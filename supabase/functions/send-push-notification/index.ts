import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  userId: string
  title: string
  body: string
  data?: Record<string, string>
  type: 'chat' | 'booking' | 'payment' | 'reminder'
}

interface ServiceAccount {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
}

/**
 * Get OAuth2 access token from Service Account
 */
async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  // Create JWT claims
  const claims = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1 hour
    scope: 'https://www.googleapis.com/auth/firebase.messaging'
  }

  // Import private key
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  const pemContents = serviceAccount.private_key
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\n/g, '')

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Create JWT
  const jwt = await create(
    { alg: 'RS256', typ: 'JWT' },
    claims,
    cryptoKey
  )

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })

  const tokenData = await tokenResponse.json()

  if (!tokenData.access_token) {
    console.error('Failed to get access token:', tokenData)
    throw new Error('Failed to get FCM access token')
  }

  return tokenData.access_token
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: NotificationPayload = await req.json()

    // Validate required fields
    if (!payload.userId || !payload.title || !payload.body || !payload.type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: userId, title, body, type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user's active device tokens
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('device_tokens')
      .select('id, token, platform')
      .eq('user_id', payload.userId)
      .eq('is_active', true)

    if (tokenError) {
      console.error('Error fetching device tokens:', tokenError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch device tokens' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!tokens || tokens.length === 0) {
      console.log('No active device tokens found for user:', payload.userId)

      // Still log the notification attempt
      await supabaseAdmin.from('notification_logs').insert({
        user_id: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data || {}
      })

      return new Response(
        JSON.stringify({ success: true, message: 'No device tokens found, notification logged' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get Service Account from environment
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    if (!serviceAccountJson) {
      console.error('FIREBASE_SERVICE_ACCOUNT not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Firebase not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson)

    // Get OAuth2 access token
    const accessToken = await getAccessToken(serviceAccount)
    const projectId = serviceAccount.project_id

    // Send to all device tokens via FCM V1 API
    const results: Array<{ tokenId: string; success: boolean; error?: string }> = []
    const invalidTokenIds: string[] = []

    for (const { id, token, platform } of tokens) {
      try {
        // FCM V1 API payload
        const fcmPayload = {
          message: {
            token: token,
            notification: {
              title: payload.title,
              body: payload.body
            },
            data: {
              ...payload.data,
              type: payload.type,
              click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                channel_id: 'default',
                default_vibrate_timings: true,
                default_light_settings: true
              }
            }
          }
        }

        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(fcmPayload)
          }
        )

        const fcmResult = await response.json()
        console.log('FCM V1 response for token:', token.substring(0, 20) + '...', fcmResult)

        if (!response.ok) {
          const errorCode = fcmResult.error?.details?.[0]?.errorCode || fcmResult.error?.status
          results.push({ tokenId: id, success: false, error: errorCode || 'Unknown error' })

          // Mark invalid tokens for removal
          if (['UNREGISTERED', 'INVALID_ARGUMENT'].includes(errorCode)) {
            invalidTokenIds.push(id)
          }
        } else {
          results.push({ tokenId: id, success: true })
        }
      } catch (err) {
        console.error('Error sending to FCM:', err)
        results.push({ tokenId: id, success: false, error: String(err) })
      }
    }

    // Deactivate invalid tokens
    if (invalidTokenIds.length > 0) {
      await supabaseAdmin
        .from('device_tokens')
        .update({ is_active: false })
        .in('id', invalidTokenIds)

      console.log('Deactivated invalid tokens:', invalidTokenIds)
    }

    // Log notification
    await supabaseAdmin.from('notification_logs').insert({
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data || {}
    })

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in send-push-notification:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

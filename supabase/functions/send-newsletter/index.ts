// Supabase Edge Function untuk mengirim newsletter
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_aTn4KwMG_HTfHs5YtjvVp44rvJK7NTbT3'
const FROM_EMAIL = 'MentorinAja <noreply@mentorinaja.com>'
const REPLY_TO_EMAIL = 'zakiachsan27@gmail.com'

// Send email via Resend REST API (no SDK needed)
async function sendEmail(params: { from: string; to: string; reply_to: string; subject: string; html: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || `Resend API error: ${res.status}`)
  }
  return await res.json()
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  }

  try {
    const { newsletterId } = await req.json()

    if (!newsletterId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Newsletter ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('📧 Sending newsletter:', newsletterId)

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get newsletter details
    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .select('*')
      .eq('id', newsletterId)
      .single()

    if (newsletterError || !newsletter) {
      console.error('Newsletter not found:', newsletterError)
      return new Response(
        JSON.stringify({ success: false, message: 'Newsletter not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if emails were already sent (by checking logs, not status field)
    const { count: sentLogCount } = await supabaseAdmin
      .from('newsletter_logs')
      .select('*', { count: 'exact', head: true })
      .eq('newsletter_id', newsletterId)

    if (sentLogCount && sentLogCount > 0) {
      console.log('⚠️ Newsletter already has sent logs, skipping:', newsletterId)
      return new Response(
        JSON.stringify({ success: false, message: 'Newsletter sudah pernah dikirim' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get recipients based on target_audience
    let recipients: { id: string; email: string; name: string }[] = []

    if (newsletter.target_audience === 'all') {
      // Get all users
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .not('email', 'is', null)
      
      recipients = users || []
    } else if (newsletter.target_audience === 'mentors') {
      // Get users who are mentors
      const { data: experts } = await supabaseAdmin
        .from('experts')
        .select('user_id, email, name')
        .not('email', 'is', null)
      
      recipients = (experts || []).map(e => ({
        id: e.user_id,
        email: e.email,
        name: e.name
      }))
    } else if (newsletter.target_audience === 'users') {
      // Get users who are not mentors
      const { data: experts } = await supabaseAdmin
        .from('experts')
        .select('user_id')
      
      const expertUserIds = (experts || []).map(e => e.user_id)
      
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .not('email', 'is', null)
        .not('id', 'in', `(${expertUserIds.join(',')})`)
      
      recipients = users || []
    }

    console.log(`📧 Found ${recipients.length} recipients`)

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No recipients found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Update newsletter status to sent
    await supabaseAdmin
      .from('newsletters')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', newsletterId)

    // Send emails one by one with delay (Resend free tier: max 2 req/sec)
    const results = { sent: 0, failed: 0 }

    for (const recipient of recipients) {
      try {
        // Personalize content
        const personalizedContent = newsletter.content
          .replace(/{{name}}/g, recipient.name || 'Pengguna')
          .replace(/{{email}}/g, recipient.email)

        await sendEmail({
          from: FROM_EMAIL,
          to: recipient.email,
          reply_to: REPLY_TO_EMAIL,
          subject: newsletter.subject,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${newsletter.subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    .unsubscribe { color: #666; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MentorinAja</h1>
    </div>
    <div class="content">
      ${personalizedContent}
    </div>
    <div class="footer">
      <p>&copy; 2026 MentorinAja. All rights reserved.</p>
      <p class="unsubscribe">Email ini dikirim kepada ${recipient.email}</p>
    </div>
  </div>
</body>
</html>
          `,
        })

        // Log success
        await supabaseAdmin.from('newsletter_logs').insert({
          newsletter_id: newsletterId,
          recipient_id: recipient.id,
          recipient_email: recipient.email,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })

        results.sent++
        console.log(`✅ Email sent to: ${recipient.email}`)
      } catch (error: any) {
        // Log failure
        await supabaseAdmin.from('newsletter_logs').insert({
          newsletter_id: newsletterId,
          recipient_id: recipient.id,
          recipient_email: recipient.email,
          status: 'failed',
          error_message: error?.message || String(error),
          sent_at: new Date().toISOString(),
        })

        results.failed++
        console.error(`❌ Failed to send to ${recipient.email}:`, error?.message || error)
      }

      // Delay 600ms between emails (stay under 2 req/sec limit)
      await new Promise(resolve => setTimeout(resolve, 600))
    }

    console.log('📧 Newsletter sending completed:', results)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Newsletter sent successfully',
        stats: {
          total: recipients.length,
          sent: results.sent,
          failed: results.failed,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Newsletter error:', error)
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

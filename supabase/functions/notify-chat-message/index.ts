import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifyPayload {
  bookingId: string
  senderId: string
  senderType: 'user' | 'expert'
  messagePreview: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: NotifyPayload = await req.json()

    // Validate required fields
    if (!payload.bookingId || !payload.senderId || !payload.senderType || !payload.messagePreview) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch booking details to get both user and expert info
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        user_id,
        expert_id,
        users (id, name),
        experts (id, name, user_id)
      `)
      .eq('id', payload.bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError)
      return new Response(
        JSON.stringify({ success: false, error: 'Booking not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Determine recipient based on sender type
    let recipientUserId: string | null = null
    let senderName: string = 'Seseorang'

    if (payload.senderType === 'user') {
      // User sent message, notify expert
      recipientUserId = booking.experts?.user_id || null
      senderName = booking.users?.name || 'User'
    } else {
      // Expert sent message, notify user
      recipientUserId = booking.user_id
      senderName = booking.experts?.name || 'Expert'
    }

    if (!recipientUserId) {
      console.log('No recipient found for notification')
      return new Response(
        JSON.stringify({ success: true, message: 'No recipient to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Truncate message preview
    const messagePreview = payload.messagePreview.length > 100
      ? payload.messagePreview.substring(0, 97) + '...'
      : payload.messagePreview

    // Send push notification
    const notificationResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          userId: recipientUserId,
          title: `Pesan dari ${senderName}`,
          body: messagePreview,
          data: { bookingId: payload.bookingId },
          type: 'chat'
        })
      }
    )

    const notificationResult = await notificationResponse.json()
    console.log('Chat notification result:', notificationResult)

    return new Response(
      JSON.stringify({ success: true, notification: notificationResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in notify-chat-message:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

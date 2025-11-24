// Supabase Edge Function untuk handle Midtrans webhook notification
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Handle GET requests (health check or browser access)
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Midtrans webhook endpoint is active',
        info: 'This endpoint only accepts POST requests from Midtrans'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }

  // Only accept POST requests for webhook
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Method not allowed. Only POST requests are accepted.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    )
  }

  try {
    // Get notification payload
    const notification = await req.json()

    console.log('🔔 Midtrans Notification Received:', {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      transaction_id: notification.transaction_id,
      payment_type: notification.payment_type,
      gross_amount: notification.gross_amount,
      timestamp: new Date().toISOString()
    })

    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      signature_key,
    } = notification

    // Get server key
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') ?? ''

    // DEBUG: Log untuk melihat komponen signature
    console.log('=== DEBUG SIGNATURE ===')
    console.log('order_id:', order_id)
    console.log('transaction_status:', transaction_status)
    console.log('gross_amount:', gross_amount)
    console.log('server_key (first 10 chars):', serverKey.substring(0, 10))
    console.log('signature_key dari Midtrans:', signature_key)

    // Verify signature using Web Crypto API
    const signatureString = order_id + transaction_status + gross_amount + serverKey

    console.log('signature string to hash:', signatureString.substring(0, 50) + '...')

    // Hash using SHA-512
    const encoder = new TextEncoder()
    const data = encoder.encode(signatureString)
    const hashBuffer = await crypto.subtle.digest('SHA-512', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    console.log('calculated signature:', calculatedSignature)
    console.log('=== END DEBUG ===')

    // ✅ Signature verification ENABLED untuk debug
    // Kita perlu lihat error signature mismatch yang sebenarnya
    const SKIP_SIGNATURE_CHECK = false;

    if (!SKIP_SIGNATURE_CHECK && signature_key !== calculatedSignature) {
      console.error('❌ Invalid signature')
      console.error('Expected:', calculatedSignature)
      console.error('Received:', signature_key)

      // ⚠️ CRITICAL: Return 200 ke Midtrans meskipun signature invalid
      // Untuk mencegah retry terus-menerus
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid signature - notification received but rejected',
          order_id: order_id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (SKIP_SIGNATURE_CHECK) {
      console.warn('⚠️ SIGNATURE CHECK SKIPPED - FOR SANDBOX TESTING ONLY')
    } else {
      console.log('✅ Signature verified successfully')
    }

    // Initialize Supabase admin client (use service role key for webhook)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Determine payment status
    let paymentStatus = 'waiting'
    let bookingStatus = 'pending'

    console.log('📊 Determining payment status from transaction_status:', transaction_status)

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        paymentStatus = 'paid'
        bookingStatus = 'confirmed'
        console.log('✅ Payment captured and fraud check passed')
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'paid'
      bookingStatus = 'confirmed'
      console.log('✅ Payment settled')
    } else if (transaction_status === 'pending') {
      paymentStatus = 'waiting'
      bookingStatus = 'pending'
      console.log('⏳ Payment pending')
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire'
    ) {
      paymentStatus = 'waiting'
      bookingStatus = 'cancelled'
      console.log('❌ Payment failed/cancelled/expired')
    } else if (transaction_status === 'refund') {
      paymentStatus = 'waiting'
      bookingStatus = 'cancelled'
      console.log('💰 Payment refunded')
    }

    console.log('📝 Will update booking with:', { paymentStatus, bookingStatus, order_id })

    // Update booking in database
    const { data: booking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: paymentStatus,
        status: bookingStatus,
        paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', order_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating booking:', updateError)

      // ⚠️ CRITICAL: Return 200 ke Midtrans meskipun update gagal
      // Midtrans akan retry jika tidak dapat 200
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Booking update failed but notification received',
          error: updateError.message,
          order_id: order_id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Check if booking was found
    if (!booking) {
      console.warn('⚠️ Booking not found for order_id:', order_id)

      // Tetap return 200 ke Midtrans
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Booking not found',
          order_id: order_id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log('✅ Booking updated successfully:', {
      booking_id: booking.id,
      order_id: booking.order_id,
      payment_status: booking.payment_status,
      status: booking.status
    })

    // Assign meeting link if payment is successful and no link assigned yet
    if (paymentStatus === 'paid' && !booking.meeting_link_id) {
      console.log('🔗 Assigning meeting link for booking:', booking.id)

      try {
        const assignResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/assign-meeting-link`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ bookingId: booking.id })
          }
        )

        const assignResult = await assignResponse.json()

        if (assignResult.success) {
          console.log('✅ Meeting link assigned successfully:', assignResult.meetingLink)
        } else {
          console.error('⚠️ Failed to assign meeting link (non-critical):', assignResult.error)
          // Don't fail the webhook - booking is still confirmed
          // Admin can manually assign link later
        }
      } catch (assignError) {
        console.error('⚠️ Error calling assign-meeting-link function (non-critical):', assignError)
        // Don't fail the webhook - booking is still confirmed
      }
    } else if (booking.meeting_link_id) {
      console.log('✅ Meeting link already assigned for this booking')
    }

    // Store transaction log (optional, jangan throw error jika gagal)
    try {
      await supabaseAdmin.from('payment_logs').insert({
        booking_id: booking.id,
        order_id: order_id,
        transaction_status: transaction_status,
        payment_type: notification.payment_type || null,
        gross_amount: parseFloat(gross_amount),
        raw_notification: notification,
        created_at: new Date().toISOString(),
      })
      console.log('✅ Payment log stored successfully')
    } catch (logError) {
      console.error('⚠️ Error storing payment log (non-critical):', logError)
      // Don't throw, just log - this is non-critical
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification processed successfully',
        booking_id: booking.id,
        payment_status: paymentStatus,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Webhook error:', error)

    // ⚠️ CRITICAL: Return 200 ke Midtrans meskipun ada error
    // Agar Midtrans tidak terus retry dan mengirim email error
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Notification received but processing failed',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,  // ← IMPORTANT: Changed from 400 to 200
      }
    )
  }
})
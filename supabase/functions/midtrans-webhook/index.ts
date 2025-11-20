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

  try {
    // Get notification payload
    const notification = await req.json()

    console.log('Received notification:', notification)

    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      signature_key,
    } = notification

    // Verify signature using Web Crypto API
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') ?? ''
    const signatureString = order_id + transaction_status + gross_amount + serverKey

    // Hash using SHA-512
    const encoder = new TextEncoder()
    const data = encoder.encode(signatureString)
    const hashBuffer = await crypto.subtle.digest('SHA-512', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (signature_key !== calculatedSignature) {
      console.error('Invalid signature')
      console.error('Expected:', calculatedSignature)
      console.error('Received:', signature_key)
      throw new Error('Invalid signature')
    }

    // Initialize Supabase admin client (use service role key for webhook)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Determine payment status
    let paymentStatus = 'pending'
    let bookingStatus = 'pending'

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        paymentStatus = 'paid'
        bookingStatus = 'confirmed'
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'paid'
      bookingStatus = 'confirmed'
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending'
      bookingStatus = 'pending'
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire'
    ) {
      paymentStatus = 'failed'
      bookingStatus = 'cancelled'
    } else if (transaction_status === 'refund') {
      paymentStatus = 'refunded'
      bookingStatus = 'cancelled'
    }

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
      console.error('Error updating booking:', updateError)
      throw updateError
    }

    console.log('Booking updated successfully:', booking)

    // Store transaction log
    await supabaseAdmin.from('payment_logs').insert({
      booking_id: booking.id,
      order_id: order_id,
      transaction_status: transaction_status,
      payment_type: notification.payment_type || null,
      gross_amount: parseFloat(gross_amount),
      raw_notification: notification,
      created_at: new Date().toISOString(),
    })

    // TODO: Send notification email to user and expert
    // You can add email notification logic here

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
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

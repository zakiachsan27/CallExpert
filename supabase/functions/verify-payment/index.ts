// Supabase Edge Function untuk verify payment status langsung ke Midtrans API
// Approach: Server-to-Server, tidak bergantung pada webhook
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
    console.log('🔍 Payment Verification Request Received')

    // Get request body
    const { orderId, bookingId } = await req.json()

    if (!orderId && !bookingId) {
      throw new Error('Either orderId or bookingId is required')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // If bookingId provided, get order_id from booking
    let finalOrderId = orderId
    let booking = null

    if (bookingId) {
      const { data, error } = await supabaseClient
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (error || !data) {
        throw new Error(`Booking not found: ${bookingId}`)
      }

      booking = data
      finalOrderId = data.order_id

      console.log('📦 Booking found:', {
        id: booking.id,
        order_id: finalOrderId,
        current_payment_status: booking.payment_status
      })
    } else {
      // Get booking by order_id
      const { data, error } = await supabaseClient
        .from('bookings')
        .select('*')
        .eq('order_id', finalOrderId)
        .single()

      if (error || !data) {
        throw new Error(`Booking not found for order_id: ${finalOrderId}`)
      }

      booking = data
      console.log('📦 Booking found by order_id:', {
        id: booking.id,
        order_id: finalOrderId,
        current_payment_status: booking.payment_status
      })
    }

    if (!finalOrderId) {
      throw new Error('Order ID not found in booking')
    }

    // Get Midtrans credentials
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') ?? ''
    const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'
    const statusUrl = isProduction
      ? `https://api.midtrans.com/v2/${finalOrderId}/status`
      : `https://api.sandbox.midtrans.com/v2/${finalOrderId}/status`

    console.log('🔐 Calling Midtrans Transaction Status API:', {
      url: statusUrl,
      isProduction,
      serverKeyPrefix: serverKey.substring(0, 10) + '...'
    })

    // Call Midtrans Transaction Status API
    const midtransResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(serverKey + ':')}`,
      },
    })

    const responseText = await midtransResponse.text()
    console.log('📥 Midtrans API Response:', {
      status: midtransResponse.status,
      body: responseText.substring(0, 200)
    })

    if (!midtransResponse.ok) {
      console.error('❌ Midtrans API Error:', {
        status: midtransResponse.status,
        statusText: midtransResponse.statusText,
        body: responseText
      })
      throw new Error(`Midtrans API error: ${midtransResponse.status} - ${responseText}`)
    }

    const transactionData = JSON.parse(responseText)

    console.log('💳 Transaction Status from Midtrans:', {
      order_id: transactionData.order_id,
      transaction_status: transactionData.transaction_status,
      payment_type: transactionData.payment_type,
      gross_amount: transactionData.gross_amount,
      fraud_status: transactionData.fraud_status
    })

    // Determine payment status based on transaction_status
    let paymentStatus = 'waiting'
    let bookingStatus = 'pending'

    const { transaction_status, fraud_status } = transactionData

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        paymentStatus = 'paid'
        bookingStatus = 'confirmed'
        console.log('✅ Payment captured and fraud check passed')
      } else {
        paymentStatus = 'waiting'
        bookingStatus = 'pending'
        console.log('⚠️ Payment captured but fraud status is:', fraud_status)
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'paid'
      bookingStatus = 'confirmed'
      console.log('✅ Payment settled')
    } else if (transaction_status === 'pending') {
      paymentStatus = 'waiting'
      bookingStatus = 'pending'
      console.log('⏳ Payment still pending')
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire'
    ) {
      paymentStatus = 'failed'
      bookingStatus = 'cancelled'
      console.log('❌ Payment failed/cancelled/expired')
    } else {
      console.warn('⚠️ Unknown transaction status:', transaction_status)
    }

    console.log('📝 Will update booking with:', {
      booking_id: booking.id,
      paymentStatus,
      bookingStatus
    })

    // Update booking in database
    const { data: updatedBooking, error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        payment_status: paymentStatus,
        status: bookingStatus,
        paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating booking:', updateError)
      throw updateError
    }

    console.log('✅ Booking updated successfully:', {
      booking_id: updatedBooking.id,
      payment_status: updatedBooking.payment_status,
      status: updatedBooking.status
    })

    // Assign meeting link from pool if payment is successful and no link assigned yet
    if (paymentStatus === 'paid' && !updatedBooking.meeting_link_id) {
      console.log('🔗 Assigning meeting link for booking:', updatedBooking.id)

      try {
        const assignLinkResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/assign-meeting-link`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ bookingId: updatedBooking.id })
          }
        )

        const assignResult = await assignLinkResponse.json()

        if (assignResult.success) {
          console.log('✅ Meeting link assigned successfully:', assignResult.meetingLink)
          
          // Also update meeting_link column for easy access
          await supabaseClient
            .from('bookings')
            .update({ meeting_link: assignResult.meetingLink })
            .eq('id', updatedBooking.id)
        } else {
          console.error('⚠️ Failed to assign meeting link (non-critical):', assignResult.error)
        }
      } catch (assignError) {
        console.error('⚠️ Error calling assign-meeting-link function (non-critical):', assignError)
      }
    }

    // Store transaction log (optional)
    try {
      await supabaseClient.from('payment_logs').insert({
        booking_id: booking.id,
        order_id: finalOrderId,
        transaction_status: transaction_status,
        payment_type: transactionData.payment_type || null,
        gross_amount: parseFloat(transactionData.gross_amount),
        raw_notification: transactionData,
        created_at: new Date().toISOString(),
      })
      console.log('✅ Payment log stored successfully')
    } catch (logError) {
      console.error('⚠️ Error storing payment log (non-critical):', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
        booking_id: updatedBooking.id,
        order_id: finalOrderId,
        payment_status: paymentStatus,
        transaction_status: transaction_status,
        transaction_data: transactionData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Verification error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Payment verification failed',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

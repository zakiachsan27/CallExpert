// Supabase Edge Function untuk generate Midtrans Snap Token
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
    // Get request body
    const { bookingId, customerDetails } = await req.json()

    if (!bookingId) {
      throw new Error('Booking ID is required')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        experts (
          id,
          name,
          email
        ),
        session_types (
          id,
          name,
          price,
          duration
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError) {
      console.error('Booking fetch error:', bookingError)
      throw bookingError
    }
    if (!booking) throw new Error('Booking not found')

    console.log('Booking data:', JSON.stringify(booking, null, 2))

    // Get user details
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: userProfile } = await supabaseClient
      .from('users')
      .select('name, email, phone')
      .eq('id', user.id)
      .single()

    console.log('User profile:', userProfile)

    // Prepare Midtrans request
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') ?? ''
    const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'
    const snapUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

    // Log environment info (without exposing full server key)
    console.log('Midtrans config:', {
      isProduction,
      serverKeyPrefix: serverKey.substring(0, 10) + '...',
      snapUrl
    })

    // Use existing order_id from booking, or generate new one if not exists
    let orderId = booking.order_id
    if (!orderId) {
      // Fallback: generate new order_id if not exists
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
      orderId = `ORDER-${timestamp}-${randomStr}`.substring(0, 50)
      console.log('Generated new order_id:', orderId)
    } else {
      console.log('Using existing order_id:', orderId)
    }

    // Calculate amounts - ensure they match
    const itemPrice = booking.session_types.price
    const itemQuantity = 1
    const grossAmount = itemPrice * itemQuantity

    // Truncate item name (max 50 chars)
    const sessionName = booking.session_types.name || 'Konsultasi'
    const expertName = booking.experts.name || 'Expert'
    const fullItemName = `${sessionName} - ${expertName}`
    const itemName = fullItemName.length > 50
      ? fullItemName.substring(0, 47) + '...'
      : fullItemName

    console.log('Payment details:', {
      orderId,
      grossAmount,
      itemPrice,
      itemQuantity,
      itemName,
      match: grossAmount === (itemPrice * itemQuantity)
    })

    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount, // Must equal sum of item_details
      },
      credit_card: {
        secure: true,
      },
      customer_details: customerDetails || {
        first_name: userProfile?.name || user.email?.split('@')[0] || 'Customer',
        email: userProfile?.email || user.email || '',
        phone: userProfile?.phone || '',
      },
      item_details: [
        {
          id: booking.session_types.id.substring(0, 50), // Truncate ID too
          price: itemPrice,
          quantity: itemQuantity,
          name: itemName, // Max 50 chars
        },
      ],
      callbacks: {
        finish: `${req.headers.get('origin')}/payment/success?booking_id=${bookingId}`,
        error: `${req.headers.get('origin')}/payment/error?booking_id=${bookingId}`,
        pending: `${req.headers.get('origin')}/payment/pending?booking_id=${bookingId}`,
      },
    }

    // Log request payload for debugging
    console.log('Midtrans request URL:', snapUrl)
    console.log('Midtrans request payload:', JSON.stringify(transactionDetails, null, 2))

    // Call Midtrans API
    const midtransResponse = await fetch(snapUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(serverKey + ':')}`,
      },
      body: JSON.stringify(transactionDetails),
    })

    // Get response as text first for better error logging
    const responseText = await midtransResponse.text()
    console.log('Midtrans response status:', midtransResponse.status)
    console.log('Midtrans response body:', responseText)

    if (!midtransResponse.ok) {
      console.error('Midtrans API error:', {
        status: midtransResponse.status,
        statusText: midtransResponse.statusText,
        body: responseText
      })
      throw new Error(`Midtrans API error: ${midtransResponse.status} - ${responseText}`)
    }

    // Parse successful response
    const snapData = JSON.parse(responseText)

    // Update booking with order_id and payment status (only if order_id doesn't exist)
    const updateData: any = { payment_status: 'pending' }
    if (!booking.order_id) {
      updateData.order_id = orderId
    }

    await supabaseClient
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)

    return new Response(
      JSON.stringify({
        token: snapData.token,
        redirect_url: snapData.redirect_url,
        order_id: orderId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

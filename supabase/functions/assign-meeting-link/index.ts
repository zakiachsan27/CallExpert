import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AssignLinkRequest {
  bookingId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      )
    }

    // Initialize Supabase ADMIN client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables')
      throw new Error('Server configuration error')
    }

    console.log('🔑 Initializing Supabase Admin Client')

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Parse request body
    const { bookingId }: AssignLinkRequest = await req.json()

    console.log('📋 Step 0: Request received')
    console.log('📋 bookingId:', bookingId)
    console.log('📋 bookingId type:', typeof bookingId)

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: bookingId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('📋 Step 1: Assigning meeting link for booking:', bookingId)

    // 1. Get booking details using ADMIN client (bypasses RLS)
    console.log('📋 Step 2: Querying bookings table with session_types JOIN...')

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        meeting_link_id,
        payment_status,
        session_type_id,
        session_types (
          duration
        )
      `)
      .eq('id', bookingId)
      .single()

    console.log('📋 Step 3: Booking query result:', {
      success: !bookingError,
      hasData: !!booking,
      error: bookingError ? JSON.stringify(bookingError, null, 2) : null
    })

    if (bookingError) {
      console.error('❌ Booking query error:', {
        code: bookingError.code,
        message: bookingError.message,
        details: bookingError.details,
        hint: bookingError.hint
      })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Booking query failed',
          details: bookingError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!booking) {
      console.error('❌ Booking not found:', bookingId)
      return new Response(
        JSON.stringify({ success: false, error: 'Booking not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    console.log('📋 Step 4: Booking data received:', {
      id: booking.id,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
      session_type_id: booking.session_type_id,
      meeting_link_id: booking.meeting_link_id,
      session_types: booking.session_types
    })

    // Extract duration from joined session_types
    const duration = booking.session_types?.duration

    console.log('📋 Step 5: Duration extraction:', {
      duration: duration,
      durationType: typeof duration,
      hasSessionTypes: !!booking.session_types
    })

    if (!duration) {
      console.error('❌ Session type duration not found')
      return new Response(
        JSON.stringify({ success: false, error: 'Session type duration not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('✅ Step 6: Booking validated successfully:', {
      id: booking.id,
      date: booking.booking_date,
      time: booking.booking_time,
      duration: duration,
      has_link: !!booking.meeting_link_id
    })

    // 2. Check if booking already has a meeting link
    if (booking.meeting_link_id) {
      console.log('ℹ️ Booking already has meeting link assigned:', booking.meeting_link_id)

      // Get the meeting link
      const { data: existingLink } = await supabaseAdmin
        .from('meeting_links_pool')
        .select('meeting_link')
        .eq('id', booking.meeting_link_id)
        .single()

      console.log('✅ Returning existing link:', existingLink?.meeting_link)

      return new Response(
        JSON.stringify({
          success: true,
          meetingLink: existingLink?.meeting_link,
          alreadyAssigned: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('📋 Step 7: Finding available meeting link for:', {
      date: booking.booking_date,
      time: booking.booking_time,
      duration: duration
    })

    // 3. Find available meeting link using the database function
    console.log('📋 Step 8: Calling RPC find_available_meeting_link...')
    console.log('📋 RPC params:', {
      p_booking_date: booking.booking_date,
      p_booking_time: booking.booking_time,
      p_duration: duration,
      types: {
        date: typeof booking.booking_date,
        time: typeof booking.booking_time,
        duration: typeof duration
      }
    })

    const { data: availableLinks, error: findError } = await supabaseAdmin
      .rpc('find_available_meeting_link', {
        p_booking_date: booking.booking_date,
        p_booking_time: booking.booking_time,
        p_duration: duration
      })

    console.log('📋 Step 9: RPC call result:', {
      success: !findError,
      dataType: typeof availableLinks,
      isArray: Array.isArray(availableLinks),
      length: availableLinks?.length,
      data: availableLinks,
      error: findError ? JSON.stringify(findError, null, 2) : null
    })

    if (findError) {
      console.error('❌ RPC error:', {
        code: findError.code,
        message: findError.message,
        details: findError.details,
        hint: findError.hint
      })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to find available meeting link',
          details: findError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!availableLinks || availableLinks.length === 0) {
      console.warn('⚠️ No available meeting links found for the requested time slot')

      // Log this for admin notification
      console.error('🚨 ALERT: Meeting links pool exhausted!', {
        bookingId,
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
        duration: duration
      })

      return new Response(
        JSON.stringify({
          success: false,
          error: 'No available meeting links at this time. Please contact support.',
          requiresManualAssignment: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      )
    }

    // Get first available link from array
    const availableLink = availableLinks[0]

    console.log('✅ Step 10: Found available meeting link:', {
      id: availableLink.id,
      meeting_link: availableLink.meeting_link,
      idType: typeof availableLink.id,
      linkType: typeof availableLink.meeting_link
    })

    // 4. Assign the meeting link to the booking
    console.log('📋 Step 11: Updating booking with meeting link...')
    console.log('📋 Update params:', {
      bookingId: bookingId,
      meetingLinkId: availableLink.id,
      meetingLinkIdType: typeof availableLink.id
    })

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        meeting_link_id: availableLink.id,
        meeting_link: availableLink.meeting_link,  // Also set the URL directly
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    console.log('📋 Step 12: Update result:', {
      success: !updateError,
      error: updateError ? JSON.stringify(updateError, null, 2) : null
    })

    if (updateError) {
      console.error('❌ Error updating booking:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      })
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to assign meeting link to booking' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('✅ Step 13: Meeting link assigned successfully!')
    console.log('📋 Final result:', {
      bookingId: bookingId,
      meetingLink: availableLink.meeting_link,
      meetingLinkId: availableLink.id
    })

    return new Response(
      JSON.stringify({
        success: true,
        meetingLink: availableLink.meeting_link,
        meetingLinkId: availableLink.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

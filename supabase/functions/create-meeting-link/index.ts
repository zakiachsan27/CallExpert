import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingRequest {
  bookingId: string
  expertName: string
  userName: string
  userEmail: string
  expertEmail: string
  sessionType: string
  scheduledDate: string
  scheduledTime: string
  duration: number
}

interface CalendarEvent {
  summary: string
  description: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  conferenceData: {
    createRequest: {
      requestId: string
      conferenceSolutionKey: {
        type: string
      }
    }
  }
}

async function getGoogleAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set')
  }

  const serviceAccount = JSON.parse(serviceAccountJson)

  console.log('Creating JWT for service account:', serviceAccount.client_email)

  // Create JWT
  const now = Math.floor(Date.now() / 1000)
  const jwt = await new jose.SignJWT({
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    iss: serviceAccount.client_email,
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(await jose.importPKCS8(serviceAccount.private_key, 'RS256'))

  console.log('JWT created, exchanging for access token')

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    console.error('Token exchange failed:', errorText)
    throw new Error(`Failed to get access token: ${errorText}`)
  }

  const { access_token } = await tokenResponse.json()
  console.log('Access token obtained successfully')

  return access_token
}

function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`
}

function parseScheduledDateTime(scheduledDate: string, scheduledTime: string): Date {
  // Parse date: "2025-12-01" -> [2025, 12, 1]
  const [year, month, day] = scheduledDate.split('-').map(Number)

  // Parse time: "14:00" -> [14, 0]
  const [hours, minutes] = scheduledTime.split(':').map(Number)

  // Create Date object (month is 0-indexed in JavaScript)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

function calculateEndTime(scheduledDate: string, scheduledTime: string, duration: number): string {
  const startDateTime = parseScheduledDateTime(scheduledDate, scheduledTime)
  const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000)

  return formatDateTime(endDateTime)
}

async function createCalendarEvent(accessToken: string, bookingData: BookingRequest): Promise<{ meetingLink: string; eventId: string }> {
  const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID')
  if (!calendarId) {
    throw new Error('GOOGLE_CALENDAR_ID not set')
  }

  // Calculate start and end times
  const startDateTime = parseScheduledDateTime(bookingData.scheduledDate, bookingData.scheduledTime)
  const startDateTimeFormatted = formatDateTime(startDateTime)
  const endDateTimeFormatted = calculateEndTime(bookingData.scheduledDate, bookingData.scheduledTime, bookingData.duration)

  // Log time details for debugging
  console.log('📅 Event time details:', {
    scheduledDate: bookingData.scheduledDate,
    scheduledTime: bookingData.scheduledTime,
    duration: bookingData.duration,
    startDateTime: startDateTimeFormatted,
    endDateTime: endDateTimeFormatted,
    startTimestamp: startDateTime.getTime(),
    endTimestamp: startDateTime.getTime() + (bookingData.duration * 60 * 1000)
  })

  const eventData: CalendarEvent = {
    summary: `${bookingData.expertName} - ${bookingData.sessionType} dengan ${bookingData.userName}`,
    description: `Booking ID: ${bookingData.bookingId}

Session: ${bookingData.sessionType}

Participants:
- Expert: ${bookingData.expertName} (${bookingData.expertEmail})
- User: ${bookingData.userName} (${bookingData.userEmail})`,
    start: {
      dateTime: startDateTimeFormatted,
      timeZone: 'Asia/Jakarta',
    },
    end: {
      dateTime: endDateTimeFormatted,
      timeZone: 'Asia/Jakarta',
    },
    conferenceData: {
      createRequest: {
        requestId: bookingData.bookingId,
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    },
  }

  const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`

  console.log('🔗 Creating event with conference data:', {
    calendarId,
    url: apiUrl,
    hasConferenceData: !!eventData.conferenceData,
    conferenceSolutionType: eventData.conferenceData.createRequest.conferenceSolutionKey.type
  })

  console.log('Creating calendar event:', JSON.stringify(eventData, null, 2))

  const eventResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  })

  if (!eventResponse.ok) {
    const errorText = await eventResponse.text()
    console.error('❌ Calendar event creation failed')
    console.error('Status:', eventResponse.status, eventResponse.statusText)
    console.error('Response body:', errorText)

    // Try to parse error details
    try {
      const errorJson = JSON.parse(errorText)
      console.error('Error details:', JSON.stringify(errorJson, null, 2))
    } catch (e) {
      // Error text is not JSON
    }

    throw new Error(`Failed to create calendar event: ${errorText}`)
  }

  const event = await eventResponse.json()

  console.log('✅ Calendar event created successfully!')
  console.log('Event ID:', event.id)
  console.log('Meet link:', event.hangoutLink)
  console.log('Full API response:', JSON.stringify(event, null, 2))

  // Verify we have a meeting link
  if (!event.hangoutLink) {
    console.warn('⚠️ Warning: No hangoutLink in response. Conference data:', JSON.stringify(event.conferenceData, null, 2))
  }

  return {
    meetingLink: event.hangoutLink,
    eventId: event.id,
  }
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

    // Parse request body
    const bookingData: BookingRequest = await req.json()

    // Validate required fields
    const requiredFields: (keyof BookingRequest)[] = [
      'bookingId', 'expertName', 'userName', 'userEmail',
      'expertEmail', 'sessionType', 'scheduledDate', 'scheduledTime', 'duration'
    ]

    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    console.log('Processing booking:', bookingData.bookingId)

    // Get Google access token
    const accessToken = await getGoogleAccessToken()

    // Create calendar event with Google Meet
    const { meetingLink, eventId } = await createCalendarEvent(accessToken, bookingData)

    return new Response(
      JSON.stringify({
        success: true,
        meetingLink,
        eventId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
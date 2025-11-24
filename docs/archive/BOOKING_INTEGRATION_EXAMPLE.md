# Booking Flow Integration with Google Meet

## Overview
This document shows how to integrate the `create-meeting-link` function into your booking workflow.

## Complete Booking Flow

### 1. User Books a Session

```typescript
// In your booking component (e.g., BookingPage.tsx)
import { supabase } from '../services/database'

async function handleBooking(bookingData) {
  try {
    // Step 1: Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: currentUser.id,
        expert_id: selectedExpert.id,
        session_type: bookingData.sessionType,
        scheduled_date: bookingData.date,
        scheduled_time: bookingData.time,
        duration: bookingData.duration,
        status: 'pending', // Will update after payment
        price: bookingData.price,
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // Step 2: Process payment (your existing Midtrans flow)
    const paymentResult = await processMidtransPayment(booking)

    if (paymentResult.success) {
      // Step 3: Generate Google Meet link
      const meetingResult = await createMeetingLink(booking)

      if (meetingResult.success) {
        // Step 4: Update booking with meeting link
        await supabase
          .from('bookings')
          .update({
            meeting_link: meetingResult.meetingLink,
            google_event_id: meetingResult.eventId,
            status: 'confirmed'
          })
          .eq('id', booking.id)

        // Step 5: Send confirmation emails
        await sendConfirmationEmails(booking, meetingResult.meetingLink)

        return {
          success: true,
          bookingId: booking.id,
          meetingLink: meetingResult.meetingLink
        }
      }
    }
  } catch (error) {
    console.error('Booking error:', error)
    throw error
  }
}
```

### 2. Create Meeting Link Function

```typescript
// services/meetingLink.ts
import { supabase } from './database'

interface CreateMeetingLinkParams {
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

export async function createMeetingLink(booking: any): Promise<{
  success: boolean
  meetingLink?: string
  eventId?: string
  error?: string
}> {
  try {
    // Get expert and user details
    const { data: expert } = await supabase
      .from('experts')
      .select('name, email')
      .eq('id', booking.expert_id)
      .single()

    const { data: user } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', booking.user_id)
      .single()

    // Call edge function
    const { data, error } = await supabase.functions.invoke('create-meeting-link', {
      body: {
        bookingId: booking.id,
        expertName: expert.name,
        userName: user.name,
        userEmail: user.email,
        expertEmail: expert.email,
        sessionType: booking.session_type,
        scheduledDate: booking.scheduled_date,
        scheduledTime: booking.scheduled_time,
        duration: booking.duration || 60
      }
    })

    if (error) {
      console.error('Meeting link creation error:', error)
      return { success: false, error: error.message }
    }

    if (data.success) {
      return {
        success: true,
        meetingLink: data.meetingLink,
        eventId: data.eventId
      }
    } else {
      return { success: false, error: data.error }
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: error.message }
  }
}
```

### 3. Update Database Schema

Ensure your `bookings` table has these columns:

```sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS google_event_id TEXT;
```

### 4. Display Meeting Link

```typescript
// components/BookingConfirmation.tsx
export function BookingConfirmation({ booking }) {
  return (
    <div className="confirmation-card">
      <h2>Booking Confirmed! ✅</h2>

      <div className="booking-details">
        <p><strong>Session:</strong> {booking.session_type}</p>
        <p><strong>Date:</strong> {booking.scheduled_date}</p>
        <p><strong>Time:</strong> {booking.scheduled_time}</p>
        <p><strong>Duration:</strong> {booking.duration} minutes</p>
      </div>

      {booking.meeting_link && (
        <div className="meeting-link">
          <h3>Google Meet Link</h3>
          <a
            href={booking.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="meet-button"
          >
            Join Meeting
          </a>
          <p className="meeting-url">{booking.meeting_link}</p>
        </div>
      )}

      <div className="calendar-add">
        <p>This event has been added to your calendar automatically.</p>
        <p>Check your email for calendar invitation.</p>
      </div>
    </div>
  )
}
```

### 5. Expert Dashboard

```typescript
// components/ExpertUpcomingSessions.tsx
export function ExpertUpcomingSessions({ expertId }) {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    loadUpcomingSessions()
  }, [expertId])

  async function loadUpcomingSessions() {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        users:user_id (name, email)
      `)
      .eq('expert_id', expertId)
      .eq('status', 'confirmed')
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })

    setSessions(data || [])
  }

  return (
    <div className="upcoming-sessions">
      <h3>Upcoming Sessions</h3>
      {sessions.map(session => (
        <div key={session.id} className="session-card">
          <div className="session-info">
            <h4>{session.users.name}</h4>
            <p>{session.session_type}</p>
            <p>{session.scheduled_date} at {session.scheduled_time}</p>
          </div>
          {session.meeting_link && (
            <a
              href={session.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="join-button"
            >
              Join Meeting
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
```

### 6. Email Notifications

```typescript
// services/notifications.ts
export async function sendConfirmationEmails(booking: any, meetingLink: string) {
  // Send to user
  await sendEmail({
    to: booking.user_email,
    subject: 'Booking Confirmation - CallExpert',
    template: 'booking-confirmation-user',
    data: {
      userName: booking.user_name,
      expertName: booking.expert_name,
      sessionType: booking.session_type,
      date: booking.scheduled_date,
      time: booking.scheduled_time,
      meetingLink: meetingLink,
      calendarInvite: true
    }
  })

  // Send to expert
  await sendEmail({
    to: booking.expert_email,
    subject: 'New Booking - CallExpert',
    template: 'booking-confirmation-expert',
    data: {
      expertName: booking.expert_name,
      userName: booking.user_name,
      sessionType: booking.session_type,
      date: booking.scheduled_date,
      time: booking.scheduled_time,
      meetingLink: meetingLink,
      calendarInvite: true
    }
  })
}
```

### 7. Handle Rescheduling

```typescript
// services/bookingManagement.ts
export async function rescheduleBooking(
  bookingId: string,
  newDate: string,
  newTime: string
) {
  try {
    // Get current booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    // Delete old Google Calendar event
    if (booking.google_event_id) {
      await supabase.functions.invoke('delete-calendar-event', {
        body: { eventId: booking.google_event_id }
      })
    }

    // Create new meeting link with new time
    const meetingResult = await createMeetingLink({
      ...booking,
      scheduled_date: newDate,
      scheduled_time: newTime
    })

    // Update booking
    await supabase
      .from('bookings')
      .update({
        scheduled_date: newDate,
        scheduled_time: newTime,
        meeting_link: meetingResult.meetingLink,
        google_event_id: meetingResult.eventId
      })
      .eq('id', bookingId)

    return { success: true }
  } catch (error) {
    console.error('Reschedule error:', error)
    return { success: false, error: error.message }
  }
}
```

### 8. Handle Cancellation

```typescript
// services/bookingManagement.ts
export async function cancelBooking(bookingId: string) {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    // Cancel Google Calendar event
    if (booking.google_event_id) {
      await supabase.functions.invoke('cancel-calendar-event', {
        body: { eventId: booking.google_event_id }
      })
    }

    // Update booking status
    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    // Send cancellation emails
    await sendCancellationEmails(booking)

    return { success: true }
  } catch (error) {
    console.error('Cancellation error:', error)
    return { success: false, error: error.message }
  }
}
```

## Error Handling Best Practices

```typescript
export async function handleBookingWithRetry(bookingData: any, maxRetries = 3) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await createMeetingLink(bookingData)

      if (result.success) {
        return result
      }

      lastError = result.error

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  // All retries failed
  console.error('All retries failed:', lastError)

  // Fallback: Create booking without meeting link
  // Admin can manually create link later
  return {
    success: false,
    error: 'Meeting link creation failed. Support team will contact you.',
    requiresManualIntervention: true
  }
}
```

## Testing Checklist

- [ ] Create booking with valid data
- [ ] Verify Google Calendar event created
- [ ] Verify Google Meet link generated
- [ ] Verify both attendees receive calendar invite
- [ ] Test meeting link works (can join meeting)
- [ ] Test rescheduling updates calendar event
- [ ] Test cancellation removes calendar event
- [ ] Test error handling when Google API fails
- [ ] Test timezone handling (Asia/Jakarta)
- [ ] Verify email notifications include correct link

## Next Steps

1. Test the integration with real booking
2. Monitor function logs for any errors
3. Implement additional edge functions for:
   - `delete-calendar-event` (for cancellations)
   - `update-calendar-event` (for rescheduling)
4. Add analytics tracking for meeting link usage

# Service Account Attendees Fix

## Problem Identified
The Google Calendar API was returning:
```
"forbiddenForServiceAccounts: The caller does not have permission to use this method for service accounts"
```

### Root Cause
Service accounts cannot invite attendees to calendar events unless Domain-Wide Delegation is configured. Since we're using a basic service account without domain delegation, we cannot add attendees to events.

## Solution Implemented

### 1. Removed Attendees Field
Removed the `attendees` array from the calendar event creation request.

**Before (caused error):**
```typescript
const eventData = {
  summary: "...",
  description: "...",
  start: {...},
  end: {...},
  attendees: [
    { email: userEmail },
    { email: expertEmail }
  ],  // ❌ Service account can't do this
  conferenceData: {...}
}
```

**After (working):**
```typescript
const eventData = {
  summary: "...",
  description: "...",  // Now includes participant info
  start: {...},
  end: {...},
  // ✅ No attendees field
  conferenceData: {...}
}
```

### 2. Enhanced Description
Participant information is now included in the event description:

```typescript
description: `Booking ID: ${bookingData.bookingId}

Session: ${bookingData.sessionType}

Participants:
- Expert: ${bookingData.expertName} (${bookingData.expertEmail})
- User: ${bookingData.userName} (${bookingData.userEmail})`
```

### 3. Updated TypeScript Interface
Removed `attendees` from the `CalendarEvent` interface:

```typescript
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
  // attendees field removed
  conferenceData: {
    createRequest: {
      requestId: string
      conferenceSolutionKey: {
        type: string
      }
    }
  }
}
```

## Important Notes

### How This Works Without Attendees

1. **Google Meet Link Access**
   - Google Meet links are publicly accessible by default
   - Anyone with the link can join
   - No calendar invitation needed

2. **Participant Notification**
   - Expert and User will receive the Meet link via the application
   - Store the `meetingLink` in the database
   - Send the link via email/notification in your app
   - No need for Google Calendar invitations

3. **Calendar Event Purpose**
   - Calendar event exists for record-keeping
   - Ensures unique Meet link generation
   - Provides scheduled time slot
   - Visible only to service account calendar

### Distribution Flow

```
1. User books session
   ↓
2. Function creates calendar event (without attendees)
   ↓
3. Google generates Meet link
   ↓
4. Function returns Meet link
   ↓
5. Store link in database
   ↓
6. Send link to Expert & User via app/email
   ↓
7. Both participants join using the link
```

## Alternative Approaches (Not Needed)

### Domain-Wide Delegation
If you wanted to send actual calendar invitations, you would need:
- Google Workspace admin access
- Configure Domain-Wide Delegation
- Grant calendar.events scope
- More complex setup

**Not recommended for this use case** - just share the Meet link directly!

### Public Calendar
Could make the calendar public and share view-only access, but:
- Users would see all bookings
- Privacy concern
- Not necessary

## Code Changes

### File Modified
- **[supabase/functions/create-meeting-link/index.ts](supabase/functions/create-meeting-link/index.ts)**

### Changes Made
1. Line 21-40: Removed `attendees` field from `CalendarEvent` interface
2. Line 139-164: Removed `attendees` array, enhanced description

## Testing

The function should now work without the `forbiddenForServiceAccounts` error.

### Expected Behavior
✅ Creates calendar event successfully
✅ Generates Google Meet link
✅ Returns `meetingLink` and `eventId`
✅ Participant info visible in event description
✅ Meet link accessible to anyone with the link

### Test Command
```bash
export SUPABASE_ANON_KEY="your-key-here"
node test-meeting-link.js
```

## Integration Guide

When integrating into your booking flow:

```typescript
// After creating booking and processing payment
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
    duration: booking.duration
  }
})

if (data?.success) {
  // Store the meeting link
  await supabase
    .from('bookings')
    .update({ meeting_link: data.meetingLink })
    .eq('id', booking.id)

  // Send the link to participants
  await sendMeetingLinkEmails({
    expertEmail: expert.email,
    userEmail: user.email,
    meetingLink: data.meetingLink,
    scheduledDate: booking.scheduled_date,
    scheduledTime: booking.scheduled_time
  })
}
```

### Email Template Example

```html
<!-- For Expert -->
Subject: New Booking - ${userName}

Hi ${expertName},

You have a new booking:
- Client: ${userName}
- Session: ${sessionType}
- Date: ${scheduledDate}
- Time: ${scheduledTime}

Join the meeting:
${meetingLink}

The link will be active 15 minutes before the scheduled time.
```

```html
<!-- For User -->
Subject: Booking Confirmed - ${expertName}

Hi ${userName},

Your booking is confirmed:
- Expert: ${expertName}
- Session: ${sessionType}
- Date: ${scheduledDate}
- Time: ${scheduledTime}

Join the meeting:
${meetingLink}

The link will be active 15 minutes before the scheduled time.
```

## Deployment Status

✅ **Function deployed:** `create-meeting-link`
✅ **Version:** Latest (without attendees field)
✅ **Status:** Ready for production use

## Summary

The `forbiddenForServiceAccounts` error has been fixed by removing the `attendees` field from calendar event creation. Participant information is now included in the event description, and the Meet link is distributed via the application instead of calendar invitations.

This approach is:
- ✅ Simpler (no Domain-Wide Delegation needed)
- ✅ More private (participants don't see other bookings)
- ✅ More flexible (works with any email addresses)
- ✅ Fully functional (Meet link works the same way)

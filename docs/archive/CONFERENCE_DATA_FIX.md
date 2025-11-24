# Conference Data Structure Fix

## Current Status
The conferenceData structure has been verified and enhanced logging has been added to help diagnose any "Invalid conference type value" errors.

## Correct Conference Data Structure

### Required Structure
```typescript
conferenceData: {
  createRequest: {
    requestId: "unique-booking-id",  // Used for idempotency
    conferenceSolutionKey: {
      type: "hangoutsMeet"  // Must be exactly this string
    }
  }
}
```

### Critical Requirements

1. **URL Parameter - MANDATORY**
   ```typescript
   const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1`
   ```
   - The `conferenceDataVersion=1` parameter is **REQUIRED**
   - Without this, Google will ignore the conferenceData field
   - No Meet link will be generated without this parameter

2. **Conference Solution Type**
   - Must be exactly: `"hangoutsMeet"`
   - Case-sensitive
   - No spaces or variations

3. **Request ID**
   - Should be unique per booking
   - Used for idempotency (prevents duplicate events)
   - We use `bookingId` for this

## Current Implementation

### File: [supabase/functions/create-meeting-link/index.ts](supabase/functions/create-meeting-link/index.ts)

```typescript
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
      requestId: bookingData.bookingId,  // ✅ Unique per booking
      conferenceSolutionKey: {
        type: 'hangoutsMeet',  // ✅ Correct type
      },
    },
  },
}

const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`
// ✅ conferenceDataVersion=1 is present
```

## Enhanced Logging

The function now logs detailed information about the conference creation:

```typescript
console.log('🔗 Creating event with conference data:', {
  calendarId,
  url: apiUrl,
  hasConferenceData: !!eventData.conferenceData,
  conferenceSolutionType: eventData.conferenceData.createRequest.conferenceSolutionKey.type
})
```

### What to Look For in Logs

When the function runs, you'll see:
```json
{
  "calendarId": "cfed8ac03a89fae360d108c92e6cd0b0254efa47cccbd558cd3425a6bdbec2cc@group.calendar.google.com",
  "url": "https://www.googleapis.com/calendar/v3/calendars/.../events?conferenceDataVersion=1",
  "hasConferenceData": true,
  "conferenceSolutionType": "hangoutsMeet"
}
```

## Troubleshooting

### If you get "Invalid conference type value" error:

1. **Check the logs** for the 🔗 emoji message
2. **Verify URL** includes `conferenceDataVersion=1`
3. **Verify type** is exactly `"hangoutsMeet"`
4. **Check response** from Google for specific error details

### Common Issues

❌ **Missing URL parameter**
```typescript
// WRONG - No conferenceDataVersion parameter
const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`
```

✅ **Correct URL**
```typescript
const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1`
```

❌ **Wrong conference type**
```typescript
// WRONG - Incorrect type
conferenceSolutionKey: {
  type: "hangouts"  // Should be "hangoutsMeet"
}
```

✅ **Correct type**
```typescript
conferenceSolutionKey: {
  type: "hangoutsMeet"  // Correct
}
```

## Google Calendar API Response

When successful, Google returns:
```json
{
  "id": "event-id-here",
  "hangoutLink": "https://meet.google.com/xxx-xxxx-xxx",
  "conferenceData": {
    "conferenceId": "xxx-xxxx-xxx",
    "conferenceSolution": {
      "name": "Google Meet",
      "key": {
        "type": "hangoutsMeet"
      }
    },
    "entryPoints": [
      {
        "entryPointType": "video",
        "uri": "https://meet.google.com/xxx-xxxx-xxx",
        "label": "meet.google.com/xxx-xxxx-xxx"
      }
    ]
  }
}
```

We extract the `hangoutLink` field for the meeting URL.

## Testing

To test the conference creation:

```bash
export SUPABASE_ANON_KEY="your-key-here"
node test-meeting-link.js
```

### Expected Success Response
```json
{
  "success": true,
  "meetingLink": "https://meet.google.com/xxx-xxxx-xxx",
  "eventId": "calendar-event-id"
}
```

### Check Logs
View function logs at:
https://supabase.com/dashboard/project/xnnlpwaodduqqiffeyxw/logs/edge-functions

Look for:
- 🔗 Conference creation log
- 📅 Event time details
- ✅ "Calendar event created" success message
- 🔗 "Meet link" in the logs

## API Documentation Reference

Official Google Calendar API docs:
- [Events.insert](https://developers.google.com/calendar/api/v3/reference/events/insert)
- [Conference Data](https://developers.google.com/calendar/api/guides/conference)

Key points from documentation:
- `conferenceDataVersion` parameter must be set to request conference data
- Supported values are 0 and 1
- Use 1 to create conference data
- `hangoutsMeet` is the type for Google Meet conferences

## Deployment Status

✅ **Function deployed** with enhanced logging
✅ **Conference structure** verified correct
✅ **URL parameter** confirmed present
✅ **Ready for testing**

## Summary

The conferenceData structure is correctly implemented according to Google Calendar API specifications:
- ✅ Correct `type: "hangoutsMeet"`
- ✅ URL includes `conferenceDataVersion=1`
- ✅ Unique `requestId` per booking
- ✅ Enhanced logging for debugging

If you encounter any errors, check the function logs for detailed diagnostic information.

# Google Calendar & Meet Integration

## Overview
Edge function `create-meeting-link` generates Google Meet links by creating calendar events via Google Calendar API.

## Implementation Details

### Function: `create-meeting-link`
**Location:** `supabase/functions/create-meeting-link/index.ts`

### Features Implemented

#### 1. JWT Authentication
- Uses Google Service Account credentials
- Generates JWT tokens with RS256 signing
- Exchanges JWT for OAuth access tokens
- Scope: `https://www.googleapis.com/auth/calendar`
- Library: `jose@v5.2.0` for JWT operations

#### 2. Calendar Event Creation
- Creates events with Google Meet conferencing
- Endpoint: `POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?conferenceDataVersion=1`
- **CRITICAL:** `conferenceDataVersion=1` parameter enables Google Meet link generation

#### 3. Request Format
```json
{
  "bookingId": "uuid",
  "expertName": "string",
  "userName": "string",
  "userEmail": "string",
  "expertEmail": "string",
  "sessionType": "string",
  "scheduledDate": "YYYY-MM-DD",
  "scheduledTime": "HH:MM",
  "duration": 60
}
```

#### 4. Response Format
```json
{
  "success": true,
  "meetingLink": "https://meet.google.com/xxx-xxxx-xxx",
  "eventId": "google-calendar-event-id"
}
```

#### 5. Calendar Event Details
- **Summary:** "{expertName} - {sessionType} dengan {userName}"
- **Description:** "Booking ID: {bookingId}\nSession: {sessionType}"
- **Timezone:** Asia/Jakarta (UTC+7)
- **Attendees:** User and Expert emails
- **Conference:** Google Meet (hangoutsMeet)

### Environment Variables

#### Required Variables (Already Set)
```bash
GOOGLE_SERVICE_ACCOUNT_JSON='{...full JSON credentials...}'
GOOGLE_CALENDAR_ID='cfed8ac03a89fae360d108c92e6cd0b0254efa47cccbd558cd3425a6bdbec2cc@group.calendar.google.com'
```

### Error Handling
- Input validation for all required fields
- HTTP method validation (POST only)
- Detailed error logging
- Proper HTTP status codes (400, 405, 500)
- Google API error propagation

### Testing

#### Test Script: `test-meeting-link.js`

**Setup:**
```bash
# Set your Supabase anon key
export SUPABASE_ANON_KEY="your-anon-key"

# Run test
node test-meeting-link.js
```

**Get your anon key from:**
https://supabase.com/dashboard/project/xnnlpwaodduqqiffeyxw/settings/api

#### Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/xnnlpwaodduqqiffeyxw/functions
2. Click on `create-meeting-link`
3. Use "Test" button with sample data

#### Manual Testing via cURL
```bash
curl -X POST \
  https://xnnlpwaodduqqiffeyxw.supabase.co/functions/v1/create-meeting-link \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-123",
    "expertName": "Dr. John Doe",
    "userName": "Jane Smith",
    "userEmail": "jane@example.com",
    "expertEmail": "john@example.com",
    "sessionType": "Konsultasi Karir",
    "scheduledDate": "2025-12-01",
    "scheduledTime": "14:00",
    "duration": 60
  }'
```

### Deployment

```bash
# Deploy function
supabase functions deploy create-meeting-link

# Set environment variables (if not already set)
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='...'
supabase secrets set GOOGLE_CALENDAR_ID='...'
```

### Integration with Booking Flow

When a user books a session:
1. Create booking record in database
2. Call `create-meeting-link` function with booking details
3. Store `meetingLink` and `eventId` in booking record
4. Send meeting link to user and expert via email

**Example integration:**
```typescript
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
});

if (!error && data.success) {
  // Update booking with meeting link
  await supabase
    .from('bookings')
    .update({
      meeting_link: data.meetingLink,
      google_event_id: data.eventId
    })
    .eq('id', booking.id);
}
```

## Important Notes

1. **Service Account Permissions**
   - Service account email must have write access to the calendar
   - Calendar must be shared with service account email

2. **Timezone Handling**
   - All times use Asia/Jakarta (UTC+7)
   - ISO 8601 format with timezone offset

3. **Meet Link Generation**
   - Requires `conferenceDataVersion=1` in API URL
   - `hangoutLink` field contains the Google Meet URL
   - Uses `requestId` (bookingId) for idempotency

4. **Security**
   - Function requires Supabase authentication
   - Service account credentials stored as secrets
   - Never expose credentials in client code

## Troubleshooting

### Common Issues

1. **No Meet link generated**
   - Verify `conferenceDataVersion=1` in API URL
   - Check service account has calendar access

2. **Authentication fails**
   - Verify service account JSON is valid
   - Check private key format (PKCS8)

3. **Calendar event creation fails**
   - Confirm calendar ID is correct
   - Verify service account has write permissions
   - Check date/time format

### Logs
View function logs in Supabase Dashboard:
https://supabase.com/dashboard/project/xnnlpwaodduqqiffeyxw/logs/edge-functions

## Status
✅ Implementation complete
✅ Environment variables configured
✅ Function deployed
✅ Test script created
⏳ Ready for testing with real credentials

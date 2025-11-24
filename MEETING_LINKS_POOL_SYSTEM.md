# Meeting Links Pool System

## Overview

Alternative to Google Calendar API integration. Uses a pool of pre-generated Google Meet links that are automatically assigned to bookings when payment is successful, with conflict detection to prevent overlapping meetings.

## Architecture

### Database Tables

#### 1. `meeting_links_pool`
Stores pre-generated Google Meet links.

```sql
CREATE TABLE meeting_links_pool (
  id UUID PRIMARY KEY,
  meeting_link TEXT UNIQUE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### 2. `bookings` (Updated)
Added foreign key to meeting_links_pool.

```sql
ALTER TABLE bookings
ADD COLUMN meeting_link_id UUID REFERENCES meeting_links_pool(id);
```

### Edge Functions

#### 1. `assign-meeting-link`
**Purpose:** Assign an available meeting link to a booking

**Endpoint:** `POST /functions/v1/assign-meeting-link`

**Request:**
```json
{
  "bookingId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "meetingLink": "https://meet.google.com/xxx-xxxx-xxx",
  "meetingLinkId": "uuid"
}
```

**Logic:**
1. Fetch booking details (date, time, duration)
2. Find available link with no time conflict
3. Assign link to booking
4. Return meeting link URL

#### 2. `midtrans-webhook` (Updated)
Automatically calls `assign-meeting-link` when payment status becomes 'paid'.

## Features

### 1. Conflict Detection

The system prevents assigning the same meeting link to overlapping time slots:

```sql
-- Example: Two bookings at same time = different links
Booking 1: 2025-12-01 14:00-15:00 → Link A
Booking 2: 2025-12-01 14:00-15:00 → Link B (different!)

-- Same link can be reused at different times
Booking 3: 2025-12-01 16:00-17:00 → Link A (reused, no conflict)
```

### 2. Automatic Assignment

Meeting links are assigned automatically when:
- Payment status becomes 'paid'
- Booking doesn't already have a link
- Available link found with no conflict

### 3. Manual Fallback

If all links are in use (pool exhausted):
- Function returns error with `requiresManualAssignment: true`
- Booking is still confirmed
- Admin notified to manually assign link later

## Installation & Setup

### Step 1: Run Migrations

```bash
# Apply the migration to create tables and functions
supabase db push

# Or apply specific migration files
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20251122_meeting_links_pool.sql
```

### Step 2: Seed Initial Links

**Option A: Generate Real Google Meet Links**
1. Go to https://meet.google.com/
2. Click "New meeting" → "Create instant meeting"
3. Copy the Meet link (e.g., https://meet.google.com/xxx-xxxx-xxx)
4. Repeat 10 times to get 10 unique links

**Option B: Update Seed File**
```bash
# Edit the seed file with your real Meet links
nano supabase/migrations/20251122_seed_meeting_links.sql

# Replace placeholder links with real ones
# Then run:
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20251122_seed_meeting_links.sql
```

**Option C: Insert Manually via Supabase Dashboard**
1. Go to Supabase Dashboard → Table Editor
2. Open `meeting_links_pool` table
3. Click "Insert" → "Insert row"
4. Add each meeting link

### Step 3: Deploy Edge Functions

```bash
# Deploy assign-meeting-link function
supabase functions deploy assign-meeting-link

# Re-deploy midtrans-webhook (updated with meeting link integration)
supabase functions deploy midtrans-webhook
```

## Testing

### Test 1: Manual Link Assignment

```bash
# Create a test booking first
# Then call assign-meeting-link directly

curl -X POST \
  https://xnnlpwaodduqqiffeyxw.supabase.co/functions/v1/assign-meeting-link \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "your-booking-uuid"
  }'

# Expected response:
# {
#   "success": true,
#   "meetingLink": "https://meet.google.com/xxx-xxxx-xxx",
#   "meetingLinkId": "uuid"
# }
```

### Test 2: Via Payment Webhook

```bash
# Simulate Midtrans payment notification
# This will automatically trigger meeting link assignment

curl -X POST \
  https://xnnlpwaodduqqiffeyxw.supabase.co/functions/v1/midtrans-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "BOOKING-123",
    "transaction_status": "settlement",
    "fraud_status": "accept",
    "gross_amount": "100000.00",
    "signature_key": "calculated-signature"
  }'

# Check logs to verify meeting link assignment
```

### Test 3: Conflict Detection

```sql
-- Create two bookings at same time
INSERT INTO bookings (scheduled_date, scheduled_time, duration, payment_status)
VALUES
  ('2025-12-01', '14:00', 60, 'paid'),
  ('2025-12-01', '14:00', 60, 'paid');

-- Assign links to both
SELECT find_available_meeting_link('2025-12-01', '14:00', 60);
-- Returns Link 1

SELECT find_available_meeting_link('2025-12-01', '14:00', 60);
-- Returns Link 2 (different from Link 1)
```

### Test 4: Link Reuse

```sql
-- Booking 1: 14:00-15:00 → Assigned Link A
-- Booking 2: 16:00-17:00 → Can reuse Link A (no overlap)

SELECT find_available_meeting_link('2025-12-01', '14:00', 60);
-- Returns Link A

SELECT find_available_meeting_link('2025-12-01', '16:00', 60);
-- Can return Link A (no conflict)
```

### Test 5: Pool Exhaustion

```sql
-- Create 11 bookings at same time (pool has only 10 links)
-- 11th booking should get no link available

-- Check in function logs:
-- "ALERT: Meeting links pool exhausted!"
-- Response: { requiresManualAssignment: true }
```

## Monitoring & Maintenance

### Check Pool Status

```sql
SELECT
  COUNT(*) as total_links,
  COUNT(*) FILTER (WHERE is_available = true) as available_links,
  COUNT(*) FILTER (WHERE id IN (
    SELECT meeting_link_id FROM bookings WHERE payment_status = 'paid'
  )) as currently_in_use
FROM meeting_links_pool;
```

### Find Heavily Used Links

```sql
SELECT
  ml.meeting_link,
  COUNT(b.id) as usage_count,
  MIN(b.scheduled_date) as first_booking,
  MAX(b.scheduled_date) as last_booking
FROM meeting_links_pool ml
LEFT JOIN bookings b ON b.meeting_link_id = ml.id
GROUP BY ml.id, ml.meeting_link
ORDER BY usage_count DESC;
```

### Check for Upcoming Conflicts

```sql
SELECT
  ml.meeting_link,
  b.scheduled_date,
  b.scheduled_time,
  b.duration,
  COUNT(*) OVER (PARTITION BY ml.id, b.scheduled_date) as bookings_same_day
FROM bookings b
JOIN meeting_links_pool ml ON ml.id = b.meeting_link_id
WHERE b.payment_status = 'paid'
AND b.scheduled_date >= CURRENT_DATE
ORDER BY ml.meeting_link, b.scheduled_date, b.scheduled_time;
```

### Add More Links to Pool

```sql
INSERT INTO meeting_links_pool (meeting_link, notes)
VALUES
  ('https://meet.google.com/new-link-1', 'Additional capacity'),
  ('https://meet.google.com/new-link-2', 'Additional capacity');
```

### Disable a Link

```sql
-- Soft delete (mark as unavailable)
UPDATE meeting_links_pool
SET is_available = false,
    notes = 'Disabled - technical issue'
WHERE meeting_link = 'https://meet.google.com/problematic-link';
```

## Edge Cases

### Case 1: All Links Busy
**Scenario:** 10 concurrent bookings at same time
**Handling:**
- Returns `requiresManualAssignment: true`
- Booking still confirmed (payment accepted)
- Admin alerted via logs
- Admin manually assigns link later

### Case 2: Link Already Assigned
**Scenario:** Webhook called multiple times (Midtrans retry)
**Handling:**
- Function checks if `meeting_link_id` already exists
- Returns existing link
- No duplicate assignment

### Case 3: Booking Cancelled
**Scenario:** User cancels after link assigned
**Handling:**
- Link remains assigned to booking (for record keeping)
- Link becomes available for new bookings (not in 'paid' status)
- Conflict detection excludes cancelled bookings

### Case 4: Time Overlap Detection
**Scenario:** Booking 1: 14:00-15:00, Booking 2: 14:30-15:30
**Handling:**
- 30-minute overlap detected
- Booking 2 gets different link
- Uses PostgreSQL `tstzrange` for accurate overlap detection

## Integration with Frontend

### Display Meeting Link to User

```typescript
// After payment success, fetch booking with meeting link
const { data: booking } = await supabase
  .from('bookings')
  .select(`
    *,
    meeting_link:meeting_links_pool(meeting_link)
  `)
  .eq('id', bookingId)
  .single()

if (booking.meeting_link) {
  console.log('Meeting link:', booking.meeting_link.meeting_link)
}
```

### Display in Expert Dashboard

```typescript
const { data: upcomingSessions } = await supabase
  .from('bookings')
  .select(`
    *,
    meeting_link:meeting_links_pool(meeting_link),
    users:user_id(name, email)
  `)
  .eq('expert_id', expertId)
  .eq('payment_status', 'paid')
  .gte('scheduled_date', today)
  .order('scheduled_date', { ascending: true })

// Show meeting link for each session
upcomingSessions.forEach(session => {
  console.log('Join:', session.meeting_link?.meeting_link)
})
```

## Advantages Over Google Calendar API

✅ **Simpler Implementation**
- No OAuth/JWT complexity
- No service account setup
- No API quotas or rate limits

✅ **More Reliable**
- No dependency on Google Calendar API uptime
- No timezone conversion issues
- No calendar permission problems

✅ **Better Performance**
- Single database query
- No external API calls
- Faster response time

✅ **Easier Maintenance**
- Simple SQL queries
- Clear data model
- Easy to debug

✅ **Cost Effective**
- No Google Cloud billing
- No API usage costs
- Just database storage

## Disadvantages

❌ **Manual Link Generation**
- Need to create Meet links manually
- Limited to pool size (but can expand)

❌ **No Calendar Integration**
- Participants don't get calendar invites
- Must send link via email/notification

❌ **Pool Management Required**
- Need to monitor pool capacity
- May need to add links as business grows

## Troubleshooting

### Issue: "No available meeting links"

**Cause:** All links in pool are being used at requested time

**Solutions:**
1. Add more links to pool
2. Check if old bookings can be cleaned up
3. Increase pool size based on concurrent booking capacity

### Issue: Meeting link not assigned after payment

**Cause:** assign-meeting-link function failed

**Debug:**
```bash
# Check function logs
supabase functions logs assign-meeting-link

# Look for errors in midtrans-webhook logs
supabase functions logs midtrans-webhook
```

**Solutions:**
1. Check if migration was applied
2. Verify function is deployed
3. Check database permissions
4. Manually assign: Call assign-meeting-link API directly

### Issue: Same link assigned to overlapping times

**Cause:** Conflict detection not working

**Debug:**
```sql
-- Check for overlaps
SELECT
  ml.meeting_link,
  b.scheduled_date,
  b.scheduled_time,
  b.duration
FROM bookings b
JOIN meeting_links_pool ml ON ml.id = b.meeting_link_id
WHERE b.payment_status = 'paid'
AND b.scheduled_date = '2025-12-01'
ORDER BY ml.meeting_link, b.scheduled_time;
```

**Solutions:**
1. Verify `find_available_meeting_link()` function exists
2. Check booking times are correct
3. Ensure payment_status is 'paid' for active bookings

## Future Enhancements

### Phase 1: Current Implementation ✅
- [x] Basic pool management
- [x] Conflict detection
- [x] Auto-assignment on payment

### Phase 2: Improvements
- [ ] Admin dashboard for pool management
- [ ] Automatic link generation API
- [ ] Email notifications with meeting links
- [ ] Calendar file (.ics) generation

### Phase 3: Advanced Features
- [ ] Link usage analytics
- [ ] Automatic pool expansion when capacity low
- [ ] Integration with calendar apps
- [ ] Waiting list for full slots

---

**Status:** ✅ Implemented and ready for deployment
**Last Updated:** 2025-11-22
**Migration Files:** `20251122_meeting_links_pool.sql`, `20251122_seed_meeting_links.sql`
**Edge Functions:** `assign-meeting-link`, `midtrans-webhook` (updated)

# Meeting Links Pool - Quick Setup Guide

## Prerequisites
- ✅ Supabase project running
- ✅ Database access
- ✅ 10 Google Meet links (generate manually)

## Step-by-Step Setup

### Step 1: Generate Google Meet Links

1. Go to https://meet.google.com/
2. Click "New meeting" → "Create an instant meeting"
3. Copy the Meet URL (e.g., `https://meet.google.com/abc-defg-hij`)
4. **Repeat 10 times** to get 10 unique links
5. Save them in a text file

**Example:**
```
https://meet.google.com/abc-defg-hij
https://meet.google.com/klm-nopq-rst
https://meet.google.com/uvw-xyza-bcd
...
```

### Step 2: Update Seed File

Edit `supabase/migrations/20251122_seed_meeting_links.sql`:

```sql
INSERT INTO meeting_links_pool (meeting_link, notes) VALUES
('https://meet.google.com/YOUR-LINK-1', 'Link 1'),
('https://meet.google.com/YOUR-LINK-2', 'Link 2'),
('https://meet.google.com/YOUR-LINK-3', 'Link 3'),
('https://meet.google.com/YOUR-LINK-4', 'Link 4'),
('https://meet.google.com/YOUR-LINK-5', 'Link 5'),
('https://meet.google.com/YOUR-LINK-6', 'Link 6'),
('https://meet.google.com/YOUR-LINK-7', 'Link 7'),
('https://meet.google.com/YOUR-LINK-8', 'Link 8'),
('https://meet.google.com/YOUR-LINK-9', 'Link 9'),
('https://meet.google.com/YOUR-LINK-10', 'Link 10')
ON CONFLICT (meeting_link) DO NOTHING;
```

### Step 3: Run Migrations

```bash
# Push all pending migrations to database
supabase db push

# Or run migrations manually:
# psql -h db.xxx.supabase.co -U postgres -d postgres \
#   -f supabase/migrations/20251122_meeting_links_pool.sql

# Then seed the links:
# psql -h db.xxx.supabase.co -U postgres -d postgres \
#   -f supabase/migrations/20251122_seed_meeting_links.sql
```

### Step 4: Deploy Edge Functions

```bash
# Deploy assign-meeting-link function
supabase functions deploy assign-meeting-link

# Re-deploy midtrans-webhook with meeting link integration
supabase functions deploy midtrans-webhook
```

### Step 5: Verify Installation

```sql
-- Check if table exists and has links
SELECT
  COUNT(*) as total_links,
  COUNT(*) FILTER (WHERE is_available = true) as available_links
FROM meeting_links_pool;

-- Expected result:
-- total_links: 10
-- available_links: 10
```

```sql
-- Check if function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'find_available_meeting_link';

-- Expected: 1 row returned
```

```sql
-- Check if bookings table has new column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name = 'meeting_link_id';

-- Expected: 1 row (meeting_link_id, uuid)
```

## Testing

### Test 1: Create Test Booking

```sql
-- Insert test booking
INSERT INTO bookings (
  user_id,
  expert_id,
  session_type,
  scheduled_date,
  scheduled_time,
  duration,
  price,
  payment_status,
  status,
  order_id
) VALUES (
  'test-user-id',
  'test-expert-id',
  'Konsultasi Karir',
  '2025-12-01',
  '14:00',
  60,
  100000,
  'pending',
  'pending',
  'TEST-' || gen_random_uuid()::text
)
RETURNING id, order_id;

-- Note the returned id for next step
```

### Test 2: Assign Meeting Link Manually

```bash
# Call assign-meeting-link function
curl -X POST \
  https://xnnlpwaodduqqiffeyxw.supabase.co/functions/v1/assign-meeting-link \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID_FROM_STEP_1"
  }'

# Expected response:
# {
#   "success": true,
#   "meetingLink": "https://meet.google.com/abc-defg-hij",
#   "meetingLinkId": "uuid"
# }
```

### Test 3: Verify in Database

```sql
-- Check if booking has meeting link assigned
SELECT
  b.id,
  b.order_id,
  b.scheduled_date,
  b.scheduled_time,
  ml.meeting_link
FROM bookings b
LEFT JOIN meeting_links_pool ml ON ml.id = b.meeting_link_id
WHERE b.order_id = 'YOUR_TEST_ORDER_ID';

-- Expected: Shows booking with meeting link
```

### Test 4: Test Conflict Detection

```sql
-- Create second booking at same time
INSERT INTO bookings (
  user_id,
  expert_id,
  session_type,
  scheduled_date,
  scheduled_time,
  duration,
  price,
  payment_status,
  status,
  order_id
) VALUES (
  'test-user-id-2',
  'test-expert-id',
  'Konsultasi Karir',
  '2025-12-01',  -- Same date
  '14:00',        -- Same time
  60,
  100000,
  'paid',
  'confirmed',
  'TEST-' || gen_random_uuid()::text
)
RETURNING id;

-- Call assign-meeting-link for this booking
-- It should get a DIFFERENT link than the first booking
```

### Test 5: End-to-End via Payment

```bash
# Simulate payment webhook
curl -X POST \
  https://xnnlpwaodduqqiffeyxw.supabase.co/functions/v1/midtrans-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "YOUR_TEST_ORDER_ID",
    "transaction_status": "settlement",
    "fraud_status": "accept",
    "gross_amount": "100000.00",
    "signature_key": "YOUR_CALCULATED_SIGNATURE"
  }'

# Check logs to see:
# "🔗 Assigning meeting link for booking: xxx"
# "✅ Meeting link assigned successfully: https://meet.google.com/..."
```

## Troubleshooting

### Issue: Migration fails

**Error:** `relation "meeting_links_pool" already exists`

**Solution:**
```sql
-- Check if table exists
SELECT * FROM meeting_links_pool LIMIT 1;

-- If it exists, skip the migration or drop and recreate
DROP TABLE meeting_links_pool CASCADE;
-- Then run migration again
```

### Issue: Function not found

**Error:** `function find_available_meeting_link does not exist`

**Solution:**
```bash
# Re-run the migration
supabase db push

# Or manually create function from migration file
```

### Issue: No meeting link assigned

**Check logs:**
```bash
supabase functions logs assign-meeting-link
supabase functions logs midtrans-webhook
```

**Common causes:**
1. Function not deployed
2. Database migration not applied
3. No available links in pool
4. Booking doesn't have required fields

## Production Checklist

Before going live:

- [ ] Replace placeholder Meet links with real ones
- [ ] Run all migrations on production database
- [ ] Deploy both edge functions
- [ ] Test with real payment flow
- [ ] Verify conflict detection works
- [ ] Set up monitoring for pool capacity
- [ ] Test email notifications with meeting links
- [ ] Document process for adding more links

## Monitoring

### Check Pool Capacity Daily

```sql
-- Run this query daily to monitor capacity
SELECT
  COUNT(*) as total_links,
  COUNT(*) FILTER (WHERE is_available = true) as available_links,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE is_available = true) / COUNT(*),
    2
  ) as availability_percentage
FROM meeting_links_pool;

-- Alert if availability < 30%
```

### Check for Failed Assignments

```sql
-- Find bookings without meeting links
SELECT
  b.id,
  b.order_id,
  b.scheduled_date,
  b.scheduled_time,
  b.payment_status,
  b.created_at
FROM bookings b
WHERE b.payment_status = 'paid'
AND b.meeting_link_id IS NULL
ORDER BY b.created_at DESC;

-- Manually assign links to these bookings
```

## Maintenance

### Add More Links

```sql
-- As business grows, add more links to pool
INSERT INTO meeting_links_pool (meeting_link, notes)
VALUES
  ('https://meet.google.com/new-link-1', 'Expansion - Nov 2025'),
  ('https://meet.google.com/new-link-2', 'Expansion - Nov 2025');
```

### Clean Up Old Bookings

```sql
-- Archive old bookings (optional)
-- This doesn't affect link availability
UPDATE bookings
SET status = 'archived'
WHERE scheduled_date < CURRENT_DATE - INTERVAL '30 days'
AND status IN ('completed', 'cancelled');
```

## Support

For issues:
1. Check [MEETING_LINKS_POOL_SYSTEM.md](MEETING_LINKS_POOL_SYSTEM.md) for detailed docs
2. Review function logs
3. Check database constraints
4. Verify migration applied correctly

---

**Quick Start:** Steps 1-5 above (should take ~15 minutes)
**Full Testing:** All 5 tests (additional 15 minutes)
**Total Setup Time:** ~30 minutes

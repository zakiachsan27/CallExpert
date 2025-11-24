# How to Apply Meeting Links Pool Migrations

## Option 1: Via Supabase Dashboard (Recommended)

### Step 1: Apply Main Migration

1. Go to: https://supabase.com/dashboard/project/xnnlpwaodduqqiffeyxw/sql/new
2. Copy the contents of `supabase/migrations/20251122_meeting_links_pool.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify: Should see "Success. No rows returned"

### Step 2: Seed the Links

1. In the same SQL Editor
2. Copy the contents of `supabase/migrations/20251122_seed_meeting_links.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify: Should see "3 rows returned" showing the 3 links

### Step 3: Verify Installation

Run this query in SQL Editor:
```sql
SELECT
  COUNT(*) as total_links,
  COUNT(*) FILTER (WHERE is_available = true) as available_links
FROM meeting_links_pool;
```

Expected result:
- total_links: 3
- available_links: 3

## Option 2: Via Supabase CLI (If psql Available)

```bash
# Push all migrations
supabase db push --local-only

# Then apply to remote
supabase db push
```

## Verification Queries

### Check Table Created
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'meeting_links_pool';
```

### Check Function Exists
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'find_available_meeting_link';
```

### Check Bookings Column Added
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name = 'meeting_link_id';
```

### View All Links
```sql
SELECT * FROM meeting_links_pool ORDER BY created_at;
```

Expected:
```
id                                   | meeting_link                           | is_available | notes
-------------------------------------|----------------------------------------|--------------|------------------
uuid-1                               | https://meet.google.com/kcw-ebey-pqu  | true         | Link 1 - Production
uuid-2                               | https://meet.google.com/ppt-myeq-puu  | true         | Link 2 - Production
uuid-3                               | https://meet.google.com/wyk-nvfk-qkq  | true         | Link 3 - Production
```

## Next Steps After Migration

1. ✅ Migrations applied
2. ✅ Functions deployed (`assign-meeting-link`, `midtrans-webhook`)
3. Test the system with a real booking

---

**Migration Files:**
- Main: `supabase/migrations/20251122_meeting_links_pool.sql`
- Seed: `supabase/migrations/20251122_seed_meeting_links.sql`

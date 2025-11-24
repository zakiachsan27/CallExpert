# Chat System Setup Instructions

## Current Status
Chat system code has been implemented, but the database tables need to be created first.

## Required Steps

### 1. Apply Database Migration
You need to run the chat system migration on your Supabase database:

```sql
-- This migration creates the necessary tables for the chat system
-- File: supabase/migrations/20251123_add_chat_system.sql
```

**Two options to apply:**

#### Option A: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push

# Or push a specific migration
supabase migration up --linked
```

#### Option B: Manual SQL in Supabase Dashboard
1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Open new query
3. Copy contents from `supabase/migrations/20251123_add_chat_system.sql`
4. Execute the query

### 2. Verify Tables Created
After running the migration, verify in Supabase dashboard:
- Tables → Should see `active_sessions` and `chat_messages` tables
- Check RLS is enabled (lock icon visible)

### 3. Test Chat Flow
Once tables are created:

1. **Create a booking** → For "Online Chat" session type
2. **Make payment** → Will see "Masuk ke Chat" button on invoice
3. **Click chat button** → Goes to `/session?bookingId=xxx`
4. **Chat should work** → Messages will be stored in database with real-time sync

## Tables Created

### `active_sessions`
- Tracks chat session status
- Fields: `id`, `booking_id`, `status`, `user_joined_at`, `expert_joined_at`, `ended_at`, `ended_by`
- Status: `waiting_expert` → `active` → `ended`

### `chat_messages`
- Stores all chat messages
- Fields: `id`, `booking_id`, `sender_id`, `sender_type`, `message_text`, `created_at`
- Indexed for performance

## RLS Policies
Both tables have Row Level Security enabled:
- Users can only see their own sessions/messages
- Experts can only see their sessions/messages
- Service role has full access for backend operations

## Error Handling
If tables don't exist, the app will:
- Log warnings instead of crashing
- Allow UI to render with empty chat
- Show error messages to user
- Once tables are created, restart app and chat will work

## Next Steps
1. Run migration on your Supabase database
2. Restart development server
3. Test chat functionality end-to-end

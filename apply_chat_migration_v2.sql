-- Run this script in Supabase SQL Editor
-- This version handles existing indexes gracefully

-- Create active_sessions table if not exists
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_joined_at TIMESTAMP WITH TIME ZONE,
  expert_joined_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  ended_by TEXT,
  status TEXT NOT NULL DEFAULT 'waiting_expert',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table if not exists
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'expert')),
  message_text TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes - skip if they already exist
DO $$
BEGIN
    -- Try to create each index, ignore if it already exists
    BEGIN
        CREATE INDEX idx_active_sessions_status ON public.active_sessions(status);
    EXCEPTION
        WHEN duplicate_table THEN NULL;
    END;

    BEGIN
        CREATE INDEX idx_chat_messages_booking_id ON public.chat_messages(booking_id);
    EXCEPTION
        WHEN duplicate_table THEN NULL;
    END;

    BEGIN
        CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
    EXCEPTION
        WHEN duplicate_table THEN NULL;
    END;

    BEGIN
        CREATE INDEX idx_chat_messages_sender ON public.chat_messages(sender_id, sender_type);
    EXCEPTION
        WHEN duplicate_table THEN NULL;
    END;
END $$;

-- Enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Service role can manage active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to insert sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to update sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Service role can manage messages" ON public.chat_messages;

-- Create policies for active_sessions
CREATE POLICY "Allow authenticated users to view active sessions"
  ON public.active_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage active sessions"
  ON public.active_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert sessions"
  ON public.active_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sessions"
  ON public.active_sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for chat_messages
CREATE POLICY "Allow authenticated users to view messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can manage messages"
  ON public.chat_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify tables were created
SELECT 'Tables created successfully!' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('active_sessions', 'chat_messages');

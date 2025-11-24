-- Fixed migration for chat system
-- This script is idempotent and can be run multiple times safely

-- Create active_sessions table to track session status and participants
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_joined_at TIMESTAMP WITH TIME ZONE,
  expert_joined_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  ended_by TEXT, -- 'user' | 'expert' | 'timeout'
  status TEXT NOT NULL DEFAULT 'waiting_expert', -- 'waiting_expert' | 'active' | 'ended'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table for storing all messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'expert')), -- Identify if message from user or expert
  message_text TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance (using IF NOT EXISTS)
DO $$
BEGIN
  -- Index for active_sessions.booking_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_active_sessions_booking_id') THEN
    CREATE INDEX idx_active_sessions_booking_id ON public.active_sessions(booking_id);
  END IF;

  -- Index for active_sessions.status
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_active_sessions_status') THEN
    CREATE INDEX idx_active_sessions_status ON public.active_sessions(status);
  END IF;

  -- Index for chat_messages.booking_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_booking_id') THEN
    CREATE INDEX idx_chat_messages_booking_id ON public.chat_messages(booking_id);
  END IF;

  -- Index for chat_messages.created_at
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_created_at') THEN
    CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
  END IF;

  -- Index for chat_messages sender
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_sender') THEN
    CREATE INDEX idx_chat_messages_sender ON public.chat_messages(sender_id, sender_type);
  END IF;
END $$;

-- RLS Policies for active_sessions
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies for active_sessions
  DROP POLICY IF EXISTS "Allow authenticated users to view active sessions" ON public.active_sessions;
  DROP POLICY IF EXISTS "Service role can manage active sessions" ON public.active_sessions;
  DROP POLICY IF EXISTS "Allow authenticated users to insert sessions" ON public.active_sessions;
  DROP POLICY IF EXISTS "Allow authenticated users to update sessions" ON public.active_sessions;

  -- Drop existing policies for chat_messages
  DROP POLICY IF EXISTS "Allow authenticated users to view messages" ON public.chat_messages;
  DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON public.chat_messages;
  DROP POLICY IF EXISTS "Service role can manage messages" ON public.chat_messages;
END $$;

-- Create policies for active_sessions
CREATE POLICY "Allow authenticated users to view active sessions"
  ON public.active_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage active sessions"
  ON public.active_sessions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users to insert sessions"
  ON public.active_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sessions"
  ON public.active_sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can manage messages"
  ON public.chat_messages
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add comments to tables
COMMENT ON TABLE public.active_sessions IS 'Tracks active chat session status, participant join times, and end reasons';
COMMENT ON TABLE public.chat_messages IS 'Stores all chat messages with sender identification and edit tracking';

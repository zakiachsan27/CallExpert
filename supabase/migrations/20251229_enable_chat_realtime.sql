-- Enable Supabase Realtime for chat tables
-- This allows real-time message synchronization between users
-- This script is idempotent and can be run multiple times safely

-- Enable realtime for chat_messages table (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    RAISE NOTICE 'Added chat_messages to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'chat_messages already in supabase_realtime publication';
  END IF;
END $$;

-- Enable realtime for active_sessions table (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'active_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
    RAISE NOTICE 'Added active_sessions to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'active_sessions already in supabase_realtime publication';
  END IF;
END $$;

-- Add replica identity for better change tracking
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.active_sessions REPLICA IDENTITY FULL;

-- Comment for documentation
COMMENT ON TABLE public.chat_messages IS 'Stores all chat messages with sender identification and edit tracking. Realtime enabled.';
COMMENT ON TABLE public.active_sessions IS 'Tracks active chat session status, participant join times, and end reasons. Realtime enabled.';

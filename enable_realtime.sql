-- Enable Realtime for chat tables
-- Run this in Supabase SQL Editor

-- Enable publication for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Enable publication for active_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;

-- Verify the tables are added
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

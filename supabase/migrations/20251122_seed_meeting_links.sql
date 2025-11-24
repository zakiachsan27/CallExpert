-- Seed: Initial Meeting Links Pool
-- Description: Insert 3 pre-generated Google Meet links
-- Date: 2025-11-22

INSERT INTO meeting_links_pool (meeting_link, notes) VALUES
('https://meet.google.com/kcw-ebey-pqu', 'Link 1 - Production'),
('https://meet.google.com/ppt-myeq-puu', 'Link 2 - Production'),
('https://meet.google.com/wyk-nvfk-qkq', 'Link 3 - Production')
ON CONFLICT (meeting_link) DO NOTHING;

-- Verify insertion
SELECT
  COUNT(*) as total_links,
  COUNT(*) FILTER (WHERE is_available = true) as available_links
FROM meeting_links_pool;

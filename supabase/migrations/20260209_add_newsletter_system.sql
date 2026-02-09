-- Migration: Newsletter System
-- Created: 2026-02-09

-- 1. Create newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'mentors', 'users')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled')),
    scheduled_at TIMESTAMPTZ,
    sent_by UUID REFERENCES users(id),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create newsletter_logs table (tracking)
CREATE TABLE IF NOT EXISTS newsletter_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id),
    recipient_email TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'opened')),
    opened_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX idx_newsletters_status ON newsletters(status);
CREATE INDEX idx_newsletters_sent_at ON newsletters(sent_at);
CREATE INDEX idx_newsletter_logs_newsletter_id ON newsletter_logs(newsletter_id);
CREATE INDEX idx_newsletter_logs_recipient_id ON newsletter_logs(recipient_id);
CREATE INDEX idx_newsletter_logs_status ON newsletter_logs(status);

-- 4. Enable RLS
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for newsletters
-- Only admins can view newsletters
CREATE POLICY "Admins can view all newsletters" ON newsletters
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
    );

-- Only admins can create newsletters
CREATE POLICY "Admins can create newsletters" ON newsletters
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
    );

-- Only admins can update newsletters (only drafts)
CREATE POLICY "Admins can update draft newsletters" ON newsletters
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
        AND status = 'draft'
    );

-- Only admins can delete newsletters (only drafts)
CREATE POLICY "Admins can delete draft newsletters" ON newsletters
    FOR DELETE USING (
        auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
        AND status = 'draft'
    );

-- 6. RLS Policies for newsletter_logs
-- Only admins can view logs
CREATE POLICY "Admins can view newsletter logs" ON newsletter_logs
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
    );

-- Service role can insert logs
CREATE POLICY "Service role can insert logs" ON newsletter_logs
    FOR INSERT WITH CHECK (true);

-- Service role can update logs
CREATE POLICY "Service role can update logs" ON newsletter_logs
    FOR UPDATE USING (true);

-- 7. Function to update updated_at
CREATE OR REPLACE FUNCTION update_newsletters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_newsletters_updated_at
    BEFORE UPDATE ON newsletters
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletters_updated_at();

-- 8. Function to get newsletter stats
CREATE OR REPLACE FUNCTION get_newsletter_stats(newsletter_id UUID)
RETURNS TABLE (
    total_recipients BIGINT,
    sent_count BIGINT,
    delivered_count BIGINT,
    failed_count BIGINT,
    opened_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_recipients,
        COUNT(*) FILTER (WHERE status = 'sent')::BIGINT as sent_count,
        COUNT(*) FILTER (WHERE status = 'delivered')::BIGINT as delivered_count,
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_count,
        COUNT(*) FILTER (WHERE status = 'opened')::BIGINT as opened_count
    FROM newsletter_logs
    WHERE newsletter_logs.newsletter_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

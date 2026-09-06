-- supabase/migrations/20260901000005_user_feedback_table.sql
-- Dedicated table for user feedback, suggested cost corrections, and new city/area research requests.

CREATE TABLE IF NOT EXISTS user_feedback (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    city_id TEXT REFERENCES cities(id) ON DELETE SET NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    city_name TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('cost_correction', 'new_city_request', 'new_area_request', 'general_feedback')),
    message TEXT NOT NULL,
    suggested_value NUMERIC DEFAULT NULL,
    currency_code TEXT DEFAULT NULL,
    evidence_url TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'researched', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Allow public anyone to submit feedback and research requests
CREATE POLICY "Allow public insert for user_feedback"
    ON user_feedback FOR INSERT
    WITH CHECK (true);

-- Allow public read access to feedback records
CREATE POLICY "Allow public read for user_feedback"
    ON user_feedback FOR SELECT
    USING (true);

-- Prevent unauthorized deletion or mutation by anonymous users
CREATE POLICY "Deny anon updates to user_feedback"
    ON user_feedback FOR UPDATE
    TO anon
    USING (false);

CREATE POLICY "Deny anon deletes to user_feedback"
    ON user_feedback FOR DELETE
    TO anon
    USING (false);

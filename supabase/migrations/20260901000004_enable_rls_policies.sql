-- supabase/migrations/20260901000004_enable_rls_policies.sql
-- Enables Row Level Security (RLS) across all tables with secure public read & controlled insertion rules.

-- 1. Enable Row Level Security on all core tables
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_metric_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commute_cache ENABLE ROW LEVEL SECURITY;

-- 2. Public Read Policies (Allow anyone to view verified reference data)
CREATE POLICY "Public read access for countries"
    ON countries FOR SELECT
    USING (true);

CREATE POLICY "Public read access for cities"
    ON cities FOR SELECT
    USING (true);

CREATE POLICY "Public read access for areas"
    ON areas FOR SELECT
    USING (true);

CREATE POLICY "Public read access for metrics"
    ON metrics FOR SELECT
    USING (true);

CREATE POLICY "Public read access for area_metric_values"
    ON area_metric_values FOR SELECT
    USING (true);

CREATE POLICY "Public read access for housing_listings"
    ON housing_listings FOR SELECT
    USING (true);

CREATE POLICY "Public read access for commute_cache"
    ON commute_cache FOR SELECT
    USING (true);

CREATE POLICY "Public read access for accepted submissions"
    ON submissions FOR SELECT
    USING (status = 'accepted');

-- 3. Controlled Insertion Policies (Prevent tampering & unauthorized mutation)
-- Anyone can submit evidence for validation, but cannot directly alter or delete verified metrics
CREATE POLICY "Allow public submissions for validation"
    ON submissions FOR INSERT
    WITH CHECK (true);

-- Prevent unauthorized updates or deletions by public anon roles
-- Only service_role or authenticated administrators may mutate reference tables
CREATE POLICY "Deny anon updates to countries"
    ON countries FOR UPDATE
    TO anon
    USING (false);

CREATE POLICY "Deny anon updates to cities"
    ON cities FOR UPDATE
    TO anon
    USING (false);

CREATE POLICY "Deny anon updates to areas"
    ON areas FOR UPDATE
    TO anon
    USING (false);

CREATE POLICY "Deny anon updates to metrics"
    ON metrics FOR UPDATE
    TO anon
    USING (false);

CREATE POLICY "Deny anon updates to area_metric_values"
    ON area_metric_values FOR UPDATE
    TO anon
    USING (false);

CREATE POLICY "Deny anon deletes to countries"
    ON countries FOR DELETE
    TO anon
    USING (false);

CREATE POLICY "Deny anon deletes to cities"
    ON cities FOR DELETE
    TO anon
    USING (false);

CREATE POLICY "Deny anon deletes to areas"
    ON areas FOR DELETE
    TO anon
    USING (false);

CREATE POLICY "Deny anon deletes to metrics"
    ON metrics FOR DELETE
    TO anon
    USING (false);

CREATE POLICY "Deny anon deletes to area_metric_values"
    ON area_metric_values FOR DELETE
    TO anon
    USING (false);

CREATE POLICY "Deny anon deletes to submissions"
    ON submissions FOR DELETE
    TO anon
    USING (false);


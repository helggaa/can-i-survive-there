-- ============================================================================
-- FULL SCHEMA & SECURITY POLICY: CAN I SURVIVE THERE
-- Consolidated Database Definition with Row Level Security (RLS) & Validation Engine
-- Supports both human-readable slug IDs (city-jakarta-01) and generated UUIDs
-- ============================================================================

-- 1. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE confidence_level AS ENUM ('estimated', 'low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('pending', 'accepted', 'rejected', 'flagged');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE source_type AS ENUM ('listing_site', 'aggregator', 'news_article', 'government_data', 'agent_bootstrap', 'user_fact');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CORE TABLES
CREATE TABLE IF NOT EXISTS countries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    iso_code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    gni_per_capita_ppp NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    unit VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    country_id TEXT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    bootstrap_status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (bootstrap_status IN ('not_started', 'unbootstrapped', 'discovering', 'enriched', 'ready', 'baseline_only')),
    bootstrap_source VARCHAR(20) DEFAULT NULL CHECK (bootstrap_source IN ('curated_facts', 'live_agent', 'scraped_dataset', 'user_fact')),
    last_refreshed_at TIMESTAMPTZ DEFAULT NULL,
    data_confidence confidence_level NOT NULL DEFAULT 'low',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS areas (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'osm' CHECK (source IN ('osm', 'manual', 'curated', 'crowdsourced')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    metric_id TEXT NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    note TEXT,
    submitted_by VARCHAR(100) DEFAULT 'system',
    evidence_url TEXT,
    source_type source_type NOT NULL DEFAULT 'agent_bootstrap',
    agent_confidence confidence_level DEFAULT 'medium',
    observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status submission_status NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS area_metric_values (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    metric_id TEXT NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    confidence confidence_level NOT NULL DEFAULT 'low',
    sample_size INT NOT NULL DEFAULT 1,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_area_metric UNIQUE (area_id, metric_id)
);

CREATE TABLE IF NOT EXISTS housing_listings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('dorm', 'kos', 'apartment', 'shared_house')),
    rent_monthly NUMERIC NOT NULL CHECK (rent_monthly > 0),
    lat DOUBLE PRECISION DEFAULT NULL,
    lng DOUBLE PRECISION DEFAULT NULL,
    source TEXT NOT NULL CHECK (source IN ('scraped', 'crowdsourced')),
    source_url TEXT DEFAULT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commute_cache (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lng DOUBLE PRECISION NOT NULL,
    area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('walk', 'transit', 'drive', 'bike')),
    distance_km DOUBLE PRECISION NOT NULL,
    duration_min DOUBLE PRECISION NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_commute_cache UNIQUE (origin_lat, origin_lng, area_id, mode)
);

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

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_cities_country_id ON cities(country_id);
CREATE INDEX IF NOT EXISTS idx_areas_city_id ON areas(city_id);
CREATE INDEX IF NOT EXISTS idx_area_metric_values_area_id ON area_metric_values(area_id);
CREATE INDEX IF NOT EXISTS idx_submissions_area_metric ON submissions(area_id, metric_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_commute_cache_coords ON commute_cache(origin_lat, origin_lng, area_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_city_id ON user_feedback(city_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);

-- ROW LEVEL SECURITY
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_metric_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commute_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Public read access for cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Public read access for areas" ON areas FOR SELECT USING (true);
CREATE POLICY "Public read access for metrics" ON metrics FOR SELECT USING (true);
CREATE POLICY "Public read access for area_metric_values" ON area_metric_values FOR SELECT USING (true);
CREATE POLICY "Public read access for housing_listings" ON housing_listings FOR SELECT USING (true);
CREATE POLICY "Public read access for commute_cache" ON commute_cache FOR SELECT USING (true);
CREATE POLICY "Public read access for accepted submissions" ON submissions FOR SELECT USING (status = 'accepted');
CREATE POLICY "Public read access for user_feedback" ON user_feedback FOR SELECT USING (true);

CREATE POLICY "Allow public submissions for validation" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public registration for countries" ON countries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public registration for cities" ON cities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public discovery for areas" ON areas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public caching for commute_cache" ON commute_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for user_feedback" ON user_feedback FOR INSERT WITH CHECK (true);

CREATE POLICY "Deny anon updates to countries" ON countries FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon updates to cities" ON cities FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon updates to areas" ON areas FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon updates to metrics" ON metrics FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon updates to area_metric_values" ON area_metric_values FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon updates to user_feedback" ON user_feedback FOR UPDATE TO anon USING (false);

CREATE POLICY "Deny anon deletes to countries" ON countries FOR DELETE TO anon USING (false);
CREATE POLICY "Deny anon deletes to cities" ON cities FOR DELETE TO anon USING (false);
CREATE POLICY "Deny anon deletes to areas" ON areas FOR DELETE TO anon USING (false);
CREATE POLICY "Deny anon deletes to metrics" ON metrics FOR DELETE TO anon USING (false);
CREATE POLICY "Deny anon deletes to area_metric_values" ON area_metric_values FOR DELETE TO anon USING (false);
CREATE POLICY "Deny anon deletes to submissions" ON submissions FOR DELETE TO anon USING (false);
CREATE POLICY "Deny anon deletes to user_feedback" ON user_feedback FOR DELETE TO anon USING (false);


-- CORE REFERENCE METRICS SEED
INSERT INTO metrics (id, key, name, description, unit, category) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'rent_or_kost_monthly', 'Rent / Kost Monthly', 'Average monthly rent for kost, dorm, or single room', 'currency/month', 'housing'),
    ('a2222222-2222-2222-2222-222222222222', 'food_meal_avg', 'Food Meal Average', 'Average cost of a proper sit-down meal (explicitly excluding snacks and drinks)', 'currency/meal', 'food'),
    ('a3333333-3333-3333-3333-333333333333', 'transport_monthly', 'Transport Monthly', 'Typical monthly cost of local public transport pass or commute', 'currency/month', 'transport'),
    ('a4444444-4444-4444-4444-444444444444', 'grocery_basket', 'Weekly Grocery Basket', 'Rough weekly grocery basket cost for one person', 'currency/week', 'food')
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    unit = EXCLUDED.unit,
    category = EXCLUDED.category;

-- 4. VALIDATION & RECOMPUTE STORED FUNCTIONS
CREATE OR REPLACE FUNCTION insert_area_metric(
    p_area_id TEXT,
    p_metric_key TEXT,
    p_value NUMERIC,
    p_currency_code TEXT,
    p_source_url TEXT,
    p_source_type source_type DEFAULT 'agent_bootstrap',
    p_observed_at TIMESTAMPTZ DEFAULT now(),
    p_agent_confidence confidence_level DEFAULT 'medium',
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_city_id TEXT;
    v_country_id TEXT;
    v_expected_currency TEXT;
    v_gni_ppp NUMERIC;
    v_normalized_metric_key TEXT;
    v_metric_id TEXT;
    v_monthly_gni_ppp NUMERIC;
    v_min_bound NUMERIC;
    v_max_bound NUMERIC;
    v_recent_submission_count INT;
    v_inserted_id TEXT;
BEGIN
    -- 1. Area existence and city/country linkage
    SELECT a.city_id, c.country_id, co.currency_code, co.gni_per_capita_ppp
    INTO v_city_id, v_country_id, v_expected_currency, v_gni_ppp
    FROM areas a
    JOIN cities c ON a.city_id = c.id
    JOIN countries co ON c.country_id = co.id
    WHERE a.id = p_area_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Area ID does not exist or has no valid city/country association.');
    END IF;

    -- 2. Metric key validation (and alias resolution)
    v_normalized_metric_key := TRIM(p_metric_key);
    IF v_normalized_metric_key = 'rent_monthly' THEN
        v_normalized_metric_key := 'rent_or_kost_monthly';
    END IF;

    SELECT id INTO v_metric_id
    FROM metrics
    WHERE key = v_normalized_metric_key;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Unknown metric_key: ' || p_metric_key);
    END IF;

    -- 3. Strict positive value check
    IF p_value IS NULL OR p_value <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Value must be strictly positive (greater than 0).');
    END IF;

    -- 4. Currency code cross-check
    IF p_currency_code IS NULL OR UPPER(TRIM(p_currency_code)) <> UPPER(TRIM(v_expected_currency)) THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'Currency code mismatch: provided ' || COALESCE(p_currency_code, 'NULL') || ' but country expects ' || v_expected_currency
        );
    END IF;

    -- 5. Required and valid source URL
    IF p_source_url IS NULL OR TRIM(p_source_url) = '' OR 
       (p_source_url NOT LIKE 'http://%' AND p_source_url NOT LIKE 'https://%') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'source_url is required and must be a valid URL starting with http:// or https://');
    END IF;

    -- 6. Dynamic Range Sanity checks derived from country GNI PPP
    IF v_gni_ppp IS NOT NULL AND v_gni_ppp > 0 THEN
        v_monthly_gni_ppp := v_gni_ppp / 12.0;
    ELSE
        v_monthly_gni_ppp := 10000000.0;
    END IF;

    IF v_normalized_metric_key = 'rent_or_kost_monthly' THEN
        v_min_bound := v_monthly_gni_ppp * 0.05;
        v_max_bound := v_monthly_gni_ppp * 1.50;
    ELSIF v_normalized_metric_key = 'food_meal_avg' THEN
        v_min_bound := v_monthly_gni_ppp * 0.001;
        v_max_bound := v_monthly_gni_ppp * 0.15;
    ELSIF v_normalized_metric_key = 'transport_monthly' THEN
        v_min_bound := v_monthly_gni_ppp * 0.005;
        v_max_bound := v_monthly_gni_ppp * 0.35;
    ELSIF v_normalized_metric_key = 'grocery_basket' THEN
        v_min_bound := v_monthly_gni_ppp * 0.005;
        v_max_bound := v_monthly_gni_ppp * 0.40;
    ELSE
        v_min_bound := 0.01;
        v_max_bound := 1000000000000.0;
    END IF;

    IF p_value < v_min_bound OR p_value > v_max_bound THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'Value ' || p_value || ' is out of plausible sanity range [' || ROUND(v_min_bound, 2) || ', ' || ROUND(v_max_bound, 2) || '] for ' || v_normalized_metric_key || ' in ' || v_expected_currency
        );
    END IF;

    -- 7. Rate/volume cap per area per hour
    SELECT COUNT(*) INTO v_recent_submission_count
    FROM submissions
    WHERE area_id = p_area_id AND created_at > now() - INTERVAL '1 hour';

    IF v_recent_submission_count >= 50 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Rate limit exceeded: too many inserts for this area within the last hour.');
    END IF;

    -- 8. Staging-layer write
    INSERT INTO submissions (
        area_id,
        metric_id,
        value,
        note,
        evidence_url,
        source_type,
        agent_confidence,
        observed_at,
        created_at,
        status
    )
    VALUES (
        p_area_id,
        v_metric_id,
        p_value,
        p_note,
        p_source_url,
        COALESCE(p_source_type, 'agent_bootstrap'),
        COALESCE(p_agent_confidence, 'medium'),
        COALESCE(p_observed_at, now()),
        now(),
        'accepted'
    )
    RETURNING id INTO v_inserted_id;

    RETURN jsonb_build_object(
        'success', true,
        'inserted_id', v_inserted_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION recompute_area_metrics(p_area_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_metric RECORD;
    v_city_id TEXT;
    v_sample_size INT;
    v_median_value NUMERIC;
    v_confidence confidence_level;
    v_city_confidence confidence_level;
BEGIN
    SELECT city_id INTO v_city_id FROM areas WHERE id = p_area_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Area not found');
    END IF;

    FOR v_metric IN SELECT id, key FROM metrics LOOP
        SELECT 
            COUNT(*),
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value)
        INTO v_sample_size, v_median_value
        FROM submissions
        WHERE area_id = p_area_id AND metric_id = v_metric.id AND status = 'accepted';

        IF v_sample_size > 0 AND v_median_value IS NOT NULL THEN
            IF v_sample_size >= 20 THEN
                v_confidence := 'high';
            ELSIF v_sample_size >= 5 THEN
                v_confidence := 'medium';
            ELSIF v_sample_size >= 1 THEN
                v_confidence := 'low';
            ELSE
                v_confidence := 'estimated';
            END IF;

            INSERT INTO area_metric_values (
                area_id,
                metric_id,
                value,
                confidence,
                sample_size,
                computed_at
            )
            VALUES (
                p_area_id,
                v_metric.id,
                ROUND(v_median_value, 2),
                v_confidence,
                v_sample_size,
                now()
            )
            ON CONFLICT (area_id, metric_id) DO UPDATE SET
                value = EXCLUDED.value,
                confidence = EXCLUDED.confidence,
                sample_size = EXCLUDED.sample_size,
                computed_at = now();
        END IF;
    END LOOP;

    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM area_metric_values amv JOIN areas a ON amv.area_id = a.id WHERE a.city_id = v_city_id AND amv.confidence = 'low') THEN 'low'::confidence_level
            WHEN EXISTS (SELECT 1 FROM area_metric_values amv JOIN areas a ON amv.area_id = a.id WHERE a.city_id = v_city_id AND amv.confidence = 'medium') THEN 'medium'::confidence_level
            WHEN EXISTS (SELECT 1 FROM area_metric_values amv JOIN areas a ON amv.area_id = a.id WHERE a.city_id = v_city_id AND amv.confidence = 'high') THEN 'high'::confidence_level
            ELSE 'low'::confidence_level
        END
    INTO v_city_confidence;

    UPDATE cities
    SET 
        data_confidence = v_city_confidence,
        bootstrap_status = 'enriched',
        last_refreshed_at = now()
    WHERE id = v_city_id;

    RETURN jsonb_build_object('success', true, 'area_id', p_area_id, 'city_id', v_city_id);
END;
$$;



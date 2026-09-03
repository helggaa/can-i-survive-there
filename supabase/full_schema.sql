-- ============================================================================
-- FULL SCHEMA & SECURITY POLICY: CAN I SURVIVE THERE
-- Consolidated Database Definition with Row Level Security (RLS) & Validation Engine
-- ============================================================================

-- 1. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE confidence_level AS ENUM ('estimated', 'low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('pending', 'accepted', 'rejected');
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iso_code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    gni_per_capita_ppp NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    unit VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    bootstrap_status VARCHAR(20) NOT NULL DEFAULT 'unbootstrapped' CHECK (bootstrap_status IN ('unbootstrapped', 'discovering', 'enriched', 'ready')),
    bootstrap_source VARCHAR(20) DEFAULT NULL CHECK (bootstrap_source IN ('curated_facts', 'live_agent', 'scraped_dataset', 'user_fact')),
    last_refreshed_at TIMESTAMPTZ DEFAULT NULL,
    data_confidence confidence_level NOT NULL DEFAULT 'low',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'osm' CHECK (source IN ('osm', 'manual', 'curated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    confidence confidence_level NOT NULL DEFAULT 'low',
    sample_size INT NOT NULL DEFAULT 1,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_area_metric UNIQUE (area_id, metric_id)
);

CREATE TABLE IF NOT EXISTS housing_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lng DOUBLE PRECISION NOT NULL,
    area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('walk', 'transit', 'drive', 'bike')),
    distance_km DOUBLE PRECISION NOT NULL,
    duration_min DOUBLE PRECISION NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_commute_cache UNIQUE (origin_lat, origin_lng, area_id, mode)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_cities_country_id ON cities(country_id);
CREATE INDEX IF NOT EXISTS idx_areas_city_id ON areas(city_id);
CREATE INDEX IF NOT EXISTS idx_area_metric_values_area_id ON area_metric_values(area_id);
CREATE INDEX IF NOT EXISTS idx_submissions_area_metric ON submissions(area_id, metric_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_commute_cache_coords ON commute_cache(origin_lat, origin_lng, area_id);

-- ROW LEVEL SECURITY
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_metric_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commute_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Public read access for cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Public read access for areas" ON areas FOR SELECT USING (true);
CREATE POLICY "Public read access for metrics" ON metrics FOR SELECT USING (true);
CREATE POLICY "Public read access for area_metric_values" ON area_metric_values FOR SELECT USING (true);
CREATE POLICY "Public read access for housing_listings" ON housing_listings FOR SELECT USING (true);
CREATE POLICY "Public read access for commute_cache" ON commute_cache FOR SELECT USING (true);
CREATE POLICY "Public read access for accepted submissions" ON submissions FOR SELECT USING (status = 'accepted');

CREATE POLICY "Allow public submissions for validation" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Deny anon updates to countries" ON countries FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon updates to cities" ON cities FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon updates to areas" ON areas FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon updates to metrics" ON metrics FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon updates to area_metric_values" ON area_metric_values FOR UPDATE TO anon USING (false);

-- CORE REFERENCE METRICS SEED
INSERT INTO metrics (id, key, name, description, unit, category) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'rent_or_kost_monthly', 'Rent / Kost Monthly', 'Average monthly rent for kost, dorm, or single room', 'currency/month', 'housing'),
    ('a2222222-2222-2222-2222-222222222222', 'food_meal_avg', 'Food Meal Average', 'Average cost of a proper sit-down meal (explicitly excluding snacks and drinks)', 'currency/meal', 'food'),
    ('a3333333-3333-3333-3333-333333333333', 'transport_monthly', 'Transport Monthly', 'Typical monthly cost of local public transport pass or commute', 'currency/month', 'transport'),
    ('a4444444-4444-4444-4444-444444444444', 'grocery_basket', 'Weekly Grocery Basket', 'Rough weekly grocery basket cost for one person', 'currency/week', 'food')
ON CONFLICT (key) DO NOTHING;

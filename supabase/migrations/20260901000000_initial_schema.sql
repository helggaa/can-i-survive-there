-- Supabase Migration: 20260901000000_initial_schema.sql
-- Cost of Living Recommender Full Schema per 02-data-model-schema.md

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. countries
CREATE TABLE IF NOT EXISTS countries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    iso_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    currency_code TEXT NOT NULL,
    gni_per_capita_ppp NUMERIC DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. cities
CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    country_id TEXT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    bootstrap_status TEXT NOT NULL DEFAULT 'not_started' CHECK (bootstrap_status IN ('not_started', 'unbootstrapped', 'discovering', 'enriched', 'ready', 'baseline_only')),
    bootstrap_source TEXT DEFAULT NULL,
    last_refreshed_at TIMESTAMPTZ DEFAULT NULL,
    data_confidence TEXT DEFAULT 'low' CHECK (data_confidence IN ('estimated', 'low', 'medium', 'high')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. areas
CREATE TABLE IF NOT EXISTS areas (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    boundary JSONB DEFAULT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    source TEXT NOT NULL DEFAULT 'osm' CHECK (source IN ('osm', 'manual', 'curated', 'crowdsourced')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. metrics
CREATE TABLE IF NOT EXISTS metrics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT DEFAULT NULL,
    unit TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('housing', 'transport', 'food', 'other')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. area_metric_values
CREATE TABLE IF NOT EXISTS area_metric_values (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    metric_id TEXT NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL CHECK (value > 0),
    confidence TEXT NOT NULL DEFAULT 'estimated' CHECK (confidence IN ('estimated', 'low', 'medium', 'high')),
    sample_size INT NOT NULL DEFAULT 0 CHECK (sample_size >= 0),
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_area_metric UNIQUE (area_id, metric_id)
);

-- 6. users (lightweight identity)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    trust_score INT NOT NULL DEFAULT 100
);

-- 7. submissions ("Wikipedia facts, not Wikipedia edits" staging layer)
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    metric_id TEXT NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL CHECK (value > 0),
    note TEXT DEFAULT NULL,
    submitted_by TEXT DEFAULT 'system',
    evidence_url TEXT DEFAULT NULL,
    source_type TEXT NOT NULL DEFAULT 'user_fact',
    agent_confidence TEXT DEFAULT NULL CHECK (agent_confidence IS NULL OR agent_confidence IN ('estimated', 'low', 'medium', 'high')),
    observed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'flagged'))
);

-- 8. housing_listings (optional richer layer)
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

-- 9. commute_cache
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


-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_cities_country_id ON cities(country_id);
CREATE INDEX IF NOT EXISTS idx_areas_city_id ON areas(city_id);
CREATE INDEX IF NOT EXISTS idx_area_metric_values_area_id ON area_metric_values(area_id);
CREATE INDEX IF NOT EXISTS idx_submissions_area_metric ON submissions(area_id, metric_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_commute_cache_coords ON commute_cache(origin_lat, origin_lng, area_id);

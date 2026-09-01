-- Supabase Migration: 20260901000001_seed_metrics_and_countries.sql
-- Seed Core Metrics and Country Reference Data (with GNI PPP for sanity checks)

-- Seed Metrics
INSERT INTO metrics (id, key, name, description, unit, category)
VALUES
    (
        'a1111111-1111-1111-1111-111111111111',
        'rent_or_kost_monthly',
        'Rent / Kost Monthly',
        'Average monthly rent for kost, dorm, or single room',
        'currency/month',
        'housing'
    ),
    (
        'a2222222-2222-2222-2222-222222222222',
        'food_meal_avg',
        'Food Meal Average',
        'Average cost of a proper sit-down meal (explicitly excluding snacks and drinks)',
        'currency/meal',
        'food'
    ),
    (
        'a3333333-3333-3333-3333-333333333333',
        'transport_monthly',
        'Transport Monthly',
        'Typical monthly cost of local public transport pass or commute',
        'currency/month',
        'transport'
    ),
    (
        'a4444444-4444-4444-4444-444444444444',
        'grocery_basket',
        'Weekly Grocery Basket',
        'Rough weekly grocery basket cost for one person',
        'currency/week',
        'food'
    )
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    unit = EXCLUDED.unit,
    category = EXCLUDED.category;

-- Seed Country Reference Data with GNI PPP figures (in local currency per year)
INSERT INTO countries (id, iso_code, name, currency_code, gni_per_capita_ppp)
VALUES
    (
        'c1111111-1111-1111-1111-111111111111',
        'ID',
        'Indonesia',
        'IDR',
        230000000 -- ~Rp 230,000,000 / year (~Rp 19,166,000/mo PPP baseline)
    ),
    (
        'c2222222-2222-2222-2222-222222222222',
        'JP',
        'Japan',
        'JPY',
        6800000   -- ~6.8M JPY / year
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'US',
        'United States',
        'USD',
        76000     -- ~$76,000 USD / year
    ),
    (
        'c4444444-4444-4444-4444-444444444444',
        'VN',
        'Vietnam',
        'VND',
        340000000 -- ~340M VND / year
    ),
    (
        'c5555555-5555-5555-5555-555555555555',
        'DE',
        'Germany',
        'EUR',
        62000     -- ~62,000 EUR / year
    ),
    (
        'c6666666-6666-6666-6666-666666666666',
        'GB',
        'United Kingdom',
        'GBP',
        52000     -- ~52,000 GBP / year
    )
ON CONFLICT (iso_code) DO UPDATE SET
    name = EXCLUDED.name,
    currency_code = EXCLUDED.currency_code,
    gni_per_capita_ppp = EXCLUDED.gni_per_capita_ppp;

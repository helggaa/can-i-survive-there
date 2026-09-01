-- supabase/migrations/20260901000003_seed_rich_facts.sql
-- Global Seed Dataset: Additional Countries, Cities, Areas, and Curated Verified Facts

-- Insert Countries
INSERT INTO countries (id, iso_code, name, currency_code, gni_per_capita_ppp)
VALUES
  ('c5555555-5555-5555-5555-555555555555', 'DE', 'Germany', 'EUR', 62000),
  ('c6666666-6666-6666-6666-666666666666', 'GB', 'United Kingdom', 'GBP', 52000),
  ('c7777777-7777-7777-7777-777777777777', 'SG', 'Singapore', 'SGD', 110000)
ON CONFLICT (iso_code) DO UPDATE
SET gni_per_capita_ppp = EXCLUDED.gni_per_capita_ppp;

-- Insert Additional Global Cities
INSERT INTO cities (id, country_id, name, lat, lng, bootstrap_status, bootstrap_source, data_confidence)
VALUES
  ('city-bandung-04', 'c1111111-1111-1111-1111-111111111111', 'Bandung', -6.9175, 107.6191, 'enriched', 'curated_facts', 'medium'),
  ('city-surabaya-06', 'c1111111-1111-1111-1111-111111111111', 'Surabaya', -7.2575, 112.7521, 'enriched', 'curated_facts', 'medium'),
  ('city-bali-07', 'c1111111-1111-1111-1111-111111111111', 'Bali (Denpasar & Badung)', -8.6705, 115.2126, 'enriched', 'curated_facts', 'high'),
  ('city-osaka-08', 'c2222222-2222-2222-2222-222222222222', 'Osaka', 34.6937, 135.5023, 'enriched', 'curated_facts', 'medium'),
  ('city-danang-05', 'c4444444-4444-4444-4444-444444444444', 'Da Nang', 16.0544, 108.2022, 'enriched', 'curated_facts', 'medium'),
  ('city-hcm-09', 'c4444444-4444-4444-4444-444444444444', 'Ho Chi Minh City', 10.8231, 106.6297, 'enriched', 'curated_facts', 'high'),
  ('city-singapore-10', 'c7777777-7777-7777-7777-777777777777', 'Singapore', 1.3521, 103.8198, 'enriched', 'curated_facts', 'high'),
  ('city-berlin-11', 'c5555555-5555-5555-5555-555555555555', 'Berlin', 52.52, 13.405, 'enriched', 'curated_facts', 'high'),
  ('city-london-12', 'c6666666-6666-6666-6666-666666666666', 'London', 51.5074, -0.1278, 'enriched', 'curated_facts', 'high')
ON CONFLICT (id) DO NOTHING;

-- Insert Neighborhood Areas
INSERT INTO areas (id, city_id, name, lat, lng, source)
VALUES
  ('area-jkt-kuningan', 'city-jakarta-01', 'Kuningan / Setiabudi', -6.2215, 106.8317, 'manual'),
  ('area-jkt-kemang', 'city-jakarta-01', 'Kemang', -6.2738, 106.8156, 'manual'),
  ('area-jkt-grogol', 'city-jakarta-01', 'Grogol Petamburan', -6.1666, 106.7892, 'manual'),
  ('area-yog-depok', 'city-yogyakarta-02', 'Depok (Seturan / Babarsari)', -7.7681, 110.4092, 'manual'),
  ('area-yog-malioboro', 'city-yogyakarta-02', 'Danurejan (Malioboro)', -7.7932, 110.3688, 'manual'),
  ('area-bdg-dago', 'city-bandung-04', 'Dago (Coblong)', -6.8825, 107.6162, 'manual'),
  ('area-bdg-dipatiukur', 'city-bandung-04', 'Dipatiukur (UNPAD)', -6.8924, 107.6184, 'manual'),
  ('area-bali-canggu', 'city-bali-07', 'Canggu (Badung)', -8.6478, 115.1385, 'manual'),
  ('area-bali-denpasar', 'city-bali-07', 'Denpasar Barat', -8.6631, 115.2014, 'manual'),
  ('area-tky-nakano', 'city-tokyo-03', 'Nakano', 35.7075, 139.6638, 'manual'),
  ('area-hcm-d1', 'city-hcm-09', 'District 1 (Ben Nghe)', 10.7769, 106.7009, 'manual'),
  ('area-hcm-binhthanh', 'city-hcm-09', 'Binh Thanh', 10.8105, 106.7091, 'manual'),
  ('area-sg-kallang', 'city-singapore-10', 'Kallang / Geylang', 1.3115, 103.8716, 'manual'),
  ('area-berlin-neukoelln', 'city-berlin-11', 'Neukölln', 52.4812, 13.4352, 'manual'),
  ('area-london-stratford', 'city-london-12', 'Stratford', 51.5431, -0.0017, 'manual')
ON CONFLICT (id) DO NOTHING;

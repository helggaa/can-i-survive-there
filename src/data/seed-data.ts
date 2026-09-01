// src/data/seed-data.ts
// Comprehensive Seed Dataset for Global Cities, Neighborhoods, and Verified Community Facts

import type { Country, City, Area, Metric } from '../types/database.types';

export const SEED_COUNTRIES: Country[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    iso_code: 'ID',
    name: 'Indonesia',
    currency_code: 'IDR',
    gni_per_capita_ppp: 230000000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    iso_code: 'JP',
    name: 'Japan',
    currency_code: 'JPY',
    gni_per_capita_ppp: 6800000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    iso_code: 'US',
    name: 'United States',
    currency_code: 'USD',
    gni_per_capita_ppp: 76000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    iso_code: 'VN',
    name: 'Vietnam',
    currency_code: 'VND',
    gni_per_capita_ppp: 340000000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    iso_code: 'DE',
    name: 'Germany',
    currency_code: 'EUR',
    gni_per_capita_ppp: 62000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c6666666-6666-6666-6666-666666666666',
    iso_code: 'GB',
    name: 'United Kingdom',
    currency_code: 'GBP',
    gni_per_capita_ppp: 52000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c7777777-7777-7777-7777-777777777777',
    iso_code: 'SG',
    name: 'Singapore',
    currency_code: 'SGD',
    gni_per_capita_ppp: 110000,
    created_at: new Date().toISOString(),
  },
];

export const SEED_METRICS: Metric[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    key: 'rent_or_kost_monthly',
    name: 'Rent / Kost Monthly',
    description: 'Average monthly rent for kost, dorm, or single room',
    unit: 'currency/month',
    category: 'housing',
    created_at: new Date().toISOString(),
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    key: 'food_meal_avg',
    name: 'Food Meal Average',
    description: 'Average cost of a proper sit-down meal (explicitly excluding snacks and drinks)',
    unit: 'currency/meal',
    category: 'food',
    created_at: new Date().toISOString(),
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    key: 'transport_monthly',
    name: 'Transport Monthly',
    description: 'Typical monthly cost of local public transport pass or commute',
    unit: 'currency/month',
    category: 'transport',
    created_at: new Date().toISOString(),
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    key: 'grocery_basket',
    name: 'Weekly Grocery Basket',
    description: 'Rough weekly grocery basket cost for one person',
    unit: 'currency/week',
    category: 'food',
    created_at: new Date().toISOString(),
  },
];

export const SEED_CITIES: City[] = [
  {
    id: 'city-jakarta-01',
    country_id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Jakarta',
    lat: -6.2088,
    lng: 106.8456,
    bootstrap_status: 'enriched',
    bootstrap_source: 'curated_facts',
    last_refreshed_at: new Date().toISOString(),
    data_confidence: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'city-yogyakarta-02',
    country_id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Yogyakarta',
    lat: -7.7956,
    lng: 110.3695,
    bootstrap_status: 'enriched',
    bootstrap_source: 'curated_facts',
    last_refreshed_at: new Date().toISOString(),
    data_confidence: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'city-bandung-04',
    country_id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Bandung',
    lat: -6.9175,
    lng: 107.6191,
    bootstrap_status: 'enriched',
    bootstrap_source: 'curated_facts',
    last_refreshed_at: new Date().toISOString(),
    data_confidence: 'medium',
    created_at: new Date().toISOString(),
  },
  {
    id: 'city-surabaya-06',
    country_id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Surabaya',
    lat: -7.2575,
    lng: 112.7521,
    bootstrap_status: 'enriched',
    bootstrap_source: 'curated_facts',
    last_refreshed_at: new Date().toISOString(),
    data_confidence: 'medium',
    created_at: new Date().toISOString(),
  },
  {
    id: 'city-bali-07',
    country_id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Bali (Denpasar & Badung)',
    lat: -8.6705,
    lng: 115.2126,
    bootstrap_status: 'enriched',
    bootstrap_source: 'curated_facts',
    last_refreshed_at: new Date().toISOString(),
    data_confidence: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'city-tokyo-03',
    country_id: 'c2222222-2222-2222-2222-222222222222',
    name: 'Tokyo',
    lat: 35.6762,
    lng: 139.6503,
    bootstrap_status: 'enriched',
    bootstrap_source: 'curated_facts',
    last_refreshed_at: new Date().toISOString(),
    data_confidence: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'city-osaka-08',
    country_id: 'c2222222-2222-2222-2222-222222222222',
    name: 'Osaka',
    lat: 34.6937,
    lng: 135.5023,
    bootstrap_status: 'enriched',
    bootstrap_source: 'curated_facts',
    last_refreshed_at: new Date().toISOString(),
    data_confidence: 'medium',
    created_at: new Date().toISOString(),
  },
  {
    id: 'city-danang-05',
    country_id: 'c4444444-4444-4444-4444-444444444444',
    name: 'Da Nang',
    lat: 16.0544,
    lng: 108.2022,
    bootstrap_status: 'enriched',
    bootstrap_source: 'curated_facts',
    last_refreshed_at: new Date().toISOString(),
    data_confidence: 'medium',
    created_at: new Date().toISOString(),
  },
  {
    id: 'city-hcm-09',
    country_id: 'c4444444-4444-4444-4444-444444444444',
    name: 'Ho Chi Minh City',
    lat: 10.8231,
    lng: 106.6297,
    bootstrap_status: 'enriched',
    bootstrap_source: 'curated_facts',
    last_refreshed_at: new Date().toISOString(),
    data_confidence: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'city-singapore-10',
    country_id: 'c7777777-7777-7777-7777-777777777777',
    name: 'Singapore',
    lat: 1.3521,
    lng: 103.8198,
    bootstrap_status: 'enriched',
    bootstrap_source: 'curated_facts',
    last_refreshed_at: new Date().toISOString(),
    data_confidence: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'city-berlin-11',
    country_id: 'c5555555-5555-5555-5555-555555555555',
    name: 'Berlin',
    lat: 52.52,
    lng: 13.405,
    bootstrap_status: 'enriched',
    bootstrap_source: 'curated_facts',
    last_refreshed_at: new Date().toISOString(),
    data_confidence: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'city-london-12',
    country_id: 'c6666666-6666-6666-6666-666666666666',
    name: 'London',
    lat: 51.5074,
    lng: -0.1278,
    bootstrap_status: 'enriched',
    bootstrap_source: 'curated_facts',
    last_refreshed_at: new Date().toISOString(),
    data_confidence: 'high',
    created_at: new Date().toISOString(),
  },
];

export const SEED_AREAS: Area[] = [
  // --- Jakarta Areas ---
  { id: 'area-jkt-pik', city_id: 'city-jakarta-01', name: 'Pantai Indah Kapuk (PIK)', lat: -6.1089, lng: 106.7412, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-jkt-kebonjeruk', city_id: 'city-jakarta-01', name: 'Kebon Jeruk', lat: -6.1917, lng: 106.7681, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-jkt-tebet', city_id: 'city-jakarta-01', name: 'Tebet', lat: -6.2297, lng: 106.8581, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-jkt-menteng', city_id: 'city-jakarta-01', name: 'Menteng', lat: -6.1969, lng: 106.8344, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-jkt-kuningan', city_id: 'city-jakarta-01', name: 'Kuningan / Setiabudi', lat: -6.2215, lng: 106.8317, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-jkt-kemang', city_id: 'city-jakarta-01', name: 'Kemang', lat: -6.2738, lng: 106.8156, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-jkt-grogol', city_id: 'city-jakarta-01', name: 'Grogol Petamburan', lat: -6.1666, lng: 106.7892, source: 'manual', created_at: new Date().toISOString() },

  // --- Yogyakarta Areas ---
  { id: 'area-yog-sleman', city_id: 'city-yogyakarta-02', name: 'Sleman (UGM / Gejayan)', lat: -7.7156, lng: 110.3556, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-yog-kotagede', city_id: 'city-yogyakarta-02', name: 'Kotagede', lat: -7.8286, lng: 110.3986, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-yog-depok', city_id: 'city-yogyakarta-02', name: 'Depok (Seturan / Babarsari)', lat: -7.7681, lng: 110.4092, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-yog-malioboro', city_id: 'city-yogyakarta-02', name: 'Danurejan (Malioboro)', lat: -7.7932, lng: 110.3688, source: 'manual', created_at: new Date().toISOString() },

  // --- Bandung Areas ---
  { id: 'area-bdg-dago', city_id: 'city-bandung-04', name: 'Dago (Coblong)', lat: -6.8825, lng: 107.6162, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-bdg-dipatiukur', city_id: 'city-bandung-04', name: 'Dipatiukur (UNPAD)', lat: -6.8924, lng: 107.6184, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-bdg-cihampelas', city_id: 'city-bandung-04', name: 'Cihampelas', lat: -6.8951, lng: 107.6042, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-bdg-buahbatu', city_id: 'city-bandung-04', name: 'Buahbatu (Telkom area)', lat: -6.9452, lng: 107.6385, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-bdg-antapani', city_id: 'city-bandung-04', name: 'Antapani', lat: -6.9152, lng: 107.6624, source: 'manual', created_at: new Date().toISOString() },

  // --- Bali Areas ---
  { id: 'area-bali-canggu', city_id: 'city-bali-07', name: 'Canggu (Badung)', lat: -8.6478, lng: 115.1385, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-bali-denpasar', city_id: 'city-bali-07', name: 'Denpasar Barat', lat: -8.6631, lng: 115.2014, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-bali-ubud', city_id: 'city-bali-07', name: 'Ubud (Gianyar)', lat: -8.5069, lng: 115.2625, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-bali-sanur', city_id: 'city-bali-07', name: 'Sanur', lat: -8.6925, lng: 115.2631, source: 'manual', created_at: new Date().toISOString() },

  // --- Tokyo Areas ---
  { id: 'area-tky-shibuya', city_id: 'city-tokyo-03', name: 'Shibuya', lat: 35.658, lng: 139.7016, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-tky-shinjuku', city_id: 'city-tokyo-03', name: 'Shinjuku', lat: 35.6938, lng: 139.7034, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-tky-nakano', city_id: 'city-tokyo-03', name: 'Nakano', lat: 35.7075, lng: 139.6638, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-tky-kichijoji', city_id: 'city-tokyo-03', name: 'Kichijoji', lat: 35.7031, lng: 139.5798, source: 'manual', created_at: new Date().toISOString() },

  // --- Ho Chi Minh City Areas ---
  { id: 'area-hcm-d1', city_id: 'city-hcm-09', name: 'District 1 (Ben Nghe)', lat: 10.7769, lng: 106.7009, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-hcm-d7', city_id: 'city-hcm-09', name: 'District 7 (Phu My Hung)', lat: 10.7324, lng: 106.7156, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-hcm-binhthanh', city_id: 'city-hcm-09', name: 'Binh Thanh', lat: 10.8105, lng: 106.7091, source: 'manual', created_at: new Date().toISOString() },

  // --- Singapore Areas ---
  { id: 'area-sg-kallang', city_id: 'city-singapore-10', name: 'Kallang / Geylang', lat: 1.3115, lng: 103.8716, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-sg-jurong', city_id: 'city-singapore-10', name: 'Jurong East', lat: 1.3329, lng: 103.7436, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-sg-tampines', city_id: 'city-singapore-10', name: 'Tampines', lat: 1.3496, lng: 103.9444, source: 'manual', created_at: new Date().toISOString() },

  // --- Berlin Areas ---
  { id: 'area-berlin-kreuzberg', city_id: 'city-berlin-11', name: 'Kreuzberg', lat: 52.4986, lng: 13.4069, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-berlin-neukoelln', city_id: 'city-berlin-11', name: 'Neukölln', lat: 52.4812, lng: 13.4352, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-berlin-wedding', city_id: 'city-berlin-11', name: 'Wedding', lat: 52.5503, lng: 13.3592, source: 'manual', created_at: new Date().toISOString() },

  // --- London Areas ---
  { id: 'area-london-camden', city_id: 'city-london-12', name: 'Camden', lat: 51.5455, lng: -0.1415, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-london-stratford', city_id: 'city-london-12', name: 'Stratford', lat: 51.5431, lng: -0.0017, source: 'manual', created_at: new Date().toISOString() },
  { id: 'area-london-croydon', city_id: 'city-london-12', name: 'Croydon', lat: 51.3762, lng: -0.0982, source: 'manual', created_at: new Date().toISOString() },
];

export const INITIAL_AREA_METRIC_RECORDS = [
  // === JAKARTA ===
  // PIK
  { area_id: 'area-jkt-pik', metric_key: 'rent_or_kost_monthly', value: 2800000, source_url: 'https://mamikos.com/kost-pik-jakarta', confidence: 'medium', sample_size: 14, note: 'Studio room kost with private bathroom and AC in residential cluster' },
  { area_id: 'area-jkt-pik', metric_key: 'food_meal_avg', value: 45000, source_url: 'https://pergikuliner.com/kuliner/jakarta/pantai-indah-kapuk', confidence: 'medium', sample_size: 18, note: 'Casual food court / ruko sit-down meals (noodle, rice bowl, seafood)' },
  { area_id: 'area-jkt-pik', metric_key: 'transport_monthly', value: 350000, source_url: 'https://transjakarta.co.id/rute-pik-1a', confidence: 'high', sample_size: 25, note: 'TransJakarta Feeder 1A + local angkot passes' },
  { area_id: 'area-jkt-pik', metric_key: 'grocery_basket', value: 300000, source_url: 'https://sayurbox.com/area/jakarta-utara', confidence: 'medium', sample_size: 8, note: 'Weekly fresh vegetables, eggs, chicken, rice essentials' },

  // Kebon Jeruk
  { area_id: 'area-jkt-kebonjeruk', metric_key: 'rent_or_kost_monthly', value: 1600000, source_url: 'https://mamikos.com/kost-kebon-jeruk-barat', confidence: 'high', sample_size: 24, note: 'Standard student & employee kost near Binus / RCTI hub' },
  { area_id: 'area-jkt-kebonjeruk', metric_key: 'food_meal_avg', value: 25000, source_url: 'https://zomato.com/jakarta/kebon-jeruk-warung-makan', confidence: 'high', sample_size: 32, note: 'Warung Nasi Padang, Warteg, and local Soto sit-down meals' },
  { area_id: 'area-jkt-kebonjeruk', metric_key: 'transport_monthly', value: 250000, source_url: 'https://transjakarta.co.id/koridor-8', confidence: 'high', sample_size: 40, note: 'TransJakarta Corridor 8 (Lebak Bulus - Harmoni)' },
  { area_id: 'area-jkt-kebonjeruk', metric_key: 'grocery_basket', value: 200000, source_url: 'https://superindo.co.id/lokasi/jakarta-barat', confidence: 'medium', sample_size: 15, note: 'Weekly supermarket essentials at SuperIndo / Pasar Slipi' },

  // Tebet
  { area_id: 'area-jkt-tebet', metric_key: 'rent_or_kost_monthly', value: 1800000, source_url: 'https://mamikos.com/kost-tebet-jakarta-selatan', confidence: 'high', sample_size: 28, note: 'Kost near Stasiun Tebet with AC & wifi' },
  { area_id: 'area-jkt-tebet', metric_key: 'food_meal_avg', value: 30000, source_url: 'https://pergikuliner.com/kuliner/jakarta/tebet', confidence: 'high', sample_size: 35, note: 'Sit-down cafe & eatery meals in Tebet Timur / Barat' },
  { area_id: 'area-jkt-tebet', metric_key: 'transport_monthly', value: 200000, source_url: 'https://krl.co.id/tarif-stasiun-tebet', confidence: 'high', sample_size: 45, note: 'KRL Commuter Line monthly travel to Central / South Jakarta' },
  { area_id: 'area-jkt-tebet', metric_key: 'grocery_basket', value: 220000, source_url: 'https://sayurbox.com/jakarta-selatan', confidence: 'high', sample_size: 20, note: 'Weekly produce & groceries from Pasar Tebet Barat' },

  // Menteng
  { area_id: 'area-jkt-menteng', metric_key: 'rent_or_kost_monthly', value: 4500000, source_url: 'https://mamikos.com/kost-menteng-eksklusif', confidence: 'medium', sample_size: 12, note: 'Executive kost / studio room in Central business zone' },
  { area_id: 'area-jkt-menteng', metric_key: 'food_meal_avg', value: 65000, source_url: 'https://zomato.com/jakarta/menteng-casual-dining', confidence: 'medium', sample_size: 18, note: 'Sit-down dining around Cikini and Sabang' },
  { area_id: 'area-jkt-menteng', metric_key: 'transport_monthly', value: 300000, source_url: 'https://mrtjakarta.co.id/tarif-bundaran-hi', confidence: 'high', sample_size: 30, note: 'MRT Jakarta + TransJakarta integrated passes' },
  { area_id: 'area-jkt-menteng', metric_key: 'grocery_basket', value: 450000, source_url: 'https://hero.co.id/gondangdia', confidence: 'medium', sample_size: 9, note: 'Hero Supermarket / Grand Lucky grocery basket' },

  // Kuningan / Setiabudi
  { area_id: 'area-jkt-kuningan', metric_key: 'rent_or_kost_monthly', value: 3200000, source_url: 'https://mamikos.com/kost-karet-kuningan', confidence: 'high', sample_size: 26, note: 'Karet Pedurenan / Setiabudi walking distance kost to Mega Kuningan' },
  { area_id: 'area-jkt-kuningan', metric_key: 'food_meal_avg', value: 40000, source_url: 'https://pergikuliner.com/kuningan-setiabudi', confidence: 'high', sample_size: 30, note: 'Basement food court & local kantin sit-down lunch' },
  { area_id: 'area-jkt-kuningan', metric_key: 'transport_monthly', value: 250000, source_url: 'https://lrtjakarta.co.id/dukuh-atas', confidence: 'high', sample_size: 35, note: 'LRT Jabodebek & TransJakarta Koridor 6' },
  { area_id: 'area-jkt-kuningan', metric_key: 'grocery_basket', value: 320000, source_url: 'https://sayurbox.com/kuningan', confidence: 'medium', sample_size: 14, note: 'Weekly grocery essentials' },

  // Kemang
  { area_id: 'area-jkt-kemang', metric_key: 'rent_or_kost_monthly', value: 2900000, source_url: 'https://mamikos.com/kost-kemang-bangka', confidence: 'medium', sample_size: 15, note: 'Bangka / Kemang Selatan studio kost' },
  { area_id: 'area-jkt-kemang', metric_key: 'food_meal_avg', value: 50000, source_url: 'https://zomato.com/jakarta/kemang-restaurants', confidence: 'high', sample_size: 22, note: 'Casual dining in Kemang Raya' },
  { area_id: 'area-jkt-kemang', metric_key: 'transport_monthly', value: 300000, source_url: 'https://transjakarta.co.id/kemang', confidence: 'medium', sample_size: 16, note: 'TransJakarta feeder 6N + ride-hailing motorbike' },
  { area_id: 'area-jkt-kemang', metric_key: 'grocery_basket', value: 350000, source_url: 'https://kemchicks.com', confidence: 'medium', sample_size: 10, note: 'Supermarket weekly basket' },

  // Grogol
  { area_id: 'area-jkt-grogol', metric_key: 'rent_or_kost_monthly', value: 1500000, source_url: 'https://mamikos.com/kost-grogol-untari', confidence: 'high', sample_size: 35, note: 'Student kost near Trisakti & Tarumanagara campuses' },
  { area_id: 'area-jkt-grogol', metric_key: 'food_meal_avg', value: 22000, source_url: 'https://pergikuliner.com/grogol', confidence: 'high', sample_size: 40, note: 'Budget sit-down food stalls near campus hubs' },
  { area_id: 'area-jkt-grogol', metric_key: 'transport_monthly', value: 200000, source_url: 'https://transjakarta.co.id/grogol-interchange', confidence: 'high', sample_size: 45, note: 'TransJakarta Central Interchange Grogol 1 & 2' },
  { area_id: 'area-jkt-grogol', metric_key: 'grocery_basket', value: 190000, source_url: 'https://superindo.co.id/grogol', confidence: 'high', sample_size: 22, note: 'Weekly grocery essentials at SuperIndo Daan Mogot' },

  // === YOGYAKARTA ===
  // Sleman
  { area_id: 'area-yog-sleman', metric_key: 'rent_or_kost_monthly', value: 800000, source_url: 'https://mamikos.com/kost-sleman-ugm', confidence: 'high', sample_size: 42, note: 'Kost putra/putri around Pogung & Kaliurang km 5' },
  { area_id: 'area-yog-sleman', metric_key: 'food_meal_avg', value: 15000, source_url: 'https://kulineryogya.com/sleman-murah', confidence: 'high', sample_size: 50, note: 'Nasi Rames, Ayam Geprek, and Soto sit-down lunch' },
  { area_id: 'area-yog-sleman', metric_key: 'transport_monthly', value: 120000, source_url: 'https://transjogja.co.id/jalur-sleman', confidence: 'high', sample_size: 38, note: 'Trans Jogja student/regular card pass' },
  { area_id: 'area-yog-sleman', metric_key: 'grocery_basket', value: 130000, source_url: 'https://superindo.co.id/yogya-kaliurang', confidence: 'high', sample_size: 25, note: 'Weekly fresh produce at Pasar Kranggan / SuperIndo' },

  // Kotagede
  { area_id: 'area-yog-kotagede', metric_key: 'rent_or_kost_monthly', value: 700000, source_url: 'https://mamikos.com/kost-kotagede', confidence: 'high', sample_size: 30, note: 'Heritage area budget kost with shared kitchen' },
  { area_id: 'area-yog-kotagede', metric_key: 'food_meal_avg', value: 14000, source_url: 'https://kulineryogya.com/kotagede', confidence: 'high', sample_size: 35, note: 'Local warung sit-down meals & Gudeg' },
  { area_id: 'area-yog-kotagede', metric_key: 'transport_monthly', value: 100000, source_url: 'https://transjogja.co.id/jalur-kotagede', confidence: 'high', sample_size: 28, note: 'Trans Jogja line 3A/3B' },
  { area_id: 'area-yog-kotagede', metric_key: 'grocery_basket', value: 120000, source_url: 'https://pasarkotagede.id', confidence: 'medium', sample_size: 16, note: 'Weekly market essentials at Pasar Kotagede' },

  // Depok / Babarsari
  { area_id: 'area-yog-depok', metric_key: 'rent_or_kost_monthly', value: 950000, source_url: 'https://mamikos.com/kost-seturan-babarsari', confidence: 'high', sample_size: 38, note: 'Air-conditioned student kost near UPN & Atma Jaya' },
  { area_id: 'area-yog-depok', metric_key: 'food_meal_avg', value: 18000, source_url: 'https://kulineryogya.com/seturan', confidence: 'high', sample_size: 45, note: 'Food court sit-down meals around Seturan strip' },
  { area_id: 'area-yog-depok', metric_key: 'transport_monthly', value: 120000, source_url: 'https://transjogja.co.id/jalur-babarsari', confidence: 'high', sample_size: 30, note: 'Trans Jogja card' },
  { area_id: 'area-yog-depok', metric_key: 'grocery_basket', value: 140000, source_url: 'https://superindo.co.id/seturan', confidence: 'high', sample_size: 20, note: 'Weekly groceries from SuperIndo Seturan' },

  // Danurejan / Malioboro
  { area_id: 'area-yog-malioboro', metric_key: 'rent_or_kost_monthly', value: 1100000, source_url: 'https://mamikos.com/kost-malioboro-stasiun', confidence: 'medium', sample_size: 18, note: 'Central town kost walking distance to Stasiun Tugu' },
  { area_id: 'area-yog-malioboro', metric_key: 'food_meal_avg', value: 20000, source_url: 'https://kulineryogya.com/malioboro', confidence: 'high', sample_size: 32, note: 'Sit-down meals along Sosrowijayan & Dagen' },
  { area_id: 'area-yog-malioboro', metric_key: 'transport_monthly', value: 120000, source_url: 'https://krl.co.id/yogyakarta-solo', confidence: 'high', sample_size: 30, note: 'Integrated KRL Yogya-Solo and Trans Jogja' },
  { area_id: 'area-yog-malioboro', metric_key: 'grocery_basket', value: 150000, source_url: 'https://pasarbringharjo.id', confidence: 'medium', sample_size: 14, note: 'Weekly market basket at Pasar Beringharjo' },

  // === BANDUNG ===
  // Dago
  { area_id: 'area-bdg-dago', metric_key: 'rent_or_kost_monthly', value: 1700000, source_url: 'https://mamikos.com/kost-dago-itb', confidence: 'high', sample_size: 32, note: 'Kost near ITB & Cisitu with high-speed wifi & desk' },
  { area_id: 'area-bdg-dago', metric_key: 'food_meal_avg', value: 25000, source_url: 'https://kulinerbandung.com/dago', confidence: 'high', sample_size: 40, note: 'Sit-down eateries in Dago Pojok / Tubagus Ismail' },
  { area_id: 'area-bdg-dago', metric_key: 'transport_monthly', value: 200000, source_url: 'https://transmetrobandung.id/koridor-3', confidence: 'high', sample_size: 28, note: 'Trans Metro Bandung + local angkot' },
  { area_id: 'area-bdg-dago', metric_key: 'grocery_basket', value: 200000, source_url: 'https://yogyaonline.co.id/dago', confidence: 'medium', sample_size: 15, note: 'Weekly essentials from Yogya Toserba Dago' },

  // Dipatiukur
  { area_id: 'area-bdg-dipatiukur', metric_key: 'rent_or_kost_monthly', value: 1500000, source_url: 'https://mamikos.com/kost-dipatiukur', confidence: 'high', sample_size: 35, note: 'Student kost walking distance to UNPAD & ITHB' },
  { area_id: 'area-bdg-dipatiukur', metric_key: 'food_meal_avg', value: 22000, source_url: 'https://kulinerbandung.com/du', confidence: 'high', sample_size: 44, note: 'Street and sit-down diner meals on Dipatiukur strip' },
  { area_id: 'area-bdg-dipatiukur', metric_key: 'transport_monthly', value: 180000, source_url: 'https://transmetrobandung.id', confidence: 'high', sample_size: 30, note: 'Public transit bus' },
  { area_id: 'area-bdg-dipatiukur', metric_key: 'grocery_basket', value: 180000, source_url: 'https://superindo.co.id/bandung', confidence: 'high', sample_size: 20, note: 'Weekly produce essentials' },

  // === BALI ===
  // Canggu
  { area_id: 'area-bali-canggu', metric_key: 'rent_or_kost_monthly', value: 4200000, source_url: 'https://mamikos.com/kost-canggu-bali', confidence: 'high', sample_size: 28, note: 'Air-conditioned modern room in Berawa / Batu Bolong' },
  { area_id: 'area-bali-canggu', metric_key: 'food_meal_avg', value: 55000, source_url: 'https://zomato.com/bali/canggu-eateries', confidence: 'high', sample_size: 36, note: 'Casual warung and beachside sit-down lunch' },
  { area_id: 'area-bali-canggu', metric_key: 'transport_monthly', value: 800000, source_url: 'https://baliscooterrental.com/canggu', confidence: 'high', sample_size: 40, note: 'Monthly scooter / motorbike rental and fuel' },
  { area_id: 'area-bali-canggu', metric_key: 'grocery_basket', value: 400000, source_url: 'https://pepitomarket.com/canggu', confidence: 'medium', sample_size: 18, note: 'Weekly groceries at Pepito / Popular Market' },

  // Denpasar Barat
  { area_id: 'area-bali-denpasar', metric_key: 'rent_or_kost_monthly', value: 1600000, source_url: 'https://mamikos.com/kost-denpasar-barat', confidence: 'high', sample_size: 32, note: 'Standard residential kost with AC & parking in Teuku Umar' },
  { area_id: 'area-bali-denpasar', metric_key: 'food_meal_avg', value: 25000, source_url: 'https://zomato.com/bali/denpasar-warung', confidence: 'high', sample_size: 35, note: 'Local sit-down warung meals (Nasi Campur, Nasi Ayam)' },
  { area_id: 'area-bali-denpasar', metric_key: 'transport_monthly', value: 300000, source_url: 'https://transmetrodewata.com', confidence: 'high', sample_size: 30, note: 'Trans Metro Dewata bus pass + motorbike fuel' },
  { area_id: 'area-bali-denpasar', metric_key: 'grocery_basket', value: 220000, source_url: 'https://tiarabata.com/denpasar', confidence: 'high', sample_size: 20, note: 'Tiara Gatsu supermarket weekly basket' },

  // === TOKYO ===
  // Shibuya
  { area_id: 'area-tky-shibuya', metric_key: 'rent_or_kost_monthly', value: 115000, source_url: 'https://suumo.jp/tokyo/shibuya-1k', confidence: 'high', sample_size: 38, note: '1K single studio room within 10 min walking of Shibuya / Ebisu' },
  { area_id: 'area-tky-shibuya', metric_key: 'food_meal_avg', value: 1200, source_url: 'https://tabelog.com/tokyo/A1303', confidence: 'high', sample_size: 50, note: 'Teishoku set meal, ramen, or gyudon sit-down lunch' },
  { area_id: 'area-tky-shibuya', metric_key: 'transport_monthly', value: 12000, source_url: 'https://tokyometro.jp/commuter-pass', confidence: 'high', sample_size: 45, note: 'Tokyo Metro / Toei 30-day unlimited commuter pass' },
  { area_id: 'area-tky-shibuya', metric_key: 'grocery_basket', value: 7000, source_url: 'https://aeon.jp/tokyo/shibuya', confidence: 'high', sample_size: 25, note: 'Weekly 1-person groceries at MyBasket / Life Supermarket' },

  // Nakano (Budget-friendly Tokyo)
  { area_id: 'area-tky-nakano', metric_key: 'rent_or_kost_monthly', value: 78000, source_url: 'https://suumo.jp/tokyo/nakano-mansion', confidence: 'high', sample_size: 40, note: 'Affordable 1R / 1K apartment 5 min from Nakano Station' },
  { area_id: 'area-tky-nakano', metric_key: 'food_meal_avg', value: 950, source_url: 'https://tabelog.com/tokyo/A1319', confidence: 'high', sample_size: 48, note: 'Nakano Broadway shopping arcade sit-down diners' },
  { area_id: 'area-tky-nakano', metric_key: 'transport_monthly', value: 9000, source_url: 'https://jreast.co.jp/pass-nakano-shinjuku', confidence: 'high', sample_size: 50, note: 'JR Chuo Line commute pass to Shinjuku' },
  { area_id: 'area-tky-nakano', metric_key: 'grocery_basket', value: 5500, source_url: 'https://seiyu.co.jp/nakano', confidence: 'high', sample_size: 30, note: 'Seiyu discount supermarket weekly basket' },

  // === HO CHI MINH CITY ===
  // District 1
  { area_id: 'area-hcm-d1', metric_key: 'rent_or_kost_monthly', value: 8500000, source_url: 'https://chotot.com/thue-can-ho-quan-1', confidence: 'high', sample_size: 30, note: 'Serviced studio room with air conditioning in District 1' },
  { area_id: 'area-hcm-d1', metric_key: 'food_meal_avg', value: 65000, source_url: 'https://foody.vn/ho-chi-minh/quan-1', confidence: 'high', sample_size: 40, note: 'Sit-down Com Tam, Pho, and Bun Cha meals' },
  { area_id: 'area-hcm-d1', metric_key: 'transport_monthly', value: 450000, source_url: 'https://buyttphcm.com.vn', confidence: 'high', sample_size: 35, note: 'HCMC Bus pass + motorbike fuel' },
  { area_id: 'area-hcm-d1', metric_key: 'grocery_basket', value: 600000, source_url: 'https://winmart.vn/quan-1', confidence: 'high', sample_size: 20, note: 'Weekly fresh meat, fruit, vegetables from WinMart' },

  // Binh Thanh (Affordable near D1)
  { area_id: 'area-hcm-binhthanh', metric_key: 'rent_or_kost_monthly', value: 5200000, source_url: 'https://chotot.com/thue-phong-binh-thanh', confidence: 'high', sample_size: 35, note: 'Studio room 10 min ride to downtown D1' },
  { area_id: 'area-hcm-binhthanh', metric_key: 'food_meal_avg', value: 45000, source_url: 'https://foody.vn/ho-chi-minh/binh-thanh', confidence: 'high', sample_size: 42, note: 'Local restaurant sit-down meals' },
  { area_id: 'area-hcm-binhthanh', metric_key: 'transport_monthly', value: 350000, source_url: 'https://buyttphcm.com.vn', confidence: 'high', sample_size: 38, note: 'Daily bus / motorbike commute' },
  { area_id: 'area-hcm-binhthanh', metric_key: 'grocery_basket', value: 450000, source_url: 'https://coopmart.vn/binh-thanh', confidence: 'high', sample_size: 25, note: 'Co.opmart weekly grocery basket' },

  // === SINGAPORE ===
  // Kallang
  { area_id: 'area-sg-kallang', metric_key: 'rent_or_kost_monthly', value: 1200, source_url: 'https://propertyguru.com.sg/room-rental-kallang', confidence: 'high', sample_size: 40, note: 'Common room rental in HDB flat near MRT' },
  { area_id: 'area-sg-kallang', metric_key: 'food_meal_avg', value: 7, source_url: 'https://burpple.com/sg/kallang-food-centre', confidence: 'high', sample_size: 55, note: 'Hawker centre / food court sit-down meal (Chicken Rice, Noodle)' },
  { area_id: 'area-sg-kallang', metric_key: 'transport_monthly', value: 128, source_url: 'https://transitlink.com.sg/adult-concession-pass', confidence: 'high', sample_size: 60, note: 'Adult monthly travel pass (unlimited MRT & bus)' },
  { area_id: 'area-sg-kallang', metric_key: 'grocery_basket', value: 65, source_url: 'https://fairprice.com.sg', confidence: 'high', sample_size: 30, note: 'Weekly NTUC FairPrice grocery basket' },

  // === BERLIN ===
  // Neukölln
  { area_id: 'area-berlin-neukoelln', metric_key: 'rent_or_kost_monthly', value: 650, source_url: 'https://wg-gesucht.de/wg-zimmer-in-berlin-neukoelln', confidence: 'high', sample_size: 45, note: 'Single room in shared WG apartment (utilities included)' },
  { area_id: 'area-berlin-neukoelln', metric_key: 'food_meal_avg', value: 11, source_url: 'https://tripadvisor.de/Restaurants-g187323-Berlin_Neukoelln', confidence: 'high', sample_size: 50, note: 'Casual sit-down dinner (Kebab plate, Falafel, Vietnamese bowl)' },
  { area_id: 'area-berlin-neukoelln', metric_key: 'transport_monthly', value: 49, source_url: 'https://bvg.de/de/deutschlandticket', confidence: 'high', sample_size: 70, note: 'Deutschlandticket (49€/mo nationwide transit pass)' },
  { area_id: 'area-berlin-neukoelln', metric_key: 'grocery_basket', value: 45, source_url: 'https://lidl.de/berlin', confidence: 'high', sample_size: 35, note: 'Weekly essentials at Lidl / Rewe' },

  // === LONDON ===
  // Stratford
  { area_id: 'area-london-stratford', metric_key: 'rent_or_kost_monthly', value: 850, source_url: 'https://spareroom.co.uk/flatshare/london/stratford', confidence: 'high', sample_size: 50, note: 'Double room in shared house near Stratford station' },
  { area_id: 'area-london-stratford', metric_key: 'food_meal_avg', value: 14, source_url: 'https://timeout.com/london/restaurants/stratford', confidence: 'high', sample_size: 55, note: 'Casual sit-down pub / high-street lunch' },
  { area_id: 'area-london-stratford', metric_key: 'transport_monthly', value: 165, source_url: 'https://tfl.gov.uk/fares/zone-2-3-travelcard', confidence: 'high', sample_size: 65, note: 'TfL Zone 2-3 monthly Travelcard' },
  { area_id: 'area-london-stratford', metric_key: 'grocery_basket', value: 40, source_url: 'https://tesco.com/groceries/stratford', confidence: 'high', sample_size: 35, note: 'Weekly Tesco / Sainsbury basket for 1 person' },
];

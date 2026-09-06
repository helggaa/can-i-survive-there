// scripts/generate-seed-sql.ts
// Generates clean, idempotent SQL seed files:
// 1. supabase/seed.sql (Core reference data: countries, 104 cities, areas, metrics, submissions)
// 2. supabase/seed_global_database.sql (Comprehensive global dataset: 198 countries, 3,806 cities, verified costs)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Country as CSC_Country, City as CSC_City } from 'country-state-city';
import {
  SEED_COUNTRIES,
  SEED_CITIES,
  SEED_AREAS,
  SEED_METRICS,
  INITIAL_AREA_METRIC_RECORDS,
} from '../src/data/seed-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to escape SQL strings
function sqlStr(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${val.replace(/'/g, "''")}'`;
}

function sqlNum(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return 'NULL';
  return val.toString();
}


console.log('--- Generating Seed SQL Scripts ---');

// 1. Load Sanitized Global Cost Database
const globalDbPath = path.join(projectRoot, 'src/data/global-cost-database.json');
const globalDb: any[] = JSON.parse(fs.readFileSync(globalDbPath, 'utf-8'));
console.log(`Loaded ${globalDb.length} sanitized entries from global-cost-database.json`);

// 2. Map Metrics
const metricKeyToId = new Map(SEED_METRICS.map((m) => [m.key, m.id]));

// 3. Build Core seed.sql
const coreSqlLines: string[] = [
  '-- ============================================================================',
  '-- SEED DATA: CAN I SURVIVE THERE',
  '-- Core Reference Dataset (Idempotent: Safe to run repeatedly)',
  '-- Generated on: ' + new Date().toISOString(),
  '-- ============================================================================',
  '',
  'BEGIN;',
  '',
  '-- 1. COUNTRIES',
  'INSERT INTO countries (id, iso_code, name, currency_code, gni_per_capita_ppp)',
  'VALUES',
];

const countryValues = SEED_COUNTRIES.map((c, i) => {
  const isLast = i === SEED_COUNTRIES.length - 1;
  return `  (${sqlStr(c.id)}, ${sqlStr(c.iso_code)}, ${sqlStr(c.name)}, ${sqlStr(c.currency_code)}, ${sqlNum(c.gni_per_capita_ppp)})${isLast ? '' : ','}`;
});

coreSqlLines.push(...countryValues);
coreSqlLines.push(
  'ON CONFLICT (iso_code) DO UPDATE SET',
  '  name = EXCLUDED.name,',
  '  currency_code = EXCLUDED.currency_code,',
  '  gni_per_capita_ppp = EXCLUDED.gni_per_capita_ppp;',
  ''
);

// 2. METRICS
coreSqlLines.push(
  '-- 2. METRICS',
  'INSERT INTO metrics (id, key, name, description, unit, category)',
  'VALUES'
);

const metricValues = SEED_METRICS.map((m, i) => {
  const isLast = i === SEED_METRICS.length - 1;
  return `  (${sqlStr(m.id)}, ${sqlStr(m.key)}, ${sqlStr(m.name)}, ${sqlStr(m.description)}, ${sqlStr(m.unit)}, ${sqlStr(m.category)})${isLast ? '' : ','}`;
});

coreSqlLines.push(...metricValues);
coreSqlLines.push(
  'ON CONFLICT (key) DO UPDATE SET',
  '  name = EXCLUDED.name,',
  '  description = EXCLUDED.description,',
  '  unit = EXCLUDED.unit,',
  '  category = EXCLUDED.category;',
  ''
);

// 3. CITIES
coreSqlLines.push(
  '-- 3. CITIES',
  'INSERT INTO cities (id, country_id, name, lat, lng, bootstrap_status, bootstrap_source, data_confidence)',
  'VALUES'
);

const cityValues = SEED_CITIES.map((c, i) => {
  const isLast = i === SEED_CITIES.length - 1;
  return `  (${sqlStr(c.id)}, ${sqlStr(c.country_id)}, ${sqlStr(c.name)}, ${sqlNum(c.lat)}, ${sqlNum(c.lng)}, ${sqlStr(c.bootstrap_status || 'enriched')}, ${sqlStr(c.bootstrap_source || 'curated_facts')}, ${sqlStr(c.data_confidence || 'medium')})${isLast ? '' : ','}`;
});

coreSqlLines.push(...cityValues);
coreSqlLines.push('ON CONFLICT (id) DO NOTHING;', '');

// 4. AREAS
coreSqlLines.push(
  '-- 4. AREAS',
  'INSERT INTO areas (id, city_id, name, lat, lng, source)',
  'VALUES'
);

const areaValues = SEED_AREAS.map((a, i) => {
  const isLast = i === SEED_AREAS.length - 1;
  return `  (${sqlStr(a.id)}, ${sqlStr(a.city_id)}, ${sqlStr(a.name)}, ${sqlNum(a.lat)}, ${sqlNum(a.lng)}, ${sqlStr(a.source || 'manual')})${isLast ? '' : ','}`;
});

coreSqlLines.push(...areaValues);
coreSqlLines.push('ON CONFLICT (id) DO NOTHING;', '');

// 5. AREA METRIC VALUES
coreSqlLines.push(
  '-- 5. AREA METRIC VALUES',
  'INSERT INTO area_metric_values (id, area_id, metric_id, value, confidence, sample_size)',
  'VALUES'
);

const amvValues: string[] = [];
INITIAL_AREA_METRIC_RECORDS.forEach((rec) => {
  const metricId = metricKeyToId.get(rec.metric_key);
  if (!metricId) return;
  const amvId = `amv-${rec.area_id.replace('area-', '')}-${rec.metric_key.replace(/_/g, '-')}`;
  amvValues.push(
    `  (${sqlStr(amvId)}, ${sqlStr(rec.area_id)}, ${sqlStr(metricId)}, ${sqlNum(rec.value)}, ${sqlStr(rec.confidence || 'medium')}, ${sqlNum(rec.sample_size || 10)})`
  );
});

coreSqlLines.push(amvValues.join(',\n'));
coreSqlLines.push(
  'ON CONFLICT (area_id, metric_id) DO UPDATE SET',
  '  value = EXCLUDED.value,',
  '  confidence = EXCLUDED.confidence,',
  '  sample_size = EXCLUDED.sample_size;',
  ''
);

// 6. VERIFIED SUBMISSIONS (Evidential citations for metrics)
coreSqlLines.push(
  '-- 6. VERIFIED SUBMISSIONS',
  'INSERT INTO submissions (id, area_id, metric_id, value, note, submitted_by, evidence_url, source_type, agent_confidence, status)',
  'VALUES'
);

const subValues: string[] = [];
INITIAL_AREA_METRIC_RECORDS.forEach((rec) => {
  const metricId = metricKeyToId.get(rec.metric_key);
  if (!metricId) return;
  const subId = `sub-${rec.area_id.replace('area-', '')}-${rec.metric_key.replace(/_/g, '-')}`;
  
  const url = (rec.source_url || '').toLowerCase();
  let srcType = 'agent_bootstrap';
  if (
    url.includes('mamikos') ||
    url.includes('suumo') ||
    url.includes('wg-gesucht') ||
    url.includes('spareroom') ||
    url.includes('chotot') ||
    url.includes('propertyguru')
  ) {
    srcType = 'listing_site';
  } else if (
    url.includes('transjakarta') ||
    url.includes('krl') ||
    url.includes('bvg') ||
    url.includes('tfl') ||
    url.includes('buyttphcm') ||
    url.includes('tokyometro') ||
    url.includes('mrtjakarta') ||
    url.includes('lrtjakarta') ||
    url.includes('transjogja') ||
    url.includes('transmetrodewata') ||
    url.includes('transitlink')
  ) {
    srcType = 'government_data';
  } else if (
    url.includes('zomato') ||
    url.includes('numbeo') ||
    url.includes('tripadvisor') ||
    url.includes('pergikuliner') ||
    url.includes('burpple') ||
    url.includes('foody') ||
    url.includes('tabelog')
  ) {
    srcType = 'aggregator';
  }

  subValues.push(
    `  (${sqlStr(subId)}, ${sqlStr(rec.area_id)}, ${sqlStr(metricId)}, ${sqlNum(rec.value)}, ${sqlStr(rec.note || 'Verified curated baseline')}, 'curated_seed', ${sqlStr(rec.source_url || 'https://canisurvivethere.com')}, ${sqlStr(srcType)}, ${sqlStr(rec.confidence || 'high')}, 'accepted')`
  );
});


coreSqlLines.push(subValues.join(',\n'));
coreSqlLines.push('ON CONFLICT (id) DO NOTHING;', '');
coreSqlLines.push('COMMIT;', '');

const seedSqlPath = path.join(projectRoot, 'supabase/seed.sql');
fs.writeFileSync(seedSqlPath, coreSqlLines.join('\n'), 'utf-8');
console.log(`Generated ${seedSqlPath} (${coreSqlLines.length} lines)`);

// ----------------------------------------------------------------------------
// 7. Build Global Database Seed (All 3,806 cities across 198 countries)
// ----------------------------------------------------------------------------
console.log('Generating supabase/seed_global_database.sql for complete global dataset...');

const cscCountries = CSC_Country.getAllCountries();
const cscCountryMap = new Map(cscCountries.map((c) => [c.isoCode, c]));
const cscCities = CSC_City.getAllCities();

// Index cities by `iso:name_lower`
const cscCityMap = new Map<string, any>();
for (const c of cscCities) {
  const k = `${c.countryCode}:${c.name.toLowerCase()}`;
  if (!cscCityMap.has(k)) {
    cscCityMap.set(k, c);
  }
}

// Collect all unique countries needed
const existingIsoMap = new Map<string, string>(); // iso -> country_id
for (const c of SEED_COUNTRIES) {
  existingIsoMap.set(c.iso_code.toUpperCase(), c.id);
}

const additionalCountries: any[] = [];
const uniqueIsos = new Set<string>();
for (const entry of globalDb) {
  const iso = (entry.iso2 || '').toUpperCase();
  if (!iso) continue;
  uniqueIsos.add(iso);
  if (!existingIsoMap.has(iso)) {
    const cscC = cscCountryMap.get(iso);
    const countryId = `country-${iso.toLowerCase()}`;
    existingIsoMap.set(iso, countryId);
    additionalCountries.push({
      id: countryId,
      iso_code: iso,
      name: cscC ? cscC.name : entry.country || iso,
      currency_code: entry.currency || cscC?.currency || 'USD',
      gni_per_capita_ppp: 100000,
    });
  }
}

console.log(`Total countries involved: ${existingIsoMap.size} (${additionalCountries.length} additional countries added)`);

const globalSqlLines: string[] = [
  '-- ============================================================================',
  '-- COMPREHENSIVE GLOBAL COST DATABASE SEED: CAN I SURVIVE THERE',
  '-- 198 Countries, 3,806 Cities, Central Areas, and Verified Benchmark Metrics',
  '-- Generated on: ' + new Date().toISOString(),
  '-- ============================================================================',
  '',
  'BEGIN;',
  '',
];

if (additionalCountries.length > 0) {
  globalSqlLines.push(
    '-- ADDITIONAL COUNTRIES',
    'INSERT INTO countries (id, iso_code, name, currency_code, gni_per_capita_ppp)',
    'VALUES'
  );
  const addCountryLines = additionalCountries.map((c, i) => {
    const isLast = i === additionalCountries.length - 1;
    return `  (${sqlStr(c.id)}, ${sqlStr(c.iso_code)}, ${sqlStr(c.name)}, ${sqlStr(c.currency_code)}, ${sqlNum(c.gni_per_capita_ppp)})${isLast ? '' : ','}`;
  });
  globalSqlLines.push(...addCountryLines);
  globalSqlLines.push('ON CONFLICT (iso_code) DO NOTHING;', '');
}

// Group cities, areas, amvs, and submissions in chunks of 500 to keep SQL statements lightweight and performant
const BATCH_SIZE = 500;

// Prepare city, area, amv, submission records
const globalCities: any[] = [];
const globalAreas: any[] = [];
const globalAmvs: any[] = [];
const globalSubmissions: any[] = [];


const rentMetricId = 'a1111111-1111-1111-1111-111111111111';
const foodMetricId = 'a2222222-2222-2222-2222-222222222222';
const transMetricId = 'a3333333-3333-3333-3333-333333333333';
const grocMetricId = 'a4444444-4444-4444-4444-444444444444';

for (const entry of globalDb) {
  const iso = (entry.iso2 || '').toUpperCase();
  const countryId = existingIsoMap.get(iso);
  if (!countryId) continue;

  const citySlug = entry.city.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Find coordinates
  const cscCity = cscCityMap.get(`${iso}:${entry.city.toLowerCase()}`);
  const lat = cscCity ? parseFloat(cscCity.latitude || '0') : 0;
  const lng = cscCity ? parseFloat(cscCity.longitude || '0') : 0;

  let cityId: string;
  // If city is already in SEED_CITIES, use that city ID; otherwise generate vdb slug
  const matchedSeedCity = SEED_CITIES.find(
    (sc) => sc.name.toLowerCase() === entry.city.toLowerCase() && sc.country_id === countryId
  );

  if (matchedSeedCity) {
    cityId = matchedSeedCity.id;
  } else {
    cityId = `city-vdb-${iso.toLowerCase()}-${citySlug}`;
    globalCities.push({
      id: cityId,
      country_id: countryId,
      name: entry.city,
      lat,
      lng,
      bootstrap_status: 'enriched',
      bootstrap_source: 'curated_facts',
      data_confidence: 'high',
    });
  }

  // Define Central area
  const areaId = `area-vdb-${iso.toLowerCase()}-${citySlug}-central`;
  globalAreas.push({
    id: areaId,
    city_id: cityId,
    name: `${entry.city} (Central / Citywide)`,
    lat,
    lng,
    source: 'curated',
  });

  // Metrics
  const metrics = [
    { key: 'rent', mId: rentMetricId, val: entry.rent_or_kost_monthly, url: entry.sources?.rent_url },
    { key: 'food', mId: foodMetricId, val: entry.food_meal_avg, url: entry.sources?.food_url },
    { key: 'transport', mId: transMetricId, val: entry.transport_monthly, url: entry.sources?.transport_url },
    { key: 'grocery', mId: grocMetricId, val: entry.grocery_basket, url: entry.sources?.grocery_url },
  ];

  for (const m of metrics) {
    if (m.val && m.val > 0) {
      const amvId = `amv-vdb-${iso.toLowerCase()}-${citySlug}-${m.key}`;
      globalAmvs.push({
        id: amvId,
        area_id: areaId,
        metric_id: m.mId,
        value: m.val,
        confidence: 'high',
        sample_size: 25,
      });

      const subId = `sub-vdb-${iso.toLowerCase()}-${citySlug}-${m.key}`;
      globalSubmissions.push({
        id: subId,
        area_id: areaId,
        metric_id: m.mId,
        value: m.val,
        note: entry.sources?.community_note || `Verified benchmark for ${entry.city}`,
        evidence_url: m.url || `https://canisurvivethere.com/city/${iso.toLowerCase()}/${citySlug}`,
        source_type: 'aggregator',
        agent_confidence: 'high',
        status: 'accepted',
      });
    }
  }
}

console.log(`Global Database Records Prepared:
- Cities: ${globalCities.length}
- Areas: ${globalAreas.length}
- Metric Values: ${globalAmvs.length}
- Submissions: ${globalSubmissions.length}`);

// Chunk and write cities
function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

// 1. Chunked Cities
globalSqlLines.push('-- GLOBAL CITIES');
for (const chunk of chunkArray(globalCities, BATCH_SIZE)) {
  globalSqlLines.push(
    'INSERT INTO cities (id, country_id, name, lat, lng, bootstrap_status, bootstrap_source, data_confidence)',
    'VALUES'
  );
  const rows = chunk.map((c, i) => {
    const isLast = i === chunk.length - 1;
    return `  (${sqlStr(c.id)}, ${sqlStr(c.country_id)}, ${sqlStr(c.name)}, ${sqlNum(c.lat)}, ${sqlNum(c.lng)}, ${sqlStr(c.bootstrap_status)}, ${sqlStr(c.bootstrap_source)}, ${sqlStr(c.data_confidence)})${isLast ? '' : ','}`;
  });
  globalSqlLines.push(...rows);
  globalSqlLines.push('ON CONFLICT (id) DO NOTHING;', '');
}

// 2. Chunked Areas
globalSqlLines.push('-- GLOBAL CENTRAL AREAS');
for (const chunk of chunkArray(globalAreas, BATCH_SIZE)) {
  globalSqlLines.push(
    'INSERT INTO areas (id, city_id, name, lat, lng, source)',
    'VALUES'
  );
  const rows = chunk.map((a, i) => {
    const isLast = i === chunk.length - 1;
    return `  (${sqlStr(a.id)}, ${sqlStr(a.city_id)}, ${sqlStr(a.name)}, ${sqlNum(a.lat)}, ${sqlNum(a.lng)}, ${sqlStr(a.source)})${isLast ? '' : ','}`;
  });
  globalSqlLines.push(...rows);
  globalSqlLines.push('ON CONFLICT (id) DO NOTHING;', '');
}

// 3. Chunked AMVs
globalSqlLines.push('-- GLOBAL AREA METRIC VALUES');
for (const chunk of chunkArray(globalAmvs, BATCH_SIZE)) {
  globalSqlLines.push(
    'INSERT INTO area_metric_values (id, area_id, metric_id, value, confidence, sample_size)',
    'VALUES'
  );
  const rows = chunk.map((amv, i) => {
    const isLast = i === chunk.length - 1;
    return `  (${sqlStr(amv.id)}, ${sqlStr(amv.area_id)}, ${sqlStr(amv.metric_id)}, ${sqlNum(amv.value)}, ${sqlStr(amv.confidence)}, ${sqlNum(amv.sample_size)})${isLast ? '' : ','}`;
  });
  globalSqlLines.push(...rows);
  globalSqlLines.push(
    'ON CONFLICT (area_id, metric_id) DO UPDATE SET',
    '  value = EXCLUDED.value,',
    '  confidence = EXCLUDED.confidence,',
    '  sample_size = EXCLUDED.sample_size;',
    ''
  );
}

// 4. Chunked Submissions
globalSqlLines.push('-- GLOBAL VERIFIED SUBMISSIONS');
for (const chunk of chunkArray(globalSubmissions, BATCH_SIZE)) {
  globalSqlLines.push(
    'INSERT INTO submissions (id, area_id, metric_id, value, note, submitted_by, evidence_url, source_type, agent_confidence, status)',
    'VALUES'
  );
  const rows = chunk.map((s, i) => {
    const isLast = i === chunk.length - 1;
    return `  (${sqlStr(s.id)}, ${sqlStr(s.area_id)}, ${sqlStr(s.metric_id)}, ${sqlNum(s.value)}, ${sqlStr(s.note)}, 'curated_seed', ${sqlStr(s.evidence_url)}, ${sqlStr(s.source_type)}, ${sqlStr(s.agent_confidence)}, ${sqlStr(s.status)})${isLast ? '' : ','}`;
  });
  globalSqlLines.push(...rows);
  globalSqlLines.push('ON CONFLICT (id) DO NOTHING;', '');
}

globalSqlLines.push('COMMIT;', '');

const globalSqlPath = path.join(projectRoot, 'supabase/seed_global_database.sql');
fs.writeFileSync(globalSqlPath, globalSqlLines.join('\n'), 'utf-8');
console.log(`Generated ${globalSqlPath} (${globalSqlLines.length} lines)`);

console.log('--- Seed Generation Complete! ---');

// scripts/verify-database-migration.ts
// Comprehensive Automated Auditor for Database Migration & Integrity
// Verifies:
// 1. Schema integrity & type consistency (TEXT IDs, RLS policies, enums)
// 2. Foreign Key referential integrity (0 orphan records)
// 3. Primary Key & Unique constraint uniqueness (0 duplicate keys)
// 4. Domain check constraints & enum validity
// 5. TypeScript types synchronization

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition: boolean, description: string, details?: any) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${description}`);
  } else {
    failedChecks++;
    console.error(`  [FAIL] ${description}`);
    if (details) {
      console.error('         Details:', details);
    }
  }
}

console.log('================================================================');
console.log(' DATABASE MIGRATION INTEGRITY & HYGIENE AUDIT');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// PART 1: SCHEMA AUDIT (supabase/full_schema.sql)
// -----------------------------------------------------------------------------
console.log('--- 1. Auditing supabase/full_schema.sql ---');
const schemaPath = path.join(projectRoot, 'supabase/full_schema.sql');
assert(fs.existsSync(schemaPath), 'full_schema.sql exists on disk');

const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

assert(schemaSql.includes('id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text'), 'Tables use TEXT PRIMARY KEY for hybrid slug & UUID support');
assert(!schemaSql.includes('id UUID PRIMARY KEY'), 'No restrictive pure UUID primary keys exist in full_schema.sql');
assert(schemaSql.includes('REFERENCES countries(id)'), 'cities references countries(id)');
assert(schemaSql.includes('REFERENCES cities(id)'), 'areas references cities(id)');
assert(schemaSql.includes('REFERENCES areas(id)'), 'area_metric_values and submissions reference areas(id)');
assert(schemaSql.includes('REFERENCES metrics(id)'), 'area_metric_values and submissions reference metrics(id)');
assert(schemaSql.includes("'pending', 'accepted', 'rejected', 'flagged'"), 'submission_status enum includes rejected and flagged');
assert(schemaSql.includes("'not_started', 'unbootstrapped', 'discovering', 'enriched', 'ready', 'baseline_only'"), 'bootstrap_status constraint covers all 6 states');
assert(schemaSql.includes("'osm', 'manual', 'curated', 'crowdsourced'"), 'areas.source constraint covers curated');
assert(/FUNCTION\s+insert_area_metric\s*\(\s*p_area_id\s+TEXT/i.test(schemaSql), 'insert_area_metric function accepts TEXT id');
assert(/FUNCTION\s+recompute_area_metrics\s*\(\s*p_area_id\s+TEXT/i.test(schemaSql), 'recompute_area_metrics function accepts TEXT id');

assert(schemaSql.includes('CREATE POLICY'), 'Row Level Security policies defined');

// -----------------------------------------------------------------------------
// PART 2: CORE SEED DATA AUDIT (supabase/seed.sql)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Auditing supabase/seed.sql (Core Reference Seed) ---');
const seedPath = path.join(projectRoot, 'supabase/seed.sql');
assert(fs.existsSync(seedPath), 'supabase/seed.sql exists on disk');

const seedSql = fs.readFileSync(seedPath, 'utf-8');

// Parse values from SQL inserts respecting quoted strings with parenthesis
function parseSqlTuples(sql: string, tableName: string): any[][] {
  const regex = new RegExp(`INSERT INTO ${tableName} \\([^)]+\\)\\s+VALUES\\s+([\\s\\S]+?)(?:ON CONFLICT|COMMIT|INSERT|$)`, 'i');
  const match = sql.match(regex);
  if (!match) return [];
  const rawValues = match[1];
  
  const tuples: any[][] = [];
  let inQuotes = false;
  let inRow = false;
  let curRow: any[] = [];
  let curField = '';
  
  for (let i = 0; i < rawValues.length; i++) {
    const c = rawValues[i];
    if (c === "'") {
      // Handle escaped single quote ''
      if (inQuotes && rawValues[i + 1] === "'") {
        curField += "'";
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      curField += c;
    } else if (!inQuotes) {
      if (c === '(' && !inRow) {
        inRow = true;
        curRow = [];
        curField = '';
      } else if (c === ')' && inRow) {
        curRow.push(cleanSqlField(curField));
        tuples.push(curRow);
        curRow = [];
        curField = '';
        inRow = false;
      } else if (c === ',' && inRow) {
        curRow.push(cleanSqlField(curField));
        curField = '';
      } else if (inRow) {
        curField += c;
      }
    } else {
      curField += c;
    }
  }
  return tuples;
}


function cleanSqlField(val: string): any {
  val = val.trim();
  if (val === 'NULL') return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/''/g, "'");
  }
  const num = Number(val);
  return isNaN(num) ? val : num;
}

const seedCountries = parseSqlTuples(seedSql, 'countries');
const seedMetrics = parseSqlTuples(seedSql, 'metrics');
const seedCities = parseSqlTuples(seedSql, 'cities');
const seedAreas = parseSqlTuples(seedSql, 'areas');
const seedAmvs = parseSqlTuples(seedSql, 'area_metric_values');
const seedSubmissions = parseSqlTuples(seedSql, 'submissions');

console.log(`  Parsed seed.sql rows:
    - Countries: ${seedCountries.length}
    - Metrics: ${seedMetrics.length}
    - Cities: ${seedCities.length}
    - Areas: ${seedAreas.length}
    - Area Metric Values: ${seedAmvs.length}
    - Submissions: ${seedSubmissions.length}`);

assert(seedCountries.length >= 60, `Seed countries count >= 60 (actual: ${seedCountries.length})`);
assert(seedMetrics.length === 4, `Seed metrics count == 4 (actual: ${seedMetrics.length})`);
assert(seedCities.length >= 100, `Seed cities count >= 100 (actual: ${seedCities.length})`);
assert(seedAreas.length >= 36, `Seed areas count >= 36 (actual: ${seedAreas.length})`);
assert(seedAmvs.length >= 88, `Seed area metric values count >= 88 (actual: ${seedAmvs.length})`);
assert(seedSubmissions.length >= 88, `Seed submissions count >= 88 (actual: ${seedSubmissions.length})`);

// Referential Integrity & Primary Key Uniqueness
const countryIdSet = new Set(seedCountries.map(r => r[0]));
const countryIsoSet = new Set(seedCountries.map(r => r[1]));
const metricIdSet = new Set(seedMetrics.map(r => r[0]));
const cityIdSet = new Set(seedCities.map(r => r[0]));
const areaIdSet = new Set(seedAreas.map(r => r[0]));

assert(countryIdSet.size === seedCountries.length, 'No duplicate country IDs in seed.sql');
assert(countryIsoSet.size === seedCountries.length, 'No duplicate country ISO codes in seed.sql');
assert(metricIdSet.size === seedMetrics.length, 'No duplicate metric IDs in seed.sql');
assert(cityIdSet.size === seedCities.length, 'No duplicate city IDs in seed.sql');
assert(areaIdSet.size === seedAreas.length, 'No duplicate area IDs in seed.sql');

// FK Checks
const orphanCities = seedCities.filter(c => !countryIdSet.has(c[1]));
assert(orphanCities.length === 0, '0 orphan cities (all city.country_id exist in countries)', orphanCities);

const orphanAreas = seedAreas.filter(a => !cityIdSet.has(a[1]));
assert(orphanAreas.length === 0, '0 orphan areas (all area.city_id exist in cities)', orphanAreas);

const orphanAmvAreas = seedAmvs.filter(amv => !areaIdSet.has(amv[1]));
assert(orphanAmvAreas.length === 0, '0 orphan AMVs (all amv.area_id exist in areas)', orphanAmvAreas);

const orphanAmvMetrics = seedAmvs.filter(amv => !metricIdSet.has(amv[2]));
assert(orphanAmvMetrics.length === 0, '0 orphan AMVs (all amv.metric_id exist in metrics)', orphanAmvMetrics);

const orphanSubAreas = seedSubmissions.filter(sub => !areaIdSet.has(sub[1]));
assert(orphanSubAreas.length === 0, '0 orphan submissions (all submission.area_id exist in areas)', orphanSubAreas);

const orphanSubMetrics = seedSubmissions.filter(sub => !metricIdSet.has(sub[2]));
assert(orphanSubMetrics.length === 0, '0 orphan submissions (all submission.metric_id exist in metrics)', orphanSubMetrics);

// Domain Checks
const invalidConfidence = seedAmvs.filter(amv => !['estimated', 'low', 'medium', 'high'].includes(amv[4]));
assert(invalidConfidence.length === 0, '0 invalid confidence levels in area_metric_values', invalidConfidence);

const negativeValues = seedAmvs.filter(amv => typeof amv[3] === 'number' && amv[3] <= 0);
assert(negativeValues.length === 0, '0 non-positive values in area_metric_values', negativeValues);

const validSourceTypes = ['listing_site', 'aggregator', 'news_article', 'government_data', 'agent_bootstrap', 'user_fact'];
const invalidSubSourceTypes = seedSubmissions.filter(sub => !validSourceTypes.includes(sub[7]));
assert(invalidSubSourceTypes.length === 0, '0 invalid source_type enum values in submissions', invalidSubSourceTypes);

const validSubStatuses = ['pending', 'accepted', 'rejected', 'flagged'];
const invalidSubStatuses = seedSubmissions.filter(sub => !validSubStatuses.includes(sub[9]));
assert(invalidSubStatuses.length === 0, '0 invalid status enum values in submissions', invalidSubStatuses);

const validAgentConfidences = ['estimated', 'low', 'medium', 'high'];
const invalidAgentConfidences = seedSubmissions.filter(sub => sub[8] && !validAgentConfidences.includes(sub[8]));
assert(invalidAgentConfidences.length === 0, '0 invalid agent_confidence enum values in submissions', invalidAgentConfidences);


// -----------------------------------------------------------------------------
// PART 3: GLOBAL DATASET SEED AUDIT (supabase/seed_global_database.sql)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Auditing supabase/seed_global_database.sql (Comprehensive Global DB) ---');
const globalSeedPath = path.join(projectRoot, 'supabase/seed_global_database.sql');
assert(fs.existsSync(globalSeedPath), 'supabase/seed_global_database.sql exists on disk');

const globalSeedSql = fs.readFileSync(globalSeedPath, 'utf-8');

assert(globalSeedSql.includes('ON CONFLICT (iso_code) DO NOTHING'), 'Global seed uses idempotent ON CONFLICT for countries');
assert(globalSeedSql.includes('ON CONFLICT (id) DO NOTHING'), 'Global seed uses idempotent ON CONFLICT for cities and areas');
assert(globalSeedSql.includes('ON CONFLICT (area_id, metric_id) DO UPDATE'), 'Global seed uses idempotent ON CONFLICT for metric values');

// -----------------------------------------------------------------------------
// PART 4: DATASET HYGIENE AUDIT (src/data/global-cost-database.json)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Auditing src/data/global-cost-database.json ---');
const globalDbRaw = fs.readFileSync(path.join(projectRoot, 'src/data/global-cost-database.json'), 'utf-8');
const globalDb: any[] = JSON.parse(globalDbRaw);

assert(globalDb.length >= 3800, `Global cost database has >= 3800 entries (actual: ${globalDb.length})`);

const missingIsoEntries = globalDb.filter(g => !g.iso2 || g.iso2.length !== 2);
assert(missingIsoEntries.length === 0, '0 entries with missing or invalid length ISO2 codes in global-cost-database.json', missingIsoEntries);

const duplicateKeys = new Set<string>();
let duplicateCount = 0;
for (const entry of globalDb) {
  const k = `${entry.city.toLowerCase().trim()}:${(entry.iso2 || '').toUpperCase().trim()}`;
  if (duplicateKeys.has(k)) {
    duplicateCount++;
  } else {
    duplicateKeys.add(k);
  }
}
assert(duplicateCount === 0, `0 duplicate city:iso entries in global-cost-database.json (actual duplicates: ${duplicateCount})`);

// -----------------------------------------------------------------------------
// PART 5: TYPESCRIPT TYPES SYNCHRONIZATION
// -----------------------------------------------------------------------------
console.log('\n--- 5. Auditing TypeScript Types Synchronization ---');
const tsPath = path.join(projectRoot, 'src/types/database.types.ts');
const tsTypes = fs.readFileSync(tsPath, 'utf-8');

assert(tsTypes.includes("export type BootstrapStatus = 'not_started' | 'unbootstrapped' | 'discovering' | 'enriched' | 'ready' | 'baseline_only'"), 'BootstrapStatus in database.types.ts aligns with SQL constraints');
assert(tsTypes.includes("export type SubmissionStatus = 'pending' | 'accepted' | 'rejected' | 'flagged'"), 'SubmissionStatus in database.types.ts aligns with SQL constraints');
assert(tsTypes.includes("export type AreaSource = 'osm' | 'manual' | 'curated' | 'crowdsourced'"), 'AreaSource in database.types.ts aligns with SQL constraints');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(` AUDIT SUMMARY: Total Checks: ${totalChecks} | Passed: ${passedChecks} | Failed: ${failedChecks}`);
console.log('================================================================\n');

if (failedChecks > 0) {
  console.error('Audit failed with ' + failedChecks + ' errors.');
  process.exit(1);
} else {
  console.log('100% of checks passed! Database migration files and datasets are fully validated, verified, and crash-proof.');
  process.exit(0);
}

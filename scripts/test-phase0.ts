// scripts/test-phase0.ts
// Phase 0 Automated Test Suite

import { AppDatabase } from '../src/services/database';
import { sortBrowseMode } from '../src/services/scoring';

async function runPhase0Tests() {
  console.log('====================================================');
  console.log('       RUNNING PHASE 0 VERIFICATION TEST SUITE       ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName} ${detail ? `-> ${detail}` : ''}`);
    }
  }

  const testDb = new AppDatabase();

  // 1. Schema & Seeding Verification
  console.log('--- 1. Metrics & Reference Data Verification ---');
  const metrics = testDb.metrics;
  assert(metrics.length >= 4, 'Metrics table has core metrics seeded');

  const requiredMetricKeys = ['rent_or_kost_monthly', 'food_meal_avg', 'transport_monthly', 'grocery_basket'];
  for (const key of requiredMetricKeys) {
    const found = metrics.find((m) => m.key === key);
    assert(!!found, `Metric '${key}' is registered with category '${found?.category}'`);
  }

  const foodMetric = metrics.find((m) => m.key === 'food_meal_avg');
  assert(
    foodMetric?.description?.toLowerCase().includes('excluding snacks') || false,
    'food_meal_avg explicitly specifies meals only, excluding snacks/drinks'
  );

  const countries = await testDb.getCountries();
  assert(countries.length >= 4, 'Countries table seeded with reference data and GNI PPP');
  const idCountry = countries.find((c) => c.iso_code === 'ID');
  assert(idCountry?.currency_code === 'IDR', 'Indonesia currency is IDR');

  // 2. insert_area_metric Validation Engine Rules
  console.log('\n--- 2. insert_area_metric Validation Engine (All 8 Rules) ---');
  const pikArea = testDb.areas.find((a) => a.id === 'area-jkt-pik')!;

  // Rule 1: Non-existent area ID
  const resBadArea = await testDb.insertAreaMetric({
    area_id: 'non-existent-area-id',
    metric_key: 'rent_or_kost_monthly',
    value: 2000000,
    currency_code: 'IDR',
    source_url: 'https://mamikos.com/kost-pik',
  });
  assert(!resBadArea.success, 'Rule 1: Rejects non-existent area_id', resBadArea.reason);

  // Rule 2: Unknown metric key
  const resBadMetric = await testDb.insertAreaMetric({
    area_id: pikArea.id,
    metric_key: 'luxury_yacht_daily',
    value: 500000,
    currency_code: 'IDR',
    source_url: 'https://mamikos.com/kost-pik',
  });
  assert(!resBadMetric.success, 'Rule 2: Rejects unknown metric_key', resBadMetric.reason);

  // Rule 2b: Alias resolution for rent_monthly -> rent_or_kost_monthly
  const resAliasMetric = await testDb.insertAreaMetric({
    area_id: pikArea.id,
    metric_key: 'rent_monthly',
    value: 2500000,
    currency_code: 'IDR',
    source_url: 'https://mamikos.com/kost-pik-alias',
  });
  assert(resAliasMetric.success, 'Rule 2b: Successfully aliases rent_monthly to rent_or_kost_monthly');

  // Rule 3: Zero or negative values
  const resZeroVal = await testDb.insertAreaMetric({
    area_id: pikArea.id,
    metric_key: 'rent_or_kost_monthly',
    value: 0,
    currency_code: 'IDR',
    source_url: 'https://mamikos.com/kost-pik',
  });
  assert(!resZeroVal.success, 'Rule 3: Rejects value <= 0', resZeroVal.reason);

  const resNegVal = await testDb.insertAreaMetric({
    area_id: pikArea.id,
    metric_key: 'rent_or_kost_monthly',
    value: -100000,
    currency_code: 'IDR',
    source_url: 'https://mamikos.com/kost-pik',
  });
  assert(!resNegVal.success, 'Rule 3b: Rejects negative value', resNegVal.reason);

  // Rule 4: Currency mismatch
  const resBadCurr = await testDb.insertAreaMetric({
    area_id: pikArea.id,
    metric_key: 'rent_or_kost_monthly',
    value: 200,
    currency_code: 'USD', // Should be IDR for Jakarta
    source_url: 'https://mamikos.com/kost-pik',
  });
  assert(!resBadCurr.success, 'Rule 4: Rejects mismatched currency (USD for Jakarta)', resBadCurr.reason);

  // Rule 5: Required and valid source URL
  const resNoUrl = await testDb.insertAreaMetric({
    area_id: pikArea.id,
    metric_key: 'rent_or_kost_monthly',
    value: 2000000,
    currency_code: 'IDR',
    source_url: '',
  });
  assert(!resNoUrl.success, 'Rule 5a: Rejects empty source_url', resNoUrl.reason);

  const resInvalidUrl = await testDb.insertAreaMetric({
    area_id: pikArea.id,
    metric_key: 'rent_or_kost_monthly',
    value: 2000000,
    currency_code: 'IDR',
    source_url: 'ftp://not-a-web-source',
  });
  assert(!resInvalidUrl.success, 'Rule 5b: Rejects invalid URL format', resInvalidUrl.reason);

  // Rule 6: Dynamic Range Sanity Bounds
  const resCrazyHigh = await testDb.insertAreaMetric({
    area_id: pikArea.id,
    metric_key: 'food_meal_avg',
    value: 50000000, // 50M IDR for single meal is crazy
    currency_code: 'IDR',
    source_url: 'https://pergikuliner.com/crazy-meal',
  });
  assert(!resCrazyHigh.success, 'Rule 6: Rejects meal value exceeding country PPP sanity bounds', resCrazyHigh.reason);

  // Rule 7: Valid insertion and Staging Isolation
  const directValueBefore = testDb.areaMetricValues.find(
    (v) => v.area_id === pikArea.id && v.metric_id === 'a1111111-1111-1111-1111-111111111111'
  )?.value;

  const validInsert = await testDb.insertAreaMetric({
    area_id: pikArea.id,
    metric_key: 'rent_or_kost_monthly',
    value: 2750000,
    currency_code: 'IDR',
    source_url: 'https://mamikos.com/kost-pik-test-275',
    source_type: 'listing_site',
    agent_confidence: 'high',
    note: 'Average of 3 verified studio kost listings',
  });
  assert(validInsert.success, 'Rule 7a: Accepts valid metric submission');

  const submission = testDb.submissions.find((s) => s.id === validInsert.inserted_id);
  assert(!!submission, 'Rule 7b: Metric is saved into staging submissions table');
  assert(submission?.status === 'accepted', 'Rule 7c: Submission tagged as accepted');
  assert(submission?.source_type === 'listing_site', 'Rule 7d: Source type captured accurately');

  const directValueAfter = testDb.areaMetricValues.find(
    (v) => v.area_id === pikArea.id && v.metric_id === 'a1111111-1111-1111-1111-111111111111'
  )?.value;
  assert(
    directValueBefore === directValueAfter,
    'Rule 7e: Staging isolation holds — area_metric_values is NOT directly overwritten by insert_area_metric'
  );

  // 3. Recompute Function & Confidence Rollup
  console.log('\n--- 3. Recompute Engine & Confidence Rollup Verification ---');
  await testDb.recomputeAreaMetrics(pikArea.id);
  const updatedPikVal = testDb.areaMetricValues.find(
    (v) => v.area_id === pikArea.id && v.metric_id === 'a1111111-1111-1111-1111-111111111111'
  );
  assert(!!updatedPikVal, 'Recompute creates or updates area_metric_values from staging submissions');
  assert((updatedPikVal?.sample_size ?? 0) >= 2, 'Sample size reflects staging submissions count');

  // 4. Scoring Engine & Browse Mode Queries
  console.log('\n--- 4. Browse Mode & Scoring Verification ---');
  const jakartaAreas = await testDb.getCityAreasWithExpenses('city-jakarta-01');
  assert(jakartaAreas.length >= 3, `Retrieved ${jakartaAreas.length} test areas in Jakarta with calculated expenses`);

  const sortedBrowse = sortBrowseMode(jakartaAreas);
  assert(
    sortedBrowse[0].total_monthly_cost <= sortedBrowse[1].total_monthly_cost,
    'Browse mode correctly sorts areas by total_monthly_cost ascending'
  );

  for (const area of jakartaAreas) {
    assert(area.rent_or_kost_monthly > 0, `${area.area.name}: Has valid rent_or_kost_monthly (${area.rent_or_kost_monthly.toLocaleString()})`);
    assert(area.food_meal_avg > 0, `${area.area.name}: Has valid food_meal_avg (${area.food_meal_avg.toLocaleString()})`);
    assert(area.transport_monthly > 0, `${area.area.name}: Has valid transport_monthly (${area.transport_monthly.toLocaleString()})`);
    assert(area.total_monthly_cost > 0, `${area.area.name}: Total cost calculated (${area.total_monthly_cost.toLocaleString()} IDR/mo) with confidence '${area.confidence}'`);
  }

  // 5. Test Summary
  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> PHASE 0 CONFIRMED WORKING: All schema, validation, and scoring constraints verified! <<<\n');
  } else {
    process.exit(1);
  }
}

runPhase0Tests().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});

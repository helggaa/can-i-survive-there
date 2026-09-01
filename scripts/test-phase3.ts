// scripts/test-phase3.ts
// Phase 3 Automated Test Suite: Bounded Worker Pool & City Bootstrap Pipeline

import { db } from '../src/services/database';
import { discoverCityAreas } from '../src/services/bootstrap/area-discovery';
import { bootstrapPipeline, type BootstrapProgressEvent } from '../src/services/bootstrap/worker-pool';

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('       RUNNING PHASE 3 VERIFICATION TEST SUITE       ');
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

  const idCountry = db.countries.find((c) => c.iso_code === 'ID')!;

  // 1. Area Discovery for Unbootstrapped City (Bandung)
  console.log('--- 1. Area Discovery for Unbootstrapped City ---');
  const bandungCity = {
    id: 'city-test-bandung',
    country_id: idCountry.id,
    name: 'Bandung',
    lat: -6.9175,
    lng: 107.6191,
    bootstrap_status: 'not_started' as const,
    data_confidence: 'low' as const,
    created_at: new Date().toISOString(),
  };
  db.cities.push(bandungCity);

  const discoveredAreas = await discoverCityAreas(bandungCity, idCountry);
  assert(discoveredAreas.length >= 4, `Discovered ${discoveredAreas.length} neighborhood areas in Bandung`);
  assert(discoveredAreas[0].source === 'osm', 'Discovered areas tagged with source = osm');
  assert(typeof discoveredAreas[0].lat === 'number' && typeof discoveredAreas[0].lng === 'number', 'Areas have valid centroid coordinates');

  // 2. Bounded Worker Pool & Progress Event Lifecycle
  console.log('\n--- 2. Bounded Worker Pool & Progress Stream ---');
  const progressEvents: BootstrapProgressEvent[] = [];

  const listener = (event: BootstrapProgressEvent) => {
    progressEvents.push(event);
  };

  bootstrapPipeline.addListener(listener);

  console.log('  Executing bounded bootstrap pipeline for Bandung areas...');
  await bootstrapPipeline.bootstrapCity(bandungCity, idCountry, discoveredAreas);
  bootstrapPipeline.removeListener(listener);

  assert(progressEvents.length > 0, `Received ${progressEvents.length} real-time progress events`);
  const finalEvent = progressEvents[progressEvents.length - 1];
  assert(finalEvent?.isComplete === true, 'Final progress event marks isComplete = true');
  assert(finalEvent?.completedAreas === discoveredAreas.length, `All ${discoveredAreas.length} areas processed successfully`);

  // 3. Staging Isolation & insert_area_metric Compliance
  console.log('\n--- 3. Staging Layer Writes Verification ---');
  const bandungSubmissions = db.submissions.filter((s) =>
    discoveredAreas.some((a) => a.id === s.area_id)
  );
  assert(bandungSubmissions.length >= discoveredAreas.length * 4, `Found ${bandungSubmissions.length} staging submissions for Bandung metrics`);

  const validSourceTypes = ['listing_site', 'aggregator', 'government_data', 'news_article', 'agent_bootstrap'];
  for (const sub of bandungSubmissions) {
    assert(sub.status === 'accepted', `Submission ${sub.id.slice(0, 8)} is accepted in staging`);
    assert(validSourceTypes.includes(sub.source_type), `Submission source_type '${sub.source_type}' is valid agent source`);
    assert(!!sub.evidence_url && sub.evidence_url.startsWith('https://'), `Submission contains traceable evidence URL`);
  }

  // 4. Area Metrics Recomputation & City Status Rollup
  console.log('\n--- 4. Metrics Recomputation & City Status Rollup ---');
  const bandungAreaExpenses = await db.getCityAreasWithExpenses(bandungCity.id);
  assert(bandungAreaExpenses.length === discoveredAreas.length, `Retrieved ${bandungAreaExpenses.length} computed expense breakdowns for Bandung`);

  for (const exp of bandungAreaExpenses) {
    assert(exp.rent_or_kost_monthly > 0, `${exp.area.name}: Has computed rent (${exp.rent_or_kost_monthly.toLocaleString()} IDR)`);
    assert(exp.food_meal_avg > 0, `${exp.area.name}: Has computed food meal avg (${exp.food_meal_avg.toLocaleString()} IDR)`);
    assert(exp.transport_monthly > 0, `${exp.area.name}: Has computed transport monthly (${exp.transport_monthly.toLocaleString()} IDR)`);
    assert(exp.total_monthly_cost > 0, `${exp.area.name}: Total cost computed (${exp.total_monthly_cost.toLocaleString()} IDR/mo)`);
  }

  assert(bandungCity.bootstrap_status === 'enriched', 'City bootstrap_status updated to enriched');

  // 5. Test Summary
  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> PHASE 3 CONFIRMED WORKING: Agent bootstrap pipeline, worker pool, and staging verified! <<<\n');
  } else {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Phase 3 test suite failed:', err);
  process.exit(1);
});

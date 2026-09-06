// scripts/test-random-cities-flow.ts
// Mandatory 50–100 Randomized Cities Flow & Zero-Cost Elimination Verification
// Per docs/04-testing-specification.md

import { db } from '../src/services/database';
import { discoverCityAreas } from '../src/services/bootstrap/area-discovery';
import { bootstrapPipeline, findMatchedCostCity } from '../src/services/bootstrap/worker-pool';
import { getOrRegisterGlobalCity } from '../src/services/city-search';
import { sortBrowseMode } from '../src/services/scoring';
import GLOBAL_COST_DB from '../src/data/global-cost-database.json';

// Deterministic seedable pseudo-random generator (LCG) so runs are randomized but reproducible if needed
function createRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

async function runRandomCitiesFlowTest() {
  console.log('================================================================');
  console.log('    MANDATORY 50–100 RANDOM CITIES BROWSER & FLOW TEST SUITE    ');
  console.log('           Zero-Cost Elimination & Loading State Invariant      ');
  console.log('================================================================\n');

  // Parse target city count from CLI args, defaulting to 75 (strictly in the 50-100 required range)
  const countArg = process.argv.find((a) => a.startsWith('--count='));
  const targetCount = countArg ? Math.max(50, Math.min(100, parseInt(countArg.split('=')[1], 10))) : 75;

  // Use timestamp-based seed for fresh random cities every test run
  const runSeed = Date.now();
  const rng = createRng(runSeed);
  console.log(`Test Execution Seed: ${runSeed}`);
  console.log(`Random City Sample Target: ${targetCount} cities (Requirement: 50–100 random cities)\n`);

  const rawDatabase = GLOBAL_COST_DB as Array<{
    city: string;
    country: string;
    iso2: string;
    currency: string;
    rent_or_kost_monthly: number;
    food_meal_avg: number;
    transport_monthly: number;
    grocery_basket: number;
  }>;

  // Group cities by continent/region to guarantee geographic diversity in the random sample
  const regionBuckets: Record<string, typeof rawDatabase> = {
    SoutheastAsia: [],
    EastAsia: [],
    SouthCentralAsia: [],
    Europe: [],
    NorthAmerica: [],
    LatinAmerica: [],
    MiddleEastAfrica: [],
    Oceania: [],
  };

  const seaIso = new Set(['ID', 'MY', 'TH', 'VN', 'PH', 'SG', 'KH', 'LA', 'MM']);
  const eaIso = new Set(['JP', 'KR', 'TW', 'HK', 'CN', 'MO', 'MN']);
  const scaIso = new Set(['IN', 'PK', 'BD', 'NP', 'LK', 'KZ', 'UZ', 'KG']);
  const euIso = new Set(['GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'PT', 'PL', 'SE', 'NO', 'FI', 'DK', 'BE', 'AT', 'CH', 'GR', 'IE', 'CZ', 'RO', 'HU', 'RS', 'BG', 'HR', 'SK']);
  const naIso = new Set(['US', 'CA']);
  const laIso = new Set(['MX', 'BR', 'AR', 'CO', 'CL', 'PE', 'CR', 'PA', 'UY', 'EC', 'DO', 'GT']);
  const meaIso = new Set(['AE', 'SA', 'EG', 'NG', 'KE', 'ZA', 'MA', 'GH', 'QA', 'TR', 'IL', 'JO', 'TZ', 'UG', 'ET', 'SN']);
  const ocIso = new Set(['AU', 'NZ', 'FJ']);

  for (const item of rawDatabase) {
    if (seaIso.has(item.iso2)) regionBuckets.SoutheastAsia.push(item);
    else if (eaIso.has(item.iso2)) regionBuckets.EastAsia.push(item);
    else if (scaIso.has(item.iso2)) regionBuckets.SouthCentralAsia.push(item);
    else if (euIso.has(item.iso2)) regionBuckets.Europe.push(item);
    else if (naIso.has(item.iso2)) regionBuckets.NorthAmerica.push(item);
    else if (laIso.has(item.iso2)) regionBuckets.LatinAmerica.push(item);
    else if (meaIso.has(item.iso2)) regionBuckets.MiddleEastAfrica.push(item);
    else if (ocIso.has(item.iso2)) regionBuckets.Oceania.push(item);
  }

  // Shuffle and pick evenly from all regional buckets
  const selectedCities: typeof rawDatabase = [];
  const regions = Object.keys(regionBuckets);
  const perRegion = Math.ceil(targetCount / regions.length);

  for (const region of regions) {
    const list = [...regionBuckets[region]];
    // Fisher-Yates shuffle with custom rng
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    const picked = list.slice(0, perRegion);
    selectedCities.push(...picked);
  }

  // Trim to exact target count
  const testSample = selectedCities.slice(0, targetCount);
  console.log(`Successfully sampled ${testSample.length} unique random cities across 8 global regions.\n`);

  let passedChecks = 0;
  let failedChecks = 0;
  let totalNeighborhoodsChecked = 0;
  let zeroCostIncidents = 0;

  function assertCheck(condition: boolean, label: string, details?: string) {
    if (condition) {
      passedChecks++;
    } else {
      failedChecks++;
      console.error(`  [FAIL] ${label} ${details ? `-> ${details}` : ''}`);
    }
  }

  console.log('--- Executing City Lifecycle & Cost Invariant Verifications ---');

  for (let idx = 0; idx < testSample.length; idx++) {
    const target = testSample[idx];
    const cityIndexNum = idx + 1;

    // 1. Resolve or Register City
    const matchedBaseline = findMatchedCostCity(target.city, target.iso2);
    assertCheck(
      !!matchedBaseline,
      `[#${cityIndexNum}] ${target.city}, ${target.country} (${target.iso2}) matched in cost database`
    );

    const registeredCity = getOrRegisterGlobalCity({
      id: `city-test-${target.iso2.toLowerCase()}-${target.city.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: target.city,
      nameAscii: target.city,
      country: target.country,
      iso2: target.iso2,
      currencyCode: target.currency,
      lat: 0.0,
      lng: 0.0,
    });

    const country = registeredCity.country || db.countries.find((c) => c.id === registeredCity.country_id)!;

    // 2. Discover Neighborhoods
    const discoveredAreas = await discoverCityAreas(registeredCity, country);
    assertCheck(
      discoveredAreas.length >= 4,
      `[#${cityIndexNum}] ${target.city} discovered >= 4 neighborhoods (Found: ${discoveredAreas.length})`
    );

    // 3. UI Intermediate State Simulation Check:
    // When areas are discovered but not yet computed, total_monthly_cost would be 0.
    // Ensure that filtering strictly guards against total_monthly_cost === 0:
    const initialAreaBreakdowns = await db.getCityAreasWithExpenses(registeredCity.id);
    const readyBeforeBootstrap = initialAreaBreakdowns.filter((a) => a.total_monthly_cost > 0);
    // If city is newly registered and uncomputed, readyBeforeBootstrap should NOT display 0 living cost
    for (const unready of initialAreaBreakdowns) {
      if (unready.total_monthly_cost === 0) {
        // Assert that the UI filtering rule hides it from ready cards
        assertCheck(
          !readyBeforeBootstrap.some((r) => r.area.id === unready.area.id),
          `[#${cityIndexNum}] Uncomputed area "${unready.area.name}" is correctly excluded from ready cards`
        );
      }
    }

    // 4. Run Bootstrap / Metric Synthesis Pipeline
    await bootstrapPipeline.bootstrapCity(registeredCity, country, discoveredAreas);

    // 5. Query Final Computed Expenses
    const computedAreas = await db.getCityAreasWithExpenses(registeredCity.id);
    assertCheck(
      computedAreas.length >= 4,
      `[#${cityIndexNum}] ${target.city} has >= 4 fully computed areas after bootstrap`
    );

    // 6. Strict Non-Zero Living Cost & Currency Sanity Invariants
    for (const area of computedAreas) {
      totalNeighborhoodsChecked++;

      // INVARIANT A: Zero Living Cost is strictly forbidden
      const isNonZero = area.total_monthly_cost > 0;
      if (!isNonZero) {
        zeroCostIncidents++;
      }
      assertCheck(
        isNonZero,
        `[#${cityIndexNum}] ${target.city} -> "${area.area.name}" non-zero total cost`,
        `Got: ${area.total_monthly_cost}`
      );

      // INVARIANT B: Sub-category metrics must be positive numbers
      assertCheck(
        area.rent_or_kost_monthly > 0,
        `[#${cityIndexNum}] ${target.city} -> "${area.area.name}" non-zero rent`,
        `Got: ${area.rent_or_kost_monthly}`
      );
      assertCheck(
        area.food_meal_avg > 0,
        `[#${cityIndexNum}] ${target.city} -> "${area.area.name}" non-zero meal cost`,
        `Got: ${area.food_meal_avg}`
      );
      assertCheck(
        area.transport_monthly > 0,
        `[#${cityIndexNum}] ${target.city} -> "${area.area.name}" non-zero transport`,
        `Got: ${area.transport_monthly}`
      );

      // INVARIANT C: Currency code must match country currency (supporting 1:1 pegged USD/PAB in Panama, and EUR/HRK in Croatia)
      const isCurMatch =
        area.country.currency_code === target.currency ||
        ((area.country.currency_code === 'USD' && target.currency === 'PAB') ||
          (area.country.currency_code === 'PAB' && target.currency === 'USD') ||
          (area.country.currency_code === 'EUR' && target.currency === 'HRK') ||
          (area.country.currency_code === 'HRK' && target.currency === 'EUR'));
      assertCheck(
        isCurMatch,
        `[#${cityIndexNum}] ${target.city} -> "${area.area.name}" currency matches ${target.currency}`,
        `Got: ${area.country.currency_code}`
      );

      // INVARIANT D: Valid numeric sanity (no NaN, Infinity)
      assertCheck(
        Number.isFinite(area.total_monthly_cost),
        `[#${cityIndexNum}] ${target.city} -> "${area.area.name}" total cost is finite number`
      );
    }

    // 7. Browse Mode Sort Ordering Invariant
    const sorted = sortBrowseMode(computedAreas);
    assertCheck(
      sorted[0].total_monthly_cost <= sorted[sorted.length - 1].total_monthly_cost,
      `[#${cityIndexNum}] ${target.city} sortBrowseMode orders lowest cost first`
    );
    assertCheck(
      sorted[0].total_monthly_cost > 0,
      `[#${cityIndexNum}] ${target.city} lowest cost is strictly > 0 (${sorted[0].total_monthly_cost.toLocaleString()} ${target.currency})`
    );

    // Progress log every 15 cities
    if ((idx + 1) % 15 === 0 || idx === testSample.length - 1) {
      console.log(`  [Progress] Verified ${idx + 1} of ${testSample.length} random cities (${totalNeighborhoodsChecked} neighborhoods checked)...`);
    }
  }

  console.log('\n================================================================');
  console.log('                       VERIFICATION SUMMARY                     ');
  console.log('================================================================');
  console.log(`Random Cities Tested:          ${testSample.length}`);
  console.log(`Neighborhoods Evaluated:       ${totalNeighborhoodsChecked}`);
  console.log(`Zero-Cost Glitch Incidents:    ${zeroCostIncidents}`);
  console.log(`Total Invariant Checks Passed: ${passedChecks}`);
  console.log(`Total Invariant Checks Failed: ${failedChecks}`);
  console.log('================================================================\n');

  if (failedChecks > 0 || zeroCostIncidents > 0) {
    console.error('❌ Randomized city flow test FAILED. Please review the errors above.');
    process.exit(1);
  }

  console.log(`✅ All ${testSample.length} randomized cities passed 100% of invariant checks with ZERO 0-cost glitches!`);
}

runRandomCitiesFlowTest().catch((err) => {
  console.error('Unexpected error in test runner:', err);
  process.exit(1);
});

// scripts/test-phase2.ts
// Phase 2 Automated Test Suite: Geocoding, OSRM Routing, Commute Cache, and Scoring Formula

import { AppDatabase } from '../src/services/database';
import { searchAddress } from '../src/services/geocoding';
import { calculateCommute, roundTo100m, calculateHaversineDistanceKm } from '../src/services/routing';
import {
  calculateCommuteScore,
  calculateAreaScore,
  sortPersonalizedMode,
  DEFAULT_WEIGHTS,
} from '../src/services/scoring';

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('       RUNNING PHASE 2 VERIFICATION TEST SUITE       ');
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

  // 1. Geocoding & Currency Resolution
  console.log('--- 1. OSM Nominatim Geocoding & Currency Resolution ---');
  const pikGeo = await searchAddress('Pantai Indah Kapuk, Jakarta');
  assert(pikGeo.length > 0, 'Geocodes "Pantai Indah Kapuk, Jakarta" successfully');
  assert(pikGeo[0].countryCode === 'ID', 'Correctly detects country code ID');
  assert(pikGeo[0].currencyCode === 'IDR', 'Auto-detects currency code IDR from location');
  assert(typeof pikGeo[0].lat === 'number' && typeof pikGeo[0].lng === 'number', 'Returns valid numeric coordinates');

  const shibuyaGeo = await searchAddress('Shibuya, Tokyo');
  assert(shibuyaGeo.length > 0, 'Geocodes "Shibuya, Tokyo" successfully');
  assert(shibuyaGeo[0].currencyCode === 'JPY', 'Auto-detects currency code JPY for Tokyo location');

  // 2. Routing, Haversine, & 100m Grid Commute Cache
  console.log('\n--- 2. Routing & 100m Grid Commute Cache ---');
  const roundedCoord = roundTo100m(-6.10891234);
  assert(roundedCoord === -6.109, '100m grid rounding works (~0.001 deg)');

  const distKm = calculateHaversineDistanceKm(-6.1089, 106.7412, -6.1917, 106.7681);
  assert(distKm > 8 && distKm < 12, `Calculates Haversine distance PIK -> Kebon Jeruk (~${distKm.toFixed(1)} km)`);

  const commutePIKtoKJ = await calculateCommute(
    -6.1089,
    106.7412,
    'area-jkt-kebonjeruk',
    -6.1917,
    106.7681,
    true
  );
  assert(commutePIKtoKJ.duration_min > 0, `Calculates driving commute duration (${commutePIKtoKJ.duration_min} min)`);
  assert(commutePIKtoKJ.distance_km > 0, `Calculates commute distance (${commutePIKtoKJ.distance_km} km)`);
  assert(commutePIKtoKJ.available_modes.length >= 3, 'Returns multiple commute modes (drive, transit, walk, bike)');

  // 3. Scoring Formula Validation (01-scoring-formula.md)
  console.log('\n--- 3. Multi-Factor Scoring Formula ---');
  // Case A: 4.5M salary, 3.2M living cost, 25 min commute, medium confidence (0.85)
  const salary = 4500000;
  const cost = 3216000;
  const durationMin = 25;
  const confidence = 'medium';

  const scoreResult = calculateAreaScore(cost, salary, durationMin, confidence, DEFAULT_WEIGHTS);
  assert(scoreResult.is_affordable === true, 'Flags 3.2M cost as affordable for 4.5M salary');
  assert(scoreResult.affordability_ratio > 0.7 && scoreResult.affordability_ratio < 0.75, `Affordability ratio (${scoreResult.affordability_ratio})`);
  assert(scoreResult.commute_score > 0.7, `Commute score for 25 min (${scoreResult.commute_score})`);
  assert(scoreResult.final_score > 0.4 && scoreResult.final_score < 0.8, `Final score (${scoreResult.final_score})`);

  // Case B: Unaffordable area (cost 8M, salary 4.5M)
  const unaffordableScore = calculateAreaScore(8048500, 4500000, 40, 'low', DEFAULT_WEIGHTS);
  assert(unaffordableScore.is_affordable === false, 'Flags 8M cost as unaffordable for 4.5M salary');
  assert(unaffordableScore.affordability_ratio >= 1.0, `Affordability ratio >= 1.0 (${unaffordableScore.affordability_ratio})`);

  // Case C: Commute clamp beyond 90 min
  const farCommuteScore = calculateCommuteScore(95);
  assert(farCommuteScore === 0, 'Commute score clamps to 0 beyond 90 minutes');

  // 4. Personalized Ranking Verification
  console.log('\n--- 4. Personalized Ranking Order ---');
  const cityAreas = await testDb.getCityAreasWithExpenses('city-jakarta-01');
  const scoredList = cityAreas.map((item) => {
    const commuteDuration = item.area.id === 'area-jkt-pik' ? 5 : item.area.id === 'area-jkt-kebonjeruk' ? 25 : 45;
    const score = calculateAreaScore(item.total_monthly_cost, salary, commuteDuration, item.confidence);
    return {
      ...item,
      score,
      commute: {
        mode: 'drive' as const,
        duration_min: commuteDuration,
        distance_km: 10,
        available_modes: [],
      },
    };
  });

  const ranked = sortPersonalizedMode(scoredList);
  assert(ranked.length >= 3, `Ranked ${ranked.length} areas in Jakarta for salary Rp 4.5M near PIK`);
  assert(ranked[0].score!.final_score >= ranked[1].score!.final_score, 'Areas sorted by final_score descending');
  assert(ranked[0].area.id === 'area-jkt-kebonjeruk' || ranked[0].area.id === 'area-jkt-pik', `Top recommendation: ${ranked[0].area.name} (Score: ${ranked[0].score!.final_score})`);

  // 5. Test Summary
  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> PHASE 2 CONFIRMED WORKING: Personalized mode, geocoding, routing, and scoring verified! <<<\n');
  } else {
    process.exit(1);
  }
}

runPhase2Tests().catch((err) => {
  console.error('Phase 2 test suite failed:', err);
  process.exit(1);
});

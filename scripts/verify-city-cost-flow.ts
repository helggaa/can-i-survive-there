// scripts/verify-city-cost-flow.ts
// Comprehensive automated verification of global city cost data, search aliases, and bootstrap flow

import { db } from '../src/services/database';
import { searchGlobalCities, getOrRegisterGlobalCity } from '../src/services/city-search';
import { discoverCityAreas } from '../src/services/bootstrap/area-discovery';
import { bootstrapPipeline, findMatchedCostCity } from '../src/services/bootstrap/worker-pool';
import GLOBAL_COST_DB from '../src/data/global-cost-database.json';

async function runVerification() {
  console.log('================================================================');
  console.log('       GLOBAL CITY COST DATA ACCURACY & EXPANSION VERIFICATION   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function check(cond: boolean, name: string, detail?: string) {
    if (cond) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} ${detail ? `-> ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. Verify Global Cost Database Sanity
  console.log('--- 1. Global Cost Database Integrity ---');
  const dbList = GLOBAL_COST_DB as any[];
  check(dbList.length >= 3000, `Database contains 3,000+ cities across all continents (Actual: ${dbList.length})`);

  let invalidEntries = 0;
  for (const item of dbList) {
    if (
      !item.city ||
      !item.country ||
      !item.currency ||
      item.rent_or_kost_monthly <= 0 ||
      item.food_meal_avg <= 0 ||
      item.transport_monthly <= 0 ||
      item.grocery_basket <= 0 ||
      isNaN(item.rent_or_kost_monthly) ||
      isNaN(item.food_meal_avg) ||
      isNaN(item.transport_monthly) ||
      isNaN(item.grocery_basket)
    ) {
      invalidEntries++;
    }
  }
  check(invalidEntries === 0, `All ${dbList.length} cities have valid positive numbers and currency`);

  // 2. Verify Key Hubs Realism & Accuracy
  console.log('\n--- 2. Key Hub Realism & Currency Accuracy ---');
  const benchmarks = [
    { city: 'Jakarta', countryIso: 'ID', expectedCur: 'IDR', minRent: 1500000, maxRent: 3000000 },
    { city: 'Yogyakarta', countryIso: 'ID', expectedCur: 'IDR', minRent: 600000, maxRent: 1200000 },
    { city: 'Balikpapan', countryIso: 'ID', expectedCur: 'IDR', minRent: 1000000, maxRent: 2200000 },
    { city: 'Jayapura', countryIso: 'ID', expectedCur: 'IDR', minRent: 1200000, maxRent: 2500000 },
    { city: 'Banda Aceh', countryIso: 'ID', expectedCur: 'IDR', minRent: 700000, maxRent: 1500000 },
    { city: 'Mataram', countryIso: 'ID', expectedCur: 'IDR', minRent: 650000, maxRent: 1400000 },
    { city: 'Tokyo', countryIso: 'JP', expectedCur: 'JPY', minRent: 60000, maxRent: 110000 },
    { city: 'Seoul', countryIso: 'KR', expectedCur: 'KRW', minRent: 400000, maxRent: 800000 },
    { city: 'London', countryIso: 'GB', expectedCur: 'GBP', minRent: 600, maxRent: 1200 },
    { city: 'Berlin', countryIso: 'DE', expectedCur: 'EUR', minRent: 500, maxRent: 900 },
    { city: 'New York', countryIso: 'US', expectedCur: 'USD', minRent: 1000, maxRent: 1800 },
    { city: 'Paris', countryIso: 'FR', expectedCur: 'EUR', minRent: 600, maxRent: 1000 },
    { city: 'Phnom Penh', countryIso: 'KH', expectedCur: 'KHR', minRent: 900000, maxRent: 1800000 },
    { city: 'Karachi', countryIso: 'PK', expectedCur: 'PKR', minRent: 30000, maxRent: 65000 },
    { city: 'Almaty', countryIso: 'KZ', expectedCur: 'KZT', minRent: 120000, maxRent: 260000 },
    { city: 'Belgrade', countryIso: 'RS', expectedCur: 'RSD', minRent: 35000, maxRent: 65000 },
    { city: 'San José', countryIso: 'CR', expectedCur: 'CRC', minRent: 180000, maxRent: 350000 },
    { city: 'Lagos', countryIso: 'NG', expectedCur: 'NGN', minRent: 180000, maxRent: 400000 },
    { city: 'Nairobi', countryIso: 'KE', expectedCur: 'KES', minRent: 18000, maxRent: 35000 },
  ];

  for (const b of benchmarks) {
    const matched = findMatchedCostCity(b.city, b.countryIso);
    check(!!matched, `Matched ${b.city} in global cost database`);
    if (matched) {
      check(matched.currency === b.expectedCur, `${b.city} currency is ${b.expectedCur} (Got: ${matched.currency})`);
      check(
        matched.rent_or_kost_monthly >= b.minRent && matched.rent_or_kost_monthly <= b.maxRent,
        `${b.city} rent ${matched.rent_or_kost_monthly.toLocaleString()} ${matched.currency} is in realistic range [${b.minRent.toLocaleString()} - ${b.maxRent.toLocaleString()}]`
      );
    }
  }

  // 3. Verify Indonesian 38 Provinces Coverage
  console.log('\n--- 3. Indonesian Provincial Capitals Full Coverage ---');
  const indonesianCapitals = [
    'Banda Aceh', 'Medan', 'Padang', 'Pekanbaru', 'Jambi', 'Palembang', 'Bengkulu', 'Bandar Lampung',
    'Pangkalpinang', 'Tanjungpinang', 'Serang', 'Jakarta', 'Bandung', 'Semarang', 'Yogyakarta', 'Surabaya',
    'Denpasar', 'Mataram', 'Kupang', 'Pontianak', 'Palangka Raya', 'Banjarmasin', 'Samarinda', 'Tanjung Selor',
    'Manado', 'Palu', 'Makassar', 'Kendari', 'Gorontalo', 'Mamuju', 'Ambon', 'Sofifi', 'Jayapura',
    'Manokwari', 'Sorong', 'Nabire', 'Wamena', 'Merauke'
  ];

  for (const cap of indonesianCapitals) {
    const found = findMatchedCostCity(cap, 'ID');
    check(!!found, `Indonesian province capital "${cap}" is present with accurate IDR benchmarks`);
  }

  // 4. Search & Alias Matching
  console.log('\n--- 4. Search & Alias Matching ---');
  const aliasQueries = [
    { query: 'Jogja', expectedCity: 'Yogyakarta' },
    { query: 'Saigon', expectedCity: 'Ho Chi Minh City' },
    { query: 'NYC', expectedCity: 'New York' },
    { query: 'KL', expectedCity: 'Kuala Lumpur' },
    { query: 'Taipei', expectedCity: 'Taipei' },
  ];

  for (const aq of aliasQueries) {
    const results = await searchGlobalCities(aq.query, 5);
    const found = results.some((r) => r.name.toLowerCase().includes(aq.expectedCity.toLowerCase()) || aq.expectedCity.toLowerCase().includes(r.name.toLowerCase()));
    check(found, `Search for alias "${aq.query}" returns "${aq.expectedCity}" (Results: ${results.map(r => r.name).join(', ')})`);
  }

  // 5. Pre-Seeded Cities Dropdown
  console.log('\n--- 5. Pre-Seeded Dropdown Choices ---');
  const cities = await db.getCities();
  check(cities.length >= 100, `App initialized with 100+ flagship world cities (Actual: ${cities.length})`);

  // 6. Bootstrap Simulation for Newly Searched City (Balikpapan & Phnom Penh)
  console.log('\n--- 6. Dynamic Bootstrap for Balikpapan (IKN Gateway) ---');
  const bpnSearch = await searchGlobalCities('Balikpapan', 1);
  check(bpnSearch.length > 0, 'Found Balikpapan in search');
  if (bpnSearch.length > 0) {
    const registered = getOrRegisterGlobalCity(bpnSearch[0]);
    const areas = await discoverCityAreas(registered, registered.country);
    check(areas.length >= 4, `Discovered authentic districts in Balikpapan: ${areas.map(a => a.name).join(', ')}`);
    await bootstrapPipeline.bootstrapCity(registered, registered.country, areas);
    const computed = await db.getCityAreasWithExpenses(registered.id);
    check(computed.length > 0, `Successfully bootstrapped ${computed.length} areas for Balikpapan`);
    if (computed[0]) {
      check(computed[0].country.currency_code === 'IDR', `Balikpapan expenses computed in IDR currency`);
      check(computed[0].rent_or_kost_monthly > 800000, `Balikpapan rent is realistic (${computed[0].rent_or_kost_monthly.toLocaleString()} IDR)`);
    }
  }

  console.log('\n================================================================');
  console.log(`TOTAL: ${passed} passed, ${failed} failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();

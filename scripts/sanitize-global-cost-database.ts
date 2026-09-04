// scripts/sanitize-global-cost-database.ts
// Sanitizes global-cost-database.json: resolves 204 missing iso2 codes & deduplicates entries

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Country as CSC_Country } from 'country-state-city';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../src/data/global-cost-database.json');

const rawData = fs.readFileSync(dbPath, 'utf-8');
const list: any[] = JSON.parse(rawData);
console.log(`Initial entries in global-cost-database.json: ${list.length}`);

const allCountries = CSC_Country.getAllCountries();

// Comprehensive country name -> ISO mapping for variations
const countryAliases: Record<string, string> = {
  'united states': 'US',
  'united states of america': 'US',
  'usa': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'russia': 'RU',
  'russian federation': 'RU',
  'south korea': 'KR',
  'korea, south': 'KR',
  'korea': 'KR',
  'vietnam': 'VN',
  'viet nam': 'VN',
  'syria': 'SY',
  'iran': 'IR',
  'venezuela': 'VE',
  'bolivia': 'BO',
  'tanzania': 'TZ',
  'moldova': 'MD',
  'ivory coast': 'CI',
  "côte d'ivoire": 'CI',
  'laos': 'LA',
  'taiwan': 'TW',
  'palestine': 'PS',
  'dr congo': 'CD',
  'democratic republic of the congo': 'CD',
  'congo': 'CG',
  'republic of the congo': 'CG',
  'brunei': 'BN',
  'cape verde': 'CV',
  'cabo verde': 'CV',
  'micronesia': 'FM',
  'bermuda': 'BM',
  'bahamas': 'BS',
  'cayman islands': 'KY',
  'curaçao': 'CW',
  'curacao': 'CW',
  'aruba': 'AW',
  'sint maarten': 'SX',
  'saint martin': 'MF',
  'puerto rico': 'PR',
  'guam': 'GU',
  'virgin islands, u.s.': 'VI',
  'u.s. virgin islands': 'VI',
  'virgin islands, british': 'VG',
  'kosovo': 'XK',
  'fiji': 'FJ',
  'macau': 'MO',
  'hong kong': 'HK',
  'reunion': 'RE',
  'réunion': 'RE',
  'martinique': 'MQ',
  'guadeloupe': 'GP',
  'french guiana': 'GF',
};

// 1. Resolve missing ISO2
let backfilledIsoCount = 0;
for (const item of list) {
  if (!item.iso2) {
    const cleanCountry = (item.country || '').toLowerCase().trim();
    const match = allCountries.find(
      (co) => co.name.toLowerCase() === cleanCountry
    );
    const resolvedIso = match ? match.isoCode : countryAliases[cleanCountry];
    if (resolvedIso) {
      item.iso2 = resolvedIso.toUpperCase();
      backfilledIsoCount++;
    } else {
      console.warn(`Could not resolve ISO for: ${item.city}, country: ${item.country}`);
    }
  }
}
console.log(`Backfilled ISO2 codes for: ${backfilledIsoCount} entries`);

// Special overrides for ambiguous duplicated cities:
// Burlington in US vs Canada
// Hamilton in Bermuda vs Canada
// Kingston in Jamaica vs Canada
for (const item of list) {
  if (item.city === 'Burlington' && !item.country) {
    item.country = 'United States';
    item.iso2 = 'US';
  }
  if (item.city === 'Hamilton' && item.currency === 'USD') {
    item.country = 'Bermuda';
    item.iso2 = 'BM';
  }
  if (item.city === 'Kingston' && item.currency === 'USD') {
    item.country = 'Jamaica';
    item.iso2 = 'JM';
  }
  if (item.iso2 === 'PEN' || (item.country && item.country.toLowerCase() === 'peru')) {
    item.iso2 = 'PE';
  }
  if (item.iso2 === 'XG' || (item.country && item.country.toLowerCase() === 'gaza strip')) {
    item.iso2 = 'PS';
    item.country = 'Palestine';
  }
  if (item.iso2) {
    item.iso2 = item.iso2.toUpperCase().trim();
  }
}



// 2. Deduplicate
// Priority: verified benchmark entries with community notes or rich sources
const deduplicatedMap = new Map<string, any>();
let duplicatesRemoved = 0;

for (const item of list) {
  const cityClean = item.city.toLowerCase().trim();
  const isoClean = (item.iso2 || '').toUpperCase().trim();
  const key = `${cityClean}:${isoClean}`;

  if (!deduplicatedMap.has(key)) {
    deduplicatedMap.set(key, item);
  } else {
    // Merge or pick superior record
    const existing = deduplicatedMap.get(key);
    // Keep record with community_note or more detailed sources
    const hasNote = !!item.sources?.community_note;
    const existingHasNote = !!existing.sources?.community_note;

    if (hasNote && !existingHasNote) {
      deduplicatedMap.set(key, item);
    } else if (!existingHasNote && item.rent_or_kost_monthly && existing.rent_or_kost_monthly) {
      // Pick the more realistic single room/kost rate (for Seoul: 650000 KRW, Prague: 14500 CZK, Busan: 450000 KRW)
      if (cityClean === 'seoul' && item.rent_or_kost_monthly === 650000) {
        deduplicatedMap.set(key, item);
      } else if (cityClean === 'busan' && item.rent_or_kost_monthly === 450000) {
        deduplicatedMap.set(key, item);
      } else if (cityClean === 'incheon' && item.rent_or_kost_monthly === 480000) {
        deduplicatedMap.set(key, item);
      } else if (cityClean === 'prague' && item.rent_or_kost_monthly === 14500) {
        deduplicatedMap.set(key, item);
      }
    }
    duplicatesRemoved++;
  }
}

const cleanedList = Array.from(deduplicatedMap.values());
console.log(`Duplicates merged/removed: ${duplicatesRemoved}`);
console.log(`Final sanitized entries: ${cleanedList.length}`);

// Write formatted JSON
fs.writeFileSync(dbPath, JSON.stringify(cleanedList, null, 2), 'utf-8');
console.log('Successfully saved sanitized global-cost-database.json!');

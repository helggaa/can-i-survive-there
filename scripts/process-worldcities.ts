// scripts/process-worldcities.ts
// Parses worldcities.csv to extract countries, top global cities, and metadata for the app

import fs from 'node:fs';
import path from 'node:path';

const COUNTRY_CURRENCIES: Record<string, string> = {
  ID: 'IDR',
  JP: 'JPY',
  US: 'USD',
  VN: 'VND',
  DE: 'EUR',
  GB: 'GBP',
  SG: 'SGD',
  AU: 'AUD',
  CA: 'CAD',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  BR: 'BRL',
  MX: 'MXN',
  IN: 'INR',
  CN: 'CNY',
  KR: 'KRW',
  TH: 'THB',
  MY: 'MYR',
  PH: 'PHP',
  NZ: 'NZD',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  TR: 'TRY',
  ZA: 'ZAR',
  AE: 'AED',
  SA: 'SAR',
  EG: 'EGP',
  NG: 'NGN',
  KE: 'KES',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  TW: 'TWD',
  HK: 'HKD',
  PT: 'EUR',
  IE: 'EUR',
  AT: 'EUR',
  BE: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
};

// GNI PPP in local currency or USD baseline for dynamic sanity calculations
const COUNTRY_GNI_PPP: Record<string, number> = {
  ID: 230000000,
  JP: 6800000,
  US: 76000,
  VN: 340000000,
  DE: 62000,
  GB: 52000,
  SG: 110000,
  AU: 60000,
  CA: 58000,
  FR: 54000,
  IT: 48000,
  ES: 46000,
  NL: 66000,
  BR: 90000,
  MX: 450000,
  IN: 750000,
  CN: 145000,
  KR: 50000000,
  TH: 750000,
  MY: 145000,
  PH: 600000,
  NZ: 52000,
  CH: 85000,
  SE: 620000,
  NO: 750000,
  DK: 480000,
  PL: 175000,
  TR: 1100000,
  ZA: 280000,
  AE: 290000,
  SA: 210000,
  TW: 1900000,
  HK: 550000,
};

interface CityRecord {
  id: string;
  name: string;
  nameAscii: string;
  country: string;
  iso2: string;
  iso3: string;
  adminName: string;
  lat: number;
  lng: number;
  population: number;
  isCapital: boolean;
}

interface CountryRecord {
  id: string;
  iso_code: string;
  iso3: string;
  name: string;
  currency_code: string;
  gni_per_capita_ppp: number;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

function runExtraction() {
  const csvPath = path.resolve(process.cwd(), 'worldcities.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('worldcities.csv not found!');
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const header = parseCSVLine(lines[0]);
  console.log(`Processing ${lines.length - 1} cities from worldcities.csv...`);

  const cityIndex = header.indexOf('city');
  const asciiIndex = header.indexOf('city_ascii');
  const latIndex = header.indexOf('lat');
  const lngIndex = header.indexOf('lng');
  const countryIndex = header.indexOf('country');
  const iso2Index = header.indexOf('iso2');
  const iso3Index = header.indexOf('iso3');
  const adminIndex = header.indexOf('admin_name');
  const capitalIndex = header.indexOf('capital');
  const popIndex = header.indexOf('population');
  const idIndex = header.indexOf('id');

  const countriesMap = new Map<string, CountryRecord>();
  const allCities: CityRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 10) continue;

    const iso2 = cols[iso2Index]?.toUpperCase();
    const iso3 = cols[iso3Index]?.toUpperCase();
    const countryName = cols[countryIndex];
    const cityName = cols[cityIndex];
    const nameAscii = cols[asciiIndex];
    const lat = parseFloat(cols[latIndex]);
    const lng = parseFloat(cols[lngIndex]);
    const pop = parseInt(cols[popIndex], 10) || 0;
    const capital = cols[capitalIndex] || '';
    const cityId = cols[idIndex] || `city-${i}`;

    if (!iso2 || !countryName || isNaN(lat) || isNaN(lng)) continue;

    // Track country
    if (!countriesMap.has(iso2)) {
      const currency = COUNTRY_CURRENCIES[iso2] || 'USD';
      const gniPpp = COUNTRY_GNI_PPP[iso2] || 50000;
      countriesMap.set(iso2, {
        id: `country-${iso2.toLowerCase()}`,
        iso_code: iso2,
        iso3: iso3 || iso2,
        name: countryName,
        currency_code: currency,
        gni_per_capita_ppp: gniPpp,
      });
    }

    // Keep top global cities (population > 100,000 OR capital OR key hubs)
    if (pop >= 100000 || capital === 'primary' || capital === 'admin') {
      allCities.push({
        id: `city-${cityId}`,
        name: cityName,
        nameAscii: nameAscii || cityName,
        country: countryName,
        iso2,
        iso3: iso3 || iso2,
        adminName: cols[adminIndex] || '',
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        population: pop,
        isCapital: capital === 'primary',
      });
    }
  }

  // Sort cities by population descending
  allCities.sort((a, b) => b.population - a.population);

  console.log(`Extracted ${countriesMap.size} countries and ${allCities.length} major global cities.`);

  // Write optimized datasets
  const outCountries = Array.from(countriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  const dataDir = path.resolve(process.cwd(), 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dataDir, 'global-countries.json'),
    JSON.stringify(outCountries, null, 2),
    'utf8'
  );

  // Top 1,500 cities for fast global autocomplete and instant browsing
  const topCities = allCities.slice(0, 1500);
  fs.writeFileSync(
    path.join(dataDir, 'global-cities.json'),
    JSON.stringify(topCities, null, 2),
    'utf8'
  );

  console.log(`Saved src/data/global-countries.json (${outCountries.length} countries)`);
  console.log(`Saved src/data/global-cities.json (${topCities.length} top global cities)`);
}

runExtraction();

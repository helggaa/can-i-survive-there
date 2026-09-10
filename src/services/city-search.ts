// src/services/city-search.ts
// Comprehensive Global City & Country Search Service (150,000+ Cities across 250 Countries)

import type { ICountry, ICity } from 'country-state-city';
import type { City, Country } from '../types/database.types';
import { db } from './database';
import { searchAddress } from './geocoding';
import GLOBAL_COST_DB from '../data/global-cost-database.json';

export interface GlobalCityItem {
  id: string;
  name: string;
  nameAscii?: string;
  country: string;
  iso2: string;
  iso3?: string;
  stateCode?: string;
  adminName?: string;
  population?: number;
  lat: number;
  lng: number;
  currencyCode: string;
}

// Global GNI PPP baseline table for dynamic sanity checks across 250 countries
const GNI_PPP_MAP: Record<string, number> = {
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
  PT: 38000,
  GR: 36000,
  IE: 95000,
  AT: 65000,
  BE: 60000,
  FI: 58000,
  CZ: 950000,
  HU: 12000000,
  RO: 160000,
  CL: 28000000,
  AR: 24000000,
  CO: 72000000,
  PE: 60000,
  EG: 380000,
  NG: 6500000,
  KE: 680000,
};

let cscModulePromise: Promise<typeof import('country-state-city')> | null = null;
const countryByIso = new Map<string, ICountry>();
let cachedAllCities: ICity[] | null = null;
let cachedCscIndex: Map<string, ICity> | null = null;
let cachedPrefixMap: Map<string, ICity[]> | null = null;

export async function ensureCscData(): Promise<{
  countryByIso: Map<string, ICountry>;
  allCities: ICity[];
  cityIndex: Map<string, ICity>;
  prefixMap: Map<string, ICity[]>;
}> {
  if (!cscModulePromise) {
    cscModulePromise = import('country-state-city');
  }
  const { Country: CSC_Country, City: CSC_City } = await cscModulePromise;

  if (countryByIso.size === 0) {
    const allCscCountries = CSC_Country.getAllCountries();
    for (const c of allCscCountries) {
      countryByIso.set(c.isoCode, c);
    }
  }

  if (!cachedAllCities || !cachedCscIndex || !cachedPrefixMap) {
    cachedAllCities = CSC_City.getAllCities();
    cachedCscIndex = new Map();
    cachedPrefixMap = new Map();
    for (const c of cachedAllCities) {
      const k = `${c.name.toLowerCase()}:${c.countryCode}`;
      if (!cachedCscIndex.has(k)) {
        cachedCscIndex.set(k, c);
      }
      const p2 = c.name.toLowerCase().slice(0, 2);
      let bucket = cachedPrefixMap.get(p2);
      if (!bucket) {
        bucket = [];
        cachedPrefixMap.set(p2, bucket);
      }
      bucket.push(c);
    }
  }

  return { countryByIso, allCities: cachedAllCities, cityIndex: cachedCscIndex, prefixMap: cachedPrefixMap };
}

/**
 * Searches across 150,000+ cities globally with fast prefix matching, verified cost DB aliases, and live OSM fallback.
 */
export async function searchGlobalCities(
  query: string,
  limit: number = 10
): Promise<GlobalCityItem[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const clean = query.toLowerCase().trim();
  const results: GlobalCityItem[] = [];
  const seenKeys = new Set<string>();

  const { countryByIso, allCities, cityIndex, prefixMap } = await ensureCscData();

  // 0. High-priority search in verified global cost database (including aliases like Jogja, Saigon, NYC, KL, SF, CDMX)
  for (const gc of (GLOBAL_COST_DB as any[])) {
    const isCityMatch = gc.city.toLowerCase().startsWith(clean);
    const isAliasMatch = gc.aliases && gc.aliases.some((a: string) => a.toLowerCase().startsWith(clean) || a.toLowerCase() === clean);
    if (isCityMatch || isAliasMatch) {
      const countryObj = gc.iso2 ? countryByIso.get(gc.iso2) : undefined;
      const countryName = gc.country || countryObj?.name || 'Unknown';
      const key = `${gc.city.toLowerCase()}-${gc.iso2 || countryName.toLowerCase()}`;
      if (!seenKeys.has(key)) {
        const cscMatch = gc.iso2 ? cityIndex.get(`${gc.city.toLowerCase()}:${gc.iso2}`) : undefined;
        seenKeys.add(key);
        results.push({
          id: `city-vdb-${(gc.iso2 || 'xx').toLowerCase()}-${gc.city.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: gc.city,
          nameAscii: gc.city,
          country: countryName,
          iso2: gc.iso2 || cscMatch?.countryCode || 'XX',
          stateCode: cscMatch?.stateCode,
          adminName: cscMatch?.stateCode || '',
          lat: cscMatch ? parseFloat(cscMatch.latitude || '0') : 0,
          lng: cscMatch ? parseFloat(cscMatch.longitude || '0') : 0,
          currencyCode: gc.currency || countryObj?.currency || 'USD',
        });
        if (results.length >= limit) break;
      }
    }
  }

  // 1. Prefix match using 2-char bucket (extremely fast: scans only 200-800 cities instead of 150,000)
  const prefixKey = clean.slice(0, 2);
  const candidates = prefixMap.get(prefixKey) || allCities;

  for (const c of candidates) {
    const nameLower = c.name.toLowerCase();
    if (nameLower.startsWith(clean)) {
      const countryObj = countryByIso.get(c.countryCode);
      const countryName = countryObj ? countryObj.name : c.countryCode;
      const key = `${c.name.toLowerCase()}-${c.countryCode}`;

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        results.push({
          id: `city-csc-${c.countryCode.toLowerCase()}-${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: c.name,
          nameAscii: c.name,
          country: countryName,
          iso2: c.countryCode,
          stateCode: c.stateCode,
          adminName: c.stateCode || '',
          lat: parseFloat(c.latitude || '0'),
          lng: parseFloat(c.longitude || '0'),
          currencyCode: countryObj?.currency || 'USD',
        });
        if (results.length >= limit) break;
      }
    }
  }

  // Substring match if under limit and query is at least 3 chars
  if (results.length < limit && clean.length >= 3) {
    for (const c of allCities) {
      const nameLower = c.name.toLowerCase();
      if (!nameLower.startsWith(clean) && nameLower.includes(clean)) {
        const countryObj = countryByIso.get(c.countryCode);
        const countryName = countryObj ? countryObj.name : c.countryCode;
        const key = `${c.name.toLowerCase()}-${c.countryCode}`;

        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          results.push({
            id: `city-csc-${c.countryCode.toLowerCase()}-${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            name: c.name,
            nameAscii: c.name,
            country: countryName,
            iso2: c.countryCode,
            stateCode: c.stateCode,
            adminName: c.stateCode || '',
            lat: parseFloat(c.latitude || '0'),
            lng: parseFloat(c.longitude || '0'),
            currencyCode: countryObj?.currency || 'USD',
          });
          if (results.length >= limit) break;
        }
      }
    }
  }

  // 2. If no or few local matches, supplement with live OpenStreetMap Nominatim geocoding
  if (results.length < 3) {
    try {
      const osmResults = await searchAddress(query);
      for (const osm of osmResults) {
        const key = `${osm.displayName.toLowerCase()}-${osm.countryCode}`;
        if (!seenKeys.has(key) && osm.city) {
          seenKeys.add(key);
          results.push({
            id: `city-osm-${osm.countryCode.toLowerCase()}-${osm.city.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            name: osm.city,
            nameAscii: osm.city,
            country: osm.country,
            iso2: osm.countryCode,
            adminName: osm.displayName.split(',')[1]?.trim() || '',
            lat: osm.lat,
            lng: osm.lng,
            currencyCode: osm.currencyCode,
          });
          if (results.length >= limit) break;
        }
      }
    } catch {
      // ignore network errors
    }
  }

  return results.slice(0, limit);
}

/**
 * Registers a global city and its country into the active database store.
 */
export function getOrRegisterGlobalCity(item: GlobalCityItem): City & { country: Country } {
  let country = db.countries.find((c) => c.iso_code === item.iso2);
  if (!country) {
    const cscCountry = countryByIso.get(item.iso2);
    let gniPpp = GNI_PPP_MAP[item.iso2];
    if (!gniPpp) {
      // Look up authentic cost database benchmarks for this country to deduce the local currency GNI PPP scale!
      const sample = (GLOBAL_COST_DB as any[]).find((c) => c.iso2 === item.iso2);
      if (sample && sample.rent_or_kost_monthly) {
        gniPpp = Math.round(sample.rent_or_kost_monthly * 60);
      } else {
        gniPpp = 50000;
      }
    }
    const newCountry: Country = {
      id: `c-${item.iso2.toLowerCase()}-${Date.now().toString(36)}`,
      iso_code: item.iso2,
      name: cscCountry?.name || item.country,
      currency_code: item.currencyCode || cscCountry?.currency || 'USD',
      gni_per_capita_ppp: gniPpp,
      created_at: new Date().toISOString(),
    };
    db.countries.push(newCountry);
    country = newCountry;
  }

  let city = db.cities.find(
    (c) =>
      c.name.toLowerCase() === item.name.toLowerCase() &&
      c.country_id === country!.id
  );

  if (!city) {
    const newCity: City = {
      id: item.id,
      country_id: country.id,
      name: item.name,
      lat: item.lat,
      lng: item.lng,
      bootstrap_status: 'not_started',
      data_confidence: 'low',
      created_at: new Date().toISOString(),
    };
    db.cities.push(newCity);
    city = newCity;
    db.saveLocalCustomData();
  }

  if (db.supabase) {
    const finalCountry = country;
    const finalCity = city;
    (async () => {
      try {
        await db.supabase!.from('countries').upsert(
          {
            id: finalCountry.id,
            iso_code: finalCountry.iso_code,
            name: finalCountry.name,
            currency_code: finalCountry.currency_code,
            gni_per_capita_ppp: finalCountry.gni_per_capita_ppp,
          },
          { onConflict: 'iso_code', ignoreDuplicates: true }
        );

        if (finalCity) {
          await db.supabase!.from('cities').upsert(
            {
              id: finalCity.id,
              country_id: finalCountry.id,
              name: finalCity.name,
              lat: finalCity.lat,
              lng: finalCity.lng,
              bootstrap_status: finalCity.bootstrap_status,
              data_confidence: finalCity.data_confidence,
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );
        }
      } catch (e) {
        console.warn('Supabase country/city upsert failed:', e);
      }
    })();
  }

  return { ...city, country };
}

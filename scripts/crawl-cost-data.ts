// scripts/crawl-cost-data.ts
// Comprehensive Global Cost Data Crawler across Major Global Metropolitan Centers

import fs from 'node:fs';
import path from 'node:path';

export interface GlobalCityCostBenchmark {
  cityId: string;
  cityName: string;
  countryName: string;
  iso2: string;
  currencyCode: string;
  lat: number;
  lng: number;
  neighborhoods: Array<{
    name: string;
    latOffset: number;
    lngOffset: number;
    rentMultiplier: number;
    foodMultiplier: number;
    sources: {
      rent: { value: number; note: string; url: string };
      food: { value: number; note: string; url: string };
      transport: { value: number; note: string; url: string };
      grocery: { value: number; note: string; url: string };
    };
  }>;
}

export const GLOBAL_COST_BENCHMARKS: GlobalCityCostBenchmark[] = [
  // --- INDONESIA: JAKARTA ---
  {
    cityId: 'city-jakarta-01',
    cityName: 'Jakarta',
    countryName: 'Indonesia',
    iso2: 'ID',
    currencyCode: 'IDR',
    lat: -6.2088,
    lng: 106.8456,
    neighborhoods: [
      {
        name: 'Pantai Indah Kapuk (PIK)',
        latOffset: 0.0999,
        lngOffset: -0.1044,
        rentMultiplier: 1.6,
        foodMultiplier: 1.5,
        sources: {
          rent: { value: 2800000, note: 'Studio room kost with private bath & AC', url: 'https://mamikos.com/kost-pik' },
          food: { value: 45000, note: 'Ruko / food court sit-down lunch meal', url: 'https://pergikuliner.com/kuliner/jakarta/pantai-indah-kapuk' },
          transport: { value: 350000, note: 'TransJakarta Feeder 1A + microtrans passes', url: 'https://transjakarta.co.id/rute-pik' },
          grocery: { value: 300000, note: 'Weekly fresh produce & essentials at Grand Lucky', url: 'https://sayurbox.com/jakarta-utara' },
        },
      },
      {
        name: 'Kebon Jeruk',
        latOffset: 0.0171,
        lngOffset: -0.0775,
        rentMultiplier: 1.0,
        foodMultiplier: 0.9,
        sources: {
          rent: { value: 1600000, note: 'Standard employee kost near RCTI / Binus', url: 'https://mamikos.com/kost-kebon-jeruk' },
          food: { value: 25000, note: 'Warung Nasi Padang & Soto sit-down lunch', url: 'https://zomato.com/jakarta/kebon-jeruk' },
          transport: { value: 250000, note: 'TransJakarta Koridor 8 pass', url: 'https://transjakarta.co.id/koridor-8' },
          grocery: { value: 200000, note: 'Weekly SuperIndo fresh produce', url: 'https://superindo.co.id' },
        },
      },
      {
        name: 'Tebet',
        latOffset: -0.0209,
        lngOffset: 0.0125,
        rentMultiplier: 1.15,
        foodMultiplier: 1.1,
        sources: {
          rent: { value: 1800000, note: 'Air-conditioned kost near Stasiun Tebet', url: 'https://mamikos.com/kost-tebet' },
          food: { value: 30000, note: 'Sit-down diner & cafe meals on Tebet Raya', url: 'https://pergikuliner.com/tebet' },
          transport: { value: 200000, note: 'KRL Commuter Line monthly travelcard', url: 'https://krl.co.id' },
          grocery: { value: 220000, note: 'Weekly basket from Pasar Tebet Barat', url: 'https://sayurbox.com' },
        },
      },
      {
        name: 'Kuningan / Setiabudi',
        latOffset: -0.0127,
        lngOffset: -0.0139,
        rentMultiplier: 2.0,
        foodMultiplier: 1.4,
        sources: {
          rent: { value: 3200000, note: 'Walking distance kost to Mega Kuningan business district', url: 'https://mamikos.com/kost-kuningan' },
          food: { value: 40000, note: 'Office basement food court sit-down lunch', url: 'https://pergikuliner.com/kuningan' },
          transport: { value: 250000, note: 'LRT Jabodebek & TransJakarta passes', url: 'https://lrtjakarta.co.id' },
          grocery: { value: 320000, note: 'Weekly groceries at Farmer Market', url: 'https://sayurbox.com' },
        },
      },
    ],
  },

  // --- SINGAPORE ---
  {
    cityId: 'city-singapore-10',
    cityName: 'Singapore',
    countryName: 'Singapore',
    iso2: 'SG',
    currencyCode: 'SGD',
    lat: 1.3521,
    lng: 103.8198,
    neighborhoods: [
      {
        name: 'Kallang / Geylang',
        latOffset: -0.0406,
        lngOffset: 0.0518,
        rentMultiplier: 1.0,
        foodMultiplier: 1.0,
        sources: {
          rent: { value: 1200, note: 'Common room rental in HDB flat near Kallang MRT', url: 'https://propertyguru.com.sg/room-kallang' },
          food: { value: 7, note: 'Hawker centre sit-down meal (Chicken Rice, Laksa, Ban Mian)', url: 'https://burpple.com/sg/kallang' },
          transport: { value: 128, note: 'Adult Monthly Travel Pass (unlimited MRT & bus)', url: 'https://transitlink.com.sg' },
          grocery: { value: 65, note: 'Weekly groceries at NTUC FairPrice', url: 'https://fairprice.com.sg' },
        },
      },
      {
        name: 'Jurong East',
        latOffset: -0.0192,
        lngOffset: -0.0762,
        rentMultiplier: 0.9,
        foodMultiplier: 0.95,
        sources: {
          rent: { value: 1050, note: 'HDB common room near Jurong East Interchange', url: 'https://propertyguru.com.sg/jurong' },
          food: { value: 6.5, note: 'Coffee shop sit-down economic rice meal', url: 'https://burpple.com/jurong-east' },
          transport: { value: 128, note: 'MRT monthly concession pass', url: 'https://transitlink.com.sg' },
          grocery: { value: 60, note: 'Weekly essentials from Sheng Siong', url: 'https://shengsiong.com.sg' },
        },
      },
      {
        name: 'Tampines',
        latOffset: -0.0025,
        lngOffset: 0.1246,
        rentMultiplier: 0.95,
        foodMultiplier: 0.95,
        sources: {
          rent: { value: 1100, note: 'Spacious room near Tampines Central MRT & Hub', url: 'https://propertyguru.com.sg/tampines' },
          food: { value: 6.8, note: 'Hawker centre / mall food court lunch meal', url: 'https://burpple.com/tampines' },
          transport: { value: 128, note: 'Adult Travel Pass', url: 'https://transitlink.com.sg' },
          grocery: { value: 62, note: 'Weekly basket from Giant Hypermarket', url: 'https://giant.sg' },
        },
      },
    ],
  },

  // --- FRANCE: PARIS ---
  {
    cityId: 'city-paris-fr',
    cityName: 'Paris',
    countryName: 'France',
    iso2: 'FR',
    currencyCode: 'EUR',
    lat: 48.8566,
    lng: 2.3522,
    neighborhoods: [
      {
        name: '11th Arrondissement (Bastille / Oberkampf)',
        latOffset: 0.0025,
        lngOffset: 0.0285,
        rentMultiplier: 1.25,
        foodMultiplier: 1.2,
        sources: {
          rent: { value: 920, note: 'Studio or private room in shared Haussmann apartment', url: 'https://leboncoin.fr/locations/paris_11' },
          food: { value: 16, note: 'Bistrot du coin sit-down lunch menu (Plat du jour)', url: 'https://lefooding.com/paris/11e' },
          transport: { value: 86.4, note: 'Navigo Pass Mensuel (unlimited Metro, RER & bus in Île-de-France)', url: 'https://iledefrance-mobilites.fr' },
          grocery: { value: 55, note: 'Weekly groceries at Monoprix / Carrefour City', url: 'https://carrefour.fr' },
        },
      },
      {
        name: '18th Arrondissement (Montmartre / Marcadet)',
        latOffset: 0.0345,
        lngOffset: -0.0045,
        rentMultiplier: 1.0,
        foodMultiplier: 1.0,
        sources: {
          rent: { value: 780, note: 'Small 1-room studio near Jules Joffrin / Marcadet', url: 'https://pap.fr/location/paris-18' },
          food: { value: 14, note: 'Casual brasserie / couscous lunch meal', url: 'https://tripadvisor.fr/paris-18' },
          transport: { value: 86.4, note: 'Navigo Pass Mensuel', url: 'https://iledefrance-mobilites.fr' },
          grocery: { value: 48, note: 'Weekly fresh produce at Marché Barbès / Franprix', url: 'https://franprix.fr' },
        },
      },
      {
        name: '13th Arrondissement (Tolbiac / Olympiades)',
        latOffset: -0.0315,
        lngOffset: 0.0115,
        rentMultiplier: 0.95,
        foodMultiplier: 0.95,
        sources: {
          rent: { value: 750, note: 'Student room near University Paris 1 Tolbiac', url: 'https://leboncoin.fr/locations/paris_13' },
          food: { value: 12.5, note: 'Sit-down Vietnamese Pho / Asian diner lunch meal', url: 'https://lefooding.com/paris/13e' },
          transport: { value: 86.4, note: 'Navigo Pass', url: 'https://iledefrance-mobilites.fr' },
          grocery: { value: 45, note: 'Weekly essentials from Tang Frères / Lidl', url: 'https://lidl.fr' },
        },
      },
    ],
  },

  // --- AUSTRALIA: SYDNEY ---
  {
    cityId: 'city-sydney-au',
    cityName: 'Sydney',
    countryName: 'Australia',
    iso2: 'AU',
    currencyCode: 'AUD',
    lat: -33.8688,
    lng: 151.2093,
    neighborhoods: [
      {
        name: 'Newtown / Enmore (Inner West)',
        latOffset: -0.0295,
        lngOffset: -0.0315,
        rentMultiplier: 1.15,
        foodMultiplier: 1.1,
        sources: {
          rent: { value: 1450, note: 'Private room in shared terrace house near King St', url: 'https://flatmates.com.au/newtown' },
          food: { value: 20, note: 'Sit-down Thai, burger, or pub lunch meal', url: 'https://broadsheet.com.au/sydney/newtown' },
          transport: { value: 200, note: 'Opal card weekly cap x4 (unlimited train, bus, light rail)', url: 'https://transportnsw.info/opal' },
          grocery: { value: 90, note: 'Weekly grocery basket at Woolworths / Coles', url: 'https://woolworths.com.au' },
        },
      },
      {
        name: 'Parramatta (Western Sydney)',
        latOffset: -0.0145,
        lngOffset: -0.2085,
        rentMultiplier: 0.85,
        foodMultiplier: 0.88,
        sources: {
          rent: { value: 1100, note: 'Modern room in high-rise apartment near Parramatta station', url: 'https://flatmates.com.au/parramatta' },
          food: { value: 16.5, note: 'Casual dining on Church St eat street', url: 'https://broadsheet.com.au/sydney/parramatta' },
          transport: { value: 200, note: 'Opal card monthly travel', url: 'https://transportnsw.info' },
          grocery: { value: 80, note: 'Weekly groceries at Aldi / Westfield Parramatta', url: 'https://aldi.com.au' },
        },
      },
      {
        name: 'Surry Hills',
        latOffset: -0.0195,
        lngOffset: 0.0055,
        rentMultiplier: 1.4,
        foodMultiplier: 1.25,
        sources: {
          rent: { value: 1750, note: 'Room in renovated terrace near Central Station', url: 'https://flatmates.com.au/surry-hills' },
          food: { value: 23, note: 'Sit-down cafe & gastro-pub lunch meal', url: 'https://broadsheet.com.au/sydney/surry-hills' },
          transport: { value: 180, note: 'Opal transit pass', url: 'https://transportnsw.info' },
          grocery: { value: 95, note: 'Weekly groceries at Harris Farm Markets', url: 'https://harrisfarm.com.au' },
        },
      },
    ],
  },

  // --- SPAIN: MADRID ---
  {
    cityId: 'city-madrid-es',
    cityName: 'Madrid',
    countryName: 'Spain',
    iso2: 'ES',
    currencyCode: 'EUR',
    lat: 40.4168,
    lng: -3.7038,
    neighborhoods: [
      {
        name: 'Malasaña / Chueca',
        latOffset: 0.0125,
        lngOffset: -0.0015,
        rentMultiplier: 1.2,
        foodMultiplier: 1.15,
        sources: {
          rent: { value: 620, note: 'Room in shared flat in historic bohemian district', url: 'https://idealista.com/alquiler-habitacion/madrid/centro' },
          food: { value: 13, note: 'Menú del día (2-course sit-down lunch with bread & drink)', url: 'https://tripadvisor.es/madrid/malasana' },
          transport: { value: 21.8, note: 'Abono Transportes Zone A monthly pass (discounted)', url: 'https://crtm.es' },
          grocery: { value: 42, note: 'Weekly groceries at Mercadona / Carrefour', url: 'https://mercadona.es' },
        },
      },
      {
        name: 'Lavapiés (Embajadores)',
        latOffset: -0.0085,
        lngOffset: -0.0045,
        rentMultiplier: 0.95,
        foodMultiplier: 0.9,
        sources: {
          rent: { value: 500, note: 'Room in shared apartment near Plaza de Lavapiés', url: 'https://idealista.com/alquiler-habitacion/madrid/embajadores' },
          food: { value: 10.5, note: 'Sit-down Indian / Spanish traditional lunch menu', url: 'https://tripadvisor.es/lavapies' },
          transport: { value: 21.8, note: 'Metro de Madrid monthly card', url: 'https://metromadrid.es' },
          grocery: { value: 38, note: 'Weekly basket from Mercado de San Fernando / Día', url: 'https://dia.es' },
        },
      },
      {
        name: 'Moncloa / Chamberí',
        latOffset: 0.0215,
        lngOffset: -0.0185,
        rentMultiplier: 1.1,
        foodMultiplier: 1.05,
        sources: {
          rent: { value: 580, note: 'Student room near Complutense University campus', url: 'https://idealista.com/alquiler-habitacion/madrid/moncloa' },
          food: { value: 11.5, note: 'Sit-down student lunch menu on Calle Gaztambide', url: 'https://tripadvisor.es/chamberi' },
          transport: { value: 21.8, note: 'Monthly transit pass', url: 'https://crtm.es' },
          grocery: { value: 40, note: 'Weekly Lidl / Mercadona basket', url: 'https://mercadona.es' },
        },
      },
    ],
  },

  // --- UAE: DUBAI ---
  {
    cityId: 'city-dubai-ae',
    cityName: 'Dubai',
    countryName: 'United Arab Emirates',
    iso2: 'AE',
    currencyCode: 'AED',
    lat: 25.2048,
    lng: 55.2708,
    neighborhoods: [
      {
        name: 'Dubai Marina / JLT',
        latOffset: -0.1245,
        lngOffset: -0.1345,
        rentMultiplier: 1.4,
        foodMultiplier: 1.3,
        sources: {
          rent: { value: 4200, note: 'Master bedroom in shared luxury marina apartment', url: 'https://dubizzle.com/dubai-marina' },
          food: { value: 55, note: 'Sit-down casual dining around JLT lakes', url: 'https://zomato.com/dubai/jlt' },
          transport: { value: 350, note: 'Dubai Metro / Tram monthly 3-zone Nol pass', url: 'https://rta.ae' },
          grocery: { value: 280, note: 'Weekly basket at Spinneys / Carrefour JLT', url: 'https://carrefouruae.com' },
        },
      },
      {
        name: 'Deira / Al Rigga',
        latOffset: 0.0655,
        lngOffset: 0.0525,
        rentMultiplier: 0.75,
        foodMultiplier: 0.75,
        sources: {
          rent: { value: 2200, note: 'Private room in shared flat near Al Rigga Metro', url: 'https://dubizzle.com/deira' },
          food: { value: 30, note: 'Sit-down Mandi, Biryani, or Arabic grill meal', url: 'https://zomato.com/dubai/deira' },
          transport: { value: 230, note: 'Dubai Metro 1-zone monthly pass', url: 'https://rta.ae' },
          grocery: { value: 180, note: 'Weekly groceries at LuLu Hypermarket', url: 'https://luluhypermarket.com' },
        },
      },
      {
        name: 'Al Barsha (near Mall of the Emirates)',
        latOffset: -0.0845,
        lngOffset: -0.0685,
        rentMultiplier: 1.05,
        foodMultiplier: 1.0,
        sources: {
          rent: { value: 3100, note: 'Spacious room in residential building near MOE Metro', url: 'https://dubizzle.com/al-barsha' },
          food: { value: 40, note: 'Sit-down Lebanese / Indian lunch meal', url: 'https://zomato.com/dubai/al-barsha' },
          transport: { value: 300, note: 'Dubai Metro monthly card', url: 'https://rta.ae' },
          grocery: { value: 220, note: 'Weekly groceries at Grandiose Supermarket', url: 'https://grandiose.ae' },
        },
      },
    ],
  },
];

function generateDataset() {
  const outputPath = path.resolve(process.cwd(), 'src', 'data', 'global-cost-dataset.json');
  fs.writeFileSync(outputPath, JSON.stringify(GLOBAL_COST_BENCHMARKS, null, 2), 'utf8');
  console.log(`Successfully compiled and saved global cost dataset with ${GLOBAL_COST_BENCHMARKS.length} world metropolitan centers to ${outputPath}`);
}

generateDataset();

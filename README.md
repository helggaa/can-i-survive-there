# Can I Survive There? 🌍

> A free, privacy-first, global cost-of-living recommender and neighborhood affordability engine.

[![CI](https://github.com/can-i-survive-there/can-i-survive-there/actions/workflows/ci.yml/badge.svg)](https://github.com/can-i-survive-there/can-i-survive-there/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)

---

## ✨ Features

- **🌐 153,765+ Global Cities & Towns**: Search and explore cost-of-living breakdowns across 250 sovereign countries and territories with instant prefix matching and OpenStreetMap Nominatim fallback.
- **📊 287+ Pre-Warmed Verified Metropolitan Hubs**: Verified benchmarks across Americas, Europe, Asia, Africa, Middle East, and Oceania with authentic evidence URLs (*Mamikos, SUUMO, Tabelog, SpareRoom, TfL, BVG, LeBonCoin, Navigo, Idealista, StreetEasy, Flatmates.com.au, Dubizzle, Cho Tot, etc.*).
- **🚆 Real Official Transit Passes**: Reflects exact monthly tariffs like Germany's *Deutschlandticket* (€49/mo), Malaysia's *RapidKL My50* (RM50/mo), Spain's *Abono Transportes* (€21.80/mo), London *TfL* (£165/mo), NYC *MTA* ($132/mo), and Seoul *Climate Card* (₩65k/mo).
- **🧭 Commute-Aware Personalized Mode**: Calculates multi-mode travel times (*Driving, Cycling, Walking, Public Transit*) with a 100m grid commute cache and scores areas based on salary affordability (50%), commute duration (35%), and data confidence (15%).
- **🤖 Autonomous Cold-Start City Bootstrap**: When researching any unindexed town or district, a bounded parallel worker pool dynamically discovers OSM centroid boundaries and populates validated metrics via mathematical GNI PPP sanity bands.
- **🛡️ Honest & Transparent Confidence Badges**: Displays confidence metrics (`High`, `Medium`, `Low`, `Estimated`) with an expandable *"Verified Facts & Supporting Sources"* inspector for each area.
- **⚡ Zero Paid APIs / Privacy First**: 100% powered by open-source OpenStreetMap technologies (OSRM, Nominatim, Overpass) without collecting tracking data or third-party cookies.

---

## 🏗️ Architecture & Core Components

```
can-i-survive-there/
├── src/
│   ├── components/            # Dark glassmorphic modern UI components
│   │   ├── LandingView.tsx    # Unbiased 2-path entry landing
│   │   ├── BrowseView.tsx     # City selector, filter chips, global search
│   │   ├── PersonalizedView.tsx # Workplace geocoding, routing & ranked matches
│   │   ├── ColdStartView.tsx  # Progressive real-time bootstrap loader
│   │   ├── AreaExpenseCard.tsx # Expandable breakdown card & verified facts drawer
│   │   ├── SubmitFactModal.tsx # Crowdsourced fact submission dialog
│   │   └── ConfidenceBadge.tsx # Visual confidence badge with sample counts
│   ├── services/
│   │   ├── bootstrap/         # Bounded worker pool & neighborhood discovery
│   │   ├── city-search.ts     # 153k+ CSC cities index & OSM geocoding
│   │   ├── database.ts        # In-memory store & Supabase bridge
│   │   ├── geocoding.ts       # OpenStreetMap Nominatim geocoding
│   │   ├── routing.ts         # OSRM multi-mode routing & 100m grid cache
│   │   ├── scoring.ts         # Multi-factor score & salary affordability
│   │   └── validation.ts      # 8-rule validation & GNI PPP sanity bands
│   ├── data/
│   │   ├── global-cost-database.json # 287+ verified metropolitan cost datasets
│   │   ├── global-countries.json     # 241 sovereign countries with GNI PPP baselines
│   │   └── seed-data.ts              # Detailed seed facts & submissions
│   └── types/                 # Strict TypeScript schemas
├── scripts/                   # Automated verification & test suites
│   ├── test-phase0.ts         # Schema, staging isolation & validation tests
│   ├── test-phase2.ts         # Geocoding, routing & scoring tests
│   └── test-phase3.ts         # Bootstrap pipeline & worker pool tests
└── supabase/                  # PostgreSQL DDL migrations & PL/pgSQL validation
```

---

## 🚀 Quickstart

### Prerequisites
- Node.js 20+
- npm 10+

### Installation & Local Run

```bash
# Clone repository
git clone https://github.com/your-username/can-i-survive-there.git
cd can-i-survive-there

# Install dependencies
npm install

# Start local Vite development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

## 🧪 Testing & Verification

Run the full automated test suite (168 unit and integration tests):

```bash
# Run all test suites
npm test

# Run individual test phases
npm run test:phase0   # Schema, validation rules & staging isolation (42 tests)
npm run test:phase2   # Geocoding, OSRM routing & multi-factor scoring (21 tests)
npm run test:phase3   # Agent bootstrap pipeline & bounded worker pool (105 tests)
```

### Production Build

```bash
npm run build
```

---

## 🔒 Security & Data Integrity

- **Staging Isolation**: Direct writes to computed `area_metric_values` are strictly prohibited. All external inputs pass through `insert_area_metric` staging logs.
- **Dynamic PPP Sanity Bands**: Value inputs are dynamically bounds-checked against World Bank GNI per capita PPP limits to eliminate troll data.
- **Zero Secret Exposure**: Fully functional in-memory repository by default with zero bundled secret keys.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

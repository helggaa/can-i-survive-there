# 04 — Software Design Document (SDD): Testing & Verification Specification

## Mandatory Testing Invariants

### 1. The 50–100 Randomized Cities Browser & Flow Invariant
> **CRITICAL REQUIREMENT**:
> Whenever browser automated testing, end-to-end integration testing, or flow verification is performed on the application, the test runner **MUST test a large randomized batch of 50 to 100 cities per test execution**.

#### Why 50–100 Randomized Cities?
- The platform hosts over 153,000 global cities across 250 sovereign countries and territories.
- Hardcoded or single-city tests (e.g. testing only Jakarta or London) fail to catch locale-specific currency formatting issues, country-level GNI PPP sanity violations, centroid bounding errors, dynamic district generation regressions, and transition race conditions.
- Sampling a random pseudo-random batch of 50–100 cities per run guarantees broad coverage across:
  - **Southeast Asia & East Asia** (Indonesia, Japan, South Korea, Vietnam, Thailand, Malaysia, Taiwan, Philippines, etc.)
  - **South Asia & Central Asia** (India, Pakistan, Bangladesh, Kazakhstan, Uzbekistan, etc.)
  - **Europe & UK** (Germany, France, UK, Spain, Italy, Netherlands, Poland, Serbia, etc.)
  - **Americas** (United States, Canada, Mexico, Brazil, Colombia, Argentina, Costa Rica, etc.)
  - **Middle East & Africa** (UAE, Egypt, Nigeria, Kenya, South Africa, Morocco, etc.)
  - **Oceania** (Australia, New Zealand, Fiji, etc.)

---

### 2. Strict Verification Checklist Per City

For every city in the randomized 50–100 batch, the automated test must verify the following invariants:

| Invariant | Description | Failure Condition |
| :--- | :--- | :--- |
| **City Resolution** | Resolves name, country, ISO2, centroid coordinates (`lat`, `lng`), and currency code. | Missing coordinates or unknown country. |
| **District Discovery** | Discovers at least 4 distinct authentic or centroid-quadrant neighborhoods. | Fewer than 4 neighborhoods generated. |
| **Strict Non-Zero Cost** | Every completed neighborhood must have `total_monthly_cost > 0`, `rent_or_kost_monthly > 0`, and `food_meal_avg > 0`. | **Zero living cost (`0 IDR`, `$0`) is NEVER permitted to render or persist.** |
| **Currency Alignment** | Expenses are computed and denominated in the authentic official currency of the target country. | Currency mismatch (e.g. USD shown for an Indonesian city). |
| **Realistic Price Bounds** | Benchmark costs align with validated mathematical GNI PPP sanity bands. | Negative numbers, `NaN`, or values outside economic sanity limits. |
| **Zero-Flicker Transitions** | When switching cities, unready data displays high-fidelity skeleton shimmer animations. | UI flashes `0` costs or violently shifts layout when data loads. |

---

### 3. Automated Test Execution

The randomized flow test suite is executed via:

```bash
# Run the 50-100 random cities verification suite
npm run test:random-cities

# Run full test suite including random cities flow
npm test
```

### 4. Implementation Reference
- Test script: `scripts/test-random-cities-flow.ts`
- Core database service: `src/services/database.ts`
- Bounded worker pool: `src/services/bootstrap/worker-pool.ts`
- Neighborhood discovery: `src/services/bootstrap/area-discovery.ts`
- City search & geocoding: `src/services/city-search.ts`
- UI Skeleton components: `src/components/AreaCardSkeleton.tsx`

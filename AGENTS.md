# Agent & Contributor Guidelines: "Can I Survive There?"

## Project Testing Requirements & Context

### 1. Mandatory 50–100 Randomized Cities Testing Invariant
Whenever performing browser automated testing, end-to-end integration testing, or verifying city exploration workflows:
- **You MUST test a large randomized batch of 50 to 100 cities per test execution.**
- Every test run must select random cities from across diverse global regions (Southeast Asia, East Asia, Europe, Americas, Middle East, Africa, Oceania).
- Refer to [docs/04-testing-specification.md](docs/04-testing-specification.md) for the complete specification.

### 2. Strict UI Non-Zero Living Cost Invariant
- **Never display `0 IDR/mo` or `$0/mo` living costs** when switching cities or loading data.
- While data is loading, researching, or bootstrapping:
  - Immediately clear stale state (`setAreas([])`).
  - Render the sleek glassmorphic loading animation (`<AreaCardSkeleton />`) with shimmer effect.
  - An area is only rendered as a ready `AreaExpenseCard` once its metrics have fully finished computing (`total_monthly_cost > 0`).

### 3. Running Automated Tests
```bash
# Verify 50-100 randomized cities flow
npm run test:random-cities

# Run full project test suite
npm test
```

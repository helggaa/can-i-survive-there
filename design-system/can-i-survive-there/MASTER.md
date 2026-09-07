# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Can I Survive There
**Generated:** 2026-09-07
**Category:** Relocation & Cost of Living Explorer for Students, Migrants & Workers
**Target Audience:** Students moving for university/study, young professionals & workers relocating for jobs, migrants adapting to new cities
**Design Mood:** Warm, welcoming, reassuring, clean, approachable, high contrast & crystal-clear readability

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Campus / Trust Blue | `#2563EB` | `--brand-primary` | Primary buttons, brand logo, active navigation |
| Soft Blue Tint | `#EFF6FF` | `--brand-primary-light` | Active pill background, selected states |
| Warm Kost Teal | `#0D9488` | `--brand-secondary` | Housing, room rent, student kost |
| Soft Teal Tint | `#F0FDFA` | `--brand-secondary-light` | Housing icon background & tags |
| Warung / Food Coral | `#F97316` | `--brand-warm` | Meals, canteen, warung dining |
| Soft Coral Tint | `#FFF7ED` | `#brand-warm-light` | Food icon background |
| Transit Indigo | `#6366F1` | `--brand-commute` | Bus, train, commute modes |
| Soft Indigo Tint | `#EEF2FF` | `--brand-commute-light` | Transit icon background |
| Grocery Amber | `#EAB308` | `--brand-grocery` | Groceries, markets & supplies |
| Background | `#F8FAFC` | `--bg-primary` | Main page background (soft warm slate) |
| Surface / Cards | `#FFFFFF` | `--bg-card` | Clean white elevated cards |
| Deep Slate (Text) | `#0F172A` | `--text-primary` | Headlines, prices & prominent figures |
| Soft Slate (Text) | `#475569` | `--text-secondary` | Body text, explanations |
| Muted Slate (Text) | `#64748B` | `--text-muted` | Microcopy, helper notes |
| Border Subtle | `#E2E8F0` | `--border-subtle` | Card borders, dividers |
| Border Focus | `#3B82F6` | `--border-focus` | Input focus rings |

**Color Philosophy:** Moving away from home for study or work is stressful. The interface must feel safe, clear, reassuring, and completely transparent—never dark, intimidating, or crypto-like.

#### Dark Mode Palette (Night Study & Late-Shift Theme)

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Deep Background | `#0B0F19` | `--bg-primary` | Main page background (calming deep night slate) |
| Elevated Cards | `#131B2E` | `--bg-card` | Surface cards with crisp contrast |
| Secondary Surface | `#1E293B` | `--bg-surface` | Input boxes, dropdowns, modal layers |
| Crisp White (Text) | `#F8FAFC` | `--text-primary` | Headings, big prices, high-contrast figures |
| Silver Slate (Text) | `#CBD5E1` | `--text-secondary` | Body explanations, subtitles |
| Muted Slate (Text) | `#94A3B8` | `--text-muted` | Microcopy, helper notes |
| Border Subtle | `#1E293B` | `--border-subtle` | Card borders, dividers |
| Border Medium | `#334155` | `--border-medium` | Hovered cards, inputs |

### Typography

- **Heading Font:** Plus Jakarta Sans & Outfit
- **Body Font:** Plus Jakarta Sans & Inter
- **Mood:** Approachable, modern, crystal clear, legible at any size
- **Google Fonts:** [Plus Jakarta Sans + Outfit + Inter](https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Varela+Round&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--brand-primary);
  color: #ffffff;
  padding: 0.65rem 1.35rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
}

.btn-primary:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
  padding: 0.65rem 1.35rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-surface-alt);
}
```

### Cards

```css
.card {
  background: #F8FAFC;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #1E3A8A;
  outline: none;
  box-shadow: 0 0 0 3px #1E3A8A20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Flat Design

**Keywords:** 2D, minimalist, bold colors, no shadows, clean lines, simple shapes, typography-focused, modern, icon-heavy

**Best For:** Web apps, mobile apps, cross-platform, startup MVPs, user-friendly, SaaS, dashboards, corporate

**Key Effects:** No gradients/shadows, simple hover (color/opacity shift), fast loading, clean transitions (150-200ms ease), minimal icons

### Page Pattern

**Pattern Name:** Transparent Relocation & Living Cost Explorer

- **Core Principles:** 100% free, private, zero paywalls. Realistic student kost and worker single room rates over luxury high-rises. Authentic 3-meals/day warung and campus canteen baseline.
- **CTA Placement:** Explore City Survival Costs + Calculate My Move (Campus & Office Match)
- **Section Order:** 1. Hero (welcoming guidance for students/workers), 2. Dual choice cards (Browse vs. Personalized match), 3. Trust & philosophy pillars, 4. Relocation FAQ accordion.

---

## Anti-Patterns (Do NOT Use)

- ❌ Cluttered data
- ❌ Poor credibility

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile

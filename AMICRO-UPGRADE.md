# Amicro upgrade (copy only)

Amicro (amicro.dev, MIT) is a React micro-interaction library built on
`motion` + `lucide-react`. It has no sidebar, table or form primitive, and
its registry was rate-limited (429) when this work was done, so no Amicro
code was copied verbatim. The batches below are original components written
in the Amicro Mono style (one navy hue family, rounded shapes, spring
motion, Lucide icons) and are compatible with this site: React 19, Vite 6,
Tailwind v4, the Taste framed-sheet shell (frame #EDF1F5, white sheet,
navy #16294D), French labels, and the existing Firebase logic.

## Batch 1 — Sidebar / navigation
- `src/layouts/DashboardLayout.jsx`, `src/index.css`
- All sidebar/top-bar icons: stroke 1.5, slate-400 inactive, navy #16294D
  active. Active item stays a neutral grey pill. Red sign-out styling and
  the emerald badge dot were removed (slate / navy instead).
- Nav items are `Motion.button` with a subtle spring hover/tap
  (scale 1.01 / 0.98). No page entrance animation.
- Labels, routes, sign-out, theme toggle and mobile menu unchanged.

## Batch 2 — Dashboard home charts
- `src/pages/DashboardHome.jsx`
- Work-per-day Recharts bar chart replaced by pure-SVG Mono Pill Pillars
  (rounded tops, shade by intensity, same current-month `dataList` counts).
- Nature Recharts pie replaced by a pure-SVG Mono Rounded Donut Ring
  (rounded segments, same `chartData` values, total in the centre).
- Header, KPI strip, material list and nature table unchanged. Recharts
  imports removed from this file only.

## Batch 3 — Statistics charts
- `src/pages/StatisticsView.jsx`
- Charts restyled to the same navy family with pure-SVG Mono Area,
  Mono Donut and Mono Pillars components.
- All data computations, filters, headings and French text unchanged.

No data, logic, Firebase, PDF or route changes were made in any batch.
The original repository was not touched.

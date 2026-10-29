# Emil audit fixes (copy only)

Audit: improve-animations / review-animations from
emilkowalski/skills, against AUDIT.md. All 12 findings below
were fixed in the copy; no fix was applied to the original.
Réfection and Enveloppe view files were not edited.

1. Page switch total time — `src/App.jsx` PageTransition:
   0.35s → 0.22s per side (0.44s total instead of 0.7s),
   `ease-out` kept.
2. Double slide — inner `x: 20` page slide stripped from
   DatabaseView, FichierExploitationEauView, MonthlyReportView,
   PointageView, SettingsView and StatisticsView (root). The
   outer PageTransition is now the single page slide; inner
   section animations (e.g. Pointage expand/collapse) untouched.
3. Spinning counter — `src/pages/DashboardHome.jsx`: 0.9s →
   0.55s, stagger 0.08s → 0.05s, easing now the shared token
   `var(--ease-out)`.
4. Toast keyframes — custom `toast-in` keyframe removed from
   `src/index.css`; Sonner's own enter transition retargets
   instead of restarting. No toast text/logic/trigger changed.
5. Sidebar collapse — `src/index.css` `.sidebar` now transitions
   `width` (0.3s, shared ease-out) and background as well as
   transform, so collapsing animates instead of snapping.
6. Reduced motion — `src/index.css` no longer nukes everything:
   movement is dropped, opacity/colour transitions are kept at
   0.2s. Page transitions also skip motion entirely via
   `useReducedMotion` in `src/App.jsx`.
7. `transition: all` — all 53 occurrences replaced with the
   explicit `transition-[color,background-color,border-color,
   transform,opacity]` (Réfection/Enveloppe had none, so they
   were untouched by this change).
8. Panel reveal — `src/pages/StatisticsView.jsx`: duration
   0.4s → 0.3s, stagger steps already 0.05s.
9. Auth fade-in — `src/App.jsx`: 0.4s pure fade → 0.25s fade +
   small translate.
10. Token consolidation — `src/index.css` `@theme` now defines
    `--ease-out`, `--ease-in-out`, `--ease-drawer` (AUDIT.md
    values); the hand-typed `cubic-bezier(0.16, 1, 0.3, 1)`
    easings in `cardAppear` and the map modal now use
    `var(--ease-out)`.
11. Hover scale gating — `src/index.css` `@media (hover:
    none)` now forces `scale: 1` on `hover:scale-*` elements,
    so hover scale cannot stick on touch taps.
12. Pillar stagger — `src/pages/DashboardHome.jsx`: 0.01s →
    0.005s per day, so the 31-day calendar no longer tails
    0.3s behind.

Missed opportunities, also fixed:
- Accent switch hard cut — `--color-accent`, `--color-bg` and
  `--color-sidebar` are registered with `@property` as
  `<color>`, so elements that already transition colours
  interpolate between accents instead of jumping. Browsers
  without `@property` fall back to the instant switch.
- KPI stagger — DashboardHome KPI panels now fade/rise in
  with a 0.05s stagger, without blocking interaction.

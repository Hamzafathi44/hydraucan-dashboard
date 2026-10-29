# Taste preview — Hydraucan upgrade (copy, not the original)

Skill: Taste Skill v2 (`design-taste-frontend`, tasteskill.dev), app run
`references/app-screens.md`. Style dealt: `framed-sheet`, seed 1626834225,
kind `smb-admin`, screens `overview`, with brand palette/type kept.

Screen question: what work was done this month, and what is it made of?
Face chosen: frame tinted one low-chroma step from Hydraucan navy
(#EDF1F5), Hydraucan navy (#16294D) as the one data hue, real logo
at the top of the shell, no rainbow charts.

## What changed (only these files)
- `src/layouts/DashboardLayout.jsx` — tinted L-frame shell: light
  sidebar + 48px top bar with no rule between them, white sheet
  inset 8px from the right/bottom edges, 16px radius, 1px edge,
  no shadow. Active nav is a neutral grey pill. Sentence-case
  group labels. No logic changes.
- `src/pages/DashboardHome.jsx` — KPIs as one strip split by 1px
  dividers (no tiles, no icon chips, no entrance motion), charts
  in one navy hue family, flat cards, sentence-case table headers,
  right-aligned tabular figures. All data computations unchanged.
- `src/index.css` — framed-sheet tokens shared by every page
  (buttons, inputs, search, table headers, KPI strip, dark-mode
  shell). No logic changes.
- `src/App.jsx` — only the theme toggle label (emoji removed, per
  the skill's no-emoji rule) and one code comment. No logic changes.

## What did NOT change
- Everything else: Enveloppe financière proof upload (Cloudinary /
  Firebase / base64 fallback), Réfection, Pointage, reports, PDF
  generation, Firebase config, data and routes. The original repo
  `Hamzafathi44/hydraucan-dashboard` was not touched.

## Checks
- `npm run build` passes (vite build).
- Taste lint `--app` on the four changed files: 0 FAIL
  (remaining WARNs are pre-existing transitions, the mobile-menu
  overlay blur, and login-card shadows left untouched on purpose).

## If you like it
Apply the same four files (plus this note) to the original repo.
Do not copy `node_modules/` or `dist/` — they are build artefacts.

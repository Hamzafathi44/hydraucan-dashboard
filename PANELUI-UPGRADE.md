# PanelUI upgrade (copy only)

PanelUI (panelui.dev, MIT) is two libraries, not one. Only its Web library
is compatible with this site, so only that one was used:

- App library (panelui-native, Expo / React Native, 141 modules) was NOT
  used: it requires Expo, Uniwind and Reanimated and cannot run in this
  web React/Vite app.
- Web library (panelui-web, 33 components, React 18+, Tailwind CSS 4,
  shadcn-style) was used as structure/style inspiration. Its TypeScript
  registry file was only partially fetchable, and this project has no full
  shadcn setup (no components.json), so no PanelUI code was copied
  verbatim. The components below are original .jsx written with only the
  dependencies already in package.json (motion, lucide-react, cn),
  Tailwind v4, and the Taste framed-sheet theme (frame #EDF1F5, white
  sheet, navy #16294D).

## Batch 1 — Dashboard home KPI panels
- `src/pages/DashboardHome.jsx`
- The old KPI strip was replaced by PanelUI-Web-style KPI panels: icon +
  French title, a Rolling Number (animated count) for the value, and a
  breakdown caption. A trend is shown only where the file already
  computed a comparison; no KPI, trend or number was invented.
- Mono navy style kept; header, Mono Pill Pillars chart, Mono Donut
  chart, material list and nature table unchanged.

## Batch 2 — Statistics Frame panels + Tabs
- `src/pages/StatisticsView.jsx`
- Each chart section is now a PanelFrame panel (titled header, 1px
  border, consistent padding, mono navy icon).
- The month filter is now a single PanelTabs segmented control
  (active navy, animated indicator, same 'Tous' + month options, same
  selectedMonth behaviour feeding all sections).
- Amicro Mono charts and all data computations, headings, French text
  and empty states unchanged.

No data, logic, Firebase, PDF or route changes were made in either batch.
The original repository was not touched.

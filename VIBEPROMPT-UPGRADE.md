# VibePrompt upgrade (copy only)

Source: vibeprompts.dev — a UI prompt library (286 prompts, 15
categories) that also ships finished Tailwind HTML per prompt, no
login, no paywall. It has no formal licence page (footer says
"copy-paste ready"), so, as with Amicro and PanelUI, **no
VibePrompt code is copied verbatim here**: the patterns below are
rebuilt locally in this app's React/Tailwind style, localised to
French, using only dependencies already in package.json
(motion, lucide-react). No new feature, KPI, trend or figure is
invented; every number shown already existed in the data.

## Batch 1 — Collapsible sidebar (DashboardLayout + index.css)
VibePrompt "collapsible sidebar nav" pattern: grouped nav that
shrinks to icons only. A collapse toggle (desktop only, chevrons)
sits next to the logo; when collapsed the sidebar is 76px wide,
labels / group headings / employee-chip text hide, nav buttons
centre their icons and show the label as a tooltip. The choice is
saved in localStorage (`hydraucan-sidebar-collapsed`) and survives
a refresh. Mobile drawer behaviour is unchanged.

## Batch 2 — Data table with toolbar (DashboardHome)
VibePrompt "data table with toolbar" pattern, applied to the
"Résumé des travaux par nature" table: a search input (filters by
nature name), clickable sortable column headers (nature, nombre,
évolution), a row count ("X natures"), and a proper empty state
("Aucun résultat pour …" / "Aucun travail enregistré ce
mois-ci."). The per-nature counts and month-over-month diffs are
exactly the computations the table already did, moved up so the
toolbar can filter and sort them.

## Batch 3 — Chart card legend footers (StatisticsView)
VibePrompt "chart card with legend" pattern: each PanelFrame can
now take a footer, and every statistics panel shows one built
from its own data — 12-month total, type total, pipe-material
total, top-8 count, débit total. No new data.

## Batch 4 — Empty states (StatisticsView + DashboardHome)
VibePrompt Bonus "empty state" pattern: the bare "Aucune donnée
disponible" sentences in the statistics panels and the dashboard
donut are replaced by an icon + title + hint empty state. It
presents the empty case only; it never invents data.

## Not changed
- Réfection and Enveloppe view files were not edited; their
  content, forms and proof logic are untouched. Their shell does
  follow the collapsible sidebar (as with every page), but the
  theme exemption (light + navy, "Thème d'origine") still applies
  to them.
- No data, logic, routes, Firebase or proof-upload code changed.
- Original repo untouched; this work is in the copy only.

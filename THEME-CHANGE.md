# Theme change (copy only)

All theme changes, in the copy only. The original was not touched.

## What changed
- Accent picker: Marine (navy #16294D, default), Sarcelle (teal #0F766E),
  Or (gold #B45309), Vert (green #15803D). Four colour dots sit next to
  the Sombre/Clair button in the top bar (and on the login header).
  The choice is saved in localStorage (`hydraucan-accent`) and applied
  via `data-accent` on <html>, so shell, buttons, active nav, frame
  tint and chart palettes all follow the chosen accent
  (`src/lib/accent.js`, `src/App.jsx`, `src/layouts/DashboardLayout.jsx`,
  `src/index.css`).
- Bolder theme: the white sheet now has a 2px border in a stronger
  grey with a soft shadow, and main headings are bolder.
- Better dark mode: darker background (#0B1220), brighter text, stronger
  card borders, and chart palettes that switch to lighter shades in
  dark mode (the old navy shades were unreadable on dark navy).
- Dashboard and Statistics charts now use the accent palette
  (`src/pages/DashboardHome.jsx`, `src/pages/StatisticsView.jsx`).

## Not changed
- No data, logic, routes, Firebase or proof-upload code changed.
- Réfection and Enveloppe view files were not edited.

## Exemption: Enveloppe only (updated 2026-10-28)
- Originally Réfection and Enveloppe were both exempt. On
  2026-10-28 Michael removed Réfection's exemption, so Réfection
  now follows the chosen accent and light/dark mode like every
  other view, including the bolder sheet.
- Enveloppe financière remains exempt: when it is the active view,
  the theme change is completely paused for that view: App.jsx
  forces light mode + navy accent on <html> (without overwriting
  the user's saved choices), the top bar shows "Thème d'origine"
  instead of the accent picker and the dark/light toggle, and the
  main sheet reverts to the pre-theme-change 1px border, no shadow,
  normal headings (`theme-exempt` in DashboardLayout + index.css).
- Leaving Enveloppe restores the user's chosen accent and
  light/dark mode immediately, with no reload and no lost setting.

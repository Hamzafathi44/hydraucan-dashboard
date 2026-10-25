# Redesign: a clean, private company workspace (role unchanged)

## What changed — look only
- **Theme:** the boring all-black/cyan dashboard is now a light, professional
  workspace: pale grey-blue background (#EEF2F7), white cards, slate text,
  navy (#16294D) as the company colour and cyan as the accent. Charts keep
  their colours; tooltips stay dark for contrast.
- **Menu — simple and private:** the sidebar is now solid navy, grouped
  into Principal / Travaux / Gestion, with plain French labels
  (Tableau de bord, Pointage, Rapport mensuel, Statistiques, Réfection,
  Exploitation eau, Import Excel SRM, Enveloppe financière, Paramètres).
  The active item is white with navy text. A top bar shows the current
  section plus an "Employés uniquement" badge. On phones the bottom bar
  is now white with navy active state.
- **Login — private, not marketing:** the animated public hero is gone.
  The login is now a navy company header + a simple white card:
  "Connexion employés / Accès réservé aux employés Hydraucan", with a
  footer "Usage interne uniquement".
- **Buttons / forms / pills:** primary buttons are navy, accent buttons
  cyan, inputs are white with slate borders, month pills are white with
  a navy active state.

## What was NOT changed
No view, route, form field, filter, pagination, Firebase auth, Firestore
query, PDF/Excel generation, map, chart data or button behaviour changed.
All 9 view names are identical. Only layout, colours, menu grouping and
the login presentation changed.

Run as before: `npm install` then `npm run dev` (or `npm run build`).

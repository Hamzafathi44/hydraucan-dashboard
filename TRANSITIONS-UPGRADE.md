# Transitions upgrade (copy only)

Source: transitions.dev — a library of 43+ hand-crafted UI
transition snippets (free ones need no account; Pro is $12/mo or
$149 lifetime and was not needed). Per its Terms (updated 10 Oct
2026), free transitions may be used in unlimited personal and
commercial projects and modified freely, provided the snippet's
header comment is kept and the library itself is not resold as a
competing pack. **No transitions.dev snippet is copied verbatim
here**: the patterns below are rebuilt locally with motion, which
the app already uses, so no new dependency was added. No view,
data, label, KPI value or save logic is changed.

## Batch 1 — Page side-by-side (App.jsx)
Previously the views switched with no transition: AnimatePresence
was present but its children had no keys, so exits never ran.
Each view is now a keyed motion wrapper (PageTransition): it
enters from the right when moving forward through the view order
and from the left when moving back, with a short blur fade
(0.35s). Réfection and Enveloppe views themselves are untouched;
only the wrapper around them animates.

## Batch 2 — Spinning counter (DashboardHome)
The KPI RollingNumber count-up is replaced by a reel spinner:
each digit of a numeric KPI spins through a 0–9 strip to its
target digit, staggered per digit (0.9s). Non-numeric values
(e.g. the "Dernière Entrée" date) are rendered exactly as before.
Same labels, same values.

## Batch 3 — Skeleton loader and reveal + panel reveal
- Skeleton: while auth resolves, App.jsx shows a skeleton of the
  real shell (sidebar, top bar, KPI row, chart cards, pulsing)
  instead of a lone spinner; once the user is known, the
  authenticated app fades in (0.4s).
- Panel reveal: StatisticsView PanelFrame is now a motion section
  that fades and rises in, staggered 0–0.2s across the panels.
  Chart data inside each panel is unchanged.

## Batch 4 — Text states swap + toast open
- Text swap: the page title in DashboardLayout blurs and fades
  out, then the new title blurs in, on every view change (0.25s).
- Toast open: Sonner toasts (save confirmations in Réfection,
  Enveloppe and elsewhere) rise in with a fade, slight scale and
  a blur that clears (0.35s, CSS in index.css). No toast text,
  logic or trigger is changed.

## Not changed
- Réfection and Enveloppe view files were not edited; their
  content, forms and proof logic are untouched. They do sit inside
  the new page transition and title swap, like every view, and
  their toasts use the new toast animation — the theme exemption
  (light + navy, "Thème d'origine") still applies to them.
- No data, logic, routes, Firebase or proof-upload code changed.
- Original repo untouched; this work is in the copy only.

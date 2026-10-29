# Security fixes (copy only, 2026-10-28)

From the code-only review (`~/workspace/hydraucan-copy-security-review.md`).
Original untouched; these changes are in the copy only.

## What changed

- **Réfection is per-user now** (`src/hooks/useRefections.js`, `src/pages/RefectionView.jsx`,
  `src/App.jsx`): the hook takes the signed-in user, queries only
  `where('userId', '==', user.uid)`, stamps new entries with `userId`, and sorts
  client-side (so no new Firestore composite index is needed).
- **Enveloppe financière is per-user now** (`src/hooks/useEnveloppes.js`,
  `src/pages/EnveloppeFinanciereView.jsx`, `src/App.jsx`): same pattern — owner-only
  read, `userId` stamped on new reports, client-side sort by `createdAt`.
- **Orphan migration removed** (`src/hooks/useDashboardData.js`): the effect that
  fetched every workReport and silently assigned userId-less documents to whoever
  signed in first is gone. UserId-less documents are simply not shown by the
  per-user queries; assigning them is a deliberate console action, not an app
  behaviour on load.
- **Rules files aligned with the app** (`firestore.rules`, `storage.rules`):
  owner rules for workReports, workers, pointages, refeccions and
  enveloppe_reports; Storage proofs under `enveloppe_preuves/<uid>/`.
- **Proof upload validation** (`EnveloppeFinanciereView.jsx`): only images and
  PDFs, max ~10 MB, checked before any upload; Firebase Storage fallback path
  now includes the owner's uid.

## What this does NOT change on its own

- **Deployed console rules are untouched.** Vercel does not deploy
  `firestore.rules`/`storage.rules`. Until the new files are pasted into the
  Firebase console and published there, direct Firestore/Storage API access is
  still governed by whatever rules are currently deployed. The app's own UI
  now filters by user, but a direct API call bypasses the UI.
- **Cloudinary preset limits are untouched.** The preset's format/size limits
  must still be set in the Cloudinary dashboard — client-side validation does
  not stop a direct API call made with the preset name from the bundle.
- **Old data without a userId is hidden, not deleted.** Réfection entries and
  Enveloppe reports written before this fix carry no `userId`, so they no
  longer appear in the lists. To make them visible again, assign them a
  `userId` in the Firebase console (one-time). The same applies to proofs in
  the old flat Storage folder.
- **appSettings/options stays shared by design** (any authenticated user may
  read/write the Nature/Type options), and there is still no admin role.

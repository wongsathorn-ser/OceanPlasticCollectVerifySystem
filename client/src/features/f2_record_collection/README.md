# F2: Record a collection

Owner: Masaaki Kato. Baseline: uploaded main `97b59ab` (27 Nov 2026), including the PM's D13 schema and CHG-001–004 helpers. This update connects F2 to those shared parts without changing table models or dependencies.

| Screen | Route | Behavior |
|---|---|---|
| Boat picker | `/record` | Active boats from F5's DB-backed `/api/boats`, cached for offline use |
| New collection | `/record/details` | Weight, material, note; PLASTIC photo first, then SCALE photo; fresh device GPS alongside each selection; nearest active site check |
| Confirmation | `/record/saved?client_id=UUID` | Local/server state, both photos, flags, site and automatic verification result |
| Send | `/send` | Current owner's queue, retries, errors and confirmed receipts |

Sign in as crew `mreyes` / `password123`. Photos are decoded, resized (max 1600 px), converted to JPEG and saved as Blobs with the immutable draft in IndexedDB **before** upload. SCALE is also retained as the `photo` alias for F3's local thumbnail contract. GPS is captured with each photo selection, never refreshed when syncing; SCALE GPS populates the existing Record coordinates. The browser cannot prove when a gallery image was originally taken. There is no mock-GPS fallback.

Both capture locations must be within the configured radius (default 100 m) of an active site. Sites/radius are cached for offline checking; the server repeats its authoritative check using Record GPS and flags outside records instead of discarding evidence. First-time offline use without cached configuration is blocked with a message. The seeded sites are near Phuket: classroom testing elsewhere needs an explicitly synthetic local test site at the device's **real** coordinates; see `docs/F2_IMPLEMENTATION.md`.

F2 uses the PM's shared LanguageContext and sidebar language switcher. New keys have English fallback; empty Thai/Burmese entries need translator review. Records/photos/flags are committed atomically, then the PM's auto-verification helper runs under the same record lock used by F4. A new record starts PENDING and can become VERIFIED under CHG-003.

Failed/expired-session uploads stay on the device. Ownership comes from the actual cookie session. UUID retries return the original record. Legacy one-photo server records remain readable/retryable; **unsent** legacy one-photo drafts are preserved with an explicit review message because their missing evidence cannot be reconstructed.

See `offline/README.md`, `docs/F2_IMPLEMENTATION.md` and `docs/F2_VERIFICATION.md`. The small shared guard/evidence fixes are separated for PM review in `docs/F2_SHARED_REVIEW.md`. Manual camera/GPS and real offline reopening remain to be verified on a device.

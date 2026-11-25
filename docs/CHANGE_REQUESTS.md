# Change requests from the sponsor (18 Nov 2026)

Status: **approved, in progress.** The schema update for CHG-002/003/004 is done (decision D13, 25 Nov): all new tables and columns below exist, with demo data. The rules and screens are still to build. After pulling the schema update, everyone runs `docker compose down -v` and `docker compose up --build` once.

| ID | Change | Main owners | Status |
|---|---|---|---|
| CHG-001 | Thai and Burmese on crew screens | PM (helper, switcher), F1, F2, F3 | translation file ready: `client/translations.json` |
| CHG-002 | Crew reward per verified kg | PM (rates admin), F3, F4, F5 | prepared |
| CHG-003 | Auto-verification for low-risk records | F4 (+ F2, F3) | prepared |
| CHG-004 | Stronger evidence (2 photos, landing site, duplicate photo) | F2 (+ PM, F3, F4) | prepared |

**Schema update done (D13):** `reward_rates`, `landing_sites`, `record_flags`, `app_settings`; new columns on `records`, `photos` and `boats`. Column list: `docs/DATABASE.md` section 3. `GET /api/photos/{record_id}` now takes `?kind=SCALE` (default) or `?kind=PLASTIC`.

## CHG-001 Thai and Burmese language support

- Crew screens only: sign in, create account, record a collection, crew home, my history, record details. Sponsor and admin screens stay in English.
- Text lives in `client/translations.json` (next to `index.html`): `"key": {"eng_word": "...", "th_word": "", "burmese_word": ""}`.
  - Translators fill `th_word` and `burmese_word`; an empty value falls back to English.
  - Keep `{name}`, `{count}`, `{kg}` and other words in curly braces exactly as they are; never change a key.
  - Save as UTF-8 and keep it valid JSON (VS Code shows errors in red).
  - Developers: new crew-facing text gets a new key here instead of fixed English in the page. Keys starting with `chg002_`, `chg003_`, `chg004_` are for the upcoming changes.
- To build (PM): a `LanguageContext` (React context, taught) with the chosen language saved in `localStorage`, a `t(key, values)` helper that replaces `{name}`-style placeholders, and a language switcher on the sign-in page and the crew layout.
- Then each owner replaces fixed English text in their crew screens with `t('...')`.
- Server error messages shown to crews have keys under `server_error.*`; the frontend maps the English `detail` to the key.

## CHG-002 Crew reward per verified kilogram

New table (PM, in the schema update):

| `reward_rates` | |
|---|---|
| `id` | primary key |
| `material` | one of `MATERIALS` |
| `rate_thb_per_kg` | > 0 |
| `valid_from` | date (Thailand date); a new rate never edits an old one |
| `created_by` → users, `created_at` | who set it |

Rules:

- Reward of a record = `weight_kg × rate` of the newest rate for its material with `valid_from <= recorded_at` (Thailand date).
- Only `VERIFIED` records earn. The reward is **calculated, not stored**, so a reversed record (status back to `REJECTED`) earns nothing automatically.
- Crew home (F3): earnings this month, earnings to date, pending amount (same calculation for `PENDING` records).
- Fleet overview (F5): total payout per boat.
- Admin (PM): list rates and add a new rate (`/api/admin/reward-rates`).
- Reverse a verified record (F4): new action with reason, `reversed_by`, `reversed_at`. This changes BR-1 ("VERIFIED is final") – update the spec.

## CHG-003 Auto-verification for low-risk records

New columns and table (PM, in the schema update):

- `records`: `auto_verified` (bool), `verified_rule` (text shown to users), `spot_check` (bool), `reversed_by`, `reversed_at`, `reversal_reason`.
- `boats`: `auto_verify_blocked_until` (datetime).
- `app_settings` (key, value): `auto_verify_max_kg` = 50, `auto_verify_min_verified` = 10, `auto_verify_days` = 30, `spot_check_percent` = 10, `block_days` = 30.

Rule (F4 service, called by F2 right after a record is saved):

1. `weight_kg <= 50`
2. the record has no rows in `record_flags`
3. the boat is not blocked (`auto_verify_blocked_until` is empty or in the past)
4. the boat has >= 10 `VERIFIED` records and 0 `REJECTED` records in the last 30 days

If all pass: `status = VERIFIED`, `auto_verified = True`, `verified_rule = "≤ 50 kg, no flags, boat trusted (10+ verified, no rejections in 30 days)"`, `reviewed_at = now`, `reviewed_by = NULL`. Then with probability `spot_check_percent` set `spot_check = True`. Pass the random number into the function so tests can control it.

Spot-check (F4): a "Spot-check" tab lists `spot_check = True` records. Confirm keeps it verified; reject sets `REJECTED` with a reason (reward reversed by CHG-002) and sets the boat's `auto_verify_blocked_until = now + 30 days`.

F3 shows "Auto-verified" and `verified_rule` on history and record pages.

## CHG-004 Stronger evidence when recording a collection

Table changes (PM, in the schema update):

- `photos`: add `kind` (`PLASTIC` or `SCALE`) and `sha256` (indexed); one photo **per kind** per record (unique `record_id` + `kind`) instead of one per record.
- New `landing_sites`: `id`, `name`, `kind` (`PIER` or `PORT`), `latitude`, `longitude`, `active`. Admin list/add/deactivate (PM, `/api/admin/landing-sites`).
- New `record_flags`: `id`, `record_id` → records, `flag` (`DUPLICATE_PHOTO`, `OUTSIDE_LANDING_SITE`, …), `detail`, `created_at`. Used by CHG-003.

Record rules (F2):

- Both photos are required. GPS (`latitude`, `longitude`, `gps_accuracy_m`) is required and taken **when the photo is captured**, not when the record is sent (offline).
- Distance to the nearest active landing site <= 100 m (haversine formula with Python `math`, no library). The app blocks the save outside 100 m; the server flags `OUTSIDE_LANDING_SITE` if such a record still arrives.
- `sha256` of each photo (`hashlib`); if the same hash exists on an earlier record, add a `DUPLICATE_PHOTO` flag (the record is still saved).
- F3 and F4 show both photos and any flags.

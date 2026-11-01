# F2 · Offline-first code (owner: Masaaki Kato)

Planned modules for FR-2.4 – FR-2.7 (all browser-native APIs, no extra libraries):

| Module | Job |
|---|---|
| `localDb.js` | IndexedDB store: every record + photo Blob is saved here **before** any network call; remember which user created it |
| `syncQueue.js` | States SAVED_ON_PHONE → SENDING → SENT; send after each save, on app open, on the `online` event and on the Send button (no Background Sync - iOS Safari) |
| `photo.js` | Camera input (`<input type="file" accept="image/*" capture="environment">`) and compression with a canvas (~1600 px JPEG) |
| `location.js` | Geolocation (latitude, longitude, accuracy); explain how to enable it when permission is denied |
| `client/public/sw.js` + `manifest.webmanifest` | Service worker that caches the app shell + web app manifest (installable PWA) |

Delete a local record only after the server confirms it (returns its id / record number). GPS and service workers need HTTPS, so test on the deployed URL (or `localhost` on a computer).

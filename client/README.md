# Client – React frontend

React 19 (Vite, JavaScript) + Tailwind CSS v4 + React Router (declarative mode), structured by feature. Each team member works only inside their own feature folder.

```
client/src/
├── main.jsx, App.jsx, index.css   SHARED  bootstrap, route composition, Tailwind import
├── shared/                        SHARED  api/client.js (fetch wrapper), layout/ (side nav),
│                                          components/, ui/status.js (status colours), pages/
└── features/
    ├── f1_accounts/           F1  Wongsathorn Sereephap
    ├── f2_record_collection/  F2  Masaaki Kato
    ├── f3_crew_history/       F3  Kaung Khant Paing
    ├── f4_verification/       F4  Hein Thant Si Thu
    └── f5_fleet_boats/        F5  Natthachaimongkol Chayopathum
```

Inside a feature folder: `pages/` (one file per Figma screen), `components/` (UI only this feature uses), `routes.jsx` (the feature's routes – `App.jsx` imports them, so you never edit `App.jsx`), `api.js` (backend calls through `shared/api/client.js`), `README.md` (screens, routes, notes).

## Run

From the repository root: `docker compose up --build`, then open http://localhost:5173.

Without Docker (faster hot reload on Windows):

```bash
cd client
npm install
npm run dev
```

`/api` requests are proxied to the backend (`http://localhost:34242` by default, `VITE_PROXY_TARGET` overrides it), so the browser talks to one origin and the session cookie just works. Set `VITE_API_BASE_URL` in `client/.env.local` only if the API ever moves to another address.

## Check before pushing

```bash
npm run lint    # oxlint - the linter that comes with the current Vite React template
npm run build   # must succeed - CI runs both
```

## Add a dependency

Libraries not taught in ITCS525 need team approval first (docs/DECISIONS.md). Then `npm install <package>` and commit `package.json` together with `package-lock.json`.

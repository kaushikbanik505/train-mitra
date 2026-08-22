# TrainMitra

Crowdsourced Train Status & Tatkal Tracker. Full spec: [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md).

> This README is a working draft, updated as features are built. A final polished version (with architecture diagram) is written in the last build step.

## Status

- [x] Step 1 — MERN boilerplate + MongoDB connection + JWT auth (roles)
- [ ] Step 2 — Seed Trains collection
- [ ] Step 3 — Train search/autocomplete
- [ ] Step 4 — Tatkal countdown
- [ ] Step 5 — Delay reports + voting
- [ ] Step 6 — Socket.io live status updates
- [ ] Step 7 — Tatkal experience aggregation
- [ ] Step 8 — Admin/moderator dashboard
- [ ] Step 9 — Deployment
- [ ] Step 10 — Final README

## Project layout

```
train-mitra/
├── backend/     # Express + MongoDB API
├── frontend/    # React (Vite) + Tailwind
└── docs/        # Project spec
```

## Local development

### Backend

```
cd backend
cp .env.example .env   # fill in MONGO_URI and JWT secrets
npm install
npm run dev
```

Runs on http://localhost:5000

### Frontend

```
cd frontend
cp .env.example .env   # optional, defaults to http://localhost:5000/api
npm install
npm run dev
```

Runs on http://localhost:5173

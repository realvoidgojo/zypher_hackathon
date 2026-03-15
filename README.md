# Zypher

![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js)
![React](https://img.shields.io/badge/React-20232a?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

> A supply chain platform focused on getting things done, not showing off.

<p>
  <img src="https://img.shields.io/badge/Setup-Fast-0ea5e9" alt="Fast setup" />
  <img src="https://img.shields.io/badge/Workflows-Logistics-22c55e" alt="Logistics workflows" />
  <img src="https://img.shields.io/badge/repIntelligence-ML%20%2B%20AI-a855f7" alt="ML and AI" />
  <img src="https://img.shields.io/badge/Readiness-Production-f97316" alt="Production ready" />
</p>

## Navigation

- [Why this exists](#why-this-exists)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quickstart](#quickstart)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Notes](#notes)
- [Contributing](#contributing)

## Why this exists

Most logistics tools are slow, noisy, and full of dashboard theater.
Zypher cuts that out: track inventory, move shipments, predict risk, and make decisions before delays burn money.

## Features

- Live operations view for inventory + shipments
- Route + weather-aware shipment analysis
- Delay probability prediction
- Demand forecasting endpoint
- Copilot Logistics Assistant (Powered by Gemini)

### SaaS Features

- API-First Architecture
- Row-Level Security via Supabase
- Predictive ML Microservice

#### Highlights at a glance

| Area                                                                           | What you get                                    |
| ------------------------------------------------------------------------------ | ----------------------------------------------- |
| <img src="https://img.shields.io/badge/-Operations-0f172a" alt="Operations" /> | Shipment + inventory visibility from one place  |
| <img src="https://img.shields.io/badge/-Risk-0f172a" alt="Risk" />             | Weather-aware checks and route-aware decisions  |
| <img src="https://img.shields.io/badge/-Planning-0f172a" alt="Planning" />     | Demand forecast + delay probability predictions |
| <img src="https://img.shields.io/badge/-Assistant-0f172a" alt="Assistant" />   | Copilot Logistics Assistant (Gemini-powered)    |

## Tech stack

- **Frontend:** Next.js App Router, React, TypeScript, Leaflet, Recharts
- **ML service:** FastAPI, Pandas, Prophet
- **Database:** Supabase (Postgres)
- **Hosting:** Vercel (frontend), Render (ML service)

> Keep this README tight. No fluff, no marketing paragraphs, no dead sections.

## Quickstart

> <img src="https://img.shields.io/badge/ETA-10%20min-2563eb" alt="10-minute setup" /> local run if your Supabase project is ready.

### Requirements

- Node.js 20+
- Python 3.10+
- Supabase project

### 1) Database

Run in Supabase SQL Editor, in this exact order (do not skip):

1. `database/supabase_setup.sql`
2. `database/migration_real_data.sql`
3. `database/sample_test_account.sql` _(optional seed data)_

Then copy your Supabase **Project URL** and **Anon Key**. If these are wrong, nothing works.

### 2) Frontend

From repo root:

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional. Defaults to http://127.0.0.1:8000
NEXT_PUBLIC_ML_SERVICE_URL=http://127.0.0.1:8000

# Required for app/api/chat/route.ts
GEMINI_API_KEY=your_google_gemini_api_key

# Required for Cloudflare Turnstile (login/signup)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key
TURNSTILE_SECRET_KEY=your_cloudflare_turnstile_secret_key

# Optional: weather overlays in shipment UI
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweathermap_api_key
```

Run frontend:

```bash
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

### 3) ML service

In a second terminal:

```bash
cd python-ml-service
python -m venv venv
```

Activate virtual env:

- **Windows PowerShell**

  ```powershell
  .\venv\Scripts\Activate.ps1
  ```

- **Windows CMD**

  ```bat
  venv\Scripts\activate.bat
  ```

- **macOS/Linux**

  ```bash
  source venv/bin/activate
  ```

Install + run:

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

ML API: [http://127.0.0.1:8000](http://127.0.0.1:8000)

Optional `python-ml-service/.env`:

```env
API_KEY=your_openweathermap_api_key
OPENAI_API_KEY=your_openai_api_key
```

## Environment variables

### Frontend (`.env.local`)

| Variable                          | Required | Purpose                                         |
| --------------------------------- | -------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Yes      | Supabase URL                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Yes      | Supabase anon key                               |
| `NEXT_PUBLIC_ML_SERVICE_URL`      | No       | ML base URL (fallback: `http://127.0.0.1:8000`) |
| `GEMINI_API_KEY`                  | Yes      | Used by `app/api/chat/route.ts`                 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`  | Yes      | Cloudflare Turnstile widget site key            |
| `TURNSTILE_SECRET_KEY`            | Yes      | Used by `app/api/turnstile/verify/route.ts`     |
| `NEXT_PUBLIC_OPENWEATHER_API_KEY` | No       | Weather in shipment UI                          |

### ML service (`python-ml-service/.env`)

| Variable         | Required | Purpose                                         |
| ---------------- | -------- | ----------------------------------------------- |
| `API_KEY`        | No       | OpenWeatherMap access for `/check-weather-risk` |
| `OPENAI_API_KEY` | No       | FastAPI `/chat` endpoint                        |

## Deployment

### Frontend → Vercel

1. Import repository in Vercel
2. Add frontend env vars (`NEXT_PUBLIC_*`, `GEMINI_API_KEY`)
3. Point `NEXT_PUBLIC_ML_SERVICE_URL` to deployed ML endpoint
4. Deploy

### ML API → Render

`render.yaml` is already configured for `python-ml-service/`.

1. Create a Blueprint/Web Service in Render
2. Render installs from `python-ml-service/requirements.txt`
3. Add env vars: `API_KEY`, `OPENAI_API_KEY` (if needed)

## Notes

- Missing `NEXT_PUBLIC_ML_SERVICE_URL` → frontend hard-falls back to `http://127.0.0.1:8000`.
- `/api/chat` in Next.js uses Gemini.
- `/chat` in FastAPI uses OpenAI. Separate endpoints, separate responsibilities.

## Contributing

Small PRs. Sharp diffs. Fix a real problem or don’t open it.

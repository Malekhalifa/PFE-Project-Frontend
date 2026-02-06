# Frontend — Next.js App

This directory contains the **Next.js frontend** for the CSV data quality analysis project. Users upload a CSV file, trigger analysis, and view a quality report plus optional raw table view. The frontend talks to the FastAPI backend at `http://127.0.0.1:8000`.

## Tech Stack

| Layer      | Technology                          |
|-----------|--------------------------------------|
| Framework | Next.js 16 (App Router)              |
| UI        | React 19                             |
| Language  | TypeScript 5                         |
| Styling   | Tailwind CSS 4                       |
| API       | `fetch` (see `app/lib/api.ts`)       |

## User Flow

1. **Upload** — User selects a CSV on `/`, submits, and is redirected to `/analyze/[jobId]`.
2. **Analyze** — The analyze page triggers `POST /analyze/{job_id}` and polls `GET /status/{job_id}` every 2 seconds until status is `completed` or `failed`.
3. **Results** — On completion, user is redirected to `/results/[jobId]`, where they see the quality report and can toggle “Show original data” or download the analysis report as JSON.

## File Structure

```
frontend/
├── app/
│   ├── page.tsx                 # Upload page (/)
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── lib/
│   │   └── api.ts               # API client (upload, analyze, status, results, raw, export)
│   ├── analyze/
│   │   └── [jobId]/
│   │       └── page.tsx         # Analysis in progress + status polling
│   └── results/
│       └── [jobId]/
│           └── page.tsx         # Quality report + raw table + download report
├── package.json
├── tsconfig.json
└── README.md
```

## File-by-File Overview

- **`app/page.tsx`** — Home/upload page. File input (CSV only), submit button, and redirect to `/analyze/[jobId]` after a successful upload.

- **`app/analyze/[jobId]/page.tsx`** — Analysis page. Calls `POST /analyze/{job_id}` on mount, polls `GET /status/{job_id}` every 2 seconds, and redirects to `/results/[jobId]` when status is `completed`, or shows an error when `failed`.

- **`app/results/[jobId]/page.tsx`** — Results page. Displays:
  - Dataset summary (rows, columns)
  - Data quality report (missing rate, duplicate rate, outlier rate, quality score)
  - Numeric column stats and type consistency
  - Column analysis table
  - Numeric distribution metrics
  - **Download report** button — fetches `GET /results/{job_id}/export` and downloads the report as `analysis-report-{jobId}.json`
  - **Show original data** toggle — fetches `GET /raw/{job_id}` and displays the CSV as a table

- **`app/lib/api.ts`** — Central API client. Functions:
  - `uploadFile(file)` — `POST /upload`
  - `analyzeJob(jobId)` — `POST /analyze/{job_id}`
  - `getStatus(jobId)` — `GET /status/{job_id}`
  - `getResults(jobId)` — `GET /results/{job_id}`
  - `getRawData(jobId)` — `GET /raw/{job_id}`
  - `getReportExport(jobId)` — `GET /results/{job_id}/export`

- **`app/layout.tsx`** — Root layout wrapper for all pages.
- **`app/globals.css`** — Global CSS and Tailwind imports.

## Running the Frontend

From the `frontend` directory:

```bash
npm install   # once
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Ensure the backend is running at `http://127.0.0.1:8000` (see `backend-python/README.md`).

## API Base URL

The API base URL is set in `app/lib/api.ts`:

```ts
const API_URL = "http://127.0.0.1:8000";
```

Update this if the backend runs on a different host or port.

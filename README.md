# orchestrator-frontend

  > dbSherpa Studio — visual AI workflow builder UI. React 19 + Vite 7 + TanStack Query + React Flow.

  Standalone frontend for the orchestrator stack. Pairs with [`orchestrator-backend`](https://github.com/sunpratik1772/orchestrator-backend) (Python FastAPI). Both deploy independently to Cloud Run.

  ## Features

  - **Visual canvas** — drag-and-drop DAG editor (React Flow), 33 node types, branching/conditions.
  - **AI Copilot** — describe a workflow in natural language; Gemini plans + self-heals it via streaming SSE.
  - **4 color themes** — Dark, Light, Claude (warm cream), Ocean (matte turquoise).
  - **Export** — JSON / YAML / clipboard.
  - **Polish** — ⌘K command palette, sonner toasts, hero composer, canvas skeleton loader.

  ## Quickstart

  ```bash
  npm install
  echo 'VITE_API_BASE_URL=http://localhost:8080' > .env.local
  npm run dev      # http://localhost:5173
  ```

  ## Docker

  ```bash
  docker build -t orchestrator-frontend .
  docker run -p 8080:8080 \
    -e API_BACKEND_URL=https://your-backend.run.app \
    orchestrator-frontend
  ```

  The container ships nginx with `/api/*` reverse-proxied to `API_BACKEND_URL` (SSE-friendly: buffering off, 600s read timeout). Cloud Run substitutes `PORT` automatically.

  ## Deploy to Cloud Run

  ```bash
  gcloud builds submit --tag gcr.io/PROJECT_ID/orchestrator-frontend
  gcloud run deploy orchestrator-frontend \
    --image gcr.io/PROJECT_ID/orchestrator-frontend \
    --region us-central1 --allow-unauthenticated \
    --set-env-vars="API_BACKEND_URL=https://orchestrator-backend-xxx.run.app"
  ```

  The frontend container does NOT need any secrets — all AI / Slack / etc. calls go through the backend.

  ## Project structure

  ```
  src/
    api-client/          # generated React Query hooks (from backend's OpenAPI spec)
    components/canvas/   # React Flow canvas + custom nodes + execution panel
    components/layout/   # sidebar, theme switcher, navigation
    components/ui/       # shadcn primitives
    pages/               # Home, WorkflowEditor, WorkflowList, ...
    lib/theme.ts         # 4-theme zustand store
  ```

  ## Environment variables

  | Var | Where | Purpose |
  |---|---|---|
  | `PORT` | runtime | Port nginx listens on (default 8080) |
  | `API_BACKEND_URL` | runtime | Backend base URL; nginx proxies `/api/*` here |
  | `VITE_API_BASE_URL` | build-time | Used in dev to bypass nginx |
  | `BASE_PATH` | build-time | Vite `base` for sub-path deploys |

  ## License

  MIT
  
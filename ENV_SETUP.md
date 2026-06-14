# Environment Variables Setup

## Note

This doc is AI generated. I will loop back at the end to re-write this myself, but if you notice issuse ahead of time please let me know!

## Quick Start

Copy both templates and edit values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

- **Backend:** `backend/.env` (gitignored) — loaded by FastAPI when you run from `backend/`
- **Frontend:** `frontend/.env` (gitignored) — loaded by Expo at dev/build time; only variables prefixed with `EXPO_PUBLIC_` are exposed to the app

## Backend — Local Development

Create `backend/.env` with at least:

```bash
# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_API_KEY=your-web-api-key
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# Database — Option 1: individual components (local Postgres on localhost)
POSTGRES_USER=nhl_arenas_user
POSTGRES_PASSWORD=your-password-here
POSTGRES_DB=nhl_arenas
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Database — Option 2: full URL (Supabase, Railway, etc.)
# DATABASE_URL=postgresql+psycopg://user:pass@host:5432/nhl_arenas

# Optional
APP_NAME=NHL Arena Tracker API
ENVIRONMENT=development
CORS_ORIGINS=*
```

If `DATABASE_URL` is set, it takes priority over the `POSTGRES_*` components. See `backend/.env.example` for Firebase service account options (file, base64, or Google Cloud ADC).

## Frontend — Local Development

Create `frontend/.env` with at least:

```bash
# Backend API (no trailing slash)
EXPO_PUBLIC_API_URL=http://localhost:8000

# Firebase Web API key — same value as backend FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_API_KEY=your-web-api-key
```

### Variable reference

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Base URL for the FastAPI backend. Used by the axios client in `frontend/src/lib/api.ts`. |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Yes (for session refresh) | Firebase Web API key. Used when the app refreshes an expired `id_token` after a 401 (`frontend/src/lib/firebaseAuth.ts`). Login and register still go through the backend; this key is not used for sign-in directly. |

Get the Firebase Web API key from Firebase Console → Project Settings → General → **Web API Key** (same key as `FIREBASE_API_KEY` in `backend/.env`).

### Running the frontend

From `frontend/`:

```bash
npm install
npm start          # Expo dev server (press w / i / a for web / iOS / Android)
```

Ensure the backend is running and reachable at `EXPO_PUBLIC_API_URL` before signing in or loading visits.

### `.env` formatting (Expo)

Keep comments on their own line. Expo's env loader does **not** strip inline `#` comments from values, so a line like `EXPO_PUBLIC_API_URL=http://localhost:8000 # dev` can produce an invalid URL and axios "Network Error" responses.

### Physical devices and simulators

| Target | Typical `EXPO_PUBLIC_API_URL` |
|--------|-------------------------------|
| Production web ([nhl-arenas.onrender.com](https://nhl-arenas.onrender.com/)) | Your deployed backend URL (set in Render env vars) |
| Web (`npm run web`) | `http://localhost:8000` |
| iOS Simulator | `http://localhost:8000` |
| Android Emulator | `http://10.0.2.2:8000` (host machine from the emulator) |
| Physical phone (Expo Go) | `http://<your-lan-ip>:8000` (e.g. `http://192.168.1.42:8000`) |

The backend must listen on an interface the device can reach (e.g. `uvicorn` bound to `0.0.0.0`, not only `127.0.0.1`). For local dev, keep `CORS_ORIGINS=*` in `backend/.env`.

Restart the Expo dev server after changing `frontend/.env` — Metro caches env values at startup.

## Database URL Configuration

### Option 1: Individual components

```bash
POSTGRES_USER=nhl_arenas_user
POSTGRES_PASSWORD=your-password
POSTGRES_DB=nhl_arenas
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

The backend builds: `postgresql+psycopg://user:pass@host:port/db`

### Option 2: Full `DATABASE_URL` (recommended for production)

```bash
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/nhl_arenas
```

Use your Supabase or other provider connection string. Plain `postgresql://` URIs are normalized to use psycopg3.

**Note:** If both are set, `DATABASE_URL` takes priority.

## Security Best Practices

### Development

- Use `backend/.env` and `frontend/.env` (both gitignored)
- Use different credentials per environment
- Never commit `.env` files or Firebase JSON keys
- `EXPO_PUBLIC_*` values are embedded in the client bundle — safe for the Firebase **Web API key** (it is restricted by Firebase console rules), but never put server secrets (service account JSON, database URLs, etc.) in frontend env vars

### Production

- Use your platform’s secrets / env vars (`DATABASE_URL`, `FIREBASE_PROJECT_ID`, etc.)
- Use strong passwords and rotate credentials
- Prefer managed PostgreSQL (Supabase, Railway, RDS, etc.)

## Getting Your Firebase Project ID

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click gear icon → Project Settings
4. Copy the **Project ID** (not the Project name)

## Generating Secure Passwords

### macOS/Linux

```bash
openssl rand -base64 32
```

### Windows (PowerShell)

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

## Deployment Platform Examples

### Render

The production web version is live at [https://nhl-arenas.onrender.com/](https://nhl-arenas.onrender.com/).

Create a web service (backend) or static site (frontend) as needed. Then set in the dashboard:

Environment Variables:

- `DATABASE_URL` (often auto-provided when you attach Postgres)
- `FIREBASE_API_KEY`
- `FIREBASE_PROJECT_ID`
- `GOOGLE_APPLICATION_CREDENTIALS` (Set to ./firebase-service-account.json)

Secret Files:

- `firebase-service-account.json` (Get from firebase console)

### Google Cloud Run

```bash
gcloud run deploy nhl-arenas-backend \
  --set-env-vars FIREBASE_PROJECT_ID=your-id \
  --set-secrets DATABASE_URL=projects/PROJECT/secrets/db-url:latest
```

### Docker container

```bash
docker run -d \
  -e FIREBASE_PROJECT_ID="your-id" \
  -e DATABASE_URL="postgresql+psycopg://..." \
  nhl-arenas-backend
```

See [backend/DEPLOYMENT.md](./backend/DEPLOYMENT.md) for full deployment options.

## Verifying Environment Variables

```bash
# Backend — from backend/ with venv active
cd backend && python -c "from app.core.config import get_settings; s=get_settings(); print(s.firebase_project_id, s.database_url[:30]+'...')"

# Frontend — start Expo and check the startup log shows env loaded, or from frontend/
cd frontend && npx expo start
# Look for: "env: load .env" and "env: export EXPO_PUBLIC_API_URL ..."
```

If `EXPO_PUBLIC_API_URL` is missing, the app logs a console warning at startup and API calls will fail until `frontend/.env` is configured.

## Troubleshooting

### "Missing Firebase configuration"

- Verify `FIREBASE_PROJECT_ID` is set in `backend/.env`
- Restart the dev server after changing `.env`

### Database connection failed

- Check `DATABASE_URL` or `POSTGRES_*` values match your database
- For Supabase, use the connection string from the dashboard (Session pooler on hosts without IPv6)
- Ensure migrations have run: `alembic upgrade head`

### Changes not taking effect

- Restart `uvicorn` after editing `backend/.env`
- Restart the Expo dev server (`npm start`) after editing `frontend/.env`
- For production containers, redeploy or restart the service so new env vars are picked up

### Frontend "Network Error" or API calls fail

- Confirm `EXPO_PUBLIC_API_URL` is set with **no trailing slash** and no inline `#` comment on the same line
- Confirm the backend is running: `curl http://localhost:8000/docs` (or your configured URL)
- On a physical device, use your machine's LAN IP, not `localhost`
- On Android Emulator, try `http://10.0.2.2:8000` instead of `localhost`

### Session expires immediately or 401 loops

- Set `EXPO_PUBLIC_FIREBASE_API_KEY` to the same Web API key as `FIREBASE_API_KEY` in `backend/.env`
- Without it, token refresh on 401 fails and the app clears the session

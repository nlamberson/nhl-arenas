# Environment Variables Setup

## Quick Start

Copy the backend template and edit values:

```bash
cp backend/.env.example backend/.env
```

All configuration lives in `backend/.env` (gitignored). The FastAPI app loads it when you run locally from the `backend/` directory.

## Local Development

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

- Use `backend/.env` (gitignored)
- Use different credentials per environment
- Never commit `.env` files or Firebase JSON keys

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

Create a web-service. Then set in the dashboard:

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
# Local — from backend/ with venv active
cd backend && python -c "from app.core.config import get_settings; s=get_settings(); print(s.firebase_project_id, s.database_url[:30]+'...')"
```

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
- For production containers, redeploy or restart the service so new env vars are picked up

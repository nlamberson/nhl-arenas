# Environment Variables Setup

## Quick Start - Use Templates!

### Root `.env` (for Docker Compose)
```bash
cp .env.example .env
# Then edit .env with your values
```

### Backend `.env` (for local development)
```bash
cp backend/.env.example backend/.env
# Then edit backend/.env with your values
```

## For Docker Compose

Create a `.env` file in the **root directory** (next to `docker-compose.yml`):

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id

# Database Configuration
POSTGRES_USER=nhl_arenas_user
POSTGRES_PASSWORD=change-this-to-a-secure-password
POSTGRES_DB=nhl_arenas
```

**Important**: This `.env` file is gitignored and will NOT be committed!

## For Local Development (Without Docker)

Create `backend/.env`:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id

# Database Configuration (separate variables)
POSTGRES_USER=nhl_arenas_user
POSTGRES_PASSWORD=your-password-here
POSTGRES_DB=nhl_arenas

# Database URL (auto-constructed from above, or set manually)
# This will be built as: postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}
# Or set manually:
# DATABASE_URL=postgresql+psycopg://nhl_arenas_user:your-password@localhost:5432/nhl_arenas

# Optional
APP_NAME=NHL Arena Tracker API
ENVIRONMENT=development
```

## Security Best Practices

### Development
- ✅ Use `.env` files (gitignored)
- ✅ Different passwords for each environment
- ✅ Never commit `.env` files

### Production
- ✅ Use secrets management (AWS Secrets Manager, Google Secret Manager, Railway variables)
- ✅ Use strong passwords (20+ characters)
- ✅ Rotate credentials regularly
- ✅ Use environment variables in deployment platform

## Getting Your Firebase Project ID

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click gear icon → Project Settings
4. Copy the **Project ID** (not the Project name)

## Generating Secure Passwords

### On macOS/Linux:
```bash
# Generate a secure random password
openssl rand -base64 32
```

### On Windows (PowerShell):
```powershell
# Generate a secure random password
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

## Database URL Configuration - Two Options

The backend now supports **two ways** to configure the database:

### Option 1: Individual Components (Recommended)

```bash
POSTGRES_USER=nhl_arenas_user
POSTGRES_PASSWORD=your-password
POSTGRES_DB=nhl_arenas
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

The backend automatically builds: `postgresql+psycopg://user:pass@host:port/db`

**Pros:**
- ✅ Easier to read and update
- ✅ Works seamlessly with Docker Compose
- ✅ Consistent format across environments

### Option 2: Full DATABASE_URL (Alternative)

```bash
DATABASE_URL=postgresql+psycopg://nhl_arenas_user:your-password@localhost:5432/nhl_arenas
```

**Pros:**
- ✅ Works with cloud provider connection strings
- ✅ Copy-paste from Railway, Render, etc.

**Note:** If both are set, `DATABASE_URL` takes priority.

## Example `.env` Files

### Root `.env` (for Docker Compose)
```bash
FIREBASE_PROJECT_ID=my-nhl-app-abc123
POSTGRES_USER=nhl_arenas_user
POSTGRES_PASSWORD=X9mKp2@nQ5wRtY8#vL3zF6hJ9dS4bN7c
POSTGRES_DB=nhl_arenas
```

### Backend `.env` (for local development)
```bash
FIREBASE_PROJECT_ID=my-nhl-app-abc123
POSTGRES_USER=nhl_arenas_user
POSTGRES_PASSWORD=X9mKp2@nQ5wRtY8#vL3zF6hJ9dS4bN7c
POSTGRES_DB=nhl_arenas
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

## Deployment Platform Examples

### Railway
Set in Dashboard → Variables:
- `FIREBASE_PROJECT_ID`
- Database URL is auto-generated

### AWS ECS/Fargate
Set in Task Definition → Environment variables or use Secrets Manager

### Google Cloud Run
```bash
gcloud run deploy nhl-arenas-backend \
  --set-env-vars FIREBASE_PROJECT_ID=your-id \
  --set-secrets DATABASE_URL=projects/PROJECT/secrets/db-url:latest
```

### Docker Container
```bash
docker run -d \
  -e FIREBASE_PROJECT_ID="your-id" \
  -e DATABASE_URL="postgresql://..." \
  nhl-arenas-backend
```

## Verifying Environment Variables

### Check if loaded correctly:

```bash
# In Docker Compose
docker-compose exec backend env | grep FIREBASE

# In running container
docker exec nhl-arenas-backend env | grep DATABASE_URL
```

## Troubleshooting

### "Missing Firebase configuration"
- Verify `FIREBASE_PROJECT_ID` is set in `.env`
- Restart Docker Compose: `docker-compose down && docker-compose up`

### Database connection failed
- Check `POSTGRES_PASSWORD` matches in both db and backend services
- Verify database URL format is correct
- Ensure database is running: `docker-compose ps`

### Changes not taking effect
- Restart services: `docker-compose restart`
- Or full restart: `docker-compose down && docker-compose up`

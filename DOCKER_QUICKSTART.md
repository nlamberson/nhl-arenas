# Docker Quick Start

Get your entire app running with one command!

## Prerequisites

- Docker Desktop installed
- Docker Compose installed (included with Docker Desktop)

## Setup (2 minutes)

### 1. Create Root `.env` File

Copy the template and customize it:

```bash
# Copy template
cp .env.example .env

# Then edit .env with your values:
# - Set your FIREBASE_PROJECT_ID
# - Change POSTGRES_PASSWORD to a secure password
```

Or create it manually:

```bash
cat > .env << 'EOF'
FIREBASE_PROJECT_ID=your-firebase-project-id
POSTGRES_USER=nhl_arenas_user
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=nhl_arenas
EOF
```

**Security Note**: This file is gitignored and won't be committed. See `ENV_SETUP.md` for password generation tips.

### 2. Start Everything

```bash
cd /Users/nathanlamberson/Code/nhl-arenas
docker-compose up
```

That's it! 🎉

### 3. Access Your API

- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Database: localhost:5432

### 4. Stop Everything

```bash
# Stop (keeps data)
docker-compose down

# Stop and remove data
docker-compose down -v
```

## What Just Happened?

Docker Compose started:
1. ✅ PostgreSQL database
2. ✅ Ran migrations (`alembic upgrade head`)
3. ✅ Started your FastAPI backend

## Testing

```bash
# Check it works
curl http://localhost:8000/

# Test health endpoint
curl http://localhost:8000/health
```

## Useful Commands

```bash
# View logs
docker-compose logs -f backend

# View database logs
docker-compose logs -f db

# Restart just the backend
docker-compose restart backend

# Run migrations manually (if needed)
docker-compose exec backend alembic upgrade head

# Access database
docker-compose exec db psql -U nhl_arenas_user -d nhl_arenas

# Rebuild after code changes
docker-compose up --build
```

## Next Steps

- For deployment info: See `backend/DEPLOYMENT.md`
- For Firebase setup: See `FIREBASE_AUTH_SUMMARY.md`
- For API usage: See `frontend/API_USAGE.md`

## Troubleshooting

### "Port 5432 already in use"

Your local PostgreSQL is running. Either:
- Stop local PostgreSQL: `brew services stop postgresql`
- Or change port in `docker-compose.yml`: `"5433:5432"`

### "Port 8000 already in use"

Stop your local backend server.

### Changes not showing up?

Rebuild:
```bash
docker-compose up --build
```

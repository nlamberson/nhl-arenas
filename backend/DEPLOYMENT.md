# Deployment Guide

This guide covers deploying your NHL Arenas backend with Docker.

## Quick Start with Docker Compose

### 1. Set Environment Variables

Create a `.env` file in the **root directory** (next to `docker-compose.yml`):

```bash
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### 2. Start Everything

```bash
# Start database and backend
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop everything
docker-compose down
```

The API will be available at http://localhost:8000

## Building the Docker Image

### Local Build

```bash
cd backend
docker build -t nhl-arenas-backend .
```

### Test the Image

```bash
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql+psycopg://nhl_arenas_user:nhl_arenas_local@host.docker.internal:5432/nhl_arenas" \
  -e FIREBASE_PROJECT_ID="your-project-id" \
  nhl-arenas-backend
```

## Deployment Options

### Option 1: AWS EC2 / VM

1. **Build and push image to registry:**

```bash
# Build for production
docker build -t your-registry/nhl-arenas-backend:latest ./backend

# Push to registry (Docker Hub, ECR, GCR, etc.)
docker push your-registry/nhl-arenas-backend:latest
```

2. **On your VM:**

```bash
# Pull the image
docker pull your-registry/nhl-arenas-backend:latest

# Run it
docker run -d \
  --name nhl-arenas-backend \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql+psycopg://user:pass@your-db-host:5432/nhl_arenas" \
  -e FIREBASE_PROJECT_ID="your-project-id" \
  --restart unless-stopped \
  your-registry/nhl-arenas-backend:latest
```

### Option 2: AWS ECS (Elastic Container Service)

1. Push image to AWS ECR
2. Create ECS Task Definition with your image
3. Set environment variables in task definition
4. Create ECS Service

### Option 3: AWS Elastic Beanstalk

1. Create `Dockerrun.aws.json`:

```json
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "your-registry/nhl-arenas-backend:latest"
  },
  "Ports": [
    {
      "ContainerPort": 8000
    }
  ]
}
```

2. Deploy: `eb deploy`

### Option 4: Google Cloud Run (Recommended - Easiest!)

```bash
# Build and deploy in one command!
gcloud run deploy nhl-arenas-backend \
  --source ./backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL="your-db-url" \
  --set-env-vars FIREBASE_PROJECT_ID="your-project-id" \
  --allow-unauthenticated
```

### Option 5: Railway / Render (Easiest for Beginners!)

**Railway:**
1. Connect your GitHub repo
2. Select backend folder
3. Railway auto-detects Dockerfile
4. Set environment variables in dashboard
5. Deploy!

**Render:**
1. New Web Service → Docker
2. Connect repo, select backend
3. Set environment variables
4. Deploy!

## Environment Variables for Production

Required:
```bash
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname
FIREBASE_PROJECT_ID=your-firebase-project-id
```

Optional:
```bash
APP_NAME=NHL Arena Tracker API
ENVIRONMENT=production
```

## Database Setup for Production

### Option 1: Managed Database (Recommended)

Use a managed PostgreSQL service:
- **AWS RDS**
- **Google Cloud SQL**
- **Railway Postgres**
- **Supabase**
- **Neon**

Get the connection URL and set it as `DATABASE_URL`.

### Option 2: Database in Docker

If running on your own VM, you can use the `docker-compose.yml` but with **persistent volumes**:

```bash
# Production docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## Migrations in Production

### Automatic (Recommended)

Migrations run automatically on startup via `start.sh`:
1. Container starts
2. Runs `alembic upgrade head`
3. Starts uvicorn

### Manual

If you prefer manual control, modify `start.sh` to skip migrations and run separately:

```bash
# SSH into your server/container
docker exec -it nhl-arenas-backend alembic upgrade head
```

## Health Checks

The Dockerfile includes a health check at `/health`. Make sure this endpoint exists:

```python
# In app/routers/health.py
@router.get("/health")
async def health_check():
    return {"status": "healthy"}
```

## Logging

View logs:

```bash
# Docker Compose
docker-compose logs -f backend

# Docker
docker logs -f nhl-arenas-backend

# Cloud Run
gcloud logging read
```

## Scaling

### Horizontal Scaling

You can run multiple instances safely:
- Alembic handles concurrent migrations (locks the database)
- Only one instance will run migrations
- Others will wait or skip

### Vertical Scaling

Adjust container resources:

```bash
docker run --memory="1g" --cpus="1.0" ...
```

## Security Checklist

- [ ] Use HTTPS (TLS certificates)
- [ ] Set `allow_origins` in CORS to your frontend domain (not `["*"]`)
- [ ] Use secrets management (AWS Secrets Manager, etc.)
- [ ] Don't commit `.env` files
- [ ] Use read-only database users where appropriate
- [ ] Enable database SSL connections
- [ ] Set up monitoring and alerts

## Monitoring

Add logging and monitoring:
- **Sentry** - Error tracking
- **DataDog** - APM
- **New Relic** - Performance monitoring
- **CloudWatch** - AWS monitoring

## Rollback Strategy

If a deployment fails:

```bash
# Rollback migrations
alembic downgrade -1

# Deploy previous Docker image
docker pull your-registry/nhl-arenas-backend:previous-tag
docker stop nhl-arenas-backend
docker rm nhl-arenas-backend
docker run ... your-registry/nhl-arenas-backend:previous-tag
```

## Cost Estimates

### Budget-Friendly Options:
- **Railway**: ~$5/month (includes DB)
- **Render**: Free tier available
- **Fly.io**: ~$5/month

### AWS (Rough Estimates):
- **EC2 t3.micro**: ~$8/month
- **RDS db.t3.micro**: ~$15/month
- **Total**: ~$23/month

### Google Cloud:
- **Cloud Run**: Pay per request (~$0-5/month for low traffic)
- **Cloud SQL**: ~$10/month

## Recommended Setup for Beginners

**Railway** (Easiest):
1. Sign up at railway.app
2. New Project → Deploy from GitHub
3. Add PostgreSQL database (one click)
4. Set `FIREBASE_PROJECT_ID` in variables
5. Deploy!

Railway handles everything: Docker build, database, SSL, domains.

## Need Help?

Common issues:
1. **Migrations fail**: Check database connectivity and credentials
2. **App won't start**: Check logs with `docker logs`
3. **Can't connect**: Check firewall rules and port exposure
4. **Database connection refused**: Ensure database is running and URL is correct

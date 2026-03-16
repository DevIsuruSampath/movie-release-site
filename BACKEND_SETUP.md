# Backend Setup Guide

## Prerequisites

- Python 3.12+ installed
- PostgreSQL 14+ (or use managed PostgreSQL service)
- Node.js 20+ for frontend setup

## Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt
```

## Environment Configuration

Create a `.env` file from the template:

```bash
cp .env.example .env
# Edit .env with your values
```

### Environment Variables

```env
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/movie_db

# Security
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS - Add your frontend URLs
ALLOWED_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]

# Local File Storage (No S3 needed!)
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
```

### Database Setup Options

#### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo service postgresql start

# Create database
sudo -u postgres psql -c "CREATE DATABASE movie_db;"
sudo -u postgres psql -c "CREATE USER movie_user WITH PASSWORD 'movie_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE movie_db TO movie_user;"
```

#### Option 2: Managed PostgreSQL

```bash
# Railway
railway postgresql

# Render
# Create PostgreSQL database in Render dashboard

# Supabase
# Create project at https://supabase.com

# Neon
# Create project at https://neon.tech
```

## Database Migration

```bash
# Run migrations to create tables
alembic upgrade head
```

## Starting the Server

```bash
# Development mode with hot reload
uvicorn app.main:app --reload

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

After starting, visit:
- **API Documentation:** http://localhost:8000/docs
- **OpenAPI Schema:** http://localhost:8000/openapi.json
- **Health Check:** http://localhost:8000/health

## File Storage

The backend uses **local file storage** (no S3 required!):

- Images are saved to `/backend/uploads/` directory
- Served at `http://localhost:8000/uploads/{filename}`
- Files persist in Docker volume `movie_uploads`

### Uploads API

- **POST /api/v1/uploads/image** - Upload image (admin only)
- **GET /api/v1/uploads/image/{filename}** - Get uploaded image
- **DELETE /api/v1/uploads/image/{filename}** - Delete image (admin only)
- **GET /api/v1/uploads/list** - List all uploads (admin only)
- **POST /api/v1/uploads/cleanup** - Remove unused images

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Test connection
psql -U movie_user -d movie_db -h localhost -c "SELECT 1;"
```

### Port Conflicts

```bash
# Check if port 8000 is in use
sudo lsof -i :8000

# Kill process if needed
sudo kill -9 <PID>
```

### Migration Errors

```bash
# Reset migrations (DESTRUCTIVE - wipes data!)
alembic downgrade base

# Re-run migrations
alembic upgrade head
```

## Project Structure

```
backend/
├── app/
│   ├── api/v1/           # API routes
│   ├── core/            # Config, security
│   ├── db/              # Database connection
│   ├── models/          # SQLAlchemy models
│   └── schemas/         # Pydantic schemas
├── alembic/             # Database migrations
├── uploads/             # Local file storage
│   └── .gitkeep          # Track empty directory
├── requirements.txt       # Python dependencies
├── .env.example         # Environment template
└── Dockerfile           # Docker image build
```

## Production Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Stop services
docker-compose down
```

### Direct Deployment

```bash
# Run backend directly
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Security Notes

1. **JWT Secret Key** - Must be unique and complex
2. **Database Password** - Use strong passwords
3. **File Upload Limits** - MAX_FILE_SIZE_MB set to 10MB
4. **Admin Routes** - All admin endpoints check user permissions
5. **CORS** - Only allow frontend origins
6. **File Types** - Only allow images (JPEG, PNG, GIF, WebP)

## Monitoring

### Health Checks

```bash
# Check backend health
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "storage": "local"
}
```

### Logs

```bash
# View uvicorn logs
docker-compose logs backend

# Check for errors
docker-compose logs backend | grep -i "error"
```

## Performance Tuning

1. **Database Connection Pooling** - Already configured in db/database.py
2. **Static File Serving** - FastAPI serves uploads efficiently
3. **Response Compression** - Consider adding for production
4. **Caching** - Add Redis for rate limiting and caching

## Integration with Dokploy

When deploying to Dokploy + VPS:

1. **Push code to GitHub** (already done!)
2. **Connect GitHub repository to Dokploy**
3. **Use Docker Compose deployment** in Dokploy
4. **Ensure uploads volume persists** between restarts
5. **Set environment variables** in Dokploy dashboard

### Dokploy Deployment Steps

1. Go to your Dokploy project
2. Click "Create Service" → "Git Repository"
3. Enter your GitHub repo URL:
   ```
   https://github.com/DevIsuruSampath/movie-release-site.git
   ```
4. Configure deployment:
   - Branch: `main`
   - Docker Compose: ✅
   - Auto-deploy on push: ✅ (recommended)
5. Click "Deploy"
6. Environment variables: Set these in Dokploy:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SECRET_KEY`: Your JWT secret
   - `ALLOWED_ORIGINS`: Your frontend URL

### Environment Variables for Dokploy

```env
DATABASE_URL=postgresql://movie_user:password@postgres:5432/movie_db
SECRET_KEY=your-super-secret-key
ALLOWED_ORIGINS=https://your-domain.com,https://your-domain.com
```

## Next Steps

1. ✅ Configure environment variables
2. ✅ Start PostgreSQL database
3. ✅ Run migrations: `alembic upgrade head`
4. ✅ Start backend: `uvicorn app.main:app --reload`
5. ✅ Set up frontend (see ../FRONTEND_SETUP.md)
6. ✅ Test API endpoints
7. ✅ Deploy to production

---

**Ready to deploy!** Your backend is configured for Dokploy + VPS hosting with local file storage.

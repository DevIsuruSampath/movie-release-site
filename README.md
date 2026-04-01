# Movie Release Website

A full-featured movie release website with public streaming/download pages and comprehensive admin dashboard, designed for **Dokploy + VPS hosting**.

## 🚀 Key Features

### Public Website
- 🎬 Browse movies by category, year, language, quality
- 🔍 Search movies by title with real-time filtering
- 📖 View movie details with high-quality posters and backdrops
- ▶️ Stream movies with multiple server options
- 📥 Download movies with quality selection
- ⭐ Featured movies on homepage
- 🏷️ Browse by category with dedicated pages
- 📊 Responsive design for all devices

### Admin Dashboard
- 🔐 Secure admin login with JWT authentication
- 📊 Dashboard with real-time statistics
- ➕ Add/edit/delete movies with full form
- 📂 Upload images to local storage or **Supabase Storage**
- 🏷️ Manage categories (CRUD operations)
- 🔗 Manage streaming links (multiple servers)
- 📥 Manage download links (quality options)
- 🖼️ SEO metadata management
- 📈 Publish/unpublish functionality
- 👥 Role-based access control (admin/editor)

## 🎯 Tech Stack

### Backend
- **FastAPI** 0.115.6 - Modern Python web framework
- **SQLAlchemy** 2.0.36 - ORM
- **PostgreSQL** - Production database, including Supabase Postgres
- **JWT Authentication** - Secure token-based auth
- **Alembic** - Database migrations
- **Supabase Storage or Local File Storage** - Media asset handling
- **Python-jose** - JWT token management
- **Passlib** - Bcrypt password hashing

### Frontend
- **Next.js** 16.1.6 - Latest stable
- **React** 19.2.4 - Latest stable
- **TypeScript** 5.8.3 - Type safety
- **Tailwind CSS** 3.4.21 - Utility-first styling
- **Zustand** 5.0.3 - State management
- **Axios** 1.7.9 - HTTP client
- **React Hook Form** 7.55.4 - Form validation

### Deployment
- **Docker Compose** - Complete orchestration
- **Dokploy** - VPS hosting platform
- **Supabase Postgres or self-hosted PostgreSQL**
- **Supabase Storage or Local File Storage**

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 14+
- Docker and Docker Compose
- GitHub account (for deployment)

### Step 1: Clone Repository

```bash
git clone https://github.com/DevIsuruSampath/movie-release-site.git
cd movie-release-site
```

### Step 2: Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials, storage backend, and registration settings
alembic upgrade head
```

**Important:** Set your admin registration code in `.env`:
```env
ADMIN_REGISTRATION_CODE=your-secure-secret-code-here
ALLOW_PUBLIC_REGISTRATION=false
```

### Step 3: Start Services

**Option A: Local Development**

```bash
# Start PostgreSQL (if local, or use Supabase DATABASE_URL)
sudo service postgresql start

# Start backend
cd backend
uvicorn app.main:app --reload

# Start frontend (in another terminal)
cd frontend
npm install
npm run dev
```

**Option B: Docker Compose (Recommended)**

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Step 4: Create Admin User

**First admin registration requires a code:**

```bash
# Via API with registration code
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"SecurePass123!",
    "full_name":"Admin User",
    "registration_code":"your-secure-secret-code-here"
  }'

# Then login at: http://localhost:3000/admin/login
```

**Additional users can be created by admins via:**
```bash
POST /api/v1/auth/admin/users (requires admin token)
```

### Step 5: Deploy to Dokploy

1. **Push Code to GitHub** ✅ (Already done!)

2. **Connect GitHub to Dokploy:**
   - Go to your Dokploy project
   - Click "Create Service" → "Git Repository"
   - Enter: `https://github.com/DevIsuruSampath/movie-release-site.git`
   - Configure: Docker Compose deployment
   - Set branch: `main`
   - Enable auto-deploy

3. **Set Environment Variables in Dokploy:**

```env
# Database
DATABASE_URL=postgresql://movie_user:password@postgres:5432/movie_db
STORAGE_BACKEND=local

# Supabase example
# DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
# STORAGE_BACKEND=supabase
# SUPABASE_URL=https://[project-ref].supabase.co
# SUPABASE_SERVICE_ROLE_KEY=...
# SUPABASE_IMAGES_BUCKET=movie-images
# SUPABASE_SUBTITLES_BUCKET=movie-subtitles

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production

# Registration (important!)
ALLOW_PUBLIC_REGISTRATION=false
ADMIN_REGISTRATION_CODE=your-secure-admin-code-change-this

# Frontend URLs
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

4. **Deploy!** - Click the deploy button in Dokploy

## 📋 Access URLs

| Service | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |
| Admin Login | http://localhost:3000/admin/login |
| Admin Dashboard | http://localhost:3000/admin |

## 🏗️ Project Structure

```
movie-release-site/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API routes
│   │   │   ├── auth.py       # Authentication
│   │   │   ├── movies.py     # Movie CRUD
│   │   │   ├── categories.py # Category CRUD
│   │   │   └── uploads.py    # Uploads (local or Supabase)
│   │   ├── core/            # Config, security
│   │   ├── db/              # Database
│   │   ├── models/          # SQLAlchemy models
│   │   └── schemas/         # Pydantic schemas
│   ├── uploads/               # Local file storage
│   ├── alembic/               # Migrations
│   ├── requirements.txt        # Dependencies
│   ├── .env.example            # Environment template
│   └── Dockerfile              # Docker build
│
└── frontend/                 # Next.js frontend
    ├── src/
    │   ├── app/             # Pages
    │   ├── components/       # React components
    │   ├── lib/             # Utilities & API client
    │   ├── stores/          # Zustand stores
    │   └── types/           # TypeScript types
    ├── package.json
    ├── next.config.js
    └── .env.local.example   # Frontend environment
```

## 🔐 Security

- ✅ JWT-based authentication with refresh tokens
- ✅ Bcrypt password hashing
- ✅ Admin role checking on protected routes
- ✅ CORS configuration
- ✅ File upload validation (type, size)
- ✅ Configurable local or Supabase-backed media storage
- ✅ SQL injection protection via SQLAlchemy
- ✅ XSS protection via FastAPI
- ✅ Registration code required (disabled public registration by default)
- ✅ Admin-only user creation endpoint

## 📊 Database Schema

### Main Tables
- **users** - Admin accounts
- **movies** - Movie details and metadata
- **categories** - Movie categories
- **stream_links** - Streaming server URLs
- **download_links** - Download mirror URLs
- **movie_gallery** - Movie images/screenshots
- **movie_categories** - Many-to-many relationship
- **audit_logs** - Admin activity tracking

### Relationships
- Movies ↔ Categories (many-to-many)
- Movies → Stream Links (one-to-many)
- Movies → Download Links (one-to-many)
- Movies → Gallery (one-to-many)

## 🚢 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Admin login
- `POST /api/v1/auth/register` - Register user (requires code when public registration disabled)
- `POST /api/v1/auth/admin/users` - Create user (admin only)
- `POST /api/v1/auth/refresh` - Refresh access token

### Movies
- `GET /api/v1/movies` - List with filters
- `GET /api/v1/movies/{slug}` - Get by slug
- `POST /api/v1/movies` - Create (admin)
- `PUT /api/v1/movies/{id}` - Update (admin)
- `DELETE /api/v1/movies/{id}` - Delete (admin)
- `PATCH /api/v1/movies/{id}/publish` - Publish (admin)
- `PATCH /api/v1/movies/{id}/unpublish` - Unpublish (admin)

### Categories
- `GET /api/v1/categories` - List all
- `GET /api/v1/categories/{id}` - Get by ID
- `POST /api/v1/categories` - Create (admin)
- `PUT /api/v1/categories/{id}` - Update (admin)
- `DELETE /api/v1/categories/{id}` - Delete (admin)

### File Uploads (Local Storage)
- `POST /api/v1/uploads/image` - Upload image (admin)
- `GET /api/v1/uploads/image/{filename}` - Get image
- `DELETE /api/v1/uploads/image/{filename}` - Delete image (admin)
- `GET /api/v1/uploads/list` - List all uploads (admin)
- `POST /api/v1/uploads/cleanup` - Remove unused images

## 🎨 Frontend Features

### Pages
- `/` - Homepage with featured movies
- `/movies` - Browse all movies with filters
- `/movies/[slug]` - Movie details with stream/download
- `/categories` - Browse all categories
- `/categories/[slug]` - Category-specific movies
- `/search` - Full-text search
- `/admin/login` - Admin authentication
- `/admin` - Admin dashboard
- `/admin/movies` - Movie management
- `/admin/categories` - Category management
- `/admin/media` - Image management

### Components
- Button, Input, Card - Basic UI components
- Admin Layout with sidebar navigation
- Movie Details with poster/backdrop display
- Category Cards with filtering
- Search Input with real-time results

## 📦 Deployment

### Dokploy Deployment

**Why Dokploy?**
- Free or very affordable VPS hosting
- Easy GitHub integration
- Automatic deployments on push
- Built-in PostgreSQL hosting
- Persistent storage (uploads volume)
- SSL certificates included

**Deployment Steps:**

1. **Connect GitHub repository:**
   ```
   Repository: https://github.com/DevIsuruSampath/movie-release-site.git
   Branch: main
   Method: Docker Compose
   ```

2. **Set environment variables:**
   ```env
   DATABASE_URL=postgresql://movie_user:password@postgres.dokploy.internal:5432/movie_db
   SECRET_KEY=your-super-secret-key
   ALLOW_PUBLIC_REGISTRATION=false
   ADMIN_REGISTRATION_CODE=your-secure-admin-code
   ALLOWED_ORIGINS=https://your-domain.com
   ```

3. **Deploy!** - Click deploy in Dokploy dashboard

4. **Access your site:** Your domain will be live!

### Alternative Deployments

**Railway:** `railway up` (includes PostgreSQL)
**Render:** Connect GitHub repo, deploy as Web Service
**VPS:** Use `docker-compose.yml` with systemd service

## 🔧 Development

### Running Locally

```bash
# Start everything with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Restart backend only
docker-compose restart backend
```

### Development Workflow

1. Start PostgreSQL database
2. Start backend API (`uvicorn app.main:app --reload`)
3. Start frontend (`npm run dev`)
4. Open http://localhost:3000
5. Create admin user via API
6. Login at http://localhost:3000/admin/login
7. Start adding movies!

### Troubleshooting

**Backend won't start:**
- Check database URL in `.env`
- Ensure PostgreSQL is running
- Check port 8000 isn't in use: `lsof -i :8000`

**Can't upload images:**
- Ensure `/backend/uploads/` directory exists
- Check file permissions
- Verify MAX_FILE_SIZE_MB setting

**Frontend build errors:**
- Delete `.next` folder: `rm -rf .next`
- Clear cache: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`

## 📈 Performance Optimization

1. **Database Connection Pooling** - Configured in SQLAlchemy
2. **File Upload Size Limits** - 10MB max with validation
3. **Static File Serving** - FastAPI serves uploads efficiently
4. **API Response Caching** - Consider Redis for production
5. **Next.js Image Optimization** - Automatic with Next/Image component
6. **Code Splitting** - Automatic with Next.js

## 📝 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

## 📞 Support

For issues or questions:
- Create an issue in the GitHub repository
- Check existing issues and discussions
- Review the documentation

---

**🎉 Ready for production!** 

This project is designed for **Dokploy + VPS hosting** with local file storage - no external services required!

**Built with ❤️ using modern, stable web technologies**

# Movie Release Website

A modern movie release website with public streaming/download pages and admin dashboard.

## Tech Stack

### Backend
- **FastAPI** 0.115.6 - Modern Python web framework
- **SQLAlchemy** 2.0.36 - ORM
- **PostgreSQL** - Production database
- **JWT** - Authentication
- **Alembic** - Database migrations

### Frontend
- **Next.js** 16.1.6 - Latest stable
- **React** 19.2.4 - Latest stable
- **TypeScript** 5.8.3 - Type safety
- **Tailwind CSS** 3.4.21 - Styling
- **Zustand** 5.0.3 - State management
- **Axios** 1.7.9 - HTTP client

## Features

### Public Site
- 🎬 Browse movies by category, year, language
- 🔍 Search movies by title
- ▶️ Stream movies
- 📥 Download movies
- 🏷️ View movie details with poster/backdrop
- ⭐ Featured movies on homepage

### Admin Dashboard
- 🔐 Secure admin login with JWT
- 📊 Dashboard with stats
- ➕ Add/edit/delete movies
- 📂 Upload images to S3
- 🏷️ Manage categories
- 🔗 Manage stream links
- 📥 Manage download links
- 🔖 SEO metadata management

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 14+
- S3-compatible storage (or use local storage)

### 1. Clone & Install Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values:
# - DATABASE_URL
# - SECRET_KEY
# - S3_BUCKET
# - AWS credentials
```

### 3. Initialize Database

```bash
# Run migrations
alembic upgrade head
```

### 4. Start Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Install & Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 6. Create Admin User

```bash
# Via API
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"admin123",
    "full_name":"Admin User"
  }'

# Or via Python
python -c "
import requests
requests.post('http://localhost:8000/api/v1/auth/register', json={
    'email': 'admin@example.com',
    'password': 'admin123',
    'full_name': 'Admin User'
})
"
```

## Access URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Admin Login:** http://localhost:3000/admin/login
- **Public Site:** http://localhost:3000/

## Project Structure

```
project-root/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API routes
│   │   ├── core/            # Config, security
│   │   ├── db/              # Database connection
│   │   ├── models/          # SQLAlchemy models
│   │   └── schemas/         # Pydantic schemas
│   ├── alembic/             # Migrations
│   ├── requirements.txt       # Python dependencies
│   └── .env.example         # Environment template
│
└── frontend/
    ├── src/
    │   ├── app/             # Next.js pages
    │   ├── components/       # React components
    │   ├── lib/             # Utilities & API client
    │   ├── stores/          # Zustand stores
    │   └── types/           # TypeScript types
    └── package.json          # Frontend dependencies
```

## Database Schema

- **users** - Admin accounts
- **movies** - Movie details
- **categories** - Movie categories
- **stream_links** - Streaming URLs
- **download_links** - Download mirrors
- **movie_gallery** - Movie images
- **movie_categories** - Many-to-many relationship

## API Endpoints

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/refresh`

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
- `POST /api/v1/categories` - Create (admin)
- `PUT /api/v1/categories/{id}` - Update (admin)
- `DELETE /api/v1/categories/{id}` - Delete (admin)

### Uploads
- `POST /api/v1/uploads/image` - Upload image (admin)

## Deployment

### Backend (Docker)
```bash
docker build -t movie-api .
docker run -p 8000:8000 --env-file .env movie-api
```

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist folder
```

## License

MIT

## Support

For issues or questions, please create an issue in the repository.

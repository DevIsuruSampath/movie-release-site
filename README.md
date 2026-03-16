# Movie Release Website - Complete

A full-featured movie release website with public streaming/download capabilities and comprehensive admin dashboard.

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 14+
- S3-compatible storage (optional, for production image uploads)

### Step 1: Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 2: Environment Configuration

```bash
cp .env.example .env
# Edit .env with your values:
# - DATABASE_URL: PostgreSQL connection string
# - SECRET_KEY: JWT secret key
# - S3_BUCKET: AWS S3 bucket name
# - AWS_ACCESS_KEY_ID: AWS access key
# - AWS_SECRET_ACCESS_KEY: AWS secret key
```

### Step 3: Database Migration

```bash
# Initialize database
alembic upgrade head
```

### Step 4: Start Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at http://localhost:8000

### Step 5: Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:3000

### Step 6: Create Admin User

```bash
# Register first admin user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "full_name": "Admin User"
  }'
```

## 📚️ Documentation

- **Backend Setup Guide:** [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- **API Documentation:** http://localhost:8000/docs (after starting backend)
- **Database Schema:** See backend/app/models/
- **API Routes:** See backend/app/api/v1/

## 🌐 Access URLs

| Service | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Admin Login | http://localhost:3000/admin/login |
| Admin Dashboard | http://localhost:3000/admin |
| Public Movies | http://localhost:3000/movies |
| Categories | http://localhost:3000/categories |
| Search | http://localhost:3000/search |

## 🎯 Features

### Public Website
- ✅ Browse movies by category, year, language
- ✅ Search movies by title
- ✅ View movie details with poster/backdrop
- ✅ Stream movies
- ✅ Download movies
- ✅ Featured movies on homepage
- ✅ Category filtering

### Admin Dashboard
- ✅ Secure admin login with JWT authentication
- ✅ Dashboard with statistics
- ✅ Add/edit/delete movies
- ✅ Upload images to S3
- ✅ Manage categories (CRUD)
- ✅ Manage streaming links
- ✅ Manage download links
- ✅ Publish/unpublish movies
- ✅ SEO metadata management

## 🏗️ Tech Stack

### Backend
- FastAPI 0.115.6
- SQLAlchemy 2.0.36
- PostgreSQL
- JWT Authentication
- Alembic (migrations)
- Python-jose (JWT handling)
- Passlib (password hashing)
- Boto3 (S3 uploads)

### Frontend
- Next.js 16.1.6
- React 19.2.4
- TypeScript 5.8.3
- Tailwind CSS 3.4.21
- Zustand 5.0.3 (state management)
- Axios 1.7.9 (HTTP client)
- React Hook Form 7.55.4
- Zod 3.24.1 (validation)

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # API routes
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── movies.py     # Movie CRUD
│   │   │   ├── categories.py # Category CRUD
│   │   │   └── uploads.py    # Image upload
│   │   ├── core/
│   │   │   ├── config.py     # Configuration
│   │   │   └── security.py   # JWT & passwords
│   │   ├── db/
│   │   │   └── database.py   # DB connection
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   └── main.py           # FastAPI app
│   ├── alembic/               # Database migrations
│   ├── requirements.txt        # Python dependencies
│   └── .env.example          # Environment template
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── admin/         # Admin pages
    │   │   ├── categories/    # Category pages
    │   │   ├── movies/        # Movie pages
    │   │   ├── search/        # Search page
    │   │   └── page.tsx       # Homepage
    │   ├── components/
    │   │   ├── ui/           # UI components
    │   │   ├── admin/        # Admin components
    │   │   └── public/       # Public components
    │   ├── lib/
    │   │   ├── api.ts        # Axios client
    │   │   └── utils.ts      # Utilities
    │   ├── stores/
    │   │   └── auth.ts       # Auth store
    │   └── types/
    │       └── index.ts      # TypeScript types
    ├── package.json
    └── next.config.js
```

## 🔐 Security

- JWT-based authentication with refresh tokens
- Bcrypt password hashing
- CORS configuration
- Rate limiting (ready to implement)
- Admin-only routes protection
- File upload validation

## 🚢 Deployment

### Backend (Docker)

```bash
cd backend
docker build -t movie-api .
docker run -p 8000:8000 --env-file .env movie-api
```

### Frontend (Vercel)

```bash
cd frontend
npm run build
# Deploy the .next folder to Vercel
```

### Frontend (Docker)

```bash
cd frontend
docker build -t movie-frontend .
docker run -p 3000:3000 movie-frontend
```

## 📝 Development

### Running Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Running Frontend

```bash
cd frontend
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend type check
cd frontend
npm run type-check
```

## 🆘 Troubleshooting

### Backend Issues

**Problem:** Database connection error
**Solution:** Check DATABASE_URL in .env

**Problem:** Migration error
**Solution:** Run `alembic upgrade head`

**Problem:** CORS errors
**Solution:** Add frontend URL to ALLOWED_ORIGINS

### Frontend Issues

**Problem:** API calls failing
**Solution:** Check NEXT_PUBLIC_API_URL environment variable

**Problem:** Build errors
**Solution:** Run `npm install` to install dependencies

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues or questions, please create an issue in the repository or contact the maintainers.

---

**Built with ❤️ using modern web technologies**

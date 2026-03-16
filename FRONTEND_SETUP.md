# Frontend Setup Guide

## Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- Backend API running on http://localhost:8000

## Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# This will install:
# - Next.js 16.1.6
# - React 19.2.4
# - TypeScript 5.8.3
# - Tailwind CSS 3.4.21
# - Zustand 5.0.3
# - Axios 1.7.9
# - And all other dependencies
```

## Environment Variables

Create a `.env.local` file in the frontend root:

```bash
# API URL for backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: API timeout
NEXT_PUBLIC_API_TIMEOUT=30000
```

## Running Development Server

```bash
# Start development server with hot reload
npm run dev

# Server will be available at:
# http://localhost:3000
```

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run type checker
npm run type-check

# Run linter
npm run lint
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (public)/           # Public pages
│   │   ├── admin/               # Admin pages
│   │   ├── categories/          # Category pages
│   │   ├── movies/             # Movie pages
│   │   └── search/              # Search page
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── admin/               # Admin-specific components
│   │   └── public/              # Public-facing components
│   ├── lib/
│   │   ├── api.ts               # Axios API client
│   │   └── utils.ts             # Utility functions
│   ├── stores/
│   │   └── auth.ts              # Zustand auth store
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── package.json                  # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.ts           # Tailwind configuration
└── next.config.js               # Next.js configuration
```

## API Integration

The frontend uses a centralized API client (`src/lib/api.ts`) with:

- **Auto authentication** - Token injected from localStorage
- **Error handling** - 401 errors trigger logout
- **Interceptors** - Request/response logging

## State Management

**Zustand** is used for global state:

- **Auth Store** - User authentication, tokens, permissions
- Persisted to localStorage for page reloads

## Component Architecture

### UI Components (src/components/ui/)
- Reusable, unstyled components
- Built with Tailwind CSS
- TypeScript typed props

### Page Components
- **Admin Layout** - Sidebar navigation
- **Login Page** - Authentication form
- **Dashboard** - Stats and overview
- **Movies List** - Table with search/filter
- **Movie Details** - Public view with stream/download
- **Categories** - Browse by genre
- **Search** - Full-text search

## Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Custom theme** - Consistent color scheme
- **Responsive design** - Mobile-first approach
- **Dark mode ready** - Can be added later

## Routing

**Next.js App Router** for file-based routing:

- `/` - Homepage
- `/movies` - Movie list
- `/movies/[slug]` - Movie details
- `/categories` - All categories
- `/categories/[slug]` - Category details
- `/search` - Search results
- `/admin` - Admin dashboard
- `/admin/login` - Admin login

## Troubleshooting

### API Connection Issues

```bash
# Check if backend is running
curl http://localhost:8000/health

# Expected response: {"status":"healthy"}
```

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Type Errors

```bash
# Check TypeScript types
npm run type-check

# Auto-fix common issues
npm run type-check -- --fix
```

## Production Build

```bash
# Create optimized production build
npm run build

# Test production build locally
npm run start

# Output is in .next/ directory
# Deploy this folder to your hosting provider
```

## Performance Tips

1. **Image Optimization** - Use Next.js Image component
2. **Code Splitting** - Automatic with Next.js
3. **Lazy Loading** - Load components only when needed
4. **Static Generation** - Build static pages for better SEO
5. **API Caching** - Implement HTTP caching headers

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development Workflow

1. Start backend server (`cd backend && uvicorn app.main:app --reload`)
2. Start frontend server (`cd frontend && npm run dev`)
3. Open http://localhost:3000 in browser
4. Make changes - Hot reload works automatically
5. Test features in real-time

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [TypeScript](https://www.typescriptlang.org/docs/)

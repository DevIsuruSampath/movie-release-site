import api from '@/lib/api'
import { Movie, MovieListResponse } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function getFeaturedMovies() {
  try {
    const response = await api.get<MovieListResponse>('/api/v1/movies', {
      params: { is_published: true, featured: true, limit: 6 },
    })
    return response.data.items || []
  } catch (error) {
    console.error('Failed to fetch featured movies:', error)
    return []
  }
}

export default async function HomePage() {
  const featuredMovies = await getFeaturedMovies()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 to-purple-900 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-4">
            Latest Movie Releases
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Browse and download the latest movies with streaming and download options
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/movies">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
                Browse All Movies
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button size="lg" variant="secondary" className="border-white text-white hover:bg-white/10">
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Movies */}
      {featuredMovies.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Featured Movies
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredMovies.map((movie) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.slug}`}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {movie.poster_url && (
                    <div className="aspect-[2/3] overflow-hidden">
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                      {movie.title}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-3 text-sm">
                      {movie.release_year && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full">
                          {movie.release_year}
                        </span>
                      )}
                      {movie.language && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {movie.language}
                        </span>
                      )}
                      {movie.imdb_rating && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                          ★ {movie.imdb_rating}
                        </span>
                      )}
                    </div>
                    
                    {movie.short_description && (
                      <p className="text-gray-600 line-clamp-3">
                        {movie.short_description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Looking for more movies?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Browse our full collection of latest releases across all categories
        </p>
        <Link href="/movies">
          <Button size="lg">
            Browse All Movies →
          </Button>
        </Link>
      </div>
    </div>
  )
}

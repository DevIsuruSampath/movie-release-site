import api from '@/lib/api'
import { Movie, MovieListResponse } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function getCategoryMovies(slug: string) {
  try {
    const response = await api.get<MovieListResponse>('/api/v1/movies', {
      params: { category: slug },
    })
    return response.data.items || []
  } catch (error) {
    console.error('Failed to fetch category movies:', error)
    return []
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const movies = await getCategoryMovies(params.slug)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div>
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-6 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2 capitalize">
            {params.slug.replace('-', ' ')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {movies.length} {movies.length === 1 ? 'movie' : 'movies'} in this category
          </p>
        </div>

        {movies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No movies found in this category</p>
            <Link href="/">
              <Button variant="secondary">Browse All Categories</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map((movie) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.slug}`}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {movie.poster_url && (
                    <div className="aspect-[2/3] overflow-hidden bg-gray-200">
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
                    
                    <div className="flex flex-wrap gap-2 mb-2 text-sm">
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
        )}
      </div>
    </div>
  )
}

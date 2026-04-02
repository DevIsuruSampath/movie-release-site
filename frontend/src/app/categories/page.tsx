import { fetchAllPaginated, toAbsoluteUrl } from '@/lib/api'
import { Category } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'

async function getAllCategories() {
  try {
    return await fetchAllPaginated<Category>('/api/v1/categories', {}, 200)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

const categoryGradients = [
  'from-red-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-purple-500 to-indigo-600',
  'from-green-500 to-emerald-600',
  'from-orange-500 to-amber-600',
  'from-teal-500 to-cyan-600',
  'from-rose-500 to-red-600',
  'from-violet-500 to-purple-600',
]

const categoryIcons = [
  { path: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' },
  { path: 'M7 2v2m0 16v2M17 2v2m0 16v2M2 7h2m16 0h2M2 17h2m16 0h2M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z' },
  { path: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { path: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
  { path: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
  { path: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z' },
  { path: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
]

export default async function CategoriesPage() {
  const categories = await getAllCategories()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-[#e50914] rounded-full blur-[200px] opacity-10" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-[#b20710] rounded-full blur-[150px] opacity-10" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/20 mb-6">
            <span className="status-dot"></span>
            <span className="text-sm font-medium text-white">Browse Collection</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Movie <span className="text-gradient">Categories</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Explore movies by genre and find your perfect entertainment match
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-9 h-9 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No categories available</h3>
            <p className="text-gray-400 mb-6">Check back later for new categories</p>
            <Link href="/">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full">
                Back to Home
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group"
              >
                <div className={`category-card bg-gradient-to-br ${categoryGradients[index % categoryGradients.length]} animate-slide-up stagger-${(index % 6) + 1}`}>
                  {category.image_url ? (
                    <>
                      <img
                        src={toAbsoluteUrl(category.image_url)}
                        alt={category.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-black/45" />
                    </>
                  ) : null}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white relative z-10">
                    <div className="category-icon w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={categoryIcons[index % categoryIcons.length].path} />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                    {category.description && (
                      <p className="text-white/80 text-sm text-center line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}

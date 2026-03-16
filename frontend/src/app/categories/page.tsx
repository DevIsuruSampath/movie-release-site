import api from '@/lib/api'
import { Category } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function getAllCategories() {
  try {
    const response = await api.get<Category[]>('/api/v1/categories')
    return response.data || []
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

export default async function CategoriesPage() {
  const categories = await getAllCategories()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div>
          <h1 className="text-4xl font-bold mb-4">Movie Categories</h1>
          <p className="text-xl text-gray-600 mb-8">
            Browse movies by genre and category
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No categories available</p>
            <Link href="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {category.description && (
                    <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <h2 className="text-3xl font-bold text-white">
                        {category.name.charAt(0)}
                      </h2>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    
                    {category.description && (
                      <p className="text-gray-600 line-clamp-3">
                        {category.description}
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

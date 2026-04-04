import { fetchAllPaginated } from '@/lib/api'
import { Category } from '@/types'

import Footer from '@/components/footer'
import Navbar from '@/components/navbar'
import {
  CinematicCategoryCard,
  CinematicEmptyState,
  CinematicPageHero,
  CinematicSectionHeader,
} from '@/components/public-cinema'

async function getAllCategories() {
  try {
    return await fetchAllPaginated<Category>('/api/v1/categories', {}, 200, {
      auth: false,
      cacheMode: 'force-cache',
      revalidateSeconds: 300,
    })
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

const categoryGradients = [
  'bg-[linear-gradient(135deg,rgba(255,90,95,0.8),rgba(135,30,54,0.9))]',
  'bg-[linear-gradient(135deg,rgba(38,99,235,0.82),rgba(8,145,178,0.9))]',
  'bg-[linear-gradient(135deg,rgba(139,92,246,0.82),rgba(79,70,229,0.92))]',
  'bg-[linear-gradient(135deg,rgba(34,197,94,0.78),rgba(5,150,105,0.92))]',
  'bg-[linear-gradient(135deg,rgba(249,115,22,0.82),rgba(180,83,9,0.95))]',
  'bg-[linear-gradient(135deg,rgba(20,184,166,0.82),rgba(14,116,144,0.95))]',
  'bg-[linear-gradient(135deg,rgba(244,63,94,0.82),rgba(190,24,93,0.95))]',
  'bg-[linear-gradient(135deg,rgba(168,85,247,0.82),rgba(126,34,206,0.95))]',
]

const categoryIcons = [
  'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z',
  'M7 2v2m0 16v2M17 2v2m0 16v2M2 7h2m16 0h2M2 17h2m16 0h2M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z',
  'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
  'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z',
  'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
]

export default async function CategoriesPage() {
  const categories = await getAllCategories()

  return (
    <div id="main-content" className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <CinematicPageHero
        eyebrow="Browse by genre"
        title="Step into curated lanes built for mood, style, and discovery"
        description="Explore category-driven movie browsing with richer presentation, stronger visual hierarchy, and premium cards that feel more editorial on every screen size."
        stats={[
          { label: 'Categories', value: `${categories.length}` },
          { label: 'Browse mode', value: 'Cinematic' },
          { label: 'Experience', value: 'Mobile + desktop' },
        ]}
        primaryAction={{ href: '/movies', label: 'Browse all movies' }}
        secondaryAction={{ href: '/search', label: 'Search catalog' }}
        artwork={
          categories[0] ? (
            <CinematicCategoryCard
              category={categories[0]}
              iconPath={categoryIcons[0]}
              accentClassName={categoryGradients[0]}
            />
          ) : null
        }
      />

      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 rounded-[30px] border border-white/10 bg-[#101114] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:grid-cols-3 lg:p-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Genre-led discovery</div>
            <div className="mt-2 text-lg font-semibold text-white">Browse by vibe</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">Find movies faster when you know the mood, not the exact title.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Premium card design</div>
            <div className="mt-2 text-lg font-semibold text-white">Editorial surfaces</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">Larger visuals and clearer hierarchy give categories more presence and clarity.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Touch-friendly UX</div>
            <div className="mt-2 text-lg font-semibold text-white">Mobile polished</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">Better hit targets, spacing, and readability on smaller screens.</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <CinematicSectionHeader
          title="Movie Categories"
          description="Each category is presented like a curated lane, making exploration feel closer to a premium streaming experience than a generic grid."
          eyebrow="Browse by genre"
        />

        {categories.length === 0 ? (
          <CinematicEmptyState
            title="No categories available"
            description="Categories have not been published yet. Check back later for new genre collections."
            action={{ href: '/', label: 'Return home' }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category, index) => (
              <div key={category.id} className="animate-slide-up" style={{ animationDelay: `${(index % 6) * 0.05}s` }}>
                <CinematicCategoryCard
                  category={category}
                  iconPath={categoryIcons[index % categoryIcons.length]}
                  accentClassName={categoryGradients[index % categoryGradients.length]}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}

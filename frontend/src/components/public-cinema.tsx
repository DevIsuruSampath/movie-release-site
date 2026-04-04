import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { toAbsoluteUrl } from '@/lib/api'
import type { Category, Movie } from '@/types'

function getMovieArtwork(movie: Movie) {
  return movie.poster_url || movie.thumbnail_url || movie.backdrop_url
}

export function CinematicPageHero({
  eyebrow,
  title,
  description,
  stats,
  primaryAction,
  secondaryAction,
  artwork,
}: {
  eyebrow: string
  title: string
  description: string
  stats?: Array<{ label: string; value: string }>
  primaryAction?: { href: string; label: string }
  secondaryAction?: { href: string; label: string }
  artwork?: React.ReactNode
}) {
  return (
    <section className="cinema-shell relative overflow-hidden px-4 pb-10 pt-24 sm:px-6 md:pt-28 lg:px-8">
      <div className="relative mx-auto max-w-7xl">
        <div className="cinema-hero-grid grid gap-8 overflow-hidden p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div className="relative z-10 flex flex-col justify-between gap-8">
            <div>
              <div className="cinema-chip">
                <span className="status-dot" />
                {eyebrow}
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base md:text-lg">
                {description}
              </p>
            </div>

            {(primaryAction || secondaryAction) && (
              <div className="flex flex-wrap gap-3">
                {primaryAction ? (
                  <Link href={primaryAction.href}>
                    <Button size="lg" className="rounded-full px-7">
                      {primaryAction.label}
                    </Button>
                  </Link>
                ) : null}
                {secondaryAction ? (
                  <Link href={secondaryAction.href}>
                    <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/5 px-7 text-white hover:bg-white/10">
                      {secondaryAction.label}
                    </Button>
                  </Link>
                ) : null}
              </div>
            )}

            {stats?.length ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="cinema-stat">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{item.label}</div>
                    <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">{item.value}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative hidden lg:block">{artwork}</div>
        </div>
      </div>
    </section>
  )
}

export function CinematicSectionHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string
  description: string
  action?: { href: string; label: string }
  eyebrow?: string
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff7f86]">{eyebrow}</p> : null}
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">{description}</p>
      </div>
      {action ? (
        <Link href={action.href}>
          <Button variant="ghost" className="h-11 rounded-full px-0 text-[#ff7f86] hover:bg-transparent hover:text-white">
            {action.label}
          </Button>
        </Link>
      ) : null}
    </div>
  )
}

export function CinematicMovieCard({
  movie,
  badge,
}: {
  movie: Movie
  badge?: string
}) {
  const artwork = getMovieArtwork(movie)

  return (
    <Link href={`/movies/${movie.slug}`} className="group block">
      <article className="cinema-panel-soft overflow-hidden rounded-[24px] p-2 transition duration-300 hover:-translate-y-1 hover:border-white/20">
        <div className="movie-poster rounded-[18px]">
          {artwork ? (
            <img
              src={toAbsoluteUrl(artwork)}
              alt={movie.title}
              className="card-image h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/5 px-4 text-center text-sm text-slate-400">
              Artwork unavailable
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/35 to-transparent" />
          {movie.quality ? <div className="quality-badge">{movie.quality}</div> : null}
          {movie.imdb_rating ? <div className="rating-badge text-yellow-300">{movie.imdb_rating}</div> : null}
          {badge ? (
            <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
              {badge}
            </div>
          ) : null}
          <div className="play-overlay">
            <div className="play-button">
              <svg className="ml-0.5 h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-2 pb-2 pt-4">
          <div>
            <h3 className="line-clamp-2 text-base font-semibold leading-6 text-white transition-colors group-hover:text-[#ff6b72]">
              {movie.title}
            </h3>
            {movie.short_description ? (
              <p className="mt-2 line-clamp-2 min-h-[2.75rem] text-sm leading-6 text-slate-400">
                {movie.short_description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-300">
            {movie.release_year ? <span className="rounded-full bg-white/8 px-2.5 py-1">{movie.release_year}</span> : null}
            {movie.duration_minutes ? <span className="rounded-full bg-white/8 px-2.5 py-1">{Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m</span> : null}
            {movie.language ? <span className="rounded-full bg-white/8 px-2.5 py-1">{movie.language}</span> : null}
            {movie.categories[0] ? <span className="rounded-full bg-white/8 px-2.5 py-1">{movie.categories[0].name}</span> : null}
          </div>
        </div>
      </article>
    </Link>
  )
}

export function CinematicCategoryCard({
  category,
  iconPath,
  accentClassName,
}: {
  category: Category
  iconPath: string
  accentClassName: string
}) {
  return (
    <Link href={`/categories/${category.slug}`} className="group block">
      <article className="cinema-panel relative overflow-hidden rounded-[28px] p-2 transition duration-300 hover:-translate-y-1 hover:border-white/20">
        <div className="relative overflow-hidden rounded-[22px] p-6 sm:p-7">
          {category.image_url ? (
            <>
              <img
                src={toAbsoluteUrl(category.image_url)}
                alt={category.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,10,0.15),rgba(5,6,10,0.65))]" />
              <div className={`absolute inset-0 mix-blend-overlay opacity-15 ${accentClassName}`} />
            </>
          ) : (
            <>
              <div className={`absolute inset-0 opacity-80 ${accentClassName}`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_36%),linear-gradient(180deg,rgba(10,12,16,0.22),rgba(10,12,16,0.88))]" />
            </>
          )}

          <div className="relative z-10 flex min-h-[250px] flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-black/20 text-white backdrop-blur-sm">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={iconPath} />
                </svg>
              </div>
              <div className="cinema-chip !px-3 !py-2 !text-[10px]">View Collection</div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">{category.name}</h3>
              <p className="mt-3 line-clamp-3 max-w-md text-sm leading-6 text-slate-200">
                {category.description || 'A curated lane with cleaner discovery, richer presentation, and faster picks.'}
              </p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

export function CinematicEmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="cinema-panel mx-auto max-w-3xl rounded-[28px] px-6 py-12 text-center sm:px-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">{description}</p>
      {action ? (
        <div className="mt-7">
          <Link href={action.href}>
            <Button variant="outline" className="rounded-full border-white/20 bg-white/5 px-6 text-white hover:bg-white/10">
              {action.label}
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  )
}

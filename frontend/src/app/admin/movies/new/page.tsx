import { MovieForm } from '@/components/admin/movie-form'

export default function NewMoviePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">New Movie</h1>
        <p className="mt-1 text-sm text-gray-400">Create a movie with metadata, assets, SEO, and playback links.</p>
      </div>
      <MovieForm submitLabel="Create Movie" />
    </div>
  )
}

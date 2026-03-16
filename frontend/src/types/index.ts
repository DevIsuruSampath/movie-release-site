// API types
export interface User {
  id: number
  email: string
  full_name?: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  created_at: string
}

export interface StreamLink {
  id: number
  movie_id: number
  title: string
  url: string
  is_primary: boolean
  is_active: boolean
  sort_order: number
  region_note?: string
}

export interface DownloadLink {
  id: number
  movie_id: number
  title: string
  url: string
  quality: string
  file_size?: string
  is_active: boolean
  sort_order: number
}

export interface Movie {
  id: number
  title: string
  slug: string
  original_title?: string
  description?: string
  short_description?: string
  release_year?: number
  release_date?: string
  duration_minutes?: number
  language?: string
  country?: string
  imdb_rating?: number
  trailer_url?: string
  poster_url?: string
  backdrop_url?: string
  thumbnail_url?: string
  age_rating?: string
  content_warning?: string
  visibility: string
  featured: boolean
  stream_enabled: boolean
  download_enabled: boolean
  status: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  canonical_url?: string
  open_graph_image?: string
  created_at: string
  updated_at: string
  published_at?: string
  categories: Category[]
  stream_links?: StreamLink[]
  download_links?: DownloadLink[]
}

export interface MovieListResponse {
  items: Movie[]
  total: number
  page: number
  pages: number
}

export interface MovieCreate {
  title: string
  slug?: string
  original_title?: string
  description?: string
  short_description?: string
  release_year?: number
  release_date?: string
  duration_minutes?: number
  language?: string
  country?: string
  imdb_rating?: number
  trailer_url?: string
  age_rating?: string
  content_warning?: string
  visibility?: string
  featured?: boolean
  stream_enabled?: boolean
  download_enabled?: boolean
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  canonical_url?: string
  open_graph_image?: string
  poster_url?: string
  backdrop_url?: string
  thumbnail_url?: string
  category_ids: number[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface CategoryCreate {
  name: string
  slug: string
  description?: string
}

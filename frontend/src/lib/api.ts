import type {
  AuditLog,
  AdminSettings,
  AuthResponse,
  Category,
  CategoryListResponse,
  DashboardStats,
  DownloadLink,
  Movie,
  MovieListResponse,
  MoviePayload,
  PaginatedResponse,
  SeoMetadata,
  StreamLink,
  Tag,
  TagListResponse,
  StorageCleanupResult,
  UploadItem,
  UploadMigrationResult,
  UploadOrphanReport,
  UploadResponse,
  User,
} from '@/types'

const API_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:3000'

const ASSET_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_URL ||
  API_URL

type Primitive = string | number | boolean
type PaginatedItemsResponse<TItem> = { items: TItem[]; pages: number }

interface RequestOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  params?: Record<string, Primitive | null | undefined>
  headers?: HeadersInit
  body?: TBody
  auth?: boolean
  cacheMode?: RequestCache
  revalidateSeconds?: number
}

function getAccessToken() {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('access_token') || localStorage.getItem('access_token')
}

function toAbsoluteUrl(path?: string | null) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const baseUrl = path.startsWith('/uploads/') ? ASSET_BASE_URL : API_URL
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private buildUrl(endpoint: string, params?: Record<string, Primitive | null | undefined>) {
    const url = new URL(endpoint, this.baseUrl)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value))
        }
      })
    }
    return url.toString()
  }

  private async request<TResponse, TBody = unknown>(endpoint: string, options: RequestOptions<TBody> = {}) {
    const token = options.auth === false ? null : getAccessToken()
    let response: Response
    try {
      const requestInit: RequestInit & { next?: { revalidate: number } } = {
        method: options.method || 'GET',
        headers: {
          ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
        body:
          options.body instanceof FormData
            ? options.body
            : options.body !== undefined
              ? JSON.stringify(options.body)
              : undefined,
        cache: options.cacheMode || 'no-store',
        credentials: 'same-origin',
        next: options.revalidateSeconds ? { revalidate: options.revalidateSeconds } : undefined,
      }
      response = await fetch(this.buildUrl(endpoint, options.params), requestInit)
    } catch {
      throw new ApiError(502, 'Network request failed')
    }

    if (!response.ok) {
      let detail = response.statusText
      try {
        const json = await response.json()
        detail = json.detail || json.message || detail
      } catch {}
      throw new ApiError(response.status, detail)
    }

    if (response.status === 204) return { data: undefined as TResponse }
    return { data: (await response.json()) as TResponse }
  }

  get<TResponse>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<TResponse>(endpoint, { ...options, method: 'GET' })
  }

  post<TResponse, TBody = unknown>(endpoint: string, body?: TBody, options?: Omit<RequestOptions<TBody>, 'method' | 'body'>) {
    return this.request<TResponse, TBody>(endpoint, { ...options, method: 'POST', body })
  }

  put<TResponse, TBody = unknown>(endpoint: string, body?: TBody, options?: Omit<RequestOptions<TBody>, 'method' | 'body'>) {
    return this.request<TResponse, TBody>(endpoint, { ...options, method: 'PUT', body })
  }

  patch<TResponse, TBody = unknown>(endpoint: string, body?: TBody, options?: Omit<RequestOptions<TBody>, 'method' | 'body'>) {
    return this.request<TResponse, TBody>(endpoint, { ...options, method: 'PATCH', body })
  }

  delete<TResponse>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<TResponse>(endpoint, { ...options, method: 'DELETE' })
  }

  login(payload: { email: string; password: string }) {
    return this.post<AuthResponse>('/api/v1/auth/login', payload, { auth: false }).then((response) => response.data)
  }

  refresh(refresh_token: string) {
    return this.post<AuthResponse>('/api/v1/auth/refresh', refresh_token ? { refresh_token } : {}, { auth: false }).then((response) => response.data)
  }

  logout() {
    return this.post<void>('/api/v1/auth/logout', {}, { auth: false }).then((response) => response.data)
  }

  me() {
    return this.get<User>('/api/v1/auth/me').then((response) => response.data)
  }

  getDashboard() {
    return this.get<DashboardStats>('/api/v1/admin/dashboard').then((response) => response.data)
  }

  getAdminSettings() {
    return this.get<AdminSettings>('/api/v1/admin/settings').then((response) => response.data)
  }

  updateAdminSettings(payload: AdminSettings) {
    return this.put<AdminSettings, AdminSettings>('/api/v1/admin/settings', payload).then((response) => response.data)
  }

  getActivity(params?: { page?: number; limit?: number }) {
    return this.get<PaginatedResponse<AuditLog>>('/api/v1/admin/activity', { params }).then((response) => response.data)
  }

  listMovies(params?: Record<string, Primitive | null | undefined>) {
    return this.get<MovieListResponse>('/api/v1/movies', { params }).then((response) => response.data)
  }

  getMovieById(id: number) {
    return this.get<Movie>(`/api/v1/movies/id/${id}`).then((response) => response.data)
  }

  createMovie(payload: MoviePayload) {
    return this.post<Movie, MoviePayload>('/api/v1/movies', payload).then((response) => response.data)
  }

  updateMovie(id: number, payload: Partial<MoviePayload>) {
    return this.put<Movie, Partial<MoviePayload>>(`/api/v1/movies/${id}`, payload).then((response) => response.data)
  }

  deleteMovie(id: number) {
    return this.delete<void>(`/api/v1/movies/${id}`).then((response) => response.data)
  }

  listCategories(params?: Record<string, Primitive | null | undefined>) {
    return this.get<CategoryListResponse>('/api/v1/categories', { params }).then((response) => response.data)
  }

  createCategory(payload: Partial<Category>) {
    return this.post<Category>('/api/v1/categories', payload).then((response) => response.data)
  }

  updateCategory(id: number, payload: Partial<Category>) {
    return this.put<Category>(`/api/v1/categories/${id}`, payload).then((response) => response.data)
  }

  deleteCategory(id: number) {
    return this.delete<void>(`/api/v1/categories/${id}`).then((response) => response.data)
  }

  listTags(params?: Record<string, Primitive | null | undefined>) {
    return this.get<TagListResponse>('/api/v1/tags', { params }).then((response) => response.data)
  }

  createTag(payload: Partial<Tag>) {
    return this.post<Tag>('/api/v1/tags', payload).then((response) => response.data)
  }

  updateTag(id: number, payload: Partial<Tag>) {
    return this.put<Tag>(`/api/v1/tags/${id}`, payload).then((response) => response.data)
  }

  deleteTag(id: number) {
    return this.delete<void>(`/api/v1/tags/${id}`).then((response) => response.data)
  }

  listMovieStreams(movieId: number) {
    return this.get<StreamLink[]>(`/api/v1/stream/movie/${movieId}`).then((response) => response.data)
  }

  listMovieDownloads(movieId: number) {
    return this.get<DownloadLink[]>(`/api/v1/download/movie/${movieId}`).then((response) => response.data)
  }

  uploadImage(file: File, options?: { media_role?: string; movie_id?: number }) {
    const body = new FormData()
    body.append('file', file)
    if (options?.media_role) body.append('media_role', options.media_role)
    if (options?.movie_id) body.append('movie_id', String(options.movie_id))
    return this.post<UploadResponse, FormData>('/api/v1/uploads/image', body, {}).then((response) => response.data)
  }

  listReferencedUploads(folder?: 'images') {
    return this.get<UploadItem[]>('/api/v1/uploads/references', {
      params: folder ? { folder } : {},
    }).then((response) => response.data)
  }

  getUploadOrphans() {
    return this.get<UploadOrphanReport>('/api/v1/uploads/orphans').then((response) => response.data)
  }

  migrateLocalUploads(folder?: 'images') {
    return this.post<UploadMigrationResult>(
      '/api/v1/uploads/migrate-local',
      undefined,
      { params: folder ? { folder } : {} }
    ).then((response) => response.data)
  }

  cleanupOrphanedStorage(folder?: 'images') {
    return this.post<StorageCleanupResult>('/api/v1/uploads/orphans/cleanup', undefined, {
      params: folder ? { folder } : {},
    }).then((response) => response.data)
  }

  cleanupMissingStorageReferences(folder?: 'images') {
    return this.post<StorageCleanupResult>('/api/v1/uploads/references/cleanup-missing', undefined, {
      params: folder ? { folder } : {},
    }).then((response) => response.data)
  }
}

const api = new ApiClient(API_URL)

async function fetchAllPaginated<TItem>(
  endpoint: string,
  params: Record<string, Primitive | null | undefined>,
  limit: number,
  options?: { auth?: boolean; cacheMode?: RequestCache; revalidateSeconds?: number }
) {
  const firstPage = await api.get<PaginatedItemsResponse<TItem>>(endpoint, {
    params: { ...params, page: 1, limit },
    auth: options?.auth,
    cacheMode: options?.cacheMode,
    revalidateSeconds: options?.revalidateSeconds,
  })
  const items = [...(firstPage.data.items || [])]
  const remainingPages = Array.from({ length: Math.max((firstPage.data.pages || 1) - 1, 0) }, (_, index) => index + 2)
  const responses = await Promise.all(
    remainingPages.map((page) =>
      api.get<PaginatedItemsResponse<TItem>>(endpoint, {
        params: { ...params, page, limit },
        auth: options?.auth,
        cacheMode: options?.cacheMode,
        revalidateSeconds: options?.revalidateSeconds,
      })
    )
  )
  for (const response of responses) {
    items.push(...(response.data.items || []))
  }
  return items
}

export { API_URL, ApiError, api, fetchAllPaginated, toAbsoluteUrl }
export default api

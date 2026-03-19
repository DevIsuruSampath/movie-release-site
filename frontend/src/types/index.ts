export interface User {
  id: number
  email: string
  full_name?: string | null
  is_active: boolean
  is_superuser: boolean
  is_admin: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pages: number
}

export interface SeoMetadata {
  meta_title?: string | null
  meta_description?: string | null
  meta_keywords?: string | null
  canonical_url?: string | null
  og_title?: string | null
  og_description?: string | null
  og_image?: string | null
  robots?: string | null
  schema_markup?: string | null
}

export interface Category extends SeoMetadata {
  id: number
  name: string
  slug: string
  description?: string | null
  image_url?: string | null
  created_at: string
  updated_at?: string | null
}

export interface Tag {
  id: number
  name: string
  slug: string
  description?: string | null
  created_at: string
  updated_at?: string | null
}

export interface Subtitle {
  id?: number
  movie_id?: number
  language: string
  label: string
  file_url: string
  format: string
  is_default: boolean
  sort_order: number
  created_at?: string
  updated_at?: string | null
}

export interface MediaStorageSummaryItem {
  storage_source?: string | null
  public_url?: string | null
  telegram_message_id?: string | null
  telegram_file_id?: string | null
  local_file_path?: string | null
  media_cache_id?: number | null
}

export interface TelegramSettings {
  id?: number | null
  is_enabled: boolean
  has_api_id: boolean
  has_api_hash: boolean
  has_bot_token: boolean
  api_id_masked?: string | null
  api_hash_masked?: string | null
  bot_token_masked?: string | null
  bot_username?: string | null
  private_channel_id?: string | null
  private_channel_username?: string | null
  private_channel_title?: string | null
  private_channel_invite_link?: string | null
  auto_post_on_publish: boolean
  auto_post_on_update: boolean
  enable_telegram_storage: boolean
  telegram_storage_mode: 'local_only' | 'telegram_only' | 'hybrid'
  caption_template?: string | null
  button_text?: string | null
  default_hashtags?: string | null
  send_poster_mode: 'photo' | 'document' | 'text_only'
  parse_mode?: 'HTML' | 'MarkdownV2' | 'None' | null
  disable_web_page_preview: boolean
  test_status?: string | null
  last_tested_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  storage_stats?: Record<string, number> | null
}

export interface TelegramSettingsPayload {
  is_enabled: boolean
  api_id?: string
  api_hash?: string
  bot_token?: string
  private_channel_id?: string
  private_channel_username?: string
  private_channel_title?: string
  private_channel_invite_link?: string
  auto_post_on_publish: boolean
  auto_post_on_update: boolean
  enable_telegram_storage: boolean
  telegram_storage_mode: 'local_only' | 'telegram_only' | 'hybrid'
  caption_template?: string
  button_text?: string
  default_hashtags?: string
  send_poster_mode: 'photo' | 'document' | 'text_only'
  parse_mode: 'HTML' | 'MarkdownV2' | 'None'
  disable_web_page_preview: boolean
}

export interface TelegramTestResponse {
  ok: boolean
  message: string
  bot_username?: string | null
  private_channel_title?: string | null
  private_channel_id?: string | null
  details?: Record<string, unknown> | null
}

export interface TelegramValidateChannelResponse {
  ok: boolean
  message: string
  private_channel_title?: string | null
  private_channel_username?: string | null
  private_channel_id?: string | null
  bot_username?: string | null
  details?: Record<string, unknown> | null
}

export interface TelegramSendResponse {
  ok: boolean
  status: 'pending' | 'sent' | 'failed'
  log_id: number
  telegram_chat_id?: string | null
  telegram_message_id?: string | null
  error_message?: string | null
  response_payload_json?: Record<string, unknown> | null
  send_mode?: 'bot_api' | 'pyrofork' | null
  used_cached_media: boolean
}

export interface TelegramPostLog {
  id: number
  movie_id: number
  movie_title?: string | null
  status: 'pending' | 'sent' | 'failed'
  telegram_chat_id?: string | null
  telegram_message_id?: string | null
  request_payload_json?: Record<string, unknown> | null
  response_payload_json?: Record<string, unknown> | null
  error_message?: string | null
  retry_count: number
  send_mode: 'bot_api' | 'pyrofork'
  used_cached_media: boolean
  sent_at?: string | null
  created_at: string
  updated_at?: string | null
}

export interface TelegramPostLogListResponse extends PaginatedResponse<TelegramPostLog> {}

export interface TelegramMediaCache {
  id: number
  movie_id?: number | null
  media_role: string
  storage_source: string
  local_file_path?: string | null
  telegram_chat_id?: string | null
  telegram_message_id?: string | null
  telegram_file_id?: string | null
  telegram_file_unique_id?: string | null
  telegram_media_type?: string | null
  original_filename?: string | null
  mime_type?: string | null
  file_size?: number | null
  public_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface TelegramMediaCacheListResponse extends PaginatedResponse<TelegramMediaCache> {
  stats: Record<string, number>
}

export interface StreamLink {
  id?: number
  movie_id?: number
  server_name: string
  url: string
  quality?: string | null
  language?: string | null
  is_active: boolean
  is_primary: boolean
  sort_order: number
  created_at?: string
  updated_at?: string | null
}

export interface DownloadLink {
  id?: number
  movie_id?: number
  provider: string
  url: string
  quality?: string | null
  size?: string | null
  language?: string | null
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string | null
}

export interface MovieGallery {
  id: number
  movie_id: number
  image_url: string
  image_type: string
  sort_order: number
}

export interface Movie extends SeoMetadata {
  id: number
  title: string
  slug: string
  original_title?: string | null
  description?: string | null
  short_description?: string | null
  release_year?: number | null
  release_date?: string | null
  duration_minutes?: number | null
  language?: string | null
  country?: string | null
  imdb_rating?: number | null
  quality?: string | null
  media_url?: string | null
  trailer_url?: string | null
  poster_url?: string | null
  backdrop_url?: string | null
  thumbnail_url?: string | null
  age_rating?: string | null
  content_warning?: string | null
  visibility: string
  featured: boolean
  stream_enabled: boolean
  download_enabled: boolean
  status: string
  is_published: boolean
  open_graph_image?: string | null
  created_at: string
  updated_at?: string | null
  published_at?: string | null
  telegram_last_post_status?: string | null
  telegram_last_error_message?: string | null
  telegram_last_sent_at?: string | null
  telegram_last_log_id?: number | null
  media_storage_summary?: Record<string, MediaStorageSummaryItem>
  categories: Category[]
  tags: Tag[]
  subtitles: Subtitle[]
  stream_links: StreamLink[]
  download_links: DownloadLink[]
  gallery: MovieGallery[]
}

export interface MoviePayload extends SeoMetadata {
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
  quality?: string
  media_url?: string
  trailer_url?: string
  poster_url?: string
  backdrop_url?: string
  thumbnail_url?: string
  age_rating?: string
  content_warning?: string
  visibility?: string
  featured?: boolean
  stream_enabled?: boolean
  download_enabled?: boolean
  is_published?: boolean
  open_graph_image?: string
  category_ids: number[]
  tag_ids: number[]
  subtitles: Omit<Subtitle, 'movie_id' | 'created_at' | 'updated_at'>[]
  stream_links: Omit<StreamLink, 'movie_id' | 'created_at' | 'updated_at'>[]
  download_links: Omit<DownloadLink, 'movie_id' | 'created_at' | 'updated_at'>[]
}

export interface AuditLog {
  id: number
  actor_id?: number | null
  actor_name?: string | null
  actor_email?: string | null
  action: string
  entity_type: string
  entity_id?: number | null
  description?: string | null
  metadata_json?: Record<string, unknown> | null
  created_at: string
}

export interface DashboardStats {
  total_movies: number
  total_published_movies: number
  total_featured_movies: number
  total_media_ready_movies: number
  total_trailer_movies: number
  total_categories: number
  total_tags: number
  total_subtitles: number
  recent_movies: Array<Pick<Movie, 'id' | 'title' | 'slug' | 'poster_url' | 'status' | 'is_published' | 'created_at'>>
  recent_activity: AuditLog[]
}

export interface UploadItem {
  filename: string
  file_url: string
  size: number
  updated_at?: number
}

export interface UploadReference {
  entity: string
  entity_id: number
  field: string
  label: string
}

export interface UploadFileReport {
  folder: string
  relative_path: string
  file_url: string
  size: number
  references: UploadReference[]
}

export interface UploadOrphanReport {
  total_files: number
  orphaned_files: UploadFileReport[]
  files: UploadFileReport[]
}

export interface UploadResponse {
  filename: string
  file_url: string
  size: number
  content_type: string
  local_file_path?: string
  relative_path?: string
  media_cache_id?: number
  public_url?: string | null
  storage_source?: string
  telegram_message_id?: string | null
  telegram_file_id?: string | null
  storage_error?: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface MovieListResponse extends PaginatedResponse<Movie> {}
export interface CategoryListResponse extends PaginatedResponse<Category> {}
export interface TagListResponse extends PaginatedResponse<Tag> {}

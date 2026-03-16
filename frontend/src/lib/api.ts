const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface RequestOptions {
  params?: Record<string, any>
  headers?: HeadersInit
  body?: any
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseUrl)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }
    return url.toString()
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T }> {
    const url = this.buildUrl(endpoint, options.params)
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json() as T
    return { data }
  }

  async post<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T }> {
    const response = await fetch(new URL(endpoint, this.baseUrl).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    return { data }
  }

  async put<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T }> {
    const response = await fetch(new URL(endpoint, this.baseUrl).toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    return { data }
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T }> {
    const response = await fetch(new URL(endpoint, this.baseUrl).toString(), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    return { data }
  }
}

const api = new ApiClient(API_URL)
export default api

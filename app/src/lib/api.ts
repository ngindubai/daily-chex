const BASE = '/api'

interface ApiOptions extends RequestInit {
  token?: string
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = opts
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { headers, ...rest })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, (body as { error?: string }).error || res.statusText)
  }
  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

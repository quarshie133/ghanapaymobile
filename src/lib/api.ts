export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Enhanced fetch wrapper that automatically includes credentials (cookies)
 * and handles common errors.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ghana_pay_access');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensures HttpOnly cookies are sent
  });

  if (response.status === 401) {
    // Unauthorized: Clear frontend state or redirect if necessary
    // E.g. window.location.href = '/login'; (Better handled in context)
  }

  // Determine if response is JSON
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.message || data.error || 'API Request Failed',
      data
    );
  }

  if (data && typeof data === 'object' && data.success === true && 'data' in data) {
    const unwrapped = data.data;
    if (unwrapped && (typeof unwrapped === 'object' || Array.isArray(unwrapped))) {
      try {
        Object.defineProperty(unwrapped, 'data', {
          get() { return unwrapped; },
          configurable: true,
          enumerable: false,
        });
      } catch (e) {
        // Ignore errors if object is not extensible
      }
    }
    return unwrapped;
  }

  return data;
}

export const api = {
  get: (endpoint: string, options?: RequestInit) => apiFetch(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, body: any, options?: RequestInit) => apiFetch(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any, options?: RequestInit) => apiFetch(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string, options?: RequestInit) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};

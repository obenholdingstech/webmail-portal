/**
 * Webmail Authentication Module
 * ---------------------------------
 * Configured via environment variables (set in .env or your deployment platform):
 *
 *   VITE_AUTH_API_URL   — Base URL of your Cloudflare Workers auth endpoint
 *                         e.g. https://auth.yourdomain.workers.dev
 *   VITE_AUTH_API_KEY   — Optional API key header value (X-API-Key)
 *
 * Expected endpoint:
 *   POST /login
 *   Body: { email: string, password: string }
 *   Response 200: { token: string, user: { email: string, name?: string } }
 *   Response 401: { error: string }
 */

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL as string | undefined;
const AUTH_API_KEY = import.meta.env.VITE_AUTH_API_KEY as string | undefined;

export type AuthUser = {
  email: string;
  name?: string;
  token: string;
};

export type AuthError = {
  message: string;
  status?: number;
};

export type LoginResult =
  | { success: true; user: AuthUser }
  | { success: false; error: AuthError };

export async function login(email: string, password: string): Promise<LoginResult> {
  if (!AUTH_API_URL) {
    // Dev mode: simulate login when no API is configured
    await new Promise(resolve => setTimeout(resolve, 1200));
    if (email && password.length >= 4) {
      return { success: true, user: { email, token: 'dev-token' } };
    }
    return { success: false, error: { message: 'Invalid credentials', status: 401 } };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (AUTH_API_KEY) {
      headers['X-API-Key'] = AUTH_API_KEY;
    }

    const response = await fetch(`${AUTH_API_URL}/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: (data.error as string) || 'Authentication failed',
          status: response.status,
        },
      };
    }

    return {
      success: true,
      user: {
        email: (data.user as { email: string })?.email ?? email,
        name: (data.user as { name?: string })?.name,
        token: data.token as string,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: { message: 'Network error. Please check your connection.' },
    };
  }
}

export function saveSession(user: AuthUser) {
  try {
    sessionStorage.setItem('webmail_user', JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function getSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem('webmail_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem('webmail_user');
  } catch {
    // ignore
  }
}

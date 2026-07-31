/**
 * Admin / Gate auth — all localStorage-backed, no server needed.
 *
 * Two separate auth concerns:
 *  1. Admin panel access  → hardcoded password "ward5" (never stored)
 *  2. Activity log gate   → password set by admin, stored in localStorage
 *
 * Session (tab-level) auth is tracked in sessionStorage so it resets on
 * each new tab/window open, but persists through page refreshes.
 */

const GATE_PW_KEY     = 'webmail_gate_password';
const GATE_SESSION_KEY = 'webmail_gate_session';
const ADMIN_SESSION_KEY = 'webmail_admin_session';

// ── Hardcoded admin password ──────────────────────────────────────────────────
const ADMIN_HARDCODED = 'ward5';

export function checkAdminPassword(pw: string): boolean {
  return pw === ADMIN_HARDCODED;
}

// ── Admin session (tab-level) ─────────────────────────────────────────────────
export function setAdminSession() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
}

export function isAdminSessionActive(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

// ── Gate password (persisted, set by admin) ───────────────────────────────────
export function getGatePassword(): string | null {
  return localStorage.getItem(GATE_PW_KEY) || null;
}

export function setGatePassword(pw: string) {
  if (pw.trim()) {
    localStorage.setItem(GATE_PW_KEY, pw.trim());
  }
}

export function removeGatePassword() {
  localStorage.removeItem(GATE_PW_KEY);
}

export function isGateEnabled(): boolean {
  return !!getGatePassword();
}

// ── Gate session (tab-level) ──────────────────────────────────────────────────
export function setGateSession() {
  sessionStorage.setItem(GATE_SESSION_KEY, '1');
}

export function isGateSessionActive(): boolean {
  return sessionStorage.getItem(GATE_SESSION_KEY) === '1';
}

export function clearGateSession() {
  sessionStorage.removeItem(GATE_SESSION_KEY);
}

// ── Turnstile site key (persisted, set by admin) ──────────────────────────────
const TURNSTILE_KEY = 'webmail_turnstile_sitekey';

export function getTurnstileSitekey(): string | null {
  return localStorage.getItem(TURNSTILE_KEY) || null;
}

export function setTurnstileSitekey(key: string) {
  if (key.trim()) {
    localStorage.setItem(TURNSTILE_KEY, key.trim());
  }
}

export function removeTurnstileSitekey() {
  localStorage.removeItem(TURNSTILE_KEY);
}

// ── Turnstile verification session ────────────────────────────────────────────
const TURNSTILE_SESSION_KEY = 'webmail_turnstile_verified';

export function setTurnstileVerified() {
  sessionStorage.setItem(TURNSTILE_SESSION_KEY, '1');
}

export function isTurnstileVerified(): boolean {
  return sessionStorage.getItem(TURNSTILE_SESSION_KEY) === '1';
}

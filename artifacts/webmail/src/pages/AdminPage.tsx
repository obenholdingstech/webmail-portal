/**
 * Admin Page — access via /admin
 *
 * Gate: hardcoded password "ward5"
 * Function: set / clear the Activity Log gate password
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  checkAdminPassword, setAdminSession, isAdminSessionActive, clearAdminSession,
  getGatePassword, setGatePassword, removeGatePassword, isGateEnabled,
  getTurnstileSitekey, setTurnstileSitekey, removeTurnstileSitekey,
} from '@/lib/adminAuth';

// ── Icons ─────────────────────────────────────────────────────────────────────
function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f26522" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function LockIcon({ open = false }: { open?: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function LogOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function ShieldCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f26522" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── Login gate ────────────────────────────────────────────────────────────────
function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAdminPassword(pw)) {
      setAdminSession();
      onSuccess();
    } else {
      setError('Incorrect admin password.');
      setPw('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="pg-overlay">
      <div className={`pg-card${shake ? ' pg-shake' : ''}`}>
        <div className="pg-icon">
          <ShieldIcon />
        </div>
        <h2 className="pg-title">Admin Panel</h2>
        <p className="pg-subtitle">Enter the admin password to continue</p>
        <form onSubmit={handleSubmit} className="pg-form">
          <input
            type="password"
            className="pg-input"
            placeholder="Admin password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(''); }}
            autoFocus
            autoComplete="current-password"
          />
          {error && <p className="pg-error">{error}</p>}
          <button type="submit" className="pg-btn">Sign In</button>
        </form>
      </div>
    </div>
  );
}

// ── Main admin panel ──────────────────────────────────────────────────────────
function AdminPanel() {
  const [, navigate] = useLocation();
  const [gateEnabled, setGateEnabled] = useState(isGateEnabled());
  const [currentPw, setCurrentPw] = useState(getGatePassword() ?? '');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(true);

  // Turnstile state
  const [tsKey, setTsKey] = useState(getTurnstileSitekey() ?? '');
  const [tsSaved, setTsSaved] = useState(false);
  const [tsError, setTsError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPw.trim()) {
      setError('Password cannot be empty.');
      return;
    }
    if (newPw !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    setGatePassword(newPw.trim());
    setCurrentPw(newPw.trim());
    setNewPw('');
    setConfirmPw('');
    setGateEnabled(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDisable = () => {
    if (!window.confirm('Disable the Activity Log gate? Anyone can access it without a password.')) return;
    removeGatePassword();
    setGateEnabled(false);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate('/');
  };

  return (
    <div className="al-page">
      {/* Header */}
      <div className="al-header">
        <div className="al-header-left">
          <ShieldIcon />
          <div>
            <h1 className="al-title">Admin Panel</h1>
            <p className="al-subtitle">Manage Activity Log access</p>
          </div>
        </div>
        <div className="al-header-right">
          <button className="al-btn-outline" onClick={() => navigate('/activity')}>
            <ArrowLeftIcon /> Activity Log
          </button>
          <button className="al-btn-outline" onClick={handleLogout} title="Sign out">
            <LogOutIcon /> Sign Out
          </button>
        </div>
      </div>

      {/* Gate status card */}
      <div className="adm-section">
        <div className="adm-card">
          <div className="adm-card-header">
            <div className="adm-card-title">
              <LockIcon open={!gateEnabled} />
              Activity Log Gate
            </div>
            <span className={`al-badge ${gateEnabled ? 'adm-status-on' : 'adm-status-off'}`}>
              {gateEnabled ? 'Protected' : 'Open'}
            </span>
          </div>
          <p className="adm-card-desc">
            {gateEnabled
              ? 'The Activity Log requires a password to view. Only users who know the gate password can access it.'
              : 'The Activity Log is currently open — anyone with the URL can view login attempts. Set a password below to protect it.'}
          </p>
          {gateEnabled && (
            <div className="adm-current-pw">
              <span className="adm-current-pw-label">Current gate password:</span>
              <span className="adm-current-pw-value">{currentPw}</span>
            </div>
          )}
        </div>
      </div>

      {/* Set password form */}
      <div className="adm-section">
        <div className="adm-card">
          <div className="adm-card-header">
            <div className="adm-card-title">
              <LockIcon />
              {gateEnabled ? 'Change Gate Password' : 'Set Gate Password'}
            </div>
          </div>
          <form onSubmit={handleSave} className="adm-form">
            <div className="adm-field">
              <div className="adm-label-row">
                <label className="adm-label">New Password</label>
                <button type="button" className="adm-eye-btn" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                className="adm-input"
                placeholder="Enter new gate password"
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setError(''); setSaved(false); }}
                autoComplete="new-password"
              />
            </div>
            <div className="adm-field">
              <label className="adm-label">Confirm Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                className="adm-input"
                placeholder="Confirm new gate password"
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setError(''); setSaved(false); }}
                autoComplete="new-password"
              />
            </div>
            {error && <p className="adm-error">{error}</p>}
            {saved && <p className="adm-success">✓ Gate password saved successfully.</p>}
            <div className="adm-actions">
              <button type="submit" className="al-btn-dark">
                {gateEnabled ? 'Update Password' : 'Enable Gate'}
              </button>
              {gateEnabled && (
                <button type="button" className="adm-btn-danger" onClick={handleDisable}>
                  Disable Gate
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ── Turnstile Configuration ────────────────────────────────────── */}
      <div className="adm-section">
        <div className="adm-card">
          <div className="adm-card-header">
            <div className="adm-card-title">
              <ShieldCheckIcon />
              Turnstile Verification
            </div>
            <span className={`al-badge ${tsKey ? 'adm-status-on' : 'adm-status-off'}`}>
              {tsKey ? 'Configured' : 'Not Set'}
            </span>
          </div>
          <p className="adm-card-desc">
            Set your Cloudflare Turnstile site key. Visitors will need to pass the
            Turnstile challenge before reaching the login page. Leave empty to use
            the built-in fallback key.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setTsError('');
              if (tsKey.trim()) {
                setTurnstileSitekey(tsKey.trim());
              } else {
                removeTurnstileSitekey();
              }
              setTsSaved(true);
              setTimeout(() => setTsSaved(false), 2500);
            }}
            className="adm-form"
          >
            <div className="adm-field">
              <label className="adm-label">Turnstile Site Key</label>
              <input
                type="text"
                className="adm-input"
                placeholder="0x4AAAAAAB... (leave empty for default)"
                value={tsKey}
                onChange={(e) => { setTsKey(e.target.value); setTsError(''); setTsSaved(false); }}
              />
            </div>
            {tsError && <p className="adm-error">{tsError}</p>}
            {tsSaved && <p className="adm-success">✓ Turnstile site key saved.</p>}
            <div className="adm-actions">
              <button type="submit" className="al-btn-dark">
                Save Site Key
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Exported component ────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(isAdminSessionActive());

  useEffect(() => {
    // Keep state in sync if session was already active (e.g. page refresh)
    setAuthed(isAdminSessionActive());
  }, []);

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return <AdminPanel />;
}

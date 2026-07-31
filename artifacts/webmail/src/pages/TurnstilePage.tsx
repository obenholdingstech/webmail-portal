/**
 * TurnstilePage — security verification gate at the root of the app.
 *
 * Renders a Cloudflare Turnstile widget with the site key configured by the
 * admin (fallback to a built-in key if none is set). On success, marks the
 * session as verified and redirects to /login.
 */

import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  getTurnstileSitekey,
  isTurnstileVerified,
  setTurnstileVerified,
} from '@/lib/adminAuth';

// Built-in fallback key if admin hasn't configured one
const FALLBACK_SITEKEY = '0x4AAAAAACZQH20w4CUOso2v';

export default function TurnstilePage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState('Security check required for session synchronization.');
  const [verified, setVerified] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  // If already verified this session, skip straight to /login
  useEffect(() => {
    if (isTurnstileVerified()) {
      navigate('/login');
    }
  }, [navigate]);

  // Render the Turnstile widget once the script has loaded
  useEffect(() => {
    if (renderedRef.current) return;
    renderedRef.current = true;

    const sitekey = getTurnstileSitekey() || FALLBACK_SITEKEY;
    const container = widgetRef.current;
    if (!container) return;

    // Wait for the Turnstile API to be ready
    const checkTurnstile = () => {
      if ((window as any).turnstile) {
        (window as any).turnstile.render(container, {
          sitekey,
          theme: 'dark',
          callback: (token: string) => {
            setStatus('Verification successful. Redirecting...');
            setVerified(true);
            setTurnstileVerified();
            setTimeout(() => navigate('/login'), 1200);
          },
        });
      } else {
        // Retry in 200ms until the API script loads
        setTimeout(checkTurnstile, 200);
      }
    };

    checkTurnstile();
  }, [navigate]);

  return (
    <div className="ts-page">
      <div className="ts-main">
        <div className="ts-container">
          <div className="ts-header">
            <div className="ts-logo-box">
              <svg width="32" height="32" viewBox="0 0 512 512">
                <path
                  fill="#ff6c2c"
                  d="M428.4 251.4l-75.1-75.1c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l52.5 52.5H64c-17.7 0-32 14.3-32 32s14.3 32 32 32h296.5l-52.5 52.5c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l75.1-75.1c31.2-31.2 31.2-82 0-113.2z"
                />
              </svg>
            </div>
            <span className="ts-brand">Webmail Login</span>
          </div>

          <div className="ts-status">{status}</div>

          <div className="ts-widget" ref={widgetRef} />

          {!verified && (
            <div className="ts-note">
              Your session requires security verification before proceeding.
            </div>
          )}
        </div>
      </div>

      <div className="ts-footer">
        <hr className="ts-hr" />
        <div className="ts-footer-text">
          Performance &amp; security by Cloudflare
        </div>
      </div>
    </div>
  );
}

/**
 * PasswordGate — wraps any content behind a lock screen.
 * Used for the Activity Log page.
 */

import { useState } from 'react';

type Props = {
  onUnlock: (pw: string) => boolean; // return true if password correct
  title?: string;
  subtitle?: string;
};

export default function PasswordGate({ onUnlock, title = 'Protected Page', subtitle = 'Enter password to continue' }: Props) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onUnlock(pw);
    if (!ok) {
      setError('Incorrect password. Try again.');
      setPw('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="pg-overlay">
      <div className={`pg-card${shake ? ' pg-shake' : ''}`}>
        {/* Lock icon */}
        <div className="pg-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f26522" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="pg-title">{title}</h2>
        <p className="pg-subtitle">{subtitle}</p>
        <form onSubmit={handleSubmit} className="pg-form">
          <input
            type="password"
            className="pg-input"
            placeholder="Password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(''); }}
            autoFocus
            autoComplete="current-password"
          />
          {error && <p className="pg-error">{error}</p>}
          <button type="submit" className="pg-btn">Unlock</button>
        </form>
      </div>
    </div>
  );
}

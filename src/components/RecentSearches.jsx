import { useState } from 'react';

/**
 * RecentSearches Component
 * Displays persistent recent searches with quick re-search and safe clear action.
 *
 * @param {object} props
 * @param {Array} props.history - List of recent search entries
 * @param {function} props.onSelect - Callback when clicking a recent user
 * @param {function} props.onClear - Callback to clear search history
 * @param {boolean} [props.isLoading] - Whether a search is pending
 */
export default function RecentSearches({
  history = [],
  onSelect,
  onClear,
  isLoading = false,
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!history || history.length === 0) {
    return null;
  }

  const handleClearClick = () => {
    if (showConfirm) {
      onClear();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      // Auto-reset confirmation state after 4 seconds
      setTimeout(() => setShowConfirm(false), 4000);
    }
  };

  return (
    <section className="recent-searches" aria-label="Recent search history">
      <div className="recent-searches__header">
        <div className="recent-searches__title-wrap">
          <svg className="recent-searches__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <h2 className="recent-searches__title">Recent Searches</h2>
          <span className="recent-searches__count">{history.length}</span>
        </div>

        <button
          type="button"
          className={`recent-searches__clear-btn ${showConfirm ? 'recent-searches__clear-btn--confirm' : ''}`}
          onClick={handleClearClick}
          aria-label={showConfirm ? 'Confirm clear all search history' : 'Clear search history'}
          title={showConfirm ? 'Click again to confirm clearing history' : 'Clear history'}
        >
          {showConfirm ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Confirm Clear</span>
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Clear History</span>
            </>
          )}
        </button>
      </div>

      <div className="recent-searches__list" role="list">
        {history.map((item) => (
          <button
            key={item.username.toLowerCase()}
            type="button"
            className="recent-searches__chip"
            onClick={() => onSelect(item.username)}
            disabled={isLoading}
            aria-label={`Search again for ${item.username}`}
          >
            {item.avatar_url ? (
              <img
                src={item.avatar_url}
                alt=""
                className="recent-searches__chip-avatar"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span className="recent-searches__chip-icon" aria-hidden="true">@</span>
            )}
            <span className="recent-searches__chip-username">{item.username}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

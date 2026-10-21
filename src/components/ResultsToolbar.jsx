import { useState, useRef } from 'react';
import { cleanUsername, isValidUsername } from '../services/githubApi';

/**
 * ResultsToolbar Component
 * Persistent action toolbar rendered at the top of results to enable searching
 * for another GitHub user immediately without scrolling back to the top.
 *
 * @param {object} props
 * @param {string} props.currentUsername - Currently viewed profile username
 * @param {function} props.onSearch - Callback to execute a new search
 * @param {boolean} props.isLoading - Whether a search is currently pending
 * @param {function} [props.onScrollToHero] - Callback to scroll back to hero
 */
export default function ResultsToolbar({
  currentUsername,
  onSearch,
  isLoading,
  onScrollToHero,
}) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = cleanUsername(query);
    if (!cleaned) {
      setError('Enter a username');
      inputRef.current?.focus();
      return;
    }
    if (!isValidUsername(cleaned)) {
      setError('Invalid format');
      inputRef.current?.focus();
      return;
    }
    setError('');
    onSearch(cleaned);
    setQuery('');
  };

  return (
    <div className="results-toolbar" role="region" aria-label="Search navigation and active profile controls">
      <div className="results-toolbar__left">
        <span className="results-toolbar__badge" aria-label={`Current profile: ${currentUsername}`}>
          <span className="results-toolbar__pulse" aria-hidden="true" />
          <svg className="results-toolbar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="results-toolbar__user">@{currentUsername}</span>
        </span>
      </div>

      <div className="results-toolbar__right">
        {/* Compact Quick Search Form */}
        <form className="results-toolbar__form" onSubmit={handleSubmit} role="search" aria-label="Search another developer">
          <div className="results-toolbar__input-wrap">
            <svg className="results-toolbar__input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className={`results-toolbar__input ${error ? 'results-toolbar__input--error' : ''}`}
              placeholder="Search another user..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (error) setError('');
              }}
              aria-label="Search another username"
              autoComplete="off"
              spellCheck="false"
            />
            {error && <span className="results-toolbar__inline-error">{error}</span>}
          </div>

          <button
            type="submit"
            className="results-toolbar__btn results-toolbar__btn--primary"
            disabled={isLoading}
            aria-label={isLoading ? 'Searching...' : 'Search username'}
          >
            {isLoading ? (
              <span className="results-toolbar__spinner" aria-hidden="true" />
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Search</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Hero Search button */}
        {onScrollToHero && (
          <button
            type="button"
            className="results-toolbar__btn results-toolbar__btn--secondary"
            onClick={onScrollToHero}
            aria-label="Scroll back to hero search"
            title="Return to top"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            <span>Top</span>
          </button>
        )}
      </div>
    </div>
  );
}

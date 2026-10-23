/**
 * Navbar Component
 * Compact, visually refined header with brand, navigation, and saved count badge.
 *
 * @param {object} props
 * @param {function} [props.onGoHome] - Callback to return to search/home view
 * @param {function} [props.onOpenSaved] - Callback to toggle saved repositories view
 * @param {number} [props.savedCount] - Total saved repositories count
 * @param {string} [props.currentView] - Current active view ('search' | 'results' | 'saved')
 */
export default function Navbar({
  onGoHome,
  onOpenSaved,
  savedCount = 0,
  currentView = 'search',
}) {
  const handleBrandClick = (e) => {
    if (onGoHome) {
      e.preventDefault();
      onGoHome();
    }
  };

  return (
    <header className="navbar" role="banner">
      <div className="container navbar__inner">
        <a
          href="/"
          onClick={handleBrandClick}
          className="navbar__brand"
          aria-label="GitHub Profile Finder — Return to home search"
        >
          <span className="navbar__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <line x1="12" y1="22" x2="12" y2="15.5" />
              <polyline points="22 8.5 12 15.5 2 8.5" />
            </svg>
          </span>
          <span>
            <span className="navbar__title">GitHub Profile Finder</span>
            <span className="navbar__subtitle">Discover developers & repositories</span>
          </span>
        </a>

        <div className="navbar__actions">
          {/* Saved Favorites Navigation Button */}
          {onOpenSaved && (
            <button
              type="button"
              className={`navbar__nav-btn ${currentView === 'saved' ? 'navbar__nav-btn--active' : ''}`}
              onClick={onOpenSaved}
              aria-label={`View saved repositories (${savedCount})`}
              title="View locally saved repositories"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={savedCount > 0 ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Saved</span>
              {savedCount > 0 && <span className="navbar__badge">{savedCount}</span>}
            </button>
          )}

          <a
            href="https://docs.github.com/en/rest"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar__link"
            aria-label="GitHub REST API Documentation (opens in new tab)"
          >
            <span>API Docs</span>
            <span aria-hidden="true"> ↗</span>
          </a>
        </div>
      </div>
    </header>
  );
}

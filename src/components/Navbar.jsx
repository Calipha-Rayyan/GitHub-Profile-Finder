/**
 * Navbar Component
 * Compact, visually refined header with brand and API docs link.
 */
export default function Navbar() {
  return (
    <header className="navbar" role="banner">
      <div className="container navbar__inner">
        <a href="/" className="navbar__brand" aria-label="GitHub Profile Finder — Home">
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
        <a
          href="https://docs.github.com/en/rest"
          target="_blank"
          rel="noopener noreferrer"
          className="navbar__link"
          aria-label="GitHub REST API Documentation (opens in new tab)"
        >
          API Docs
          <span aria-hidden="true"> ↗</span>
        </a>
      </div>
    </header>
  );
}

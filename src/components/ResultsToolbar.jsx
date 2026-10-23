/**
 * ResultsToolbar Component
 * Header navigation bar rendered in the results view.
 * Features:
 * - Prominent "← Back to Search" navigation button
 * - Active profile indicator
 * - Saved repositories quick toggle
 *
 * @param {object} props
 * @param {string} props.currentUsername - Currently viewed profile username
 * @param {function} props.onBackToSearch - Callback to return to search view
 * @param {number} [props.savedCount] - Total saved repositories count
 * @param {function} [props.onOpenSaved] - Callback to open saved view
 */
export default function ResultsToolbar({
  currentUsername,
  onBackToSearch,
  savedCount = 0,
  onOpenSaved,
}) {
  return (
    <div className="results-toolbar" role="region" aria-label="Results navigation">
      <div className="results-toolbar__left">
        {/* Prominent Back to Search Button */}
        {onBackToSearch && (
          <button
            type="button"
            className="back-btn back-btn--toolbar"
            onClick={onBackToSearch}
            aria-label="Return to search view"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Search</span>
          </button>
        )}

        {/* Active Profile Pill */}
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
        {/* Saved Repositories button */}
        {onOpenSaved && (
          <button
            type="button"
            className="results-toolbar__btn results-toolbar__btn--secondary"
            onClick={onOpenSaved}
            aria-label={`View saved repositories (${savedCount})`}
            title="View saved repositories"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={savedCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Saved</span>
            {savedCount > 0 && <span className="results-toolbar__count-badge">{savedCount}</span>}
          </button>
        )}
      </div>
    </div>
  );
}

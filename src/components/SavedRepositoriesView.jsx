import RepositoryCard from './RepositoryCard';

/**
 * SavedRepositoriesView Component
 * Dedicated screen presenting locally favorited repositories.
 *
 * @param {object} props
 * @param {Array} props.savedRepos - List of locally saved repositories
 * @param {function} props.onToggleFavorite - Callback to add/remove a repository
 * @param {function} props.onBackToSearch - Callback to return to search view
 * @param {string|null} [props.activeUsername] - Previously viewed profile, if any
 * @param {function} [props.onReturnToResults] - Callback to return to active profile results
 */
export default function SavedRepositoriesView({
  savedRepos = [],
  onToggleFavorite,
  onBackToSearch,
  activeUsername = null,
  onReturnToResults,
}) {
  return (
    <div className="saved-view container" role="region" aria-label="Saved Repositories">
      {/* Top Navigation Bar */}
      <div className="saved-view__nav">
        <button
          type="button"
          className="back-btn"
          onClick={onBackToSearch}
          aria-label="Return to search view"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Search</span>
        </button>

        {activeUsername && onReturnToResults && (
          <button
            type="button"
            className="saved-view__return-btn"
            onClick={onReturnToResults}
            aria-label={`Return to results for @${activeUsername}`}
          >
            <span>Return to @{activeUsername}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        )}
      </div>

      {/* Header */}
      <header className="saved-view__header">
        <div className="saved-view__title-wrap">
          <div className="saved-view__icon-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <h1 className="saved-view__title">Saved Repositories</h1>
            <p className="saved-view__subtitle">
              Your bookmarked repositories stored locally for fast reference.
            </p>
          </div>
        </div>

        <span className="saved-view__counter">
          {savedRepos.length} {savedRepos.length === 1 ? 'repository' : 'repositories'}
        </span>
      </header>

      {/* Grid or Empty State */}
      {savedRepos.length === 0 ? (
        <div className="saved-view__empty" role="status">
          <div className="saved-view__empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 className="saved-view__empty-title">No saved repositories yet</h2>
          <p className="saved-view__empty-desc">
            When browsing developer repositories, click the star icon on any card to bookmark it here locally.
          </p>
          <button
            type="button"
            className="saved-view__empty-action"
            onClick={onBackToSearch}
          >
            Explore Developers
          </button>
        </div>
      ) : (
        <div className="repos__grid" role="list">
          {savedRepos.map((repo, index) => (
            <div role="listitem" key={repo.id}>
              <RepositoryCard
                repo={repo}
                index={index}
                isSaved={true}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

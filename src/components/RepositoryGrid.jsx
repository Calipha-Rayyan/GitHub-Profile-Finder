import RepositoryCard from './RepositoryCard';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

/**
 * RepositoryGrid Component
 * Displays repository cards in a responsive grid with load-more pagination and local favorites.
 *
 * @param {object} props
 * @param {Array} props.repos - Array of repository objects
 * @param {number} props.totalPublicRepos - Total public repos from profile
 * @param {boolean} props.hasMore - Whether more repos can be loaded
 * @param {boolean} props.loadingMore - Whether more repos are being fetched
 * @param {function} props.onLoadMore - Callback to load next page
 * @param {object|null} props.repoError - Repository-specific error
 * @param {function} props.onRetry - Callback to retry repo fetch
 * @param {Array|Set} [props.savedRepoIds] - Set or Array of saved repo IDs
 * @param {function} [props.onToggleFavorite] - Callback to toggle favorite state
 */
export default function RepositoryGrid({
  repos,
  totalPublicRepos,
  hasMore,
  loadingMore,
  onLoadMore,
  repoError,
  onRetry,
  savedRepoIds = new Set(),
  onToggleFavorite,
}) {
  const isSaved = (repoId) => {
    if (savedRepoIds instanceof Set) {
      return savedRepoIds.has(repoId);
    }
    if (Array.isArray(savedRepoIds)) {
      return savedRepoIds.includes(repoId);
    }
    return false;
  };

  return (
    <section className="repos" aria-label="Repositories">
      <div className="repos__header">
        <h2 className="repos__title">Repositories</h2>
        <span className="repos__count" aria-label={`Showing ${repos.length} of ${totalPublicRepos} repositories`}>
          {repos.length} of {totalPublicRepos} repos
        </span>
      </div>

      {repoError && repos.length === 0 ? (
        <ErrorState
          title="Could not load repositories"
          message={repoError.message}
          type={repoError.type}
          resetTime={repoError.resetTime}
          onRetry={onRetry}
        />
      ) : repos.length === 0 ? (
        <EmptyState
          title="No repositories"
          message="This user doesn't have any public repositories yet."
        />
      ) : (
        <>
          <div className="repos__grid" role="list">
            {repos.map((repo, index) => (
              <div role="listitem" key={repo.id}>
                <RepositoryCard
                  repo={repo}
                  index={index}
                  isSaved={isSaved(repo.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            ))}
          </div>

          {repoError && repos.length > 0 && (
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <ErrorState
                title="Error loading more repositories"
                message={repoError.message}
                type={repoError.type}
                resetTime={repoError.resetTime}
                onRetry={onRetry}
              />
            </div>
          )}

          {hasMore && !repoError && (
            <div className="load-more">
              <button
                className="load-more__btn"
                onClick={onLoadMore}
                disabled={loadingMore}
                aria-label={loadingMore ? 'Loading more repositories…' : 'Load more repositories'}
              >
                {loadingMore ? (
                  <>
                    <span className="search-form__btn-spinner" aria-hidden="true" style={{ borderColor: 'rgba(109,40,217,0.3)', borderTopColor: 'var(--color-primary)' }} />
                    Loading…
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

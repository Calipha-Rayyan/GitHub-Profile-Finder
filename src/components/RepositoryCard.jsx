import { useRef, useCallback } from 'react';
import { formatDate, LANGUAGE_COLORS } from '../services/githubApi';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * RepositoryCard Component
 * Displays individual repository information with interactive 3D perspective tilt,
 * staggered reveal animation, and a local favorite/save control.
 *
 * @param {object} props
 * @param {object} props.repo - Repository data
 * @param {number} props.index - Index for stagger animation
 * @param {boolean} props.isSaved - Whether repo is saved in local favorites
 * @param {function} props.onToggleFavorite - Callback when toggling favorite
 */
export default function RepositoryCard({
  repo,
  index = 0,
  isSaved = false,
  onToggleFavorite,
}) {
  const cardRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const langColor = repo.language ? LANGUAGE_COLORS[repo.language] || '#8B5CF6' : null;
  const updatedAt = formatDate(repo.updated_at);

  // 3D Tilt handler
  const handleMouseMove = useCallback((e) => {
    if (prefersReduced) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Constrain tilt to comfortable ~4 degrees
    const rotateX = ((y - centerY) / centerY) * -4.5;
    const rotateY = ((x - centerX) / centerX) * 4.5;

    card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    card.style.setProperty('--card-glow-x', `${x}px`);
    card.style.setProperty('--card-glow-y', `${y}px`);
  }, [prefersReduced]);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  }, []);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(repo);
    }
  };

  return (
    <article
      ref={cardRef}
      className={`repo-card ${isSaved ? 'repo-card--saved' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        animationDelay: prefersReduced ? '0ms' : `${Math.min(index * 60, 500)}ms`,
      }}
      aria-label={`Repository: ${repo.name}`}
    >
      {/* Specular lighting layer for 3D depth */}
      <div className="repo-card__glow" aria-hidden="true" />

      {/* Header: Name and Local Favorite Action */}
      <div className="repo-card__header">
        <h3 className="repo-card__name">
          <svg className="repo-card__name-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="repo-card__link"
            aria-label={`${repo.name} on GitHub (opens in new tab)`}
          >
            {repo.name}
          </a>
        </h3>

        {/* Local Favorite Star Control (distinct from GitHub stars) */}
        <button
          type="button"
          className={`repo-card__fav-btn ${isSaved ? 'repo-card__fav-btn--active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isSaved ? `Remove ${repo.name} from saved repositories` : `Save ${repo.name} to local favorites`}
          title={isSaved ? 'Remove from saved favorites' : 'Save to local favorites'}
        >
          <svg
            className="repo-card__fav-icon"
            viewBox="0 0 24 24"
            fill={isSaved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="sr-only">
            {isSaved ? 'Saved locally' : 'Save locally'}
          </span>
        </button>
      </div>

      {repo.description ? (
        <p className="repo-card__desc">{repo.description}</p>
      ) : (
        <p className="repo-card__desc repo-card__desc--empty">No description provided.</p>
      )}

      {/* Meta Footer */}
      <div className="repo-card__footer">
        {repo.language && (
          <span className="repo-card__meta">
            <span
              className="repo-card__lang-dot"
              style={{ backgroundColor: langColor }}
              aria-hidden="true"
            />
            {repo.language}
          </span>
        )}

        {/* GitHub Stargazers Count */}
        <span className="repo-card__meta" title={`${repo.stargazers_count ?? 0} stars on GitHub`}>
          <svg className="repo-card__meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>{repo.stargazers_count ?? 0}</span>
        </span>

        {repo.forks_count > 0 && (
          <span className="repo-card__meta" title={`${repo.forks_count} forks on GitHub`}>
            <svg className="repo-card__meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="18" r="3" />
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="6" r="3" />
              <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
              <path d="M12 12v3" />
            </svg>
            <span>{repo.forks_count}</span>
          </span>
        )}

        {updatedAt && (
          <span className="repo-card__meta" title={`Updated ${updatedAt}`}>
            <svg className="repo-card__meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{updatedAt}</span>
          </span>
        )}
      </div>
    </article>
  );
}

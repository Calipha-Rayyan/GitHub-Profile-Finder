import { formatDate, LANGUAGE_COLORS } from '../services/githubApi';

/**
 * RepositoryCard Component
 * Displays individual repository information.
 *
 * @param {object} props
 * @param {object} props.repo - Repository data from API
 * @param {number} props.index - Index for stagger animation
 */
export default function RepositoryCard({ repo, index }) {
  const langColor = repo.language ? LANGUAGE_COLORS[repo.language] || '#888' : null;
  const updatedAt = formatDate(repo.updated_at);

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="repo-card"
      style={{ animationDelay: `${Math.min(index * 80, 600)}ms` }}
      aria-label={`Repository: ${repo.name}${repo.description ? ` — ${repo.description}` : ''} (opens in new tab)`}
    >
      <h3 className="repo-card__name">
        <svg className="repo-card__name-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
        {repo.name}
      </h3>

      {repo.description && (
        <p className="repo-card__desc">{repo.description}</p>
      )}

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

        <span className="repo-card__meta">
          <svg className="repo-card__meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {repo.stargazers_count ?? 0}
        </span>

        {repo.forks_count > 0 && (
          <span className="repo-card__meta">
            <svg className="repo-card__meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="18" r="3" />
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="6" r="3" />
              <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
              <path d="M12 12v3" />
            </svg>
            {repo.forks_count}
          </span>
        )}

        {updatedAt && (
          <span className="repo-card__meta">
            <svg className="repo-card__meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {updatedAt}
          </span>
        )}
      </div>
    </a>
  );
}

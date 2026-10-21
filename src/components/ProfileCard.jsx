import { useState } from 'react';

/**
 * ProfileCard Component
 * Displays GitHub user profile information.
 *
 * @param {object} props
 * @param {object} props.user - GitHub user data from API
 */
export default function ProfileCard({ user }) {
  const [avatarError, setAvatarError] = useState(false);

  const displayName = user.name || user.login;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <article className="profile" aria-label={`Profile of ${displayName}`}>
      <div className="profile__avatar-wrap">
        {!avatarError ? (
          <img
            src={user.avatar_url}
            alt={`Avatar of ${displayName}`}
            className="profile__avatar"
            width="140"
            height="140"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div className="profile__avatar-fallback" role="img" aria-label={`Avatar placeholder for ${displayName}`}>
            {initial}
          </div>
        )}
      </div>

      <div className="profile__info">
        <div>
          <h2 className="profile__name">{displayName}</h2>
          <p className="profile__username">@{user.login}</p>
        </div>

        {user.bio && <p className="profile__bio">{user.bio}</p>}

        <div className="profile__meta">
          {user.location && (
            <span className="profile__meta-item">
              <svg className="profile__meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {user.location}
            </span>
          )}
          {user.company && (
            <span className="profile__meta-item">
              <svg className="profile__meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                <path d="M10 6h4" />
                <path d="M10 10h4" />
                <path d="M10 14h4" />
                <path d="M10 18h4" />
              </svg>
              {user.company}
            </span>
          )}
          {user.blog && (
            <span className="profile__meta-item">
              <svg className="profile__meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} target="_blank" rel="noopener noreferrer">
                {user.blog.replace(/^https?:\/\//, '')}
              </a>
            </span>
          )}
        </div>

        <a
          href={user.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="profile__link"
          aria-label={`View ${displayName}'s profile on GitHub (opens in new tab)`}
        >
          <svg className="profile__link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          View on GitHub
        </a>
      </div>
    </article>
  );
}

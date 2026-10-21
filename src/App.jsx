import { useState, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProfileCard from './components/ProfileCard';
import ProfileStats from './components/ProfileStats';
import RepositoryGrid from './components/RepositoryGrid';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import ResultsToolbar from './components/ResultsToolbar';
import { fetchUserProfile, fetchUserRepos } from './services/githubApi';

import './styles/global.css';
import './styles/components.css';
import './styles/responsive.css';

/**
 * App — Root component orchestrating search, profile, and repository display.
 */
export default function App() {
  // Profile state
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Repository state
  const [repos, setRepos] = useState([]);
  const [repoPage, setRepoPage] = useState(1);
  const [hasMoreRepos, setHasMoreRepos] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [repoError, setRepoError] = useState(null);

  // Track current search to prevent stale results
  const currentSearchRef = useRef('');
  const abortRef = useRef(null);
  const resultsRef = useRef(null);

  /**
   * Handle a new username search.
   */
  const handleSearch = useCallback(async (username) => {
    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    currentSearchRef.current = username;

    // Reset state
    setUser(null);
    setRepos([]);
    setRepoPage(1);
    setHasMoreRepos(false);
    setProfileError(null);
    setRepoError(null);
    setIsLoading(true);

    try {
      // Fetch profile
      const userData = await fetchUserProfile(username, controller.signal);

      // Check if this is still the current search
      if (currentSearchRef.current !== username) return;

      setUser(userData);
      setIsLoading(false);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      // Fetch repos (independent — profile stays visible on repo failure)
      try {
        const { repos: repoData, hasMore } = await fetchUserRepos(username, 1, controller.signal);
        if (currentSearchRef.current !== username) return;
        setRepos(repoData);
        setRepoPage(1);
        setHasMoreRepos(hasMore);
      } catch (repoErr) {
        if (repoErr.name === 'AbortError') return;
        if (currentSearchRef.current !== username) return;
        setRepoError(repoErr);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (currentSearchRef.current !== username) return;
      setIsLoading(false);
      setProfileError(error);
    }
  }, []);

  /**
   * Load more repositories (next page).
   */
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !user) return;

    setLoadingMore(true);
    setRepoError(null);
    const nextPage = repoPage + 1;

    try {
      const { repos: newRepos, hasMore } = await fetchUserRepos(user.login, nextPage);

      // Prevent duplicates
      setRepos((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const unique = newRepos.filter((r) => !existingIds.has(r.id));
        return [...prev, ...unique];
      });
      setRepoPage(nextPage);
      setHasMoreRepos(hasMore);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setRepoError(error);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, user, repoPage]);

  /**
   * Retry loading repositories after an error.
   */
  const handleRetryRepos = useCallback(() => {
    if (!user) return;
    setRepoError(null);

    if (repos.length === 0) {
      // Retry initial repo load
      (async () => {
        try {
          const { repos: repoData, hasMore } = await fetchUserRepos(user.login, 1);
          setRepos(repoData);
          setRepoPage(1);
          setHasMoreRepos(hasMore);
        } catch (err) {
          if (err.name !== 'AbortError') setRepoError(err);
        }
      })();
    } else {
      // Retry loading more
      handleLoadMore();
    }
  }, [user, repos.length, handleLoadMore]);

  return (
    <>
      <Navbar />
      <main>
        <Hero onSearch={handleSearch} isLoading={isLoading} />

        <div className="results container" ref={resultsRef}>
          {isLoading && <LoadingState />}

          {profileError && (
            <ErrorState
              title={
                profileError.type === 'not_found'
                  ? 'User Not Found'
                  : profileError.type === 'rate_limit'
                  ? 'Rate Limit Exceeded'
                  : profileError.type === 'forbidden'
                  ? 'Access Forbidden'
                  : profileError.type === 'network_error'
                  ? 'Connection Error'
                  : 'Something Went Wrong'
              }
              message={profileError.message}
              type={profileError.type}
              resetTime={profileError.resetTime}
              onRetry={() => handleSearch(currentSearchRef.current)}
            />
          )}

          {user && !isLoading && (
            <>
              <ResultsToolbar
                currentUsername={user.login}
                onSearch={handleSearch}
                isLoading={isLoading}
                onScrollToHero={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    document.querySelector('#hero-github-username')?.focus();
                  }, 300);
                }}
              />
              <ProfileCard user={user} />
              <ProfileStats user={user} />
              <RepositoryGrid
                repos={repos}
                totalPublicRepos={user.public_repos ?? 0}
                hasMore={hasMoreRepos}
                loadingMore={loadingMore}
                onLoadMore={handleLoadMore}
                repoError={repoError}
                onRetry={handleRetryRepos}
              />
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__brand">
            <span className="footer__icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                <line x1="12" y1="22" x2="12" y2="15.5" />
                <polyline points="22 8.5 12 15.5 2 8.5" />
              </svg>
            </span>
            <span className="footer__title">GitHub Profile Finder</span>
          </div>
          <p className="footer__tagline">
            Developer exploration powered by the Lavender Prism design system.
          </p>
        </div>
      </footer>
    </>
  );
}

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProfileCard from './components/ProfileCard';
import ProfileStats from './components/ProfileStats';
import RepositoryGrid from './components/RepositoryGrid';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import ResultsToolbar from './components/ResultsToolbar';
import SavedRepositoriesView from './components/SavedRepositoriesView';
import ErrorModal from './components/ErrorModal';
import { fetchUserProfile, fetchUserRepos } from './services/githubApi';
import {
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
  getSavedRepos,
  toggleSavedRepo,
} from './services/storage';

import './styles/global.css';
import './styles/components.css';
import './styles/responsive.css';

/**
 * App — Root component orchestrating search, profile, repository display,
 * persistent history, and local favorites.
 */
export default function App() {
  // Navigation View State: 'search' | 'results' | 'saved'
  const [currentView, setCurrentView] = useState('search');
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');

  // Profile & Search state
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Repository state
  const [repos, setRepos] = useState([]);
  const [repoPage, setRepoPage] = useState(1);
  const [hasMoreRepos, setHasMoreRepos] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [repoError, setRepoError] = useState(null);

  // Persistent storage state
  const [searchHistory, setSearchHistory] = useState(() => getSearchHistory());
  const [savedRepos, setSavedRepos] = useState(() => getSavedRepos());

  // Centered Error Modal State for wrong/invalid usernames
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    username: '',
  });

  // Track request cancellations
  const currentSearchRef = useRef('');
  const abortRef = useRef(null);

  // Fast lookup set of saved repository IDs
  const savedRepoIds = useMemo(() => {
    return new Set(savedRepos.map((r) => r.id));
  }, [savedRepos]);

  /**
   * Synchronize browser URL query params without reloading
   */
  const updateUrl = useCallback((view, username = '') => {
    try {
      const url = new URL(window.location.href);
      if (view === 'results' && username) {
        url.searchParams.set('user', username);
        url.searchParams.delete('tab');
      } else if (view === 'saved') {
        url.searchParams.set('tab', 'saved');
        url.searchParams.delete('user');
      } else {
        url.searchParams.delete('user');
        url.searchParams.delete('tab');
      }
      window.history.pushState({ view, username }, '', url.toString());
    } catch {
      // Fallback for non-standard environments
    }
  }, []);

  /**
   * Handle invalid or empty username submissions from the search form
   */
  const handleInvalidSearch = useCallback((validationError, rawQuery) => {
    const trimmed = (rawQuery || '').trim();
    setErrorModal({
      isOpen: true,
      title: trimmed ? 'Invalid Username Format' : 'Username Required',
      message: trimmed
        ? `"${trimmed}" is not a valid GitHub username. Usernames may only contain alphanumeric characters and hyphens (1–39 characters, no leading or trailing hyphens).`
        : 'Please enter a GitHub username to search for profiles and repositories.',
      username: trimmed,
    });
  }, []);

  /**
   * Dismiss the error modal and restore focus to search input
   */
  const handleDismissErrorModal = useCallback(() => {
    setErrorModal((prev) => ({ ...prev, isOpen: false }));
    // If not on search view and no user loaded, return to search view
    if (!user) {
      setCurrentView('search');
      updateUrl('search');
    }
    setTimeout(() => {
      const input = document.querySelector('#hero-github-username');
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }, [user, updateUrl]);

  /**
   * Handle primary search for a username
   */
  const handleSearch = useCallback(async (username, skipHistoryUpdate = false) => {
    if (!username) return;

    // Abort prior in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    currentSearchRef.current = username;
    setCurrentSearchTerm(username);

    // Switch view to results immediately with loading state
    setCurrentView('results');
    setUser(null);
    setRepos([]);
    setRepoPage(1);
    setHasMoreRepos(false);
    setProfileError(null);
    setRepoError(null);
    setIsLoading(true);

    if (!skipHistoryUpdate) {
      updateUrl('results', username);
    }

    try {
      // Fetch user profile
      const userData = await fetchUserProfile(username, controller.signal);

      // Verify request identity
      if (currentSearchRef.current !== username) return;

      setUser(userData);
      setIsLoading(false);

      // Record in persistent history
      const updatedHistory = addSearchHistory(userData.login, userData);
      if (updatedHistory) {
        setSearchHistory(updatedHistory);
      }

      // Fetch first page of repositories
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

      // If user was not found (404), trigger the centered error modal
      if (error.type === 'not_found' || error.status === 404) {
        setErrorModal({
          isOpen: true,
          title: 'User Not Found',
          message: `We couldn't find a GitHub profile for "${username}". Please check the spelling or try searching another developer.`,
          username: username,
        });
      }
    }
  }, [updateUrl]);

  /**
   * Return back to search view
   */
  const handleBackToSearch = useCallback(() => {
    setCurrentView('search');
    updateUrl('search');
    // Focus search input after view renders
    setTimeout(() => {
      const input = document.querySelector('#hero-github-username');
      if (input) {
        input.focus();
        input.select();
      }
    }, 80);
  }, [updateUrl]);

  /**
   * Open the Saved Repositories view
   */
  const handleOpenSaved = useCallback(() => {
    setCurrentView('saved');
    updateUrl('saved');
  }, [updateUrl]);

  /**
   * Return to results from saved view
   */
  const handleReturnToResults = useCallback(() => {
    if (user) {
      setCurrentView('results');
      updateUrl('results', user.login);
    } else {
      handleBackToSearch();
    }
  }, [user, handleBackToSearch, updateUrl]);

  /**
   * Clear search history
   */
  const handleClearHistory = useCallback(() => {
    const cleared = clearSearchHistory();
    setSearchHistory(cleared);
  }, []);

  /**
   * Toggle a repository's local favorite bookmark
   */
  const handleToggleFavorite = useCallback((repo) => {
    const { list } = toggleSavedRepo(repo);
    setSavedRepos([...list]);
  }, []);

  /**
   * Load more repositories (pagination)
   */
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !user) return;

    setLoadingMore(true);
    setRepoError(null);
    const nextPage = repoPage + 1;

    try {
      const { repos: newRepos, hasMore } = await fetchUserRepos(user.login, nextPage);
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
   * Retry initial repository load
   */
  const handleRetryRepos = useCallback(() => {
    if (!user) return;
    setRepoError(null);

    if (repos.length === 0) {
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
      handleLoadMore();
    }
  }, [user, repos.length, handleLoadMore]);

  /**
   * Listen to browser back/forward buttons and initial URL query params
   */
  useEffect(() => {
    const parseUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const userParam = params.get('user');
      const tabParam = params.get('tab');

      if (tabParam === 'saved') {
        setCurrentView('saved');
      } else if (userParam) {
        handleSearch(userParam, true);
      } else {
        setCurrentView('search');
      }
    };

    // Parse initial URL on load
    parseUrlState();

    // Handle back/forward navigation
    const handlePopState = () => {
      parseUrlState();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleSearch]);

  return (
    <div className="app-layout">
      <Navbar
        onGoHome={handleBackToSearch}
        onOpenSaved={handleOpenSaved}
        savedCount={savedRepos.length}
        currentView={currentView}
      />

      <main className="main-content">
        {/* VIEW 1: SEARCH PAGE */}
        {currentView === 'search' && (
          <Hero
            onSearch={handleSearch}
            onInvalidSearch={handleInvalidSearch}
            isLoading={isLoading}
            searchHistory={searchHistory}
            onSelectHistory={handleSearch}
            onClearHistory={handleClearHistory}
            initialQuery={currentSearchTerm}
          />
        )}

        {/* VIEW 2: DEDICATED RESULTS PAGE */}
        {currentView === 'results' && (
          <div className="results-view container">
            {/* Top Toolbar: clean header with Back to Search and Saved shortcut */}
            <ResultsToolbar
              currentUsername={user?.login || currentSearchTerm}
              onBackToSearch={handleBackToSearch}
              savedCount={savedRepos.length}
              onOpenSaved={handleOpenSaved}
            />

            {isLoading && <LoadingState />}

            {profileError && (
              <div className="results-view__error-wrap">
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
              </div>
            )}

            {user && !isLoading && (
              <>
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
                  savedRepoIds={savedRepoIds}
                  onToggleFavorite={handleToggleFavorite}
                />
              </>
            )}
          </div>
        )}

        {/* VIEW 3: DEDICATED SAVED REPOSITORIES PAGE */}
        {currentView === 'saved' && (
          <SavedRepositoriesView
            savedRepos={savedRepos}
            onToggleFavorite={handleToggleFavorite}
            onBackToSearch={handleBackToSearch}
            activeUsername={user?.login || null}
            onReturnToResults={user ? handleReturnToResults : null}
          />
        )}
      </main>

      {/* Centered Error Modal for wrong/invalid usernames */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        username={errorModal.username}
        onClose={handleDismissErrorModal}
        onTryAgain={handleDismissErrorModal}
      />

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
    </div>
  );
}

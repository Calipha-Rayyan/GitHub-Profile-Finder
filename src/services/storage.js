/**
 * Storage Service — Manages persistent Search History and Saved Favorite Repositories.
 * Uses versioned localStorage keys and safe parsing.
 */

const HISTORY_KEY = 'github_profile_finder_history_v1';
const SAVED_REPOS_KEY = 'github_profile_finder_saved_repos_v1';
const MAX_HISTORY = 10;

/**
 * Safe localStorage wrapper
 */
function getStorageItem(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn(`[storage] Failed to read key "${key}":`, err);
    return null;
  }
}

function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[storage] Failed to write key "${key}":`, err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// SEARCH HISTORY
// ---------------------------------------------------------------------------

/**
 * Retrieve the list of recent searches.
 * @returns {Array<{ username: string, name?: string, avatar_url?: string, timestamp: number }>}
 */
export function getSearchHistory() {
  const data = getStorageItem(HISTORY_KEY);
  if (!Array.isArray(data)) return [];
  return data.filter(item => item && typeof item.username === 'string');
}

/**
 * Add a successfully searched username to history.
 * Deduplicates case-insensitively and puts the latest search first.
 */
export function addSearchHistory(username, profileData = null) {
  if (!username || typeof username !== 'string') return;
  const clean = username.trim();
  if (!clean) return;

  const current = getSearchHistory();
  // Filter out existing entries with same case-insensitive username
  const filtered = current.filter(
    item => item.username.toLowerCase() !== clean.toLowerCase()
  );

  const newEntry = {
    username: clean,
    name: profileData?.name || clean,
    avatar_url: profileData?.avatar_url || '',
    timestamp: Date.now(),
  };

  const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY);
  setStorageItem(HISTORY_KEY, updated);
  return updated;
}

/**
 * Clear all search history.
 */
export function clearSearchHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.warn('[storage] Failed to clear history:', err);
  }
  return [];
}

// ---------------------------------------------------------------------------
// SAVED REPOSITORIES (LOCAL FAVORITES)
// ---------------------------------------------------------------------------

/**
 * Retrieve saved favorite repositories.
 * @returns {Array<object>}
 */
export function getSavedRepos() {
  const data = getStorageItem(SAVED_REPOS_KEY);
  if (!Array.isArray(data)) return [];
  return data.filter(r => r && (r.id || r.full_name));
}

/**
 * Check if a repository is already saved.
 * @param {number|string} repoId
 * @returns {boolean}
 */
export function isRepoSaved(repoId) {
  const saved = getSavedRepos();
  return saved.some(r => r.id === repoId || String(r.id) === String(repoId));
}

/**
 * Save a repository to local favorites.
 * Stores only essential public metadata.
 */
export function saveRepo(repo) {
  if (!repo || !repo.id) return getSavedRepos();
  const current = getSavedRepos();
  if (current.some(r => r.id === repo.id)) return current;

  const sanitized = {
    id: repo.id,
    name: repo.name || '',
    full_name: repo.full_name || repo.name || '',
    description: repo.description || '',
    html_url: repo.html_url || '',
    language: repo.language || '',
    stargazers_count: typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0,
    forks_count: typeof repo.forks_count === 'number' ? repo.forks_count : 0,
    updated_at: repo.updated_at || new Date().toISOString(),
    owner: {
      login: repo.owner?.login || '',
      avatar_url: repo.owner?.avatar_url || '',
    },
    saved_at: Date.now(),
  };

  const updated = [sanitized, ...current];
  setStorageItem(SAVED_REPOS_KEY, updated);
  return updated;
}

/**
 * Remove a repository from local favorites.
 * @param {number|string} repoId
 */
export function removeSavedRepo(repoId) {
  const current = getSavedRepos();
  const updated = current.filter(r => r.id !== repoId && String(r.id) !== String(repoId));
  setStorageItem(SAVED_REPOS_KEY, updated);
  return updated;
}

/**
 * Toggle a repository's saved status.
 * @param {object} repo
 * @returns {{ saved: boolean, list: Array<object> }}
 */
export function toggleSavedRepo(repo) {
  if (!repo || !repo.id) return { saved: false, list: getSavedRepos() };
  if (isRepoSaved(repo.id)) {
    const list = removeSavedRepo(repo.id);
    return { saved: false, list };
  } else {
    const list = saveRepo(repo);
    return { saved: true, list };
  }
}

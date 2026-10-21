/**
 * GitHub API Service
 * Handles all GitHub REST API communication.
 */

const BASE_URL = 'https://api.github.com';
const PER_PAGE = 12;

/**
 * Validates a GitHub username format.
 * GitHub usernames: 1-39 chars, alphanumeric or hyphens, no leading/trailing hyphens.
 */
export function isValidUsername(username) {
  if (!username || typeof username !== 'string') return false;
  const trimmed = username.trim();
  if (trimmed.length === 0 || trimmed.length > 39) return false;
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmed);
}

/**
 * Parse rate limit information from response headers.
 */
function parseRateLimit(headers) {
  const remaining = headers.get('X-RateLimit-Remaining');
  const resetTimestamp = headers.get('X-RateLimit-Reset');
  const retryAfter = headers.get('Retry-After');

  let resetTime = null;
  if (resetTimestamp) {
    resetTime = new Date(parseInt(resetTimestamp, 10) * 1000);
  } else if (retryAfter) {
    resetTime = new Date(Date.now() + parseInt(retryAfter, 10) * 1000);
  }

  return {
    remaining: remaining !== null ? parseInt(remaining, 10) : null,
    resetTime,
  };
}

/**
 * Format a reset time into a human-readable string.
 */
export function formatResetTime(resetTime) {
  if (!resetTime) return 'a few minutes';
  const now = new Date();
  const diffMs = resetTime.getTime() - now.getTime();
  if (diffMs <= 0) return 'shortly';
  const diffMin = Math.ceil(diffMs / 60000);
  if (diffMin <= 1) return 'about a minute';
  return `about ${diffMin} minutes`;
}

/**
 * Custom error class for API errors.
 */
export class GitHubApiError extends Error {
  constructor(message, status, type, resetTime = null) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.type = type;
    this.resetTime = resetTime;
  }
}

/**
 * Process a fetch response and handle error cases.
 */
async function handleResponse(response) {
  const rateLimit = parseRateLimit(response.headers);

  if (response.ok) {
    const data = await response.json();
    return { data, rateLimit };
  }

  if (response.status === 404) {
    throw new GitHubApiError(
      'GitHub user not found. Please check the username and try again.',
      404,
      'not_found'
    );
  }

  let errorBody = null;
  try {
    errorBody = await response.json();
  } catch {
    // Response might not be JSON
  }

  // Rate limit: HTTP 429, OR HTTP 403 with remaining === 0 or rate-limit message
  const isRateLimit = response.status === 429 ||
    (response.status === 403 && (
      rateLimit.remaining === 0 ||
      (errorBody?.message && errorBody.message.toLowerCase().includes('rate limit'))
    ));

  if (isRateLimit) {
    const resetMsg = rateLimit.resetTime
      ? `Rate limit will reset in ${formatResetTime(rateLimit.resetTime)}.`
      : 'Please wait a few minutes before trying again.';
    throw new GitHubApiError(
      `GitHub API rate limit exceeded. ${resetMsg}`,
      response.status,
      'rate_limit',
      rateLimit.resetTime
    );
  }

  if (response.status === 403) {
    const detail = errorBody?.message || 'Access to this resource was forbidden.';
    throw new GitHubApiError(
      `Access forbidden (403): ${detail}`,
      403,
      'forbidden'
    );
  }

  const detailMsg = errorBody?.message ? ` (${errorBody.message})` : '';
  throw new GitHubApiError(
    `GitHub API returned an error (status ${response.status})${detailMsg}. Please try again later.`,
    response.status,
    'server_error'
  );
}

/**
 * Fetch a GitHub user profile.
 * @param {string} username - GitHub username
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<object>} User profile data
 */
export async function fetchUserProfile(username, signal) {
  try {
    const response = await fetch(`${BASE_URL}/users/${encodeURIComponent(username)}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      signal,
    });
    const { data } = await handleResponse(response);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof GitHubApiError) {
      throw error;
    }
    throw new GitHubApiError(
      'Unable to connect to GitHub. Please check your internet connection and try again.',
      0,
      'network_error'
    );
  }
}

/**
 * Fetch repositories for a GitHub user.
 * @param {string} username - GitHub username
 * @param {number} [page=1] - Page number
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<{repos: Array, hasMore: boolean}>}
 */
export async function fetchUserRepos(username, page = 1, signal) {
  try {
    const url = `${BASE_URL}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=${PER_PAGE}&page=${page}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      signal,
    });
    const { data } = await handleResponse(response);

    // Determine if there are more pages based on the Link header or result count
    const linkHeader = response.headers.get('Link');
    const hasMore = data.length === PER_PAGE && (linkHeader ? linkHeader.includes('rel="next"') : true);

    return { repos: data, hasMore };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof GitHubApiError) {
      throw error;
    }
    throw new GitHubApiError(
      'Unable to load repositories. Please check your connection and try again.',
      0,
      'network_error'
    );
  }
}

/**
 * Format a date string into a relative or short format.
 */
export function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Common language colors for repo cards */
export const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Lua: '#000080',
  R: '#198CE7',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Perl: '#0298c3',
};

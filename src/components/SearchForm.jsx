import { useState, useRef } from 'react';
import { isValidUsername } from '../services/githubApi';

/**
 * SearchForm Component
 * Primary search interface with validation and loading state.
 *
 * @param {object} props
 * @param {function} props.onSearch - Callback with trimmed username
 * @param {boolean} props.isLoading - Whether a search is in progress
 */
export default function SearchForm({ onSearch, isLoading }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validate = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Please enter a GitHub username.';
    }
    if (!isValidUsername(trimmed)) {
      return 'Username can only contain letters, numbers, and hyphens (1–39 characters, no leading/trailing hyphens).';
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      inputRef.current?.focus();
      return;
    }
    setError('');
    onSearch(trimmed);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    if (error) setError('');
  };

  return (
    <form className="search-form" onSubmit={handleSubmit} role="search" aria-label="Search GitHub users">
      <div className="search-form__input-wrap">
        <svg
          className="search-form__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <label htmlFor="github-username" className="sr-only">GitHub Username</label>
        <input
          ref={inputRef}
          id="github-username"
          type="text"
          className={`search-form__input ${error ? 'search-form__input--error' : ''}`}
          placeholder="octocat"
          value={query}
          onChange={handleChange}
          autoComplete="off"
          spellCheck="false"
          aria-invalid={!!error}
          aria-describedby={error ? 'search-error' : undefined}
        />
        {error && (
          <p className="search-form__error" id="search-error" role="alert">
            <svg className="search-form__error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="search-form__btn"
        aria-label={isLoading ? 'Searching…' : 'Search GitHub user'}
      >
        {isLoading ? (
          <>
            <span className="search-form__btn-spinner" aria-hidden="true" />
            Searching…
          </>
        ) : (
          'Search'
        )}
      </button>
    </form>
  );
}

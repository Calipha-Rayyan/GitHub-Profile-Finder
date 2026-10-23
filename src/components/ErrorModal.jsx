import { useEffect, useRef } from 'react';

/**
 * ErrorModal Component
 * Centered modal dialog appearing when a username is not found, incomplete, or invalid.
 * Features:
 * - Centered on screen with smooth glassmorphic backdrop
 * - Clear error message identifying the problematic username
 * - "Try Another Search" and "Okay" action buttons
 * - Keyboard navigation (Escape key to dismiss, Enter to confirm)
 * - Automatic focus restoration to username search input
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {string} props.title - Modal title (e.g., "User Not Found")
 * @param {string} props.message - Descriptive error message
 * @param {string} [props.username] - The searched username that triggered the error
 * @param {function} props.onClose - Callback to dismiss the modal
 * @param {function} props.onTryAgain - Callback to dismiss and focus search input
 */
export default function ErrorModal({
  isOpen,
  title = 'User Not Found',
  message = 'We could not find a GitHub user with that username.',
  username = '',
  onClose,
  onTryAgain,
}) {
  const primaryBtnRef = useRef(null);

  // Focus primary button when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        primaryBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onTryAgain) onTryAgain();
        else if (onClose) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onTryAgain]);

  if (!isOpen) return null;

  const handleAction = () => {
    if (onTryAgain) {
      onTryAgain();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className="error-modal-overlay"
      role="presentation"
      onClick={handleAction}
    >
      <div
        className="error-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon Badge */}
        <div className="error-modal__icon-wrap" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Modal Header & Message */}
        <h2 id="error-modal-title" className="error-modal__title">
          {title}
        </h2>

        {username && (
          <div className="error-modal__badge">
            <span>@{username}</span>
          </div>
        )}

        <p id="error-modal-desc" className="error-modal__message">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="error-modal__actions">
          <button
            ref={primaryBtnRef}
            type="button"
            className="error-modal__btn error-modal__btn--primary"
            onClick={handleAction}
            aria-label="Try another search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Try Another Search</span>
          </button>

          <button
            type="button"
            className="error-modal__btn error-modal__btn--secondary"
            onClick={handleAction}
            aria-label="Acknowledge and dismiss"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}

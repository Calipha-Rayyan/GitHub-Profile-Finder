/**
 * EmptyState Component
 * Displays a styled empty state for sections with no data.
 *
 * @param {object} props
 * @param {string} props.title - Title text
 * @param {string} props.message - Description text
 */
export default function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <svg className="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </svg>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__message">{message}</p>
    </div>
  );
}

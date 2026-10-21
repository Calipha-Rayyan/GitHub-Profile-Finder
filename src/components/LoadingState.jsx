/**
 * LoadingState Component
 * Displays a refined loading indicator with skeleton placeholders.
 */
export default function LoadingState() {
  return (
    <div className="loading" role="status" aria-label="Loading profile data">
      <div className="loading__spinner" aria-hidden="true" />
      <p className="loading__text">Searching GitHub…</p>

      {/* Skeleton profile preview */}
      <div style={{ width: '100%', maxWidth: '700px', marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div className="skeleton" style={{ width: 100, height: 100, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="skeleton" style={{ width: '40%', height: 20 }} />
            <div className="skeleton" style={{ width: '25%', height: 14 }} />
            <div className="skeleton" style={{ width: '90%', height: 14 }} />
            <div className="skeleton" style={{ width: '60%', height: 14 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useRef, useEffect, useState } from 'react';
import { usePointerTilt } from '../hooks/usePointerTilt';
import { useReducedMotion } from '../hooks/useReducedMotion';
import SearchForm from './SearchForm';

/**
 * Hero Component
 * Visual centerpiece with responsive 3D spatial prism, vibrant animated video background,
 * and search interface.
 */
export default function Hero({ onSearch, isLoading }) {
  // Attach pointer tilt to entire hero container for full-screen response
  const { containerRef, sceneRef, layersRef } = usePointerTilt({ maxAngle: 18, smoothing: 0.08 });
  const prefersReduced = useReducedMotion();
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Play/pause management respecting visibility and reduced motion
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (prefersReduced) {
      video.pause();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [prefersReduced]);

  // Pause when document is hidden
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else if (!prefersReduced) {
        video.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [prefersReduced]);

  return (
    <section className="hero" ref={containerRef} aria-label="Search for GitHub developers">
      {/* Video Background Container */}
      <div className="hero__video-wrap" aria-hidden="true">
        {!videoError && (
          <video
            ref={videoRef}
            className={`hero__video ${videoLoaded ? 'hero__video--loaded' : ''}`}
            autoPlay={!prefersReduced}
            muted
            playsInline
            loop
            preload="auto"
            poster="/images/hero-poster.jpg"
            onCanPlay={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
          >
            <source src="/videos/hero-bg.webm" type="video/webm" />
          </video>
        )}

        {/* If video errors or reduced motion is active, show the poster image */}
        {(videoError || prefersReduced) && (
          <img
            src="/images/hero-poster.jpg"
            alt=""
            className="hero__video hero__video--poster"
          />
        )}

        {/* Dynamic atmospheric gradient overlay keeping left text legible while revealing rich right video */}
        <div className="hero__video-overlay" />
      </div>

      {/* Content */}
      <div className="hero__content">
        <div className="hero__text">
          <div className="hero__badge">
            <span className="hero__badge-dot" aria-hidden="true" />
            <span>Developer Discovery Engine</span>
          </div>

          <h1 className="hero__headline">
            Discover the people{' '}
            <span className="hero__headline-accent">behind the code.</span>
          </h1>

          <p className="hero__description">
            Explore GitHub developers, discover their repositories, and learn more about the work behind their profiles.
          </p>

          <SearchForm onSearch={onSearch} isLoading={isLoading} idPrefix="hero" />

          <div className="hero__hints">
            <span className="hero__hint-label">Try searching:</span>
            <button
              type="button"
              className="hero__hint-chip"
              onClick={() => onSearch('octocat')}
              disabled={isLoading}
            >
              octocat
            </button>
            <button
              type="button"
              className="hero__hint-chip"
              onClick={() => onSearch('gaearon')}
              disabled={isLoading}
            >
              gaearon
            </button>
            <button
              type="button"
              className="hero__hint-chip"
              onClick={() => onSearch('Calipha-Rayyan')}
              disabled={isLoading}
            >
              Calipha-Rayyan
            </button>
          </div>
        </div>

        {/* 3D Prism Composition with Multi-Layer Spatial Depth */}
        <div className="prism" aria-hidden="true">
          {/* Orbital rings with radiant accent glow */}
          <div className="prism__orbit prism__orbit--1" style={prefersReduced ? { animation: 'none' } : undefined}>
            <span className="prism__orbit-dot prism__orbit-dot--coral" />
            <span className="prism__orbit-dot prism__orbit-dot--cyan" />
          </div>
          <div className="prism__orbit prism__orbit--2" style={prefersReduced ? { animation: 'none' } : undefined}>
            <span className="prism__orbit-dot prism__orbit-dot--pink" />
          </div>

          {/* 3D Scene Root */}
          <div className="prism__scene" ref={sceneRef}>
            {/* Layer 4: Deep Background Panel */}
            <div
              className="prism__panel prism__panel--back"
              ref={(el) => (layersRef.current[3] = el)}
            >
              <div className="prism__panel-glow prism__panel-glow--indigo" />
              <div className="prism__side-inner">
                <div className="prism__mock-tag">@repository</div>
                <div className="prism__mock-line prism__mock-line--medium" />
                <div className="prism__mock-line prism__mock-line--short" />
                <div className="prism__mock-line prism__mock-line--long" />
              </div>
            </div>

            {/* Layer 3: Secondary Accent Panel (Coral / Pink) */}
            <div
              className="prism__panel prism__panel--side prism__panel--side-2"
              ref={(el) => (layersRef.current[2] = el)}
            >
              <div className="prism__panel-glow prism__panel-glow--coral" />
              <div className="prism__side-inner">
                <div className="prism__mock-chip prism__mock-chip--coral">★ Stargazers</div>
                <div className="prism__mock-line prism__mock-line--long" />
                <div className="prism__mock-line prism__mock-line--short" />
              </div>
            </div>

            {/* Layer 2: Tertiary Accent Panel (Cyan / Violet) */}
            <div
              className="prism__panel prism__panel--side prism__panel--side-1"
              ref={(el) => (layersRef.current[1] = el)}
            >
              <div className="prism__panel-glow prism__panel-glow--cyan" />
              <div className="prism__side-inner">
                <div className="prism__mock-chip prism__mock-chip--cyan">TypeScript</div>
                <div className="prism__mock-line prism__mock-line--medium" />
                <div className="prism__mock-line prism__mock-line--long" />
              </div>
            </div>

            {/* Layer 1: Foreground Glass Prism Panel */}
            <div
              className="prism__panel prism__panel--main"
              ref={(el) => (layersRef.current[0] = el)}
            >
              <div className="prism__panel-glare" />
              <div className="prism__panel--main-inner">
                <div className="prism__avatar-row">
                  <div className="prism__avatar-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="prism__avatar-meta">
                    <span className="prism__avatar-name">Developer Profile</span>
                    <span className="prism__avatar-handle">@github-user</span>
                  </div>
                </div>

                <div className="prism__mock-bio">
                  <div className="prism__mock-line prism__mock-line--medium" />
                  <div className="prism__mock-line prism__mock-line--long" />
                  <div className="prism__mock-line prism__mock-line--short" />
                </div>

                <div className="prism__mock-stats">
                  <div className="prism__mock-stat">
                    <span className="prism__mock-stat-num">84</span>
                    <span className="prism__mock-stat-lbl">Repos</span>
                  </div>
                  <div className="prism__mock-stat">
                    <span className="prism__mock-stat-num">1.2k</span>
                    <span className="prism__mock-stat-lbl">Stars</span>
                  </div>
                  <div className="prism__mock-stat">
                    <span className="prism__mock-stat-num">340</span>
                    <span className="prism__mock-stat-lbl">Forks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

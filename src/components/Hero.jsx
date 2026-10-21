import { useRef, useEffect, useState } from 'react';
import { usePointerTilt } from '../hooks/usePointerTilt';
import { useReducedMotion } from '../hooks/useReducedMotion';
import SearchForm from './SearchForm';

/**
 * Hero Component
 * Visual centerpiece with headline, interactive 3D prism, seamless looping video background, and search.
 */
export default function Hero({ onSearch, isLoading }) {
  const { containerRef, sceneRef } = usePointerTilt({ maxAngle: 10, smoothing: 0.06 });
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
          video.play().catch(() => {
            // Autoplay might be restricted in some browser settings
          });
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
    <section className="hero" aria-label="Search for GitHub developers">
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
        
        {/* If video errors or reduced motion is active, show the poster image cleanly */}
        {(videoError || prefersReduced) && (
          <img
            src="/images/hero-poster.jpg"
            alt=""
            className="hero__video"
            style={{ opacity: 0.25, objectFit: 'cover' }}
          />
        )}

        {/* Soft atmospheric gradient overlay */}
        <div className="hero__video-overlay" />
      </div>

      {/* Content */}
      <div className="hero__content">
        <div className="hero__text">
          <h1 className="hero__headline">
            Discover the people{' '}
            <span className="hero__headline-accent">behind the code.</span>
          </h1>
          <p className="hero__description">
            Explore GitHub developers, discover their repositories, and learn more about the work behind their profiles.
          </p>
          <SearchForm onSearch={onSearch} isLoading={isLoading} />
        </div>

        {/* 3D Prism */}
        <div className="prism" ref={containerRef} aria-hidden="true">
          {/* Orbital rings */}
          <div className="prism__orbit prism__orbit--1" style={prefersReduced ? { animation: 'none' } : undefined}>
            <span className="prism__orbit-dot prism__orbit-dot--1" />
            <span className="prism__orbit-dot prism__orbit-dot--2" />
          </div>
          <div className="prism__orbit prism__orbit--2" style={prefersReduced ? { animation: 'none' } : undefined}>
            <span className="prism__orbit-dot prism__orbit-dot--3" />
          </div>

          {/* 3D Scene */}
          <div className="prism__scene" ref={sceneRef}>
            {/* Back panel */}
            <div className="prism__panel prism__panel--back">
              <div className="prism__side-inner">
                <div className="prism__mock-line prism__mock-line--medium" />
                <div className="prism__mock-line prism__mock-line--short" />
                <div className="prism__mock-line prism__mock-line--long" />
                <div className="prism__mock-line prism__mock-line--medium" />
              </div>
            </div>

            {/* Side panels */}
            <div className="prism__panel prism__panel--side prism__panel--side-2">
              <div className="prism__side-inner">
                <div className="prism__mock-line prism__mock-line--long" />
                <div className="prism__mock-line prism__mock-line--short" />
              </div>
            </div>
            <div className="prism__panel prism__panel--side prism__panel--side-1">
              <div className="prism__side-inner">
                <div className="prism__mock-line prism__mock-line--medium" />
                <div className="prism__mock-line prism__mock-line--long" />
              </div>
            </div>

            {/* Main panel */}
            <div className="prism__panel prism__panel--main">
              <div className="prism__panel--main-inner">
                <div className="prism__avatar-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="prism__mock-line prism__mock-line--medium" />
                <div className="prism__mock-line prism__mock-line--long" />
                <div className="prism__mock-line prism__mock-line--short" />
                <div className="prism__mock-stats">
                  <div className="prism__mock-stat" />
                  <div className="prism__mock-stat" />
                  <div className="prism__mock-stat" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

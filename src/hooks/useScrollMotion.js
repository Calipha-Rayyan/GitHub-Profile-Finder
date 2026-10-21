import { useRef, useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Hook that provides scroll-based parallax values for decorative elements.
 * @param {object} options
 * @param {number} [options.speed=0.3] - Parallax speed multiplier
 * @returns {{ ref: React.Ref, offset: number }}
 */
export function useScrollMotion({ speed = 0.3 } = {}) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;

    let rafId = null;

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const viewportCenter = window.innerHeight / 2;
          const elementCenter = rect.top + rect.height / 2;
          const distance = (viewportCenter - elementCenter) * speed;
          setOffset(distance);
        }
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [speed, prefersReduced]);

  return { ref, offset: prefersReduced ? 0 : offset };
}

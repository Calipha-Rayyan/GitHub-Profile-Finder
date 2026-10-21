import { useRef, useCallback, useEffect } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Enhanced Hook that provides smooth, perceptible multi-layer 3D tilt
 * based on pointer position over the hero area.
 *
 * @param {object} options
 * @param {number} [options.maxAngle=16] - Maximum rotation in degrees
 * @param {number} [options.smoothing=0.08] - Damping factor (0-1)
 * @returns {{ containerRef: React.Ref, sceneRef: React.Ref, layersRef: React.Ref }}
 */
export function usePointerTilt({ maxAngle = 16, smoothing = 0.08 } = {}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const layersRef = useRef([]);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const isHovering = useRef(false);
  const prefersReduced = useReducedMotion();

  const animate = useCallback(() => {
    const dx = targetRef.current.x - currentRef.current.x;
    const dy = targetRef.current.y - currentRef.current.y;

    currentRef.current.x += dx * smoothing;
    currentRef.current.y += dy * smoothing;

    const curX = currentRef.current.x;
    const curY = currentRef.current.y;

    if (sceneRef.current) {
      const rotY = curX * maxAngle;
      const rotX = -curY * maxAngle;
      sceneRef.current.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    }

    // Apply differential parallax shifts to child layers
    if (layersRef.current && layersRef.current.length > 0) {
      layersRef.current.forEach((layerEl, idx) => {
        if (!layerEl) return;
        // Different depth multipliers for layers
        const depth = (idx + 1) * 7;
        const shiftX = curX * depth;
        const shiftY = curY * depth;
        layerEl.style.setProperty('--tilt-shift-x', `${shiftX.toFixed(1)}px`);
        layerEl.style.setProperty('--tilt-shift-y', `${shiftY.toFixed(1)}px`);
      });
    }

    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001 || isHovering.current) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [maxAngle, smoothing]);

  useEffect(() => {
    if (prefersReduced) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMove = (e) => {
      const rect = container.getBoundingClientRect();
      // Calculate normalized coords between -1 and 1
      const x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 2));
      targetRef.current = { x, y };

      if (!isHovering.current) {
        isHovering.current = true;
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    const handleEnter = () => {
      isHovering.current = true;
      rafRef.current = requestAnimationFrame(animate);
    };

    const handleLeave = () => {
      isHovering.current = false;
      targetRef.current = { x: 0, y: 0 };
      rafRef.current = requestAnimationFrame(animate);
    };

    // Touch support for gentle mobile interaction
    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, ((touch.clientX - rect.left) / rect.width - 0.5) * 2));
        const y = Math.max(-1, Math.min(1, ((touch.clientY - rect.top) / rect.height - 0.5) * 2));
        targetRef.current = { x: x * 0.6, y: y * 0.6 };
      }
    };

    container.addEventListener('mousemove', handleMove, { passive: true });
    container.addEventListener('mouseenter', handleEnter);
    container.addEventListener('mouseleave', handleLeave);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleLeave);

    return () => {
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseenter', handleEnter);
      container.removeEventListener('mouseleave', handleLeave);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate, prefersReduced]);

  return { containerRef, sceneRef, layersRef };
}

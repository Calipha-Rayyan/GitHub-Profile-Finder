import { useRef, useCallback, useEffect } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Hook that provides smooth 3D tilt based on pointer position.
 * Returns a ref to attach to the container and current rotation values.
 *
 * @param {object} options
 * @param {number} [options.maxAngle=12] - Maximum tilt angle in degrees
 * @param {number} [options.smoothing=0.08] - Smoothing factor (0-1)
 * @returns {{ containerRef: React.Ref, sceneRef: React.Ref }}
 */
export function usePointerTilt({ maxAngle = 12, smoothing = 0.08 } = {}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
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

    if (sceneRef.current) {
      const rotY = currentRef.current.x * maxAngle;
      const rotX = -currentRef.current.y * maxAngle;
      sceneRef.current.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
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
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRef.current = { x, y };
    };

    const handleEnter = () => {
      isHovering.current = true;
      rafRef.current = requestAnimationFrame(animate);
    };

    const handleLeave = () => {
      isHovering.current = false;
      targetRef.current = { x: 0, y: 0 };
      // Continue animating back to center
      rafRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseenter', handleEnter);
    container.addEventListener('mouseleave', handleLeave);

    return () => {
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseenter', handleEnter);
      container.removeEventListener('mouseleave', handleLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate, prefersReduced]);

  return { containerRef, sceneRef };
}

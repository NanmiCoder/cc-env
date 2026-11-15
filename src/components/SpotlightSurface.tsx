import { memo, type PointerEvent, type ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'framer-motion';

interface SpotlightSurfaceProps {
  children: ReactNode;
  className?: string;
  showCrosshair?: boolean;
}

const SpotlightSurface = memo(function SpotlightSurface({
  children,
  className = '',
  showCrosshair = true,
}: SpotlightSurfaceProps) {
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(-999);
  const mouseY = useMotionValue(-999);

  const borderSpotlight = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, var(--spotlight-border), transparent 72%)`;
  const surfaceSheen = useMotionTemplate`radial-gradient(420px circle at ${mouseX}px ${mouseY}px, var(--spotlight-sheen), transparent 75%)`;

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handlePointerLeave = () => {
    mouseX.set(-999);
    mouseY.set(-999);
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`group/spot surface-card relative overflow-hidden rounded-2xl ${className}`}
    >
      {/* 1px Specular Cursor Border Ring */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          className="cc-spotlight-ring pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
          style={{ background: borderSpotlight }}
        />
      )}

      {/* Subtle Surface Specular Wash */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
          style={{ background: surfaceSheen }}
        />
      )}

      {/* Subtle Blueprint Registration Tick */}
      {showCrosshair && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-2 z-10 font-mono text-[10px] leading-none text-[var(--text-muted)]/30 select-none transition-colors duration-300 group-hover/spot:text-[var(--text-muted)]/60"
        >
          +
        </span>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
});

export default SpotlightSurface;

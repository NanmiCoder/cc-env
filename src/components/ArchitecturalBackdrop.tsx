import { memo, useEffect } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

interface ArchitecturalBackdropProps {
  theme: 'dark' | 'light';
}

const ArchitecturalBackdrop = memo(function ArchitecturalBackdrop({ theme }: ArchitecturalBackdropProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Scroll-driven depth & fade as user reads down into dense telemetry logs
  const scrollArtworkY = useTransform(scrollY, [0, 900], [0, -100]);
  const scrollArtworkScale = useTransform(scrollY, [0, 900], [1, 1.07]);
  const scrollArtworkOpacity = useTransform(scrollY, [0, 820], [1, 0.34]);
  const scrollGridY = useTransform(scrollY, [0, 900], [0, -36]);

  // Subtle ambient cursor parallax on the optical glass backdrop (desktop mouse only)
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const smoothX = useSpring(rawMouseX, { stiffness: 60, damping: 22, mass: 0.8 });
  const smoothY = useSpring(rawMouseY, { stiffness: 60, damping: 22, mass: 0.8 });

  useEffect(() => {
    if (prefersReducedMotion || typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      rawMouseX.set(nx * -22);
      rawMouseY.set(ny * -14);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [prefersReducedMotion, rawMouseX, rawMouseY]);

  const imgSrc = theme === 'dark' ? '/assets/hero-bg-dark.jpg' : '/assets/hero-bg-light.jpg';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[var(--bg-page)]"
    >
      {/* L0: Precision CAD 1px blueprint grid fading radially before mid-page */}
      <motion.div
        style={prefersReducedMotion ? undefined : { y: scrollGridY }}
        className="cc-blueprint-grid absolute -inset-12 will-change-transform"
      />

      {/* L0.5: Bespoke AI-generated optical glass studio sculpture (right-weighted for typography clarity) */}
      <motion.div
        style={
          prefersReducedMotion
            ? undefined
            : {
                x: smoothX,
                y: scrollArtworkY,
                scale: scrollArtworkScale,
                opacity: scrollArtworkOpacity,
              }
        }
        className="absolute inset-0 will-change-transform"
      >
        <motion.div
          style={prefersReducedMotion ? undefined : { y: smoothY }}
          className="relative h-full w-full"
        >
          <img
            src={imgSrc}
            alt=""
            className={`cc-artwork-mask absolute -right-[3%] -top-4 h-[84vh] min-h-[600px] w-[90vw] max-w-[1360px] object-cover object-center transition-opacity duration-500 ${
              theme === 'dark'
                ? 'opacity-95 brightness-125 contrast-110'
                : 'opacity-100 contrast-105'
            }`}
          />
        </motion.div>
      </motion.div>

      {/* L1: Contrast readability scrim protecting left/center monospace telemetry */}
      <div className="cc-readability-scrim absolute inset-0" />

      {/* Subtle registration marks matching hardware / CAD studio instrument aesthetic */}
      <div className="hidden lg:block">
        <span className="absolute left-6 top-20 font-mono text-[11px] text-[var(--text-muted)]/35 select-none">
          +
        </span>
        <span className="absolute right-6 top-20 font-mono text-[11px] text-[var(--text-muted)]/35 select-none">
          +
        </span>
      </div>

      {/* L1.5: Ultra-light static studio film grain (fixed non-scrolling GPU layer) */}
      <div className="cc-studio-grain absolute inset-0" />
    </div>
  );
});

export default ArchitecturalBackdrop;

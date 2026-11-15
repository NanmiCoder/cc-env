import { memo, type PointerEvent, type ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

interface HeroInstrumentTiltProps {
  children: ReactNode;
  className?: string;
}

const HeroInstrumentTilt = memo(function HeroInstrumentTilt({
  children,
  className = '',
}: HeroInstrumentTiltProps) {
  const prefersReducedMotion = useReducedMotion();

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(25);

  const rotateX = useSpring(rawRotateX, { stiffness: 180, damping: 24, mass: 0.45 });
  const rotateY = useSpring(rawRotateY, { stiffness: 180, damping: 24, mass: 0.45 });
  const smoothGlareX = useSpring(glareX, { stiffness: 200, damping: 28 });
  const smoothGlareY = useSpring(glareY, { stiffness: 200, damping: 28 });

  const glareBg = useMotionTemplate`radial-gradient(240px circle at ${smoothGlareX}% ${smoothGlareY}%, var(--instrument-glare), transparent 72%)`;

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    // Tactile clamped tilt (±4.5deg) matching instrument chassis stability
    rawRotateX.set(-ny * 9);
    rawRotateY.set(nx * 9);
    glareX.set((nx + 0.5) * 100);
    glareY.set((ny + 0.5) * 100);
  };

  const handlePointerLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    glareX.set(50);
    glareY.set(25);
  };

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      style={{ perspective: '1000px' }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={className}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="group/tilt relative flex h-full flex-col justify-between will-change-transform"
      >
        {/* Subtle Sapphire Glass Reflection Sheen (under typography for 100% contrast) */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none inset-0 absolute z-0 opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
          style={{ background: glareBg }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between gap-5">
          {children}
        </div>
      </motion.div>
    </div>
  );
});

export default HeroInstrumentTilt;

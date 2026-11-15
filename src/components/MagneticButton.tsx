import { memo, useState, type ButtonHTMLAttributes, type PointerEvent, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

const MagneticButton = memo(function MagneticButton({
  children,
  className = '',
  disabled,
  onClick,
  type = 'button',
  title,
  'aria-label': ariaLabel,
}: MagneticButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 260, damping: 20, mass: 0.25 });
  const springY = useSpring(rawY, { stiffness: 260, damping: 20, mass: 0.25 });

  const [sheenDir, setSheenDir] = useState<'left' | 'right' | null>(null);
  const [sheenKey, setSheenKey] = useState(0);

  const handlePointerEnter = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || prefersReducedMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const enterFromLeft = e.clientX - rect.left < rect.width / 2;
    setSheenDir(enterFromLeft ? 'left' : 'right');
    setSheenKey((k) => k + 1);
  };

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || prefersReducedMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
    rawX.set(Math.max(-5, Math.min(5, dx)));
    rawY.set(Math.max(-3, Math.min(3, dy)));
  };

  const handlePointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={prefersReducedMotion ? undefined : { x: springX, y: springY }}
      whileTap={disabled || prefersReducedMotion ? undefined : { scale: 0.97 }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Entry-direction specular sheen sweep */}
      {sheenDir && !prefersReducedMotion && !disabled && (
        <motion.span
          key={sheenKey}
          aria-hidden="true"
          initial={{ x: sheenDir === 'left' ? '-120%' : '120%', opacity: 0.7 }}
          animate={{ x: sheenDir === 'left' ? '140%' : '-140%', opacity: 0 }}
          transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
      )}
      <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
        {children}
      </span>
    </motion.button>
  );
});

export default MagneticButton;

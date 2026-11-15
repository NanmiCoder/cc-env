import { memo, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export type BackdropVariant = 'studio' | 'dots' | 'radar' | 'crosshair' | 'beams';

export const BACKDROP_VARIANTS: { id: BackdropVariant; label: string; hint: string }[] = [
  { id: 'studio', label: 'A 棚拍光', hint: '纯色 + 顶光 + 跟随光晕' },
  { id: 'dots', label: 'B 点阵', hint: '点阵网格 + 鼠标照亮' },
  { id: 'radar', label: 'C 雷达', hint: '同心环 + 慢速扫描' },
  { id: 'crosshair', label: 'D 准星阵', hint: '精密十字标尺 + 鼠标点亮' },
  { id: 'beams', label: 'E 光束', hint: '建筑漫射光柱 + 微视差' },
];

export function isBackdropVariant(v: unknown): v is BackdropVariant {
  return v === 'studio' || v === 'dots' || v === 'radar' || v === 'crosshair' || v === 'beams';
}

/** Writes cursor position to CSS vars on the backdrop root (rAF-throttled, no React state). */
function useCursorVars(ref: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let raf = 0;
    let x = window.innerWidth * 0.6;
    let y = 160;
    const flush = () => {
      raf = 0;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
      el.style.setProperty('--nx', `${(x / window.innerWidth - 0.5).toFixed(4)}`);
      el.style.setProperty('--ny', `${(y / window.innerHeight - 0.5).toFixed(4)}`);
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(flush);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, enabled]);
}

function RadarLayer({ animate }: { animate: boolean }) {
  const rings = [90, 170, 260, 360, 470, 590, 720, 860];
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  return (
    <div className="cc-bg-radar absolute left-[58%] top-[150px] h-[1800px] w-[1800px] -translate-x-1/2 -translate-y-1/2">
      <svg viewBox="-900 -900 1800 1800" className="absolute inset-0 h-full w-full" fill="none">
        {rings.map((r, i) => (
          <circle
            key={r}
            r={r}
            stroke="var(--bg-line)"
            strokeWidth={1}
            strokeDasharray={i % 2 === 1 ? '2 6' : undefined}
          />
        ))}
        <line x1={-900} y1={0} x2={900} y2={0} stroke="var(--bg-line)" strokeWidth={1} />
        <line x1={0} y1={-900} x2={0} y2={900} stroke="var(--bg-line)" strokeWidth={1} />
        <line x1={-640} y1={-640} x2={640} y2={640} stroke="var(--bg-line-soft)" strokeWidth={1} />
        <line x1={640} y1={-640} x2={-640} y2={640} stroke="var(--bg-line-soft)" strokeWidth={1} />
        {ticks.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const r1 = 590;
          const r2 = deg % 30 === 0 ? 614 : 600;
          return (
            <line
              key={deg}
              x1={Math.cos(rad) * r1}
              y1={Math.sin(rad) * r1}
              x2={Math.cos(rad) * r2}
              y2={Math.sin(rad) * r2}
              stroke="var(--bg-line-strong)"
              strokeWidth={1}
            />
          );
        })}
      </svg>
      <div className={`cc-bg-radar-sweep absolute inset-0 rounded-full ${animate ? 'cc-bg-spin' : ''}`} />
    </div>
  );
}

function CrosshairLayer({ reduced }: { reduced: boolean }) {
  return (
    <div className="cc-bg-crosshair-wrap absolute inset-0">
      <div className="cc-bg-crosshair absolute inset-0" />
      {!reduced && <div className="cc-bg-crosshair-reveal absolute inset-0" />}
    </div>
  );
}

function BeamsLayer() {
  return (
    <div className="cc-bg-beams-wrap absolute inset-0 overflow-hidden">
      <div className="cc-bg-parallax absolute -inset-12">
        <div className="cc-bg-beam cc-bg-beam-1" />
        <div className="cc-bg-beam cc-bg-beam-2" />
        <div className="cc-bg-beam cc-bg-beam-3" />
      </div>
    </div>
  );
}

const SiteBackdrop = memo(function SiteBackdrop({ variant }: { variant: BackdropVariant }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useCursorVars(ref, !reduced);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[var(--bg-page)]"
    >
      {/* Shared top key light so every variant has the same depth */}
      <div className="cc-bg-keylight absolute inset-0" />

      {variant === 'studio' && <div className="cc-bg-hairline absolute inset-x-0 top-0 h-[640px]" />}

      {variant === 'dots' && (
        <>
          <div className="cc-bg-dots absolute inset-0" />
          {!reduced && <div className="cc-bg-dots-reveal absolute inset-0" />}
        </>
      )}

      {variant === 'radar' && <RadarLayer animate={!reduced} />}

      {variant === 'crosshair' && <CrosshairLayer reduced={!!reduced} />}

      {variant === 'beams' && <BeamsLayer />}

      {/* Cursor follow glow (all variants) */}
      {!reduced && <div className="cc-bg-cursor absolute inset-0" />}
      <div className="cc-studio-grain absolute inset-0" />
    </div>
  );
});

export default SiteBackdrop;

export const BackdropSwitcher = memo(function BackdropSwitcher({
  value,
  onChange,
}: {
  value: BackdropVariant;
  onChange: (v: BackdropVariant) => void;
}) {
  return (
    <div className="fixed bottom-5 left-1/2 z-40 max-w-[calc(100vw-24px)] -translate-x-1/2">
      <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-[#111113]/92 p-1 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <span className="shrink-0 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
          背景预览
        </span>
        {BACKDROP_VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            title={v.hint}
            onClick={() => onChange(v.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              value === v.id ? 'bg-white text-[#111113]' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
});

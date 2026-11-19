import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { FindingSeverity, RiskGrade } from '../types/telemetry';

export type Tone = 'ok' | 'warn' | 'bad' | 'mute';

export const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  bad: 'text-bad',
  mute: 'text-ink-3',
};

export const TONE_BG: Record<Tone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  mute: 'bg-ink-3',
};

export const SEVERITY_TONE: Record<FindingSeverity, Tone> = {
  pass: 'ok',
  info: 'mute',
  warn: 'warn',
  danger: 'bad',
};

export const GRADE_TONE: Record<RiskGrade, Tone> = {
  S: 'ok',
  A: 'ok',
  B: 'warn',
  C: 'warn',
  F: 'bad',
};

export function maskIp(ip: string | null | undefined, hidden: boolean): string {
  if (!ip) return '-';
  if (!hidden) return ip;
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 2).join(':')}:****:****`;
  }
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return '***.***.***.***';
}

export function useCopy(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), resetMs);
      } catch {
        // clipboard unavailable
      }
    },
    [resetMs]
  );
  return { copied, copy };
}

export function Logo({ className = 'h-5 w-5' }: { className?: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden="true">
      {rays.map((deg) => (
        <rect
          key={deg}
          x="45.5"
          y="8"
          width="9"
          height="32"
          rx="4.5"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="11" />
    </svg>
  );
}

export function Dot({ tone, pulse = false }: { tone: Tone; pulse?: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${TONE_BG[tone]} ${pulse ? 'blink' : ''}`}
    />
  );
}

export function Section({
  id,
  index,
  title,
  aside,
  children,
}: {
  id: string;
  index: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-t border-line pt-8 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-8">
        <h2 className="flex items-baseline gap-3 font-serif text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]">
          <span className="num text-xs font-medium text-clay">{index}</span>
          {title}
        </h2>
        {aside && <div className="text-sm text-ink-2">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

/** IP shown in mono; click toggles the global mask. */
export function Ip({
  value,
  hidden,
  onToggle,
  fallback = '-',
  className = '',
}: {
  value: string | null | undefined;
  hidden: boolean;
  onToggle: () => void;
  fallback?: string;
  className?: string;
}) {
  if (!value) return <span className={className}>{fallback}</span>;
  return (
    <button
      type="button"
      onClick={onToggle}
      title={hidden ? '点击显示完整 IP' : '点击隐藏 IP'}
      className={`num max-w-full break-all text-left underline decoration-line decoration-dotted underline-offset-4 transition hover:decoration-clay ${className}`}
    >
      {maskIp(value, hidden)}
    </button>
  );
}

const BTN_BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-medium transition active:translate-y-px disabled:opacity-45';

export const BTN = {
  primary: `${BTN_BASE} h-10 bg-ink px-5 text-paper hover:opacity-85`,
  clay: `${BTN_BASE} h-10 bg-clay px-5 text-clay-ink hover:brightness-105`,
  ghost: `${BTN_BASE} h-10 border border-line bg-card px-5 text-ink hover:border-ink-3`,
  icon: `${BTN_BASE} h-9 w-9 text-ink-2 hover:bg-sunk hover:text-ink`,
};

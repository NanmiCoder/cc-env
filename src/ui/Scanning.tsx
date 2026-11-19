import { Check } from 'lucide-react';
import { SCAN_STAGES } from '../hooks/useScan';

export default function Scanning({ stage }: { stage: number }) {
  return (
    <section className="grid items-center gap-12 py-14 sm:py-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16" aria-live="polite">
      <div className="min-w-0">
        <p className="num text-[13px] text-ink-3">
          {stage + 1} / {SCAN_STAGES.length}
        </p>
        <h1 className="mt-4 font-serif text-[40px] font-semibold leading-[1.1] tracking-tight sm:text-[60px]">
          正在体检
          <br />
          你的网络环境<span className="blink text-clay">…</span>
        </h1>
        <p className="mt-6 max-w-[32em] text-[17px] leading-[1.75] text-ink-2">
          全程在你的浏览器里完成，通常只需要几秒。公网 IP 默认脱敏显示。
        </p>

        <ol className="mt-10 max-w-xl">
          {SCAN_STAGES.map((item, idx) => {
            const done = idx < stage;
            const active = idx === stage;
            return (
              <li
                key={item.title}
                className={`flex gap-4 border-t border-line py-4 transition-opacity ${done || active ? '' : 'opacity-45'}`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                    done
                      ? 'border-ok bg-ok text-paper'
                      : active
                        ? 'border-clay text-clay'
                        : 'border-line text-ink-3'
                  }`}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : active ? (
                    <span className="blink h-2 w-2 rounded-full bg-clay" />
                  ) : (
                    <span className="num">{idx + 1}</span>
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-[15px] font-medium">{item.title}</div>
                  <div className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{item.hint}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mx-auto hidden w-full max-w-[340px] lg:block" aria-hidden="true">
        <svg viewBox="0 0 200 200" className="w-full">
          <defs>
            <linearGradient id="sweep-fade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--clay)" stopOpacity="0" />
              <stop offset="1" stopColor="var(--clay)" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          {[92, 66, 40].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="var(--line)" strokeWidth="1" />
          ))}
          <line x1="8" y1="100" x2="192" y2="100" stroke="var(--line)" strokeWidth="1" />
          <line x1="100" y1="8" x2="100" y2="192" stroke="var(--line)" strokeWidth="1" />
          <g className="sweep">
            <path d="M100 100 L192 100 A92 92 0 0 0 165 35 Z" fill="url(#sweep-fade)" />
            <line x1="100" y1="100" x2="192" y2="100" stroke="var(--clay)" strokeWidth="1.5" />
          </g>
          <circle cx="100" cy="100" r="4" fill="var(--clay)" />
          <circle cx="146" cy="62" r="3" fill="var(--ink-3)" className="blink" />
          <circle cx="58" cy="128" r="3" fill="var(--ink-3)" className="blink" style={{ animationDelay: '0.4s' }} />
          <circle cx="132" cy="150" r="3" fill="var(--ink-3)" className="blink" style={{ animationDelay: '0.8s' }} />
        </svg>
      </div>
    </section>
  );
}

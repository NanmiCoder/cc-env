import type { CSSProperties, ReactNode } from 'react';
import { Check, Globe, Laptop } from 'lucide-react';
import { SCAN_STAGES } from '../hooks/useScan';
import { Logo } from './shared';

type Phase = 'wait' | 'run' | 'done';

function phaseOf(stage: number, own: number): Phase {
  return stage < own ? 'wait' : stage === own ? 'run' : 'done';
}

/** Shimmer placeholder bar; `w` is any CSS width. */
function Sk({ w, h = 12, delay = 0, className = '' }: { w: string; h?: number; delay?: number; className?: string }) {
  const style: CSSProperties = { width: w, height: h, animationDelay: `${delay}ms` };
  return <span className={`sk ${className}`} style={style} />;
}

function PhaseTag({ phase }: { phase: Phase }) {
  if (phase === 'done') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ok">
        <Check className="h-3 w-3" />
        已取得
      </span>
    );
  }
  if (phase === 'run') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-clay">
        <span className="blink h-1.5 w-1.5 rounded-full bg-clay" />
        探测中
      </span>
    );
  }
  return <span className="text-xs text-ink-3">排队中</span>;
}

function SkSection({
  index,
  title,
  phase,
  children,
}: {
  index: string;
  title: string;
  phase: Phase;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-8 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-8">
        <h2 className="flex items-baseline gap-3 font-serif text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]">
          <span className="num text-xs font-medium text-clay">{index}</span>
          {title}
        </h2>
        <PhaseTag phase={phase} />
      </div>
      {children}
    </section>
  );
}

function SkHop({
  step,
  icon,
  title,
  phase,
  rows,
}: {
  step: string;
  icon: ReactNode;
  title: string;
  phase: Phase;
  rows: string[];
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border bg-card p-5 transition-colors duration-500 sm:p-6 ${
        phase === 'run' ? 'border-clay/50' : 'border-line'
      }`}
    >
      <div className="flex items-center justify-between text-[13px] text-ink-2">
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <span className="num text-xs text-ink-3">{step}</span>
      </div>
      <div className="mt-5">
        <Sk w="68%" h={26} />
        <div className="mt-5 space-y-3">
          {rows.map((label, i) => (
            <div key={label} className="flex items-center justify-between gap-4 text-[13px]">
              <span className="text-ink-3">{label}</span>
              <Sk w={`${34 + ((i * 17) % 28)}%`} delay={(i + 1) * 120} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkLink({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center" aria-hidden="true">
      <svg className="hidden h-3 w-full lg:block" preserveAspectRatio="none">
        <line
          x1="0"
          y1="6"
          x2="100%"
          y2="6"
          stroke={active ? 'var(--clay)' : 'var(--line)'}
          strokeWidth="1.5"
          className="flow"
        />
      </svg>
      <svg className="h-8 w-3 lg:hidden">
        <line
          x1="6"
          y1="0"
          x2="6"
          y2="100%"
          stroke={active ? 'var(--clay)' : 'var(--line)'}
          strokeWidth="1.5"
          className="flow"
        />
      </svg>
    </div>
  );
}

const CATEGORIES = ['地区合规', 'IP 纯净度', '防泄露审计', '环境一致性', '分流与宿主'];
const BYPASSES = ['国内直连', 'DNS 解析', 'WebRTC UDP', 'IPv6', '出口稳定性'];

export default function Scanning({ stage }: { stage: number }) {
  const edge = phaseOf(stage, 0);
  const probes = phaseOf(stage, 1);
  const scoring = phaseOf(stage, 2);

  return (
    <div aria-live="polite" aria-busy="true">
      <section className="pb-12 pt-10 sm:pb-16 sm:pt-16">
        <p className="flex items-center gap-2 text-[13px] text-ink-2">
          <span className="blink h-1.5 w-1.5 rounded-full bg-clay" />
          体检进行中
          <span className="num text-ink-3">
            {Math.min(stage + 1, SCAN_STAGES.length)} / {SCAN_STAGES.length}
          </span>
        </p>

        <div className="mt-6 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          <div className="min-w-0">
            <h1 className="font-serif text-[44px] font-semibold leading-[1.08] tracking-tight sm:text-[68px]">
              正在体检
              <br />
              <span className="text-clay">
                你的网络环境<span className="blink">…</span>
              </span>
            </h1>
            <p className="mt-6 max-w-[34em] text-[17px] leading-[1.75] text-ink-2">
              全程在你的浏览器里完成，通常只需要几秒。公网 IP 默认脱敏显示。
            </p>
          </div>

          <div className="mx-auto hidden w-full max-w-[250px] lg:block" aria-hidden="true">
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
        </div>

        <ol className="mt-10 grid gap-x-8 sm:grid-cols-3">
          {SCAN_STAGES.map((item, idx) => {
            const done = idx < stage;
            const active = idx === stage;
            return (
              <li
                key={item.title}
                className={`flex gap-3 border-t py-4 transition-[opacity,border-color] duration-500 ${
                  done ? 'border-ok' : active ? 'border-clay' : 'border-line opacity-50'
                }`}
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

        <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-6 sm:grid-cols-5" aria-hidden="true">
          {CATEGORIES.map((label, i) => (
            <div key={label} className="min-w-0">
              <dt className="flex items-center gap-2 text-[13px] text-ink-2">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full bg-line ${scoring === 'run' ? 'blink' : ''}`} />
                <span className="truncate">{label}</span>
              </dt>
              <dd className="mt-2">
                <Sk w="64px" h={26} delay={i * 110} />
                <Sk w="100%" h={3} delay={i * 110} className="mt-3 rounded-full" />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="space-y-14 sm:space-y-20" aria-hidden="true">
        <SkSection index="01" title="流量路径" phase={probes === 'wait' ? edge : probes}>
          <div className="grid lg:grid-cols-[minmax(0,1fr)_48px_minmax(0,1.1fr)_48px_minmax(0,1.15fr)]">
            <SkHop
              step="本机"
              icon={<Laptop className="h-4 w-4" />}
              title="浏览器环境"
              phase={edge}
              rows={['时区一致性', '首选语言', '平台']}
            />
            <SkLink active={edge !== 'wait'} />
            <SkHop
              step="出口"
              icon={<Globe className="h-4 w-4" />}
              title="海外代理出口"
              phase={edge}
              rows={['位置', '网络', '性质']}
            />
            <SkLink active={probes !== 'wait'} />
            <SkHop
              step="目的地"
              icon={<Logo className="h-4 w-4 text-clay" />}
              title="Anthropic"
              phase={probes}
              rows={['claude.ai', 'api.anthropic.com', 'platform.claude.com']}
            />
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h3 className="text-sm font-semibold">旁路检查</h3>
              <PhaseTag phase={probes} />
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
              {BYPASSES.map((label, i) => (
                <div key={label} className="min-w-0 bg-card p-5">
                  <div className="text-[13px] text-ink-2">{label}</div>
                  <Sk w="58%" h={20} delay={i * 110} className="mt-3" />
                  <Sk w="82%" delay={i * 110 + 80} className="mt-4" />
                  <Sk w="46%" delay={i * 110 + 160} className="mt-2" />
                </div>
              ))}
            </div>
          </div>
        </SkSection>

        <SkSection index="02" title="审计明细" phase={scoring}>
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="grid gap-6 rounded-2xl border border-line bg-card p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]"
              >
                <div>
                  <Sk w="96px" delay={i * 150} />
                  <Sk w={i === 0 ? '62%' : '48%'} h={24} delay={i * 150 + 60} className="mt-4" />
                  <Sk w="92%" delay={i * 150 + 120} className="mt-5" />
                  <Sk w="70%" delay={i * 150 + 180} className="mt-2.5" />
                </div>
                <div className="hidden lg:block">
                  <Sk w="40px" delay={i * 150 + 120} />
                  <Sk w="64px" h={16} delay={i * 150 + 180} className="mt-3" />
                  <Sk w="84%" delay={i * 150 + 240} className="mt-6" />
                </div>
              </div>
            ))}
          </div>
        </SkSection>
      </div>
    </div>
  );
}

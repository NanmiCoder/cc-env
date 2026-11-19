import { useEffect, useState } from 'react';
import { Bot, Check, Copy, Share2 } from 'lucide-react';
import type { FullReport } from '../hooks/useScan';
import type { RiskGrade } from '../types/telemetry';
import { BTN, Dot, GRADE_TONE, SEVERITY_TONE, TONE_BG, TONE_TEXT } from './shared';

const LADDER: Array<{ grade: RiskGrade; label: string }> = [
  { grade: 'F', label: '受限' },
  { grade: 'C', label: '高危' },
  { grade: 'B', label: '轻度' },
  { grade: 'A', label: '优质' },
  { grade: 'S', label: '极净' },
];

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export default function Verdict({
  report,
  promptCopied,
  onCopyPrompt,
  reportCopied,
  onCopyReport,
  onShare,
}: {
  report: FullReport;
  promptCopied: boolean;
  onCopyPrompt: () => void;
  reportCopied: boolean;
  onCopyReport: () => void;
  onShare: () => void;
}) {
  const { assessment, server } = report;
  const tone = GRADE_TONE[assessment.grade];
  const score = useCountUp(assessment.score);
  const [head, tail] = assessment.gradeLabel.split(' · ');
  const issues = assessment.findings.filter(
    (f) => f.severity === 'danger' || f.severity === 'warn'
  ).length;

  return (
    <section className="pb-12 pt-10 sm:pb-16 sm:pt-16">
      <p className="rise flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
        <span className="inline-flex items-center gap-2">
          <Dot tone={tone} />
          体检完成
        </span>
        <span className="num text-ink-3">{report.scannedAt}</span>
        <span className="num text-ink-3">
          COLO {server.edge.colo}
          {server.edge.clientTcpRtt !== null && ` · ${server.edge.clientTcpRtt} ms`}
        </span>
      </p>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        <div className="rise min-w-0" style={{ ['--i' as string]: 1 }}>
          <h1 className="font-serif text-[44px] font-semibold leading-[1.08] tracking-tight sm:text-[68px]">
            {head}
            {tail && (
              <>
                <br />
                <span className={TONE_TEXT[tone]}>{tail}</span>
              </>
            )}
          </h1>
          <p className="mt-6 max-w-[34em] text-[17px] leading-[1.75] text-ink-2">
            {assessment.gradeSummary}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" onClick={onCopyPrompt} className={BTN.clay}>
              {promptCopied ? <Check className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              {promptCopied ? '已复制，去粘贴给 Agent' : '复制 Agent 修复 Prompt'}
            </button>
            <button type="button" onClick={onShare} className={BTN.ghost}>
              <Share2 className="h-4 w-4" />
              分享海报
            </button>
            <button
              type="button"
              onClick={onCopyReport}
              className="inline-flex h-10 items-center gap-2 px-2 text-sm text-ink-2 underline decoration-line underline-offset-4 transition hover:text-ink hover:decoration-ink-3"
            >
              {reportCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {reportCopied ? '已复制' : '复制文字报告'}
            </button>
          </div>
        </div>

        <div className="rise" style={{ ['--i' as string]: 2 }}>
          <div className="flex items-end justify-between gap-4 border-b border-line pb-5">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[112px] font-medium leading-[0.82] tracking-[-0.04em] sm:text-[136px]">
                {score}
              </span>
              <span className="num text-base text-ink-3">/100</span>
            </div>
            <div className="pb-1 text-right">
              <div className={`font-serif text-5xl font-semibold leading-none ${TONE_TEXT[tone]}`}>
                {assessment.grade}
              </div>
              <div className="mt-2 text-xs text-ink-3">综合评级</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-5 gap-1.5" role="img" aria-label={`评级 ${assessment.grade}`}>
            {LADDER.map((step) => {
              const active = step.grade === assessment.grade;
              return (
                <div key={step.grade}>
                  <div className={`h-1.5 rounded-full ${active ? TONE_BG[tone] : 'bg-line'}`} />
                  <div
                    className={`mt-2 flex items-baseline gap-1 text-xs ${active ? 'font-semibold text-ink' : 'text-ink-3'}`}
                  >
                    <span className="num">{step.grade}</span>
                    <span>{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-ink-2">
            出口类型：<span className="font-medium text-ink">{assessment.ipTierLabel}</span>
            <span className="mx-2 text-line">|</span>
            {issues > 0 ? (
              <a href="#audit" className="underline decoration-line underline-offset-4 hover:decoration-clay">
                {issues} 项需要处理
              </a>
            ) : (
              '没有需要处理的问题'
            )}
          </p>
        </div>
      </div>

      <dl
        className="rise mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-6 sm:mt-16 sm:grid-cols-5"
        style={{ ['--i' as string]: 3 }}
      >
        {assessment.categories.map((cat) => {
          const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
          const catTone = SEVERITY_TONE[cat.status];
          return (
            <div key={cat.key} className="min-w-0">
              <dt className="flex items-center gap-2 text-[13px] text-ink-2">
                <Dot tone={catTone} />
                <span className="truncate">{cat.label}</span>
              </dt>
              <dd className="mt-2">
                <span className="num text-2xl font-medium">{cat.score}</span>
                <span className="num text-sm text-ink-3"> / {cat.maxScore}</span>
                <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full rounded-full ${catTone === 'mute' ? 'bg-ink-2' : TONE_BG[catTone]}`}
                    style={{ width: `${pct}%`, transition: 'width 0.9s cubic-bezier(0.2,0.7,0.2,1)' }}
                  />
                </div>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

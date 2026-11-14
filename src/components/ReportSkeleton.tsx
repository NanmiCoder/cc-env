import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function ReportSkeleton({ stageText }: { stageText: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* Unified Split Hero + Risk Instrument Skeleton (height-matched to loaded Hero) */}
      <section className="surface-card overflow-hidden rounded-2xl">
        <div className="grid grid-cols-1 divide-y divide-[var(--border-soft)] lg:grid-cols-[1.2fr_0.85fr] lg:divide-x lg:divide-y-0">
          {/* Left: Title + 3-Point Exit Strip */}
          <div className="flex flex-col justify-between p-5 sm:p-6">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="h-3 w-48 animate-pulse rounded bg-[#D97757]/25" />
                <div className="h-3 w-14 animate-pulse rounded bg-[var(--border-soft)]" />
              </div>
              <div className="mt-3 h-8 w-4/5 animate-pulse rounded-md bg-[var(--border-subtle)]" />
              <div className="mt-2.5 h-4 w-11/12 animate-pulse rounded bg-[var(--border-soft)]" />
            </div>

            <div className="mt-6 grid grid-cols-1 divide-y divide-[var(--border-soft)] border-t border-[var(--border-soft)] pt-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="py-2 sm:px-4 sm:py-0 sm:first:pl-0 sm:last:pr-0">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-16 animate-pulse rounded bg-[var(--border-soft)]" />
                    <div className="h-3 w-10 animate-pulse rounded bg-[var(--border-soft)]" />
                  </div>
                  <div className="mt-2 h-5 w-28 animate-pulse rounded bg-[var(--border-subtle)]" />
                  <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-[var(--border-soft)]" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Risk Gauge + Segmented Scale */}
          <div className="flex flex-col justify-between gap-5 bg-[var(--bg-inner)]/45 p-5 sm:p-6">
            <div className="flex items-center gap-5">
              <div className="h-28 w-28 shrink-0 animate-pulse rounded-full border-[6px] border-[var(--border-subtle)]" />
              <div className="flex-1 space-y-2.5">
                <div className="flex gap-1.5">
                  <div className="h-5 w-24 animate-pulse rounded-md bg-[var(--border-subtle)]" />
                  <div className="h-5 w-20 animate-pulse rounded-md bg-[var(--border-soft)]" />
                </div>
                <div className="h-3.5 w-full animate-pulse rounded bg-[var(--border-soft)]" />
                <div className="h-3.5 w-4/5 animate-pulse rounded bg-[var(--border-soft)]" />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between">
                <div className="h-2.5 w-16 animate-pulse rounded bg-[var(--border-soft)]" />
                <div className="h-2.5 w-28 animate-pulse rounded bg-[var(--border-soft)]" />
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="h-10 animate-pulse rounded-md bg-[var(--border-soft)]" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5 Category Meters Strip Skeleton */}
        <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] px-5 py-4 sm:grid-cols-5 sm:px-6">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-14 animate-pulse rounded bg-[var(--border-soft)]" />
                <div className="h-3 w-9 animate-pulse rounded bg-[var(--border-subtle)]" />
              </div>
              <div className="h-1.5 w-full animate-pulse rounded-full bg-[var(--border-subtle)]" />
            </div>
          ))}
        </div>

        {/* Live Scan-Beam Status Strip (occupies exact slot of Agent Prompt Strip) */}
        <div className="relative overflow-hidden border-t border-[var(--border-soft)] bg-[#D97757]/[0.06] px-5 py-3.5 sm:px-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#D97757]/20 to-transparent animate-scan-beam" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Activity className="h-4 w-4 animate-pulse text-[#D97757]" />
              <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
                {stageText}
              </span>
            </div>
            <span className="hidden font-mono text-[11px] text-[var(--text-muted)] sm:inline">
              并发探测中...
            </span>
          </div>
        </div>
      </section>

      {/* 2x2 Core Telemetry Matrix Skeleton */}
      <section className="surface-card grid grid-cols-1 divide-y divide-[var(--border-soft)] overflow-hidden rounded-2xl md:grid-cols-2 md:divide-y-0">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`min-w-0 space-y-3.5 p-5 ${
              idx < 2 ? 'md:border-b md:border-[var(--border-soft)]' : ''
            } ${idx % 2 === 0 ? 'md:border-r md:border-[var(--border-soft)]' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 animate-pulse rounded bg-[var(--border-subtle)]" />
              <div className="h-4 w-14 animate-pulse rounded bg-[var(--border-soft)]" />
            </div>
            <div className="space-y-2.5 pt-0.5">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="flex justify-between">
                  <div className="h-3 w-16 animate-pulse rounded bg-[var(--border-soft)]" />
                  <div className="h-3 w-28 animate-pulse rounded bg-[var(--border-subtle)]" />
                </div>
              ))}
            </div>
            {idx === 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-[var(--border-soft)] pt-3">
                {[0, 1, 2, 3, 4].map((tag) => (
                  <div key={tag} className="h-5 w-14 animate-pulse rounded-md bg-[var(--border-soft)]" />
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Anthropic Multi-Endpoint Reachability Skeleton */}
      <section className="surface-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
          <div className="h-4 w-48 animate-pulse rounded bg-[var(--border-subtle)]" />
          <div className="h-3 w-32 animate-pulse rounded bg-[var(--border-soft)]" />
        </div>
        <div className="grid grid-cols-1 divide-y divide-[var(--border-soft)] md:grid-cols-3 md:divide-x md:divide-y-0">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="space-y-2.5 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-32 animate-pulse rounded bg-[var(--border-subtle)]" />
                <div className="h-5 w-14 animate-pulse rounded-md bg-[var(--border-soft)]" />
              </div>
              <div className="h-3 w-36 animate-pulse rounded bg-[var(--border-soft)]" />
              <div className="h-3 w-full animate-pulse rounded bg-[var(--border-soft)]" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--border-soft)]" />
            </div>
          ))}
        </div>
      </section>

      {/* Claude Code CLI Guard Skeleton */}
      <section className="surface-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
          <div className="h-4 w-44 animate-pulse rounded bg-[var(--border-subtle)]" />
          <div className="h-7 w-32 animate-pulse rounded-lg bg-[var(--border-soft)]" />
        </div>
        <div className="grid grid-cols-1 divide-y divide-[var(--border-soft)] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="space-y-2.5 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="h-4 w-14 animate-pulse rounded bg-[var(--border-soft)]" />
                <div className="h-3 w-6 animate-pulse rounded bg-[var(--border-soft)]" />
              </div>
              <div className="h-3.5 w-44 animate-pulse rounded bg-[var(--border-subtle)]" />
              <div className="h-3 w-28 animate-pulse rounded bg-[var(--border-soft)]" />
              <div className="h-3 w-full animate-pulse rounded bg-[var(--border-soft)]" />
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--border-soft)] bg-[var(--bg-inner)]/60 px-5 py-3">
          <div className="h-3.5 w-5/6 animate-pulse rounded bg-[var(--border-soft)]" />
        </div>
      </section>

      {/* Audit Findings & Remediation 3:2 Split Skeleton */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="surface-card overflow-hidden rounded-2xl lg:col-span-3">
          <div className="border-b border-[var(--border-subtle)] px-5 py-3.5">
            <div className="h-4 w-28 animate-pulse rounded bg-[var(--border-subtle)]" />
          </div>
          <div className="divide-y divide-[var(--border-soft)]">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="space-y-2 px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-48 animate-pulse rounded bg-[var(--border-subtle)]" />
                  <div className="h-3.5 w-12 animate-pulse rounded bg-[var(--border-soft)]" />
                </div>
                <div className="h-3 w-11/12 animate-pulse rounded bg-[var(--border-soft)]" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--border-soft)]" />
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card overflow-hidden rounded-2xl lg:col-span-2">
          <div className="border-b border-[var(--border-subtle)] px-5 py-3.5">
            <div className="h-4 w-28 animate-pulse rounded bg-[var(--border-subtle)]" />
          </div>
          <div className="divide-y divide-[var(--border-soft)]">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="flex gap-3 px-5 py-3.5">
                <div className="h-5 w-5 shrink-0 animate-pulse rounded-md bg-[#D97757]/20" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full animate-pulse rounded bg-[var(--border-soft)]" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--border-soft)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}

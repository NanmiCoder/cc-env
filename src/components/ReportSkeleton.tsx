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
      {/* Futuristic Scan-Beam Status Bar */}
      <div className="relative overflow-hidden rounded-xl border border-[#D97757]/30 bg-[#D97757]/[0.08] px-4 py-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#D97757]/25 to-transparent animate-scan-beam" />
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

      {/* Top 3-Column Exit Comparison Skeleton */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
          >
            <div className="mb-2.5 flex items-center justify-between">
              <div className="h-3.5 w-24 animate-pulse rounded bg-current opacity-15" />
              <div className="h-4 w-16 animate-pulse rounded bg-current opacity-10" />
            </div>
            <div className="h-7 w-40 animate-pulse rounded bg-current opacity-20" />
            <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-current opacity-10" />
          </div>
        ))}
      </section>

      {/* Hero Score & 5-Tier Grade Skeleton */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="h-36 w-36 shrink-0 animate-pulse rounded-full border-8 border-[var(--border-subtle)] bg-[var(--bg-inner)]" />
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="h-6 w-28 animate-pulse rounded-md bg-current opacity-15" />
                <div className="h-6 w-28 animate-pulse rounded-md bg-current opacity-10" />
              </div>
              <div className="h-4 w-80 max-w-full animate-pulse rounded bg-current opacity-15" />
              <div className="h-4 w-60 max-w-full animate-pulse rounded bg-current opacity-10" />
            </div>
          </div>

          <div className="w-full shrink-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inner)] p-3.5 lg:w-80">
            <div className="mb-2.5 flex justify-between">
              <div className="h-3 w-20 animate-pulse rounded bg-current opacity-15" />
              <div className="h-3 w-24 animate-pulse rounded bg-current opacity-10" />
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[0, 1, 2, 3, 4].map((g) => (
                <div
                  key={g}
                  className="h-12 animate-pulse rounded-lg border border-[var(--border-soft)] bg-current opacity-10"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--border-subtle)] pt-5 sm:grid-cols-5">
          {[0, 1, 2, 3, 4].map((c) => (
            <div
              key={c}
              className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3"
            >
              <div className="flex justify-between">
                <div className="h-3 w-14 animate-pulse rounded bg-current opacity-15" />
                <div className="h-3 w-9 animate-pulse rounded bg-current opacity-15" />
              </div>
              <div className="mt-2.5 h-1.5 w-full animate-pulse rounded-full bg-current opacity-15" />
            </div>
          ))}
        </div>
      </section>

      {/* 4-Column Telemetry Skeleton (matches real card heights) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <div
            key={card}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="h-4 w-28 animate-pulse rounded bg-current opacity-15" />
              <div className="h-4 w-12 animate-pulse rounded bg-current opacity-10" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-3.5 w-16 animate-pulse rounded bg-current opacity-10" />
                <div className="h-3.5 w-24 animate-pulse rounded bg-current opacity-15" />
              </div>
              <div className="flex justify-between">
                <div className="h-3.5 w-14 animate-pulse rounded bg-current opacity-10" />
                <div className="h-3.5 w-28 animate-pulse rounded bg-current opacity-15" />
              </div>
              <div className="flex justify-between">
                <div className="h-3.5 w-16 animate-pulse rounded bg-current opacity-10" />
                <div className="h-3.5 w-20 animate-pulse rounded bg-current opacity-15" />
              </div>
              <div className="flex justify-between">
                <div className="h-3.5 w-20 animate-pulse rounded bg-current opacity-10" />
                <div className="h-3.5 w-16 animate-pulse rounded bg-current opacity-15" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Anthropic Multi-Endpoint & CLI Advisor Skeleton */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-48 animate-pulse rounded bg-current opacity-15" />
          <div className="h-5 w-28 animate-pulse rounded-full bg-current opacity-10" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[0, 1, 2].map((ep) => (
            <div
              key={ep}
              className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3.5"
            >
              <div className="flex justify-between">
                <div className="h-3.5 w-32 animate-pulse rounded bg-current opacity-15" />
                <div className="h-4 w-14 animate-pulse rounded bg-current opacity-10" />
              </div>
              <div className="mt-2.5 h-3 w-40 animate-pulse rounded bg-current opacity-10" />
              <div className="mt-2.5 h-3 w-full animate-pulse rounded bg-current opacity-10" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-44 animate-pulse rounded bg-current opacity-15" />
          <div className="h-7 w-36 animate-pulse rounded-full bg-current opacity-10" />
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {[0, 1, 2].map((cli) => (
            <div
              key={cli}
              className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3.5"
            >
              <div className="h-4 w-16 animate-pulse rounded bg-current opacity-15" />
              <div className="mt-2.5 h-3.5 w-48 animate-pulse rounded bg-current opacity-15" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-current opacity-10" />
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Audit Findings & Recommendations Skeleton (full-height match) */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 lg:col-span-2">
          <div className="mb-4 h-4 w-28 animate-pulse rounded bg-current opacity-15" />
          <div className="space-y-2.5">
            {[0, 1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3.5"
              >
                <div className="flex justify-between">
                  <div className="h-4 w-44 animate-pulse rounded bg-current opacity-15" />
                  <div className="h-3.5 w-14 animate-pulse rounded bg-current opacity-10" />
                </div>
                <div className="mt-2.5 h-3 w-5/6 animate-pulse rounded bg-current opacity-10" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="mb-4 h-4 w-28 animate-pulse rounded bg-current opacity-15" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((rec) => (
              <div
                key={rec}
                className="flex gap-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3"
              >
                <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-current opacity-15" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-current opacity-10" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-current opacity-10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}

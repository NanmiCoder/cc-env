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
      {/* Scan-Beam Status Strip */}
      <div className="relative overflow-hidden rounded-xl border border-[#D97757]/25 bg-[#D97757]/[0.06] px-4 py-3">
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

      {/* Unified Split Hero + Score Instrument Skeleton */}
      <section className="surface-card overflow-hidden rounded-2xl">
        <div className="grid grid-cols-1 divide-y divide-[var(--border-soft)] lg:grid-cols-[1.2fr_0.8fr] lg:divide-x lg:divide-y-0">
          <div className="space-y-5 p-6">
            <div className="space-y-2.5">
              <div className="h-3 w-44 animate-pulse rounded bg-[var(--border-subtle)]" />
              <div className="h-8 w-3/4 animate-pulse rounded bg-[var(--border-subtle)]" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--border-soft)]" />
            </div>

            <div className="grid grid-cols-1 divide-y divide-[var(--border-soft)] border-t border-[var(--border-soft)] pt-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="py-2 sm:px-4 sm:first:pl-0 sm:last:pr-0">
                  <div className="h-3 w-20 animate-pulse rounded bg-[var(--border-soft)]" />
                  <div className="mt-2 h-5 w-28 animate-pulse rounded bg-[var(--border-subtle)]" />
                  <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-[var(--border-soft)]" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 p-6">
            <div className="flex items-center gap-5">
              <div className="h-28 w-28 shrink-0 animate-pulse rounded-full border-4 border-[var(--border-subtle)]" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-24 animate-pulse rounded bg-[var(--border-subtle)]" />
                <div className="h-4 w-32 animate-pulse rounded bg-[var(--border-soft)]" />
                <div className="h-3 w-full animate-pulse rounded bg-[var(--border-soft)]" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div key={idx} className="h-9 animate-pulse rounded-md bg-[var(--border-soft)]" />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] px-6 py-4 sm:grid-cols-5">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-14 animate-pulse rounded bg-[var(--border-soft)]" />
                <div className="h-3 w-8 animate-pulse rounded bg-[var(--border-subtle)]" />
              </div>
              <div className="h-1.5 w-full animate-pulse rounded-full bg-[var(--border-subtle)]" />
            </div>
          ))}
        </div>
      </section>

      {/* 2x2 Telemetry Matrix Skeleton */}
      <section className="surface-card grid grid-cols-1 divide-y divide-[var(--border-soft)] overflow-hidden rounded-2xl md:grid-cols-2 md:divide-x">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 animate-pulse rounded bg-[var(--border-subtle)]" />
              <div className="h-4 w-14 animate-pulse rounded bg-[var(--border-soft)]" />
            </div>
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between">
                <div className="h-3 w-16 animate-pulse rounded bg-[var(--border-soft)]" />
                <div className="h-3 w-28 animate-pulse rounded bg-[var(--border-subtle)]" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-14 animate-pulse rounded bg-[var(--border-soft)]" />
                <div className="h-3 w-24 animate-pulse rounded bg-[var(--border-subtle)]" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 animate-pulse rounded bg-[var(--border-soft)]" />
                <div className="h-3 w-20 animate-pulse rounded bg-[var(--border-soft)]" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </motion.div>
  );
}

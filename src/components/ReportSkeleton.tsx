import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Globe,
  Laptop,
  Network,
  Server,
  ShieldCheck,
  Terminal,
  Wifi,
} from 'lucide-react';
import SpotlightSurface from './SpotlightSurface';

const SKELETON_CASCADE = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const SKELETON_ITEM = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const CATEGORY_LABELS = ['地区合规', 'IP 纯净度', '防泄露审计', '环境一致性', '分流与宿主'];

const RISK_LADDER = [
  { grade: 'F', label: '受限' },
  { grade: 'C', label: '高危' },
  { grade: 'B', label: '轻度' },
  { grade: 'A', label: '优质' },
  { grade: 'S', label: '极净' },
];

const BOOL_TAGS = ['机房', 'VPN', 'Proxy', 'Tor', '滥用库'];

const ENDPOINT_SLOTS = [
  { domain: 'claude.ai', label: 'Web 对话端', policy: 'CF Bot / 严格' },
  { domain: 'api.anthropic.com', label: 'API / CLI 接口', policy: '边缘直通 / 较宽松' },
  { domain: 'platform.claude.com', label: 'OAuth / Console', policy: 'CF WAF / 严控' },
];

const CLI_SLOTS = [
  'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC',
  'DISABLE_TELEMETRY',
  'DISABLE_ERROR_REPORTING',
];

const PROBE_STEPS = [
  { key: 'edge', label: 'Cloudflare Edge', stage: 1 },
  { key: 'cn', label: '国内直连', stage: 2 },
  { key: 'dns', label: 'DNS 泄露', stage: 2 },
  { key: 'webrtc', label: 'WebRTC UDP', stage: 2 },
  { key: 'claude', label: 'Claude 端点', stage: 2 },
];

const ShimmerBar = memo(function ShimmerBar({
  className = '',
  strong = false,
}: {
  className?: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`rounded ${strong ? 'skeleton-shimmer-strong' : 'skeleton-shimmer'} ${className}`}
    />
  );
});

const RadarRingSkeleton = memo(function RadarRingSkeleton({
  stageNum,
}: {
  stageNum: number;
}) {
  const stageLabel = `${Math.min(Math.max(stageNum, 1), 3)}/3`;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <svg className="h-28 w-28" viewBox="0 0 112 112" aria-hidden="true">
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth="6"
        />
        <circle
          cx="56"
          cy="56"
          r="35"
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      </svg>

      <motion.svg
        className="absolute inset-0 h-28 w-28"
        viewBox="0 0 112 112"
        aria-hidden="true"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
      >
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="var(--text-primary)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`72 ${circumference - 72}`}
        />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="var(--text-primary)"
          strokeOpacity="0.22"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`34 ${circumference - 34}`}
          strokeDashoffset="-76"
        />
      </motion.svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {stageLabel}
        </span>
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          SCANNING
        </span>
        <div className="mt-1.5 flex items-center gap-1">
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={`h-1 w-2.5 rounded-full transition-colors ${
                step <= stageNum ? 'bg-[var(--text-primary)]' : 'bg-[var(--border-subtle)]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

function parseStageNum(stageText: string): number {
  const match = stageText.match(/^(\d)\/3/);
  if (match) return Number(match[1]);
  return 1;
}

export default function ReportSkeleton({ stageText }: { stageText: string }) {
  const stageNum = parseStageNum(stageText);

  return (
    <motion.div
      variants={SKELETON_CASCADE}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Unified Split Hero + Calibrated Risk Instrument Skeleton */}
      <motion.section variants={SKELETON_ITEM}>
        <SpotlightSurface>
        <div className="grid grid-cols-1 divide-y divide-[var(--border-soft)] lg:grid-cols-[1.2fr_0.85fr] lg:divide-x lg:divide-y-0">
          {/* Left: Real Editorial Chrome + Shimmer Exit Values */}
          <div className="flex flex-col justify-between p-5 sm:p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-primary)]" />
                  Anthropic Environment Telemetry
                </span>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">探测中...</span>
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-[28px] sm:leading-tight">
                Anthropic 网络环境与 IP 纯净度自检
              </h1>
              <p className="mt-2 max-w-[60ch] text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                正在并发执行边缘遥测、分流识别、DNS / WebRTC 泄露与端点可达性检测，请稍候...
              </p>
            </div>

            {/* 3-Point Exit Strip with Real Labels */}
            <div className="mt-6 grid grid-cols-1 divide-y divide-[var(--border-soft)] border-t border-[var(--border-soft)] pt-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {['国内直连出口', '海外代理出口', '出口稳定性'].map((label, idx) => (
                <div
                  key={label}
                  className={`py-2 sm:py-0 ${
                    idx === 0 ? 'sm:pr-4' : idx === 1 ? 'sm:px-4' : 'sm:pl-4'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">探测中</span>
                  </div>
                  <ShimmerBar strong className="mt-1.5 h-5 w-28" />
                  <ShimmerBar className="mt-1.5 h-3 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live Radar Gauge + Standby Risk Ladder */}
          <div className="flex flex-col justify-between gap-5 bg-[var(--bg-inner)]/70 p-5 sm:p-6">
            <div className="flex items-center gap-5">
              <RadarRingSkeleton stageNum={stageNum} />

              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <ShimmerBar strong className="h-5 w-28" />
                  <ShimmerBar className="h-5 w-20" />
                </div>
                <ShimmerBar className="h-3.5 w-full" />
                <ShimmerBar className="h-3.5 w-4/5" />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-[var(--text-muted)]">
                <span>风控档位标尺</span>
                <span>CALIBRATING...</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {RISK_LADDER.map((item, idx) => (
                  <div
                    key={item.grade}
                    style={{ opacity: 0.45 + idx * 0.08 }}
                    className="flex flex-col items-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] py-1.5 text-center text-[var(--text-muted)]"
                  >
                    <span className="font-mono text-xs font-bold">{item.grade}</span>
                    <span className="text-[9px]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5 Category Meters Strip with Real Labels */}
        <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] px-5 py-4 sm:grid-cols-5 sm:px-6">
          {CATEGORY_LABELS.map((label) => (
            <div key={label} className="min-w-0">
              <div className="flex items-center justify-between text-[11px]">
                <span className="truncate text-[var(--text-muted)]">{label}</span>
                <span className="shrink-0 font-mono text-[var(--text-muted)]">--</span>
              </div>
              <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--ring-track)]">
                <div className="h-full w-2/5 rounded-full bg-[var(--text-muted)]/35 skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>

        {/* Live Concurrent Probe Checklist Strip */}
        <div className="relative overflow-hidden border-t border-[var(--border-soft)] bg-[var(--bg-inner)]/80 px-5 py-3.5 sm:px-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[var(--text-primary)]/[0.05] to-transparent animate-scan-beam" />
          <div className="relative flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--text-primary)]" />
              <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
                {stageText}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {PROBE_STEPS.map((probe) => {
                const isDone = stageNum > probe.stage || stageNum === 3;
                const isActive = !isDone && stageNum === probe.stage;

                return (
                  <span
                    key={probe.key}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                      isDone
                        ? 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                        : isActive
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                          : 'border-[var(--border-soft)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-60'
                    }`}
                  >
                    {isDone ? (
                      <Check className="h-2.5 w-2.5 text-emerald-500" />
                    ) : (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive ? 'bg-[var(--accent-fg)]' : 'bg-[var(--text-muted)]'
                        }`}
                      />
                    )}
                    {probe.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        </SpotlightSurface>
      </motion.section>

      {/* 2x2 Core Telemetry Matrix with Real Headers & Keys */}
      <motion.section variants={SKELETON_ITEM}>
        <SpotlightSurface>
        <div className="grid grid-cols-1 divide-y divide-[var(--border-soft)] md:grid-cols-2 md:divide-y-0">
        {/* Q1: IP & Security */}
        <div className="min-w-0 p-5 md:border-b md:border-r md:border-[var(--border-soft)]">
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Globe className="h-4 w-4 text-[var(--text-muted)]" />
              <span>IP 属性与安全</span>
            </div>
            <ShimmerBar className="h-4 w-16" />
          </div>
          <dl className="space-y-2 text-xs">
            {[
              ['网络性质', 'w-28'],
              ['ISP / 机构', 'w-36'],
              ['ASN', 'w-20'],
              ['IPv6', 'w-24'],
            ].map(([label, width]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <dt className="text-[var(--text-muted)]">{label}</dt>
                <ShimmerBar strong className={`h-3.5 ${width}`} />
              </div>
            ))}
          </dl>
          <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-[var(--border-soft)] pt-3">
            {BOOL_TAGS.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md border border-[var(--border-soft)] bg-[var(--bg-inner)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-muted)]"
              >
                {tag}: --
              </span>
            ))}
          </div>
        </div>

        {/* Q2: DNS Leak */}
        <div className="min-w-0 p-5 md:border-b md:border-[var(--border-soft)]">
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Server className="h-4 w-4 text-[var(--text-muted)]" />
              <span>DNS 泄露检测</span>
            </div>
            <span className="rounded-md bg-[var(--bg-inner)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
              探测中
            </span>
          </div>
          <dl className="space-y-2 text-xs">
            {[
              ['DNS 出口', 'w-28'],
              ['归属地', 'w-32'],
              ['EDNS 网段', 'w-24'],
            ].map(([label, width]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <dt className="text-[var(--text-muted)]">{label}</dt>
                <ShimmerBar strong className={`h-3.5 ${width}`} />
              </div>
            ))}
          </dl>
        </div>

        {/* Q3: WebRTC UDP */}
        <div className="min-w-0 p-5 md:border-r md:border-[var(--border-soft)]">
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Network className="h-4 w-4 text-[var(--text-muted)]" />
              <span>WebRTC UDP</span>
            </div>
            <span className="rounded-md bg-[var(--bg-inner)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
              探测中
            </span>
          </div>
          <dl className="space-y-2 text-xs">
            {[
              ['UDP 出口', 'w-32'],
              ['归属地', 'w-28'],
              ['运营商', 'w-24'],
            ].map(([label, width]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <dt className="text-[var(--text-muted)]">{label}</dt>
                <ShimmerBar strong className={`h-3.5 ${width}`} />
              </div>
            ))}
          </dl>
        </div>

        {/* Q4: Reachability & Fingerprint */}
        <div className="min-w-0 p-5">
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Laptop className="h-4 w-4 text-[var(--text-muted)]" />
              <span>生态可达与指纹</span>
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">RTT / Locale</span>
          </div>
          <div className="space-y-2 text-xs">
            {['Cloudflare Edge', 'claude.ai', 'api.anthropic.com', '国内直连基准'].map((ep) => (
              <div key={ep} className="flex items-center justify-between gap-2">
                <span className="text-[var(--text-secondary)]">{ep}</span>
                <ShimmerBar className="h-3.5 w-14" />
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 border-t border-[var(--border-soft)] pt-2">
              <span className="text-[var(--text-muted)]">时区 / 语言</span>
              <ShimmerBar strong className="h-3.5 w-36" />
            </div>
          </div>
        </div>
        </div>
        </SpotlightSurface>
      </motion.section>

      {/* Anthropic Multi-Endpoint Reachability */}
      <motion.section variants={SKELETON_ITEM}>
        <SpotlightSurface>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-[var(--text-muted)]" />
            <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Anthropic 多端点可达性与策略差异
            </h2>
          </div>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            Web / API / OAuth 独立探测
          </span>
        </div>
        <div className="grid grid-cols-1 divide-y divide-[var(--border-soft)] md:grid-cols-3 md:divide-x md:divide-y-0">
          {ENDPOINT_SLOTS.map((ep) => (
            <div key={ep.domain} className="min-w-0 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs font-semibold text-[var(--text-primary)]">
                  {ep.domain}
                </span>
                <ShimmerBar className="h-5 w-14 shrink-0" />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-medium text-[var(--text-secondary)]">{ep.label}</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">{ep.policy}</span>
              </div>
              <ShimmerBar className="mt-2.5 h-3 w-full" />
              <ShimmerBar className="mt-1.5 h-3 w-4/5" />
            </div>
          ))}
        </div>
        </SpotlightSurface>
      </motion.section>

      {/* Claude Code CLI Guard */}
      <motion.section variants={SKELETON_ITEM}>
        <SpotlightSurface>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[var(--text-muted)]" />
            <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Claude Code CLI 防风控配置建议
            </h2>
          </div>
          <ShimmerBar className="h-7 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 divide-y divide-[var(--border-soft)] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {CLI_SLOTS.map((envKey) => (
            <div key={envKey} className="min-w-0 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <ShimmerBar className="h-4 w-14" />
                <span className="font-mono text-[11px] text-[var(--text-muted)]">=1</span>
              </div>
              <div className="mt-2.5 truncate font-mono text-xs font-semibold text-[var(--text-primary)]">
                {envKey}
              </div>
              <ShimmerBar className="mt-2 h-3 w-3/4" />
              <ShimmerBar className="mt-1.5 h-3 w-full" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2.5 border-t border-[var(--border-soft)] bg-[var(--bg-inner)]/60 px-5 py-3 text-xs text-[var(--text-muted)]">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
          <ShimmerBar className="h-3.5 w-4/5" />
        </div>
        </SpotlightSurface>
      </motion.section>

      {/* Audit Findings & Remediation 3:2 Split */}
      <motion.section
        variants={SKELETON_ITEM}
        className="grid grid-cols-1 gap-5 lg:grid-cols-5"
      >
        <SpotlightSurface className="lg:col-span-3">
          <div className="border-b border-[var(--border-subtle)] px-5 py-3.5">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              风控审计明细
            </h2>
          </div>
          <div className="divide-y divide-[var(--border-soft)]">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="space-y-2 px-5 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <ShimmerBar strong className="h-4 w-52" />
                  <ShimmerBar className="h-3.5 w-12" />
                </div>
                <ShimmerBar className="h-3 w-11/12" />
                <ShimmerBar className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </SpotlightSurface>

        <SpotlightSurface className="lg:col-span-2">
          <div className="border-b border-[var(--border-subtle)] px-5 py-3.5">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              修复与防封建议
            </h2>
          </div>
          <div className="divide-y divide-[var(--border-soft)]">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex gap-3 px-5 py-3.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-inner)] font-mono text-[11px] font-bold text-[var(--text-primary)]">
                  {num}
                </span>
                <div className="flex-1 space-y-1.5">
                  <ShimmerBar strong className="h-3 w-full" />
                  <ShimmerBar className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </SpotlightSurface>
      </motion.section>
    </motion.div>
  );
}

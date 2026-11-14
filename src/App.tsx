import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  FlaskConical,
  Globe,
  Info,
  Laptop,
  Moon,
  Network,
  RefreshCw,
  Server,
  Share2,
  ShieldAlert,
  Smartphone,
  Sun,
  XCircle,
} from 'lucide-react';
import { ClaudeFlowerLogo, ScrambleIn } from './components/BrandAndText';
import { AnthropicEndpointsSection, ClaudeCliGuardSection } from './components/ClaudeCliAdvisor';
import EcosystemSidebar from './components/EcosystemSidebar';
import ReportSkeleton from './components/ReportSkeleton';
import ShareReportModal from './components/ShareReportModal';
import {
  collectBrowserEnv,
  compareAndSaveIpHistory,
  probeAnthropicEndpoints,
  probeDnsLeak,
  probeDomesticIp,
  probeDualStack,
  probeSplitTunnel,
  probeWebRTC,
} from './detectors/clientProbes';
import { evaluateRisk } from './engine/riskEngine';
import { buildAgentFixPrompt } from './utils/agentPrompt';
import type {
  AnthropicEndpointCheck,
  BrowserEnvResult,
  DnsLeakResult,
  DomesticIpResult,
  DualStackResult,
  FindingSeverity,
  IpHistoryComparison,
  RiskAssessment,
  RiskGrade,
  ServerInspectResult,
  SplitTunnelResult,
  WebRtcResult,
} from './types/telemetry';

interface FullReport {
  server: ServerInspectResult;
  domesticIp: DomesticIpResult;
  dnsLeak: DnsLeakResult;
  dualStack: DualStackResult;
  webrtc: WebRtcResult;
  splitTunnel: SplitTunnelResult;
  anthropicEndpoints: AnthropicEndpointCheck[];
  browser: BrowserEnvResult;
  history: IpHistoryComparison;
  assessment: RiskAssessment;
  scannedAt: string;
}

const GRADE_STYLES: Record<
  RiskGrade,
  {
    text: string;
    ring: string;
    badge: string;
    dot: string;
  }
> = {
  S: {
    text: 'text-emerald-500',
    ring: 'stroke-emerald-500',
    badge: 'bg-emerald-500/12 text-emerald-500 border-emerald-500/25',
    dot: 'bg-emerald-500',
  },
  A: {
    text: 'text-emerald-500',
    ring: 'stroke-emerald-500',
    badge: 'bg-emerald-500/12 text-emerald-500 border-emerald-500/25',
    dot: 'bg-emerald-500',
  },
  B: {
    text: 'text-amber-500',
    ring: 'stroke-amber-500',
    badge: 'bg-amber-500/12 text-amber-500 border-amber-500/25',
    dot: 'bg-amber-500',
  },
  C: {
    text: 'text-[#D97757]',
    ring: 'stroke-[#D97757]',
    badge: 'bg-[#D97757]/12 text-[#D97757] border-[#D97757]/30',
    dot: 'bg-[#D97757]',
  },
  F: {
    text: 'text-rose-500',
    ring: 'stroke-rose-500',
    badge: 'bg-rose-500/12 text-rose-500 border-rose-500/25',
    dot: 'bg-rose-500',
  },
};

const SEVERITY_CONFIG: Record<
  FindingSeverity,
  { icon: typeof CheckCircle2; color: string; bar: string }
> = {
  pass: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bar: 'bg-emerald-500',
  },
  info: {
    icon: Info,
    color: 'text-[var(--text-secondary)]',
    bar: 'bg-zinc-400',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bar: 'bg-amber-500',
  },
  danger: {
    icon: XCircle,
    color: 'text-rose-500',
    bar: 'bg-rose-500',
  },
};

const CASCADE_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const CASCADE_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 120, damping: 20 },
  },
};

function maskIp(ip: string | null | undefined, hidden: boolean): string {
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

function ScoreRing({ score, grade }: { score: number; grade: RiskGrade }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const style = GRADE_STYLES[grade];
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 30;
    const timer = setInterval(() => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      setDisplayScore(Math.round(score * progress));
      if (frame >= totalFrames) {
        setDisplayScore(score);
        clearInterval(timer);
      }
    }, 18);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 112 112">
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth="6"
        />
        <motion.circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', stiffness: 75, damping: 18 }}
          className={style.ring}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono text-3xl font-bold tracking-tight ${style.text}`}>
          {displayScore}
        </span>
        <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          {grade} 级
        </span>
      </div>
    </div>
  );
}

function BoolTag({
  label,
  value,
  dangerWhenTrue = true,
}: {
  label: string;
  value: boolean | null;
  dangerWhenTrue?: boolean;
}) {
  if (value === null) {
    return (
      <span className="inline-flex items-center rounded-md border border-[var(--border-soft)] bg-[var(--bg-inner)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-muted)]">
        {label}: 未知
      </span>
    );
  }
  const isBad = dangerWhenTrue ? value : !value;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] ${
        isBad
          ? 'border-rose-500/25 bg-rose-500/10 text-rose-500'
          : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500'
      }`}
    >
      {label}: {value ? '是' : '否'}
    </span>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [stageText, setStageText] = useState('正在连接 Cloudflare 边缘节点...');
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FullReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [hideIp, setHideIp] = useState(true);
  const [introOpen, setIntroOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('claudeguard:theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (!localStorage.getItem('claudeguard:theme')) {
          setTheme(e.matches ? 'light' : 'dark');
        }
      } catch {
        setTheme(e.matches ? 'light' : 'dark');
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('claudeguard:theme', next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const runScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStageText('1/3 正在获取 Cloudflare 边缘出口与 IP 情报...');

    try {
      const inspectRes = await fetch('/api/inspect', { cache: 'no-store' });
      if (!inspectRes.ok) {
        throw new Error(`边缘检测接口返回异常 (${inspectRes.status})`);
      }
      const server = (await inspectRes.json()) as ServerInspectResult;

      setStageText('2/3 正在并发探测国内直连 IP、DNS 泄露、WebRTC 与生态可达性...');
      const browser = collectBrowserEnv();
      const [domesticIp, dnsLeak, dualStack, webrtc, splitTunnel, anthropicEndpoints] =
        await Promise.all([
          probeDomesticIp(server.ip),
          probeDnsLeak(server.geo.country),
          probeDualStack(server.ip),
          probeWebRTC(server.ip),
          probeSplitTunnel(),
          probeAnthropicEndpoints(),
        ]);

      setStageText('3/3 正在生成风控评分与审计报告...');
      const history = compareAndSaveIpHistory(server.ip, server.geo.country, server.network.asn);
      const assessment = evaluateRisk(
        server,
        domesticIp,
        dnsLeak,
        dualStack,
        webrtc,
        splitTunnel,
        browser
      );

      setReport({
        server,
        domesticIp,
        dnsLeak,
        dualStack,
        webrtc,
        splitTunnel,
        anthropicEndpoints,
        browser,
        history,
        assessment,
        scannedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '检测过程中发生未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runScan();
  }, [runScan]);

  const handleCopyReport = async () => {
    if (!report) return;
    const summaryText = [
      `=== CC Env 实验性风控体检报告 ===`,
      `检测时间: ${report.scannedAt}`,
      `综合评分: ${report.assessment.score}/100 (${report.assessment.grade} 级 - ${report.assessment.gradeLabel})`,
      `海外代理出口: ${maskIp(report.server.ip, hideIp)} (${report.server.geo.country} ${report.server.geo.city || ''})`,
      `国内直连出口: ${report.domesticIp.ip ? `${maskIp(report.domesticIp.ip, hideIp)} (${report.domesticIp.locationLabel || ''})` : '未检出'}`,
      `DNS 出口: ${report.dnsLeak.dnsIp ? `${maskIp(report.dnsLeak.dnsIp, hideIp)} (${report.dnsLeak.dnsGeo || ''})` : '未知'}`,
      `WebRTC UDP: ${report.webrtc.status} (${report.webrtc.publicIps.map((i) => maskIp(i, hideIp)).join(', ') || '无公网暴露'})`,
      `网络类型: ${report.assessment.ipTierLabel} | AS${report.server.network.asn ?? '-'} ${report.server.network.asOrg ?? ''}`,
      `系统时区: ${report.browser.timezone} (IP 时区: ${report.server.geo.timezone || '-'})`,
      `检测地址: https://ccenv.app`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyAgentPrompt = async () => {
    if (!report) return;
    const promptText = buildAgentFixPrompt({
      server: report.server,
      domesticIp: report.domesticIp,
      dnsLeak: report.dnsLeak,
      webrtc: report.webrtc,
      splitTunnel: report.splitTunnel,
      browser: report.browser,
      assessment: report.assessment,
    });
    try {
      await navigator.clipboard.writeText(promptText);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  const gradeStyle = report ? GRADE_STYLES[report.assessment.grade] : GRADE_STYLES.B;
  const ladderOrder: RiskGrade[] = ['F', 'C', 'B', 'A', 'S'];

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Subtle Top Ambient Terracotta Glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_at_top,rgba(217,119,87,0.08),transparent_70%)]" />

      {/* Slim Architectural Topbar */}
      <header className="relative border-b border-[var(--border-subtle)] bg-[var(--bg-page)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ClaudeFlowerLogo className="h-5 w-5 text-[#D97757]" />
              <span className="font-mono text-sm font-bold tracking-tight text-[var(--text-primary)]">
                CC Env
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-[#D97757]/30 bg-[#D97757]/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#D97757]">
                <FlaskConical className="h-2.5 w-2.5" />
                LABS
              </span>
            </div>

            {report && !loading && (
              <div className="hidden items-center gap-2 border-l border-[var(--border-subtle)] pl-3 font-mono text-[11px] text-[var(--text-muted)] sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span>COLO {report.server.edge.colo}</span>
                {report.server.edge.clientTcpRtt !== null && (
                  <span>· {report.server.edge.clientTcpRtt} ms</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:border-[#D97757]/40 hover:text-[var(--text-primary)] active:scale-[0.96]"
              title={theme === 'dark' ? '切换为亮色主题' : '切换为暗色主题'}
              aria-label="切换亮色/暗色主题"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={() => setHideIp((v) => !v)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[11px] transition active:scale-[0.98] ${
                hideIp
                  ? 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[#D97757]/40'
                  : 'border-amber-500/35 bg-amber-500/10 text-amber-500'
              }`}
            >
              {hideIp ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{hideIp ? '显示 IP' : '隐藏 IP'}</span>
            </button>

            <button
              onClick={() => setShareOpen(true)}
              disabled={!report || loading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 font-mono text-[11px] text-[var(--text-primary)] transition hover:border-[#D97757]/45 active:scale-[0.98] disabled:opacity-40"
            >
              <Share2 className="h-3.5 w-3.5 text-[#D97757]" />
              <span className="hidden sm:inline">分享报告</span>
            </button>

            <button
              onClick={runScan}
              disabled={loading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--cta-bg)] px-3 font-mono text-[11px] font-semibold text-[var(--cta-text)] transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? '扫描中' : '重新检测'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace + Right Sticky Ecosystem Sidebar */}
      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_304px] xl:items-start">
          <main className="min-w-0">
            {/* Loading Skeleton */}
            {loading && <ReportSkeleton stageText={stageText} />}

            {/* Error State */}
            {error && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={runScan}
                  className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-medium transition hover:bg-rose-500/30 active:scale-[0.98]"
                >
                  重试
                </button>
              </div>
            )}

            {/* Main Report */}
            {!loading && report && (
              <motion.div
                variants={CASCADE_CONTAINER}
                initial="hidden"
                animate="show"
                className="space-y-5"
              >
                {/* Unified Split Hero + Risk Instrument */}
                <motion.section
                  variants={CASCADE_ITEM}
                  className="surface-card overflow-hidden rounded-2xl"
                >
                  <div className="grid grid-cols-1 divide-y divide-[var(--border-soft)] lg:grid-cols-[1.2fr_0.85fr] lg:divide-x lg:divide-y-0">
                    {/* Left: Editorial Title + Inline 3-Point Exit Strip */}
                    <div className="flex flex-col justify-between p-5 sm:p-6">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D97757]">
                            Anthropic Environment Telemetry
                          </span>
                          <button
                            type="button"
                            onClick={() => setIntroOpen((v) => !v)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                          >
                            <span>{introOpen ? '收起原理' : '检测原理'}</span>
                            {introOpen ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        </div>

                        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-[28px] sm:leading-tight">
                          <ScrambleIn text="Anthropic 网络环境与 IP 纯净度自检" delay={40} />
                        </h1>
                        <p className="mt-2 max-w-[60ch] text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                          专为规避 Claude / Anthropic 账号风控打造的实验性体检台。默认脱敏隐藏公网 IP，点击任意 IP 字段即可展开。
                        </p>

                        {introOpen && (
                          <div className="mt-4 grid gap-3 border-t border-[var(--border-soft)] pt-4 text-xs sm:grid-cols-3">
                            <div>
                              <div className="font-mono text-[11px] font-semibold text-[#D97757]">
                                01 / 出口与家宽分级
                              </div>
                              <p className="mt-1 leading-relaxed text-[var(--text-muted)]">
                                结合边缘遥测与多源 IP 情报，区分原生家宽 ISP、商业机房 VPS 与共享滥用节点。
                              </p>
                            </div>
                            <div>
                              <div className="font-mono text-[11px] font-semibold text-[var(--text-primary)]">
                                02 / 分流与泄露探针
                              </div>
                              <p className="mt-1 leading-relaxed text-[var(--text-muted)]">
                                并发探测国内直连出口、EDNS 解析归属与 WebRTC UDP 通道，抓出规则分流与底层泄露。
                              </p>
                            </div>
                            <div>
                              <div className="font-mono text-[11px] font-semibold text-[var(--text-primary)]">
                                03 / 中文指纹一致性
                              </div>
                              <p className="mt-1 leading-relaxed text-[var(--text-muted)]">
                                核验系统时区、浏览器语言偏好与中文字体特征，避免环境穿帮。
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Inline 3-Point Exit Telemetry Strip */}
                      <div className="mt-6 grid grid-cols-1 divide-y divide-[var(--border-soft)] border-t border-[var(--border-soft)] pt-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div
                          onClick={() => setHideIp((v) => !v)}
                          className="cursor-pointer py-2 transition hover:opacity-80 sm:py-0 sm:pr-4"
                          title="点击切换显示/隐藏 IP"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[11px] text-[var(--text-muted)]">国内直连出口</span>
                            <span
                              className={`font-mono text-[10px] font-medium ${
                                report.domesticIp.isChinaDirect ? 'text-amber-500' : 'text-emerald-500'
                              }`}
                            >
                              {report.domesticIp.isChinaDirect ? '分流直连' : '未检出'}
                            </span>
                          </div>
                          <div className="mt-1 truncate font-mono text-sm font-semibold text-[var(--text-primary)]">
                            {report.domesticIp.ip ? maskIp(report.domesticIp.ip, hideIp) : '未直连'}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
                            {report.domesticIp.locationLabel || '全局代理或海外原生'}
                          </div>
                        </div>

                        <div
                          onClick={() => setHideIp((v) => !v)}
                          className="cursor-pointer py-2 transition hover:opacity-80 sm:px-4 sm:py-0"
                          title="点击切换显示/隐藏 IP"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[11px] text-[var(--text-muted)]">海外代理出口</span>
                            <span className="font-mono text-[10px] font-medium text-[#D97757]">
                              {report.server.geo.country}
                            </span>
                          </div>
                          <div className="mt-1 truncate font-mono text-sm font-semibold text-[var(--text-primary)]">
                            {maskIp(report.server.ip, hideIp)}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
                            AS{report.server.network.asn ?? '-'} {report.server.geo.city || ''}
                          </div>
                        </div>

                        <div className="py-2 sm:py-0 sm:pl-4">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[11px] text-[var(--text-muted)]">出口稳定性</span>
                            <span
                              className={`font-mono text-[10px] font-medium ${
                                report.history.status === 'changed' ? 'text-amber-500' : 'text-emerald-500'
                              }`}
                            >
                              {report.history.status === 'same'
                                ? '一致'
                                : report.history.status === 'changed'
                                  ? '跳变'
                                  : '首次'}
                            </span>
                          </div>
                          <div className="mt-1 truncate font-mono text-sm font-semibold text-[var(--text-primary)]">
                            {report.history.status === 'same'
                              ? '稳定未变'
                              : report.history.status === 'changed'
                                ? 'IP 已变更'
                                : '已建立基线'}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
                            {report.history.previousIp
                              ? `上次 ${maskIp(report.history.previousIp, hideIp)}`
                              : '刷新后自动对比'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Risk Gauge + Segmented Scale */}
                    <div className="flex flex-col justify-between gap-5 bg-[var(--bg-inner)]/45 p-5 sm:p-6">
                      <div className="flex items-center gap-5">
                        <ScoreRing score={report.assessment.score} grade={report.assessment.grade} />

                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-semibold ${gradeStyle.badge}`}
                            >
                              {report.assessment.gradeLabel}
                            </span>
                            <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-secondary)]">
                              {report.assessment.ipTierLabel}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                            {report.assessment.gradeSummary}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-[var(--text-muted)]">
                          <span>风控档位标尺</span>
                          <span>{report.scannedAt}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {ladderOrder.map((g) => {
                            const active = g === report.assessment.grade;
                            const st = GRADE_STYLES[g];
                            return (
                              <div
                                key={g}
                                className={`flex flex-col items-center rounded-md border py-1.5 text-center transition ${
                                  active
                                    ? `${st.badge} font-semibold`
                                    : 'border-[var(--border-soft)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-55'
                                }`}
                              >
                                <span className="font-mono text-xs font-bold">{g}</span>
                                <span className="text-[9px]">
                                  {g === 'S'
                                    ? '极净'
                                    : g === 'A'
                                      ? '优质'
                                      : g === 'B'
                                        ? '轻度'
                                        : g === 'C'
                                          ? '高危'
                                          : '受限'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5 Category Meters Strip */}
                  <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] px-5 py-4 sm:grid-cols-5 sm:px-6">
                    {report.assessment.categories.map((cat) => {
                      const pct = Math.round((cat.score / cat.maxScore) * 100);
                      const barColor =
                        cat.status === 'danger'
                          ? 'bg-rose-500'
                          : cat.status === 'warn'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500';

                      return (
                        <div key={cat.key} className="min-w-0">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="truncate text-[var(--text-muted)]">{cat.label}</span>
                            <span className="shrink-0 font-mono font-semibold text-[var(--text-primary)]">
                              {cat.score}/{cat.maxScore}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                              className={`h-full rounded-full ${barColor}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Inline Agent Auto-Fix Prompt Strip */}
                  <div className="flex flex-col gap-3 border-t border-[var(--border-soft)] bg-[#D97757]/[0.05] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex items-start gap-2.5 sm:items-center">
                      <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#D97757] sm:mt-0" />
                      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                        <strong className="font-semibold text-[var(--text-primary)]">
                          复制给 AI Agent 自动优化：
                        </strong>
                        将该诊断指令发给 Claude Code、Codex 或{' '}
                        <span className="font-mono font-medium text-[#D97757]">CC Haha</span>
                        ，即可协同调整浏览器语言与系统底层配置。
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAgentPrompt}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#D97757] px-3.5 py-2 font-mono text-xs font-semibold text-white transition hover:bg-[#c86646] active:scale-[0.98]"
                    >
                      {promptCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>已复制，去粘贴给 Agent 吧</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>复制 Agent 修复 Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.section>

                {/* Unified 2x2 Core Telemetry Matrix */}
                <motion.section
                  variants={CASCADE_ITEM}
                  className="surface-card grid grid-cols-1 divide-y divide-[var(--border-soft)] overflow-hidden rounded-2xl md:grid-cols-2 md:divide-y-0"
                >
                  {/* Quadrant 1: IP & Intelligence */}
                  <div className="min-w-0 p-5 md:border-b md:border-r md:border-[var(--border-soft)]">
                    <div className="mb-3.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <Globe className="h-4 w-4 text-[#D97757]" />
                        <span>IP 属性与安全</span>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        {report.server.network.intel.source}
                      </span>
                    </div>

                    <dl className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">网络性质</dt>
                        <dd className="truncate font-mono font-semibold text-[var(--text-primary)]">
                          {report.assessment.ipTierLabel}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">ISP / 机构</dt>
                        <dd className="min-w-0 truncate text-right font-mono text-[var(--text-primary)]">
                          {report.server.network.intel.companyName ||
                            report.server.network.asOrg ||
                            '未知'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">ASN</dt>
                        <dd className="font-mono text-[var(--text-primary)]">
                          AS{report.server.network.asn ?? '-'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">IPv6</dt>
                        <dd
                          onClick={() => setHideIp((v) => !v)}
                          className="cursor-pointer truncate font-mono text-[var(--text-primary)]"
                        >
                          {report.dualStack.ipv6 ? maskIp(report.dualStack.ipv6, hideIp) : '已关闭 (安全)'}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-[var(--border-soft)] pt-3">
                      <BoolTag label="机房" value={report.server.network.intel.isDatacenter} />
                      <BoolTag label="VPN" value={report.server.network.intel.isVpn} />
                      <BoolTag label="Proxy" value={report.server.network.intel.isProxy} />
                      <BoolTag label="Tor" value={report.server.network.intel.isTor} />
                      <BoolTag label="滥用库" value={report.server.network.intel.isAbuser} />
                    </div>
                  </div>

                  {/* Quadrant 2: DNS Leak Detection */}
                  <div className="min-w-0 p-5 md:border-b md:border-[var(--border-soft)]">
                    <div className="mb-3.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <Server className="h-4 w-4 text-[#D97757]" />
                        <span>DNS 泄露检测</span>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-medium ${
                          report.dnsLeak.status === 'leaked'
                            ? 'bg-rose-500/12 text-rose-500'
                            : report.dnsLeak.status === 'safe'
                              ? 'bg-emerald-500/12 text-emerald-500'
                              : 'bg-[var(--bg-inner)] text-[var(--text-muted)]'
                        }`}
                      >
                        {report.dnsLeak.status === 'leaked'
                          ? '存在泄露'
                          : report.dnsLeak.status === 'safe'
                            ? '正常'
                            : '未知'}
                      </span>
                    </div>

                    <dl className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">DNS 出口</dt>
                        <dd
                          onClick={() => setHideIp((v) => !v)}
                          className="cursor-pointer truncate font-mono text-[var(--text-primary)]"
                        >
                          {maskIp(report.dnsLeak.dnsIp, hideIp)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">归属地</dt>
                        <dd
                          className={`truncate font-mono ${
                            report.dnsLeak.status === 'leaked'
                              ? 'text-rose-500'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {report.dnsLeak.dnsGeo || '-'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">EDNS 网段</dt>
                        <dd className="truncate font-mono text-[var(--text-secondary)]">
                          {maskIp(report.dnsLeak.ednsIp, hideIp)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Quadrant 3: WebRTC UDP */}
                  <div className="min-w-0 p-5 md:border-r md:border-[var(--border-soft)]">
                    <div className="mb-3.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <Network className="h-4 w-4 text-[#D97757]" />
                        <span>WebRTC UDP</span>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-medium ${
                          report.webrtc.status === 'leaked'
                            ? 'bg-rose-500/12 text-rose-500'
                            : 'bg-emerald-500/12 text-emerald-500'
                        }`}
                      >
                        {report.webrtc.status === 'leaked'
                          ? '异常泄露'
                          : report.webrtc.status === 'matched'
                            ? '与代理一致'
                            : '已屏蔽'}
                      </span>
                    </div>

                    <dl className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">UDP 出口</dt>
                        <dd
                          onClick={() => setHideIp((v) => !v)}
                          className={`cursor-pointer truncate font-mono ${
                            report.webrtc.status === 'leaked'
                              ? 'text-rose-500'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {report.webrtc.publicIps.length
                            ? report.webrtc.publicIps.map((i) => maskIp(i, hideIp)).join(', ')
                            : '无公网暴露'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">归属地</dt>
                        <dd className="truncate text-[var(--text-secondary)]">
                          {report.webrtc.ipDetails.length > 0
                            ? report.webrtc.ipDetails
                                .map((d) => `${d.country || '-'}${d.city ? `·${d.city}` : ''}`)
                                .join(', ')
                            : '-'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">运营商</dt>
                        <dd className="truncate font-mono text-[var(--text-secondary)]">
                          {report.webrtc.ipDetails.length > 0
                            ? report.webrtc.ipDetails.map((d) => d.isp || '-').join(', ')
                            : '-'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Quadrant 4: Reachability & Fingerprint */}
                  <div className="min-w-0 p-5">
                    <div className="mb-3.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        {report.browser.isMobile ? (
                          <Smartphone className="h-4 w-4 text-[#D97757]" />
                        ) : (
                          <Laptop className="h-4 w-4 text-[#D97757]" />
                        )}
                        <span>生态可达与指纹</span>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        RTT / Locale
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {report.splitTunnel.endpoints.map((ep) => (
                        <div key={ep.name} className="flex items-center justify-between gap-2">
                          <span className="truncate text-[var(--text-secondary)]">{ep.name}</span>
                          <span
                            className={`shrink-0 font-mono ${
                              !ep.reachable
                                ? 'text-[var(--text-muted)]'
                                : (ep.rttMs ?? 999) < 120
                                  ? 'text-emerald-500'
                                  : 'text-amber-500'
                            }`}
                          >
                            {ep.reachable && ep.rttMs !== null ? `${ep.rttMs} ms` : '不可达'}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between gap-2 border-t border-[var(--border-soft)] pt-2">
                        <span className="text-[var(--text-muted)]">时区 / 语言</span>
                        <span
                          className={`truncate font-mono ${
                            report.server.geo.timezone &&
                            report.browser.timezone !== report.server.geo.timezone
                              ? 'text-rose-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {report.browser.timezone} ({report.browser.language})
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Anthropic Multi-Endpoint Reachability & WAF Strategy */}
                <motion.section variants={CASCADE_ITEM}>
                  <AnthropicEndpointsSection
                    endpoints={report.anthropicEndpoints}
                    isProxyOrDatacenter={Boolean(
                      report.server.network.intel.isDatacenter ||
                        report.server.network.intel.isProxy ||
                        report.server.network.intel.isVpn ||
                        report.server.network.heuristicType === 'datacenter'
                    )}
                  />
                </motion.section>

                {/* Claude Code CLI Anti-Risk Environment Recommendations */}
                <motion.section variants={CASCADE_ITEM}>
                  <ClaudeCliGuardSection items={report.assessment.cliRecommendations} />
                </motion.section>

                {/* Audit Findings & Actionable Remediation */}
                <motion.section
                  variants={CASCADE_ITEM}
                  className="grid grid-cols-1 gap-5 lg:grid-cols-5"
                >
                  <div className="surface-card min-w-0 overflow-hidden rounded-2xl lg:col-span-3">
                    <div className="border-b border-[var(--border-subtle)] px-5 py-3.5">
                      <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                        风控审计明细
                      </h2>
                    </div>

                    <div className="divide-y divide-[var(--border-soft)]">
                      {report.assessment.findings.map((item) => {
                        const cfg = SEVERITY_CONFIG[item.severity];
                        const Icon = cfg.icon;
                        return (
                          <div key={item.id} className="relative px-5 py-3.5">
                            <div
                              className={`absolute inset-y-3 left-0 w-[2px] rounded-r ${cfg.bar}`}
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                  {item.title}
                                </span>
                              </div>
                              <span className={`shrink-0 font-mono text-xs font-semibold ${cfg.color}`}>
                                {item.impact}
                              </span>
                            </div>
                            <p className="mt-1 break-all pl-6 text-xs leading-relaxed text-[var(--text-secondary)] sm:break-words">
                              {item.detail}
                            </p>
                            {item.remediation && (
                              <p className="mt-1.5 pl-6 text-xs leading-relaxed text-[var(--text-primary)]">
                                <span className="font-semibold text-[#D97757]">建议：</span>
                                {item.remediation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="surface-card min-w-0 overflow-hidden rounded-2xl lg:col-span-2">
                    <div className="border-b border-[var(--border-subtle)] px-5 py-3.5">
                      <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                        修复与防封建议
                      </h2>
                    </div>

                    <ol className="divide-y divide-[var(--border-soft)] text-xs leading-relaxed text-[var(--text-secondary)]">
                      {report.assessment.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-3 px-5 py-3.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#D97757]/12 font-mono text-[11px] font-bold text-[#D97757]">
                            {idx + 1}
                          </span>
                          <span className="min-w-0 break-words">{rec}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </motion.section>
              </motion.div>
            )}
          </main>

          <EcosystemSidebar
            isRestrictedOrHighRisk={Boolean(
              report && (report.assessment.score < 75 || report.server.geo.regionPolicy === 'blocked')
            )}
          />
        </div>
      </div>

      {/* Share Report Modal with QR Code */}
      {report && (
        <ShareReportModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          theme={theme}
          hideIp={hideIp}
          maskIp={maskIp}
          server={report.server}
          domesticIp={report.domesticIp}
          dnsLeak={report.dnsLeak}
          webrtc={report.webrtc}
          browser={report.browser}
          assessment={report.assessment}
          scannedAt={report.scannedAt}
          onCopyText={handleCopyReport}
          copied={copied}
        />
      )}
    </div>
  );
}

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
  History,
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
  Wifi,
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
    bg: string;
    border: string;
    text: string;
    ring: string;
    badge: string;
  }
> = {
  S: {
    bg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/40',
    text: 'text-emerald-500',
    ring: 'stroke-emerald-500',
    badge: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  },
  A: {
    bg: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
    border: 'border-cyan-500/40',
    text: 'text-cyan-500',
    ring: 'stroke-cyan-500',
    badge: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  },
  B: {
    bg: 'from-amber-500/15 via-amber-500/5 to-transparent',
    border: 'border-amber-500/40',
    text: 'text-amber-500',
    ring: 'stroke-amber-500',
    badge: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  },
  C: {
    bg: 'from-orange-500/15 via-orange-500/5 to-transparent',
    border: 'border-orange-500/40',
    text: 'text-orange-500',
    ring: 'stroke-orange-500',
    badge: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  },
  F: {
    bg: 'from-rose-500/20 via-rose-500/5 to-transparent',
    border: 'border-rose-500/50',
    text: 'text-rose-500',
    ring: 'stroke-rose-500',
    badge: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
  },
};

const SEVERITY_CONFIG: Record<
  FindingSeverity,
  { icon: typeof CheckCircle2; color: string; bg: string }
> = {
  pass: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/[0.08] border-emerald-500/25',
  },
  info: {
    icon: Info,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/[0.08] border-cyan-500/25',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/[0.08] border-amber-500/25',
  },
  danger: {
    icon: XCircle,
    color: 'text-rose-500',
    bg: 'bg-rose-500/[0.08] border-rose-500/30',
  },
};

const CASCADE_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const CASCADE_ITEM = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
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
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const style = GRADE_STYLES[grade];
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 32;
    const timer = setInterval(() => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      setDisplayScore(Math.round(score * progress));
      if (frame >= totalFrames) {
        setDisplayScore(score);
        clearInterval(timer);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth="7"
        />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className={style.ring}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono text-3xl font-bold tracking-tight ${style.text}`}>
          {displayScore}
        </span>
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
          {grade} 级风险
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
      <span className="inline-flex items-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-inner)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-muted)]">
        {label}: 未知
      </span>
    );
  }
  const isBad = dangerWhenTrue ? value : !value;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] ${
        isBad
          ? 'border-rose-500/35 bg-rose-500/12 text-rose-500'
          : 'border-emerald-500/30 bg-emerald-500/12 text-emerald-500'
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
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Subtle Dot Grid & Anthropic Terracotta Glow */}
      <div className="dot-grid pointer-events-none fixed inset-0 opacity-70" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(217,119,87,0.16),rgba(16,185,129,0.04)_45%,transparent_75%)]" />
      <div className="watermark-font pointer-events-none fixed inset-x-0 top-14 select-none text-center text-[clamp(68px,16vw,210px)] uppercase leading-none tracking-[-0.04em]">
        ANTHROPIC · AUDIT
      </div>

      <div className="relative mx-auto w-full max-w-[1440px] px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        {/* Glass Pill Navbar */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-7 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 items-center gap-2.5 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-surface-strong)] px-4 backdrop-blur-md">
              <ClaudeFlowerLogo className="h-5 w-5 text-[#D97757]" />
              <span className="font-mono text-sm font-bold tracking-tight text-[var(--text-primary)]">
                CC Env
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#D97757]/40 bg-[#D97757]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#D97757]">
                <FlaskConical className="h-2.5 w-2.5" />
                LABS
              </span>
            </div>

            {report && !loading && (
              <div className="hidden h-11 items-center gap-2 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 font-mono text-xs text-[var(--text-secondary)] backdrop-blur-md sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>COLO: {report.server.edge.colo}</span>
                {report.server.edge.clientTcpRtt !== null && (
                  <span className="text-[var(--text-muted)]">· {report.server.edge.clientTcpRtt}ms</span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-strong)] text-[var(--text-secondary)] transition hover:border-[#D97757]/50 hover:text-[var(--text-primary)]"
              title={theme === 'dark' ? '切换为亮色主题' : '切换为暗色主题'}
              aria-label="切换亮色/暗色主题"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setHideIp((v) => !v)}
              className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 font-mono text-xs transition ${
                hideIp
                  ? 'border-[var(--border-subtle)] bg-[var(--bg-surface-strong)] text-[var(--text-secondary)] hover:border-[#D97757]/40'
                  : 'border-amber-500/40 bg-amber-500/15 text-amber-500'
              }`}
            >
              {hideIp ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {hideIp ? '显示 IP' : '隐藏 IP'}
            </button>

            <button
              onClick={() => setShareOpen(true)}
              disabled={!report || loading}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-strong)] px-3.5 font-mono text-xs text-[var(--text-primary)] transition hover:border-[#D97757]/50 disabled:opacity-40"
            >
              <Share2 className="h-3.5 w-3.5 text-[#D97757]" />
              分享报告
            </button>

            <button
              onClick={runScan}
              disabled={loading}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--cta-bg)] px-4 font-mono text-xs font-bold text-[var(--cta-text)] transition hover:opacity-90 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '扫描中' : '重新检测'}
            </button>
          </div>
        </motion.header>

        {/* Main Workspace + Right Sticky Ecosystem Sidebar */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_310px] xl:items-start">
          <main className="min-w-0">
            {/* Editorial Hero & Experimental Intro */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 backdrop-blur-md sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#D97757]">
                <ClaudeFlowerLogo className="h-3.5 w-3.5" />
                <span>CC Env · Experimental Risk Telemetry</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                <ScrambleIn text="Anthropic 网络环境与 IP 纯净度自检" delay={80} />
              </h1>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                专为规避 Claude / Anthropic 账号风控打造的实验性检测台。打开即测，默认脱敏隐藏所有公网 IP，点击任意 IP 可手动展开。
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIntroOpen((v) => !v)}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inner)] px-3 py-1.5 font-mono text-[11px] text-[var(--text-muted)] transition hover:text-[var(--text-primary)] lg:self-end"
            >
              <span>{introOpen ? '收起检测原理' : '查看检测原理'}</span>
              {introOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {introOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mt-5 grid gap-3 border-t border-[var(--border-subtle)] pt-4 text-xs sm:grid-cols-3"
            >
              <div className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3.5">
                <div className="mb-1 font-mono font-bold text-[#D97757]">01 / 出口与家宽分级</div>
                <p className="leading-relaxed text-[var(--text-muted)]">
                  结合 Cloudflare 边缘遥测与多源 IP 情报库，区分「原生家宽 ISP」「商业机房 VPS」与「万人骑共享/滥用节点」。
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3.5">
                <div className="mb-1 font-mono font-bold text-emerald-500">02 / 分流与泄露探针</div>
                <p className="leading-relaxed text-[var(--text-muted)]">
                  并发探测国内直连出口、EDNS 解析器归属地与 WebRTC STUN UDP 通道，抓出规则分流与底层真实 IP 泄露。
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3.5">
                <div className="mb-1 font-mono font-bold text-cyan-500">03 / 中文指纹一致性</div>
                <p className="leading-relaxed text-[var(--text-muted)]">
                  核验系统时区（如东八区 UTC+8）、浏览器语言偏好、中文字体及国产 App WebView 特征，避免环境穿帮。
                </p>
              </div>
            </motion.div>
          )}
        </motion.section>

        {/* Loading Skeleton State */}
        {loading && <ReportSkeleton stageText={stageText} />}

        {/* Error State */}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={runScan}
              className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-medium hover:bg-rose-500/30"
            >
              重试
            </button>
          </div>
        )}

        {/* Main Report with Staggered Cascade */}
        {!loading && report && (
          <motion.div
            variants={CASCADE_CONTAINER}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            {/* Top 3-Column Exit Comparison Strip */}
            <motion.section
              variants={CASCADE_ITEM}
              className="grid grid-cols-1 gap-4 md:grid-cols-3"
            >
              <div
                onClick={() => setHideIp((v) => !v)}
                className="min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#D97757]/40"
                title="点击切换显示/隐藏 IP"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[var(--text-muted)]">国内直连出口</span>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-medium ${
                      report.domesticIp.isChinaDirect
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-emerald-500/15 text-emerald-500'
                    }`}
                  >
                    {report.domesticIp.isChinaDirect ? '已检出分流直连' : '未检出/同出口'}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`truncate font-mono font-bold tracking-tight text-[var(--text-primary)] ${
                      !hideIp && report.domesticIp.ip?.includes(':') ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'
                    }`}
                  >
                    {report.domesticIp.ip ? maskIp(report.domesticIp.ip, hideIp) : '未直连'}
                  </span>
                  {report.domesticIp.ip && hideIp && (
                    <span className="shrink-0 rounded bg-[var(--bg-inner)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                      点击展开
                    </span>
                  )}
                </div>
                <p className="mt-1.5 truncate text-xs text-[var(--text-muted)]">
                  {report.domesticIp.locationLabel || '可能处于全局代理或海外原生网络'}
                </p>
              </div>

              <div
                onClick={() => setHideIp((v) => !v)}
                className="min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#D97757]/40"
                title="点击切换显示/隐藏 IP"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[var(--text-muted)]">Cloudflare / 海外出口</span>
                  <span className="shrink-0 rounded bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] text-cyan-500">
                    {report.server.geo.country}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`truncate font-mono font-bold tracking-tight text-[var(--text-primary)] ${
                      !hideIp && report.server.ip.includes(':') ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'
                    }`}
                  >
                    {maskIp(report.server.ip, hideIp)}
                  </span>
                  {hideIp && (
                    <span className="shrink-0 rounded bg-[var(--bg-inner)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                      点击展开
                    </span>
                  )}
                </div>
                <p className="mt-1.5 truncate text-xs text-[var(--text-muted)]">
                  {report.server.geo.country} {report.server.geo.city || ''} · AS
                  {report.server.network.asn ?? '-'} {report.server.network.asOrg || ''}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition duration-200 hover:-translate-y-0.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                    <History className="h-3.5 w-3.5" />
                    IP 与上次一致
                  </span>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-medium ${
                      report.history.status === 'changed'
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-emerald-500/15 text-emerald-500'
                    }`}
                  >
                    {report.history.status === 'same'
                      ? '出口稳定'
                      : report.history.status === 'changed'
                        ? 'IP 已跳变'
                        : '首次记录'}
                  </span>
                </div>
                <div className="truncate font-mono text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
                  {report.history.status === 'same'
                    ? '一致'
                    : report.history.status === 'changed'
                      ? '已变更'
                      : '已记录'}
                </div>
                <p className="mt-1.5 truncate text-xs text-[var(--text-muted)]">
                  {report.history.previousIp
                    ? `上次: ${maskIp(report.history.previousIp, hideIp)} (${report.history.previousCountry || '-'})`
                    : '下次刷新或切换节点后将自动对比'}
                </p>
              </div>
            </motion.section>

            {/* Hero Score & 5-Tier Grade Card */}
            <motion.section
              variants={CASCADE_ITEM}
              className={`overflow-hidden rounded-2xl border bg-gradient-to-br p-5 sm:p-6 ${gradeStyle.border} ${gradeStyle.bg} bg-[var(--bg-surface)]`}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                  <ScoreRing score={report.assessment.score} grade={report.assessment.grade} />

                  <div className="min-w-0 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 font-mono text-xs font-semibold ${gradeStyle.badge}`}
                      >
                        {report.assessment.gradeLabel}
                      </span>
                      <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-inner)] px-2.5 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
                        {report.assessment.ipTierLabel}
                      </span>
                    </div>

                    <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
                      {report.assessment.gradeSummary}
                    </p>
                  </div>
                </div>

                {/* 5-Tier Risk Ladder */}
                <div className="w-full shrink-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inner)] p-3.5 lg:w-80">
                  <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-[var(--text-muted)]">
                    <span>风控档位标尺</span>
                    <span>{report.scannedAt}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ladderOrder.map((g) => {
                      const active = g === report.assessment.grade;
                      const st = GRADE_STYLES[g];
                      return (
                        <div
                          key={g}
                          className={`flex flex-col items-center rounded-lg border px-1 py-2 text-center transition ${
                            active
                              ? `${st.badge} ring-1 ring-current`
                              : 'border-[var(--border-soft)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-60'
                          }`}
                        >
                          <span className="font-mono text-sm font-bold">{g}</span>
                          <span className="mt-0.5 text-[10px] leading-tight">
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

              {/* 5 Category Progress Bars */}
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--border-subtle)] pt-5 sm:grid-cols-5">
                {report.assessment.categories.map((cat) => {
                  const pct = Math.round((cat.score / cat.maxScore) * 100);
                  const barColor =
                    cat.status === 'danger'
                      ? 'bg-rose-500'
                      : cat.status === 'warn'
                        ? 'bg-amber-500'
                        : cat.status === 'info'
                          ? 'bg-cyan-500'
                          : 'bg-emerald-500';

                  return (
                    <div
                      key={cat.key}
                      className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate text-[var(--text-muted)]">{cat.label}</span>
                        <span className="shrink-0 font-mono font-semibold text-[var(--text-primary)]">
                          {cat.score}/{cat.maxScore}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                          className={`h-full rounded-full ${barColor}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Agent Auto-Fix Prompt Banner (shown inside Hero after scan completes) */}
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#D97757]/30 bg-[#D97757]/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5 sm:items-center">
                  <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#D97757] sm:mt-0" />
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">不知道怎么手动改？</strong>
                    复制这段诊断指令发给你的 AI Agent（如 Claude Code、Codex 或{' '}
                    <span className="font-mono text-[#D97757]">CC Haha</span>
                    ），让它借助终端与 Computer Use 协同帮你优化电脑和浏览器设置。
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAgentPrompt}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#D97757] px-3.5 py-2 font-mono text-xs font-semibold text-white transition hover:bg-[#c86646]"
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

            {/* Detailed Telemetry Grid */}
            <motion.section
              variants={CASCADE_ITEM}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              {/* Card 1: IP & Intelligence */}
              <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition hover:border-[#D97757]/35">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    <Globe className="h-4 w-4 shrink-0 text-cyan-500" />
                    <span className="truncate">IP 属性与安全</span>
                  </div>
                  <span className="shrink-0 rounded bg-[var(--bg-inner)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                    {report.server.network.intel.source}
                  </span>
                </div>

                <dl className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="shrink-0 text-[var(--text-muted)]">网络性质</dt>
                    <dd className="min-w-0 truncate text-right font-mono font-semibold text-[var(--text-primary)]">
                      {report.assessment.ipTierLabel}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="shrink-0 text-[var(--text-muted)]">ISP / 机构</dt>
                    <dd className="min-w-0 truncate text-right font-mono text-[var(--text-primary)]">
                      {report.server.network.intel.companyName || report.server.network.asOrg || '未知'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="shrink-0 text-[var(--text-muted)]">ASN</dt>
                    <dd className="truncate font-mono text-[var(--text-primary)]">
                      AS{report.server.network.asn ?? '-'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="shrink-0 text-[var(--text-muted)]">IPv6</dt>
                    <dd
                      onClick={() => setHideIp((v) => !v)}
                      className="min-w-0 cursor-pointer truncate text-right font-mono text-[var(--text-primary)]"
                    >
                      {report.dualStack.ipv6 ? maskIp(report.dualStack.ipv6, hideIp) : '已关闭 (安全)'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--border-subtle)] pt-3">
                  <BoolTag label="机房" value={report.server.network.intel.isDatacenter} />
                  <BoolTag label="VPN" value={report.server.network.intel.isVpn} />
                  <BoolTag label="Proxy" value={report.server.network.intel.isProxy} />
                  <BoolTag label="Tor" value={report.server.network.intel.isTor} />
                  <BoolTag label="滥用库" value={report.server.network.intel.isAbuser} />
                </div>
              </div>

              {/* Card 2: DNS Leak Detection */}
              <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition hover:border-[#D97757]/35">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    <Server className="h-4 w-4 shrink-0 text-violet-500" />
                    <span className="truncate">DNS 泄露检测</span>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-medium ${
                      report.dnsLeak.status === 'leaked'
                        ? 'bg-rose-500/15 text-rose-500'
                        : report.dnsLeak.status === 'safe'
                          ? 'bg-emerald-500/15 text-emerald-500'
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

                <dl className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="shrink-0 text-[var(--text-muted)]">DNS 出口</dt>
                    <dd
                      onClick={() => setHideIp((v) => !v)}
                      className="min-w-0 cursor-pointer truncate font-mono text-[var(--text-primary)]"
                    >
                      {maskIp(report.dnsLeak.dnsIp, hideIp)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="shrink-0 text-[var(--text-muted)]">归属地</dt>
                    <dd
                      className={`min-w-0 truncate text-right font-mono ${
                        report.dnsLeak.status === 'leaked' ? 'text-rose-500' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {report.dnsLeak.dnsGeo || '-'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="shrink-0 text-[var(--text-muted)]">EDNS 网段</dt>
                    <dd className="min-w-0 truncate font-mono text-[var(--text-secondary)]">
                      {maskIp(report.dnsLeak.ednsIp, hideIp)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Card 3: WebRTC UDP Leak + Geo */}
              <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition hover:border-[#D97757]/35">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    <Network className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="truncate">WebRTC UDP</span>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-medium ${
                      report.webrtc.status === 'leaked'
                        ? 'bg-rose-500/15 text-rose-500'
                        : 'bg-emerald-500/15 text-emerald-500'
                    }`}
                  >
                    {report.webrtc.status === 'leaked'
                      ? '异常泄露'
                      : report.webrtc.status === 'matched'
                        ? '与代理一致'
                        : '已屏蔽'}
                  </span>
                </div>

                <dl className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="shrink-0 text-[var(--text-muted)]">UDP 出口</dt>
                    <dd
                      onClick={() => setHideIp((v) => !v)}
                      className={`min-w-0 cursor-pointer truncate text-right font-mono ${
                        report.webrtc.status === 'leaked' ? 'text-rose-500' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {report.webrtc.publicIps.length
                        ? report.webrtc.publicIps.map((i) => maskIp(i, hideIp)).join(', ')
                        : '无公网暴露'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="shrink-0 text-[var(--text-muted)]">归属地</dt>
                    <dd className="min-w-0 truncate text-right text-[var(--text-secondary)]">
                      {report.webrtc.ipDetails.length > 0
                        ? report.webrtc.ipDetails
                            .map((d) => `${d.country || '-'}${d.city ? `·${d.city}` : ''}`)
                            .join(', ')
                        : '-'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="shrink-0 text-[var(--text-muted)]">运营商</dt>
                    <dd className="min-w-0 truncate text-right font-mono text-[var(--text-secondary)]">
                      {report.webrtc.ipDetails.length > 0
                        ? report.webrtc.ipDetails.map((d) => d.isp || '-').join(', ')
                        : '-'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Card 4: Claude Reachability & Browser Env */}
              <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition hover:border-[#D97757]/35">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    {report.browser.isMobile ? (
                      <Smartphone className="h-4 w-4 shrink-0 text-[#D97757]" />
                    ) : (
                      <Laptop className="h-4 w-4 shrink-0 text-[#D97757]" />
                    )}
                    <span className="truncate">生态可达与指纹</span>
                  </div>
                  <Wifi className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                </div>

                <div className="space-y-2 text-xs">
                  {report.splitTunnel.endpoints.map((ep) => (
                    <div key={ep.name} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-[var(--text-secondary)]">{ep.name}</span>
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
                  <div className="flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2">
                    <span className="shrink-0 text-[var(--text-muted)]">时区 / 语言</span>
                    <span
                      className={`min-w-0 truncate text-right font-mono ${
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
              className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            >
              <div className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 lg:col-span-2">
                <h2 className="mb-4 font-mono text-sm font-semibold text-[var(--text-primary)]">
                  风控审计明细
                </h2>
                <div className="space-y-2.5">
                  {report.assessment.findings.map((item) => {
                    const cfg = SEVERITY_CONFIG[item.severity];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={item.id}
                        className={`min-w-0 overflow-hidden rounded-xl border p-3.5 ${cfg.bg}`}
                      >
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
                        <p className="mt-1.5 break-all pl-6 text-xs leading-relaxed text-[var(--text-secondary)] sm:break-words">
                          {item.detail}
                        </p>
                        {item.remediation && (
                          <p className="mt-1.5 pl-6 text-xs text-[var(--text-primary)]">
                            <span className="font-semibold text-amber-500">建议：</span>
                            {item.remediation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                    修复与防封建议
                  </h2>
                  <button
                    type="button"
                    onClick={handleCopyAgentPrompt}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#D97757]/35 bg-[#D97757]/10 px-2.5 py-1 font-mono text-[11px] font-medium text-[#D97757] transition hover:bg-[#D97757]/20"
                  >
                    {promptCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-500">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Agent Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mb-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] px-3 py-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
                  可点击右上角 <strong className="text-[var(--text-secondary)]">Copy Agent Prompt</strong>，直接粘贴给 Codex、Claude Code 或支持 Computer Use 的桌面端（如 CC Haha），由 Agent 协同修改浏览器语言与系统配置。
                </div>

                <ol className="space-y-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {report.assessment.recommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className="flex gap-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D97757]/20 font-mono text-[11px] font-bold text-[#D97757]">
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

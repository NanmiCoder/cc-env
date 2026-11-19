import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Bot,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Fingerprint,
  Github,
  Globe2,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Menu,
  Moon,
  Network,
  Radio,
  RefreshCw,
  ScanLine,
  Server,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  TriangleAlert,
  Wifi,
  X,
} from "lucide-react";
import { ClaudeFlowerLogo } from "./components/BrandAndText";
import ShareReportModal from "./components/ShareReportModal";
import { buildAgentFixPrompt } from "./utils/agentPrompt";
import { useEnvironmentScan, type FullReport } from "./useEnvironmentScan";
import type { FindingSeverity } from "./types/telemetry";

function maskIp(ip: string | null | undefined, hidden: boolean): string {
  if (!ip) return "未检测到";
  if (!hidden) return ip;
  if (ip.includes(":"))
    return `${ip.split(":").slice(0, 2).join(":")}:****:****`;
  const parts = ip.split(".");
  return parts.length === 4
    ? `${parts[0]}.${parts[1]}.***.***`
    : "***.***.***.***";
}

const navItems = [
  { id: "overview", label: "环境总览", icon: LayoutDashboard },
  { id: "connectivity", label: "站点连通性", icon: Radio },
  { id: "diagnostics", label: "网络与隐私", icon: ShieldCheck },
  { id: "recommendations", label: "修复与建议", icon: Terminal },
  { id: "audit", label: "检测明细", icon: FileText },
];
const severityLabel: Record<FindingSeverity, string> = {
  pass: "通过",
  info: "提示",
  warn: "需关注",
  danger: "异常",
};

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`status-badge ${tone}`}>
      <i />
      {children}
    </span>
  );
}
function SectionTitle({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div className="section-heading-main">
        <span className="section-number">{number}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
function DetailRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="detail-rows">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
function DiagnosticCard({
  icon,
  title,
  badge,
  children,
}: {
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="diagnostic-card">
      <div className="card-heading">
        <span className="card-icon">{icon}</span>
        <h3>{title}</h3>
        {badge}
      </div>
      {children}
    </article>
  );
}

function ConnectionMap({
  loading,
  score,
}: {
  loading: boolean;
  score?: number;
}) {
  return (
    <div
      className={`connection-map ${loading ? "is-scanning" : ""}`}
      aria-hidden="true"
    >
      <div className="map-grid" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <svg className="map-lines" viewBox="0 0 400 290" fill="none">
        <path
          d="M82 205 L200 145 L322 75 M84 72 L200 145 L325 220"
          stroke="currentColor"
          strokeDasharray="4 5"
        />
        <path
          d="M200 145 L200 28 M200 145 L200 267"
          stroke="currentColor"
          opacity=".5"
        />
      </svg>
      <div className="map-center">
        <ClaudeFlowerLogo />
        <span>{loading ? "SCANNING" : "CC ENV"}</span>
      </div>
      <span className="map-node node-browser">
        <Globe2 />
        <span>BROWSER</span>
        <i />
      </span>
      <span className="map-node node-edge">
        <Server />
        <span>EDGE</span>
        <i />
      </span>
      <span className="map-node node-cli">
        <Terminal />
        <span>CLAUDE CLI</span>
        <i />
      </span>
      <span className="map-node node-dns">
        <Network />
        <span>DNS</span>
        <i />
      </span>
      <span className="map-coordinate">
        ENV / {loading ? "PROBING" : `SCORE ${score}`}
      </span>
      <span className="map-caption">
        <span className="live-dot" />
        {loading ? "正在建立环境快照" : "本轮网络观测已完成"}
      </span>
    </div>
  );
}

function getRedactor(report: FullReport | null, hidden: boolean) {
  const ips = report
    ? [
        report.server.ip,
        report.domesticIp.ip,
        report.dnsLeak.dnsIp,
        report.dnsLeak.ednsIp,
        report.dualStack.ipv4,
        report.dualStack.ipv6,
        ...report.webrtc.publicIps,
      ]
        .filter((ip): ip is string => Boolean(ip))
        .sort((a, b) => b.length - a.length)
    : [];
  return (text: string) =>
    hidden
      ? ips.reduce(
          (result, ip) => result.split(ip).join(maskIp(ip, true)),
          text,
        )
      : text;
}

export default function App() {
  const { loading, stage, error, report, runScan } = useEnvironmentScan();
  const [hideIp, setHideIp] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [copyError, setCopyError] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("claudeguard:theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    try {
      localStorage.setItem("claudeguard:theme", theme);
    } catch {
      /* Optional preference. */
    }
  }, [theme]);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -65% 0px" },
    );
    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [loading, report]);
  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      clearTimeout(copyTimer.current);
      setCopied(key);
      setCopyError(false);
      copyTimer.current = setTimeout(() => setCopied(null), 2400);
    } catch {
      setCopyError(true);
    }
  };
  const redact = getRedactor(report, hideIp);
  const copyReport = () => {
    if (!report) return;
    void copyText(
      [
        "CC Env · 网络环境检测报告",
        `检测时间：${report.scannedAt}`,
        `环境评分：${report.assessment.score}/100 · ${report.assessment.grade} 级`,
        `网络出口：${maskIp(report.server.ip, hideIp)} · ${report.server.geo.country} ${report.server.geo.city || ""}`,
        `国内直连：${maskIp(report.domesticIp.ip, hideIp)}`,
        `DNS：${report.dnsLeak.status} · ${maskIp(report.dnsLeak.dnsIp, hideIp)}`,
        `WebRTC：${report.webrtc.status} · ${report.webrtc.publicIps.map((ip) => maskIp(ip, hideIp)).join(", ") || "无公网地址"}`,
        ...report.anthropicEndpoints.map(
          (ep) =>
            `${ep.domain}：${ep.reachable ? "可达" : "未收到响应"} · ${ep.rttMs ?? "-"} ms`,
        ),
        `网络属性：${report.assessment.ipTierLabel} · AS${report.server.network.asn ?? "-"}`,
        `系统时区：${report.browser.timezone}`,
        "https://ccenv.app",
      ].join("\n"),
      "report",
    );
  };
  const copyPrompt = () => {
    if (!report) return;
    void copyText(buildAgentFixPrompt(report), "prompt");
  };
  const ready = Boolean(report && !loading && !error);
  const visibleReport = ready ? report : null;
  const issueCount = visibleReport?.assessment.findings.filter(
    (item) => item.severity === "warn" || item.severity === "danger",
  ).length;
  const stageLabels = [
    "获取网络出口与 IP 情报",
    "检测站点、DNS 与 WebRTC",
    "生成环境评分与报告",
  ];
  const ipButton = (ip: string | null | undefined) => (
    <button
      className="ip-value"
      onClick={() => setHideIp((value) => !value)}
      aria-label={hideIp ? "显示 IP 地址" : "隐藏 IP 地址"}
    >
      {maskIp(ip, hideIp)}
    </button>
  );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳转到检测结果
      </a>
      {menuOpen && (
        <button
          className="sidebar-scrim"
          aria-label="关闭导航"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <a
          href="#overview"
          className="brand"
          onClick={() => setMenuOpen(false)}
        >
          <span className="brand-mark">
            <AudioLines />
          </span>
          <span>
            cc<span className="brand-light">env</span>
            <span className="brand-period">.</span>
          </span>
          <span className="brand-beta">BETA</span>
        </a>
        <div className="workspace-label">
          WORKSPACE <span>01</span>
        </div>
        <nav aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                className={
                  activeSection === item.id ? "nav-item active" : "nav-item"
                }
                href={`#${item.id}`}
                onClick={() => {
                  setActiveSection(item.id);
                  setMenuOpen(false);
                }}
              >
                <Icon />
                <span>{item.label}</span>
                {item.id === "overview" && <span className="nav-active-dot" />}
              </a>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="mini-label">
            <LockKeyhole />
            LOCAL FIRST
          </span>
          <h3>你的环境，你来掌控。</h3>
          <p>在运行 Claude Code 的电脑上检测，让每一次连接更清晰。</p>
          <a href="#recommendations" onClick={() => setMenuOpen(false)}>
            了解如何排查 <ArrowUpRight />
          </a>
        </div>
        <div className="sidebar-bottom">
          <a
            href="https://github.com/NanmiCoder/cc-env"
            target="_blank"
            rel="noreferrer"
          >
            <Github />
            GitHub 开源仓库
            <ArrowUpRight />
          </a>
          <div>
            <span className="live-dot" />
            独立开源 · 免费使用<span className="version">v1.0</span>
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="打开导航"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
            <span>工作台</span>
            <ChevronRight />
            <strong>
              {navItems.find((item) => item.id === activeSection)?.label}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="privacy-label">
              <LockKeyhole />
              IP 默认脱敏
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              title={theme === "light" ? "切换为暗色主题" : "切换为亮色主题"}
              aria-label="切换亮色/暗色主题"
              onClick={() =>
                setTheme((value) => (value === "light" ? "dark" : "light"))
              }
            >
              {theme === "light" ? <Moon /> : <Sun />}
            </button>
            <a
              className="icon-button"
              href="https://github.com/NanmiCoder/cc-env"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub 仓库"
            >
              <Github />
            </a>
          </div>
        </header>

        <main id="main-content" className="main-content">
          <section id="overview" className="overview-section">
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span />
                  CLAUDE ENVIRONMENT CHECK
                </div>
                <h1>
                  好环境，让灵感不断线<span>。</span>
                </h1>
                <p>一站式检查 Claude 网络连通性、出口质量与隐私泄露。</p>
              </div>
              <button
                className="button primary rescan-button"
                onClick={runScan}
                disabled={loading}
              >
                <RefreshCw className={loading ? "spin" : ""} />
                {loading ? "正在检测" : "重新检测"}
                <span className="button-key">↻</span>
              </button>
            </div>
            <div className="overview-toolbar">
              <div>
                <span
                  className={`live-dot ${loading ? "pulse" : error ? "failed" : ""}`}
                />
                {loading
                  ? "正在检测当前设备"
                  : error
                    ? "检测暂未完成"
                    : "本次环境检测已完成"}
                <span className="toolbar-separator">/</span>
                <span className="scan-timestamp">
                  {visibleReport
                    ? visibleReport.scannedAt
                    : "只需片刻，请保持页面打开"}
                </span>
              </div>
              <button
                onClick={() => setIntroOpen((value) => !value)}
                aria-expanded={introOpen}
              >
                <CircleHelp />
                检测原理
              </button>
            </div>
            {introOpen && (
              <div className="intro-panel">
                <strong>从这台设备出发，检查真实的连接路径。</strong>
                <p>
                  通过边缘接口获取网络出口，并发检查 Claude 站点、DNS、WebRTC
                  和浏览器环境。检测会访问外部探针，出口 IP
                  会用于第三方情报查询。浏览器可达不代表终端或账号鉴权通过，评分也不是账号安全保证。
                </p>
              </div>
            )}

            {error ? (
              <div className="error-panel" role="alert">
                <TriangleAlert />
                <div>
                  <h2>这次没能完成检测</h2>
                  <p>{error}</p>
                  <span>
                    请检查网络连接后重试，之前的结果不会替代本次检测。
                  </span>
                </div>
                <button className="button primary" onClick={runScan}>
                  <RefreshCw />
                  重新尝试
                </button>
              </div>
            ) : (
              <div className="hero-grid">
                <article className="environment-hero">
                  <div className="hero-copy">
                    <span className="hero-eyebrow">
                      <span className="live-dot" />
                      ENVIRONMENT STATUS
                    </span>
                    <h2>
                      {loading
                        ? "正在认识你的网络"
                        : visibleReport!.assessment.score >= 75
                          ? "连接世界，心中有数。"
                          : "发现问题，离畅通更近。"}
                    </h2>
                    <p>
                      {loading
                        ? stageLabels[stage - 1] + "，即将为你呈现完整报告。"
                        : visibleReport!.assessment.gradeSummary}
                    </p>
                    <div className="hero-tags">
                      <span>
                        <ShieldCheck />
                        {loading
                          ? "多维度环境检测"
                          : visibleReport!.assessment.gradeLabel}
                      </span>
                      <span>
                        <Activity />
                        {loading
                          ? "探针并发运行中"
                          : `${issueCount} 项需要关注`}
                      </span>
                    </div>
                    <a
                      href={loading ? "#connectivity" : "#audit"}
                      className="hero-link"
                    >
                      {loading ? "检测结果将在下方更新" : "查看完整检测报告"}
                      <ArrowRight />
                    </a>
                  </div>
                  <ConnectionMap
                    loading={loading}
                    score={visibleReport?.assessment.score}
                  />
                  <div className="hero-footer">
                    <span>
                      <LockKeyhole />
                      公网 IP 默认隐藏
                    </span>
                    <span>
                      你的 Claude 网络环境检查站 <ArrowUpRight />
                    </span>
                  </div>
                </article>
                <article className="score-card">
                  <div className="score-card-heading">
                    <span>环境健康评分</span>
                    <span className="score-label">ENV SCORE</span>
                  </div>
                  <div className="score-display">
                    <svg viewBox="0 0 180 115" aria-hidden="true">
                      <path
                        d="M22 99 A72 72 0 1 1 158 99"
                        className="score-track"
                      />
                      <path
                        d="M22 99 A72 72 0 1 1 158 99"
                        className={`score-progress ${loading ? "scanning" : ""}`}
                        pathLength="100"
                        strokeDasharray={`${visibleReport?.assessment.score ?? 30} 100`}
                      />
                    </svg>
                    <div>
                      <strong>{visibleReport?.assessment.score ?? "–"}</strong>
                      <span>/ 100</span>
                    </div>
                  </div>
                  <div className="score-caption">
                    {loading ? (
                      <>
                        <LoaderCircle className="spin" />
                        正在分析环境
                      </>
                    ) : (
                      <>
                        <span
                          className={`grade grade-${visibleReport!.assessment.grade}`}
                        >
                          {visibleReport!.assessment.grade}
                        </span>
                        {visibleReport!.assessment.gradeLabel}
                      </>
                    )}
                  </div>
                  <div className="score-ladder">
                    {["F", "C", "B", "A", "S"].map((grade) => (
                      <span
                        key={grade}
                        className={
                          visibleReport?.assessment.grade === grade
                            ? "selected"
                            : ""
                        }
                      >
                        {grade}
                      </span>
                    ))}
                  </div>
                  <p>基于 5 个维度综合评估 · 仅供排查参考</p>
                </article>
              </div>
            )}

            {!error && (
              <div className="summary-grid">
                <article className="summary-card">
                  <span className="summary-icon">
                    <Globe2 />
                  </span>
                  <div>
                    <span className="summary-label">当前网络出口</span>
                    <strong>
                      {visibleReport ? (
                        `${visibleReport.server.geo.country} · ${visibleReport.server.geo.city || visibleReport.server.edge.colo}`
                      ) : (
                        <span className="skeleton-line" />
                      )}
                    </strong>
                    <span className="summary-foot">
                      {visibleReport
                        ? ipButton(visibleReport.server.ip)
                        : "正在识别出口位置"}
                    </span>
                  </div>
                  <button
                    className="icon-button summary-action"
                    aria-label={hideIp ? "显示 IP" : "隐藏 IP"}
                    onClick={() => setHideIp((value) => !value)}
                  >
                    {hideIp ? <Eye /> : <EyeOff />}
                  </button>
                </article>
                <article className="summary-card">
                  <span className="summary-icon warm">
                    <Fingerprint />
                  </span>
                  <div>
                    <span className="summary-label">IP 网络属性</span>
                    <strong>
                      {visibleReport ? (
                        visibleReport.assessment.ipTierLabel
                      ) : (
                        <span className="skeleton-line" />
                      )}
                    </strong>
                    <span className="summary-foot">
                      {visibleReport
                        ? `AS${visibleReport.server.network.asn ?? "–"} · ${visibleReport.server.network.asOrg || "机构未知"}`
                        : "正在查询多源 IP 情报"}
                    </span>
                  </div>
                </article>
                <article className="summary-card">
                  <span className="summary-icon blue">
                    <Wifi />
                  </span>
                  <div>
                    <span className="summary-label">Claude 站点响应</span>
                    <strong>
                      {visibleReport ? (
                        <>
                          {
                            visibleReport.anthropicEndpoints.filter(
                              (ep) => ep.reachable,
                            ).length
                          }
                          <span className="subtle">
                            {" "}
                            / {visibleReport.anthropicEndpoints.length}{" "}
                            个站点可达
                          </span>
                        </>
                      ) : (
                        <span className="skeleton-line" />
                      )}
                    </strong>
                    <span className="summary-foot">
                      {visibleReport
                        ? "Web / API / Console 独立探测"
                        : "正在检查三个独立端点"}
                    </span>
                  </div>
                </article>
              </div>
            )}
            {loading && (
              <div className="scan-progress" role="status">
                <LoaderCircle className="spin" />
                <span>{stageLabels[stage - 1]}</span>
                <div>
                  {[1, 2, 3].map((step) => (
                    <i key={step} className={step <= stage ? "complete" : ""} />
                  ))}
                </div>
                <code>0{stage} / 03</code>
              </div>
            )}
            {visibleReport && (
              <div className="category-strip">
                {visibleReport.assessment.categories.map((category) => (
                  <div key={category.key}>
                    <span>{category.label}</span>
                    <strong>
                      {category.score}
                      <small>/{category.maxScore}</small>
                    </strong>
                    <div className="category-track">
                      <i
                        className={category.status}
                        style={{
                          width: `${(category.score / category.maxScore) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="connectivity">
            <SectionTitle
              number="01"
              title="先看看，Claude 能连上吗？"
              description="三个端点，三条独立的连接路径。"
            >
              <span className="section-meta">
                <span className="live-dot" />
                浏览器实时探测
              </span>
            </SectionTitle>
            <div className="endpoint-grid">
              {[
                {
                  id: "claude_web",
                  domain: "claude.ai",
                  name: "Claude 网页",
                  desc: "日常对话与网页访问",
                  icon: ClaudeFlowerLogo,
                  style: "terracotta",
                },
                {
                  id: "api_anthropic",
                  domain: "api.anthropic.com",
                  name: "Claude API",
                  desc: "Claude Code 与 API 请求",
                  icon: Terminal,
                  style: "mint",
                },
                {
                  id: "platform_console",
                  domain: "platform.claude.com",
                  name: "开发者控制台",
                  desc: "账号授权与 Console",
                  icon: LayoutDashboard,
                  style: "lavender",
                },
              ].map((item) => {
                const endpoint = visibleReport?.anthropicEndpoints.find(
                  (ep) => ep.id === item.id,
                );
                const Icon = item.icon;
                return (
                  <article className="endpoint-card" key={item.id}>
                    <div className="endpoint-top">
                      <span className={`endpoint-icon ${item.style}`}>
                        <Icon />
                      </span>
                      <Badge
                        tone={
                          endpoint
                            ? endpoint.reachable
                              ? "pass"
                              : "warn"
                            : "neutral"
                        }
                      >
                        {endpoint
                          ? endpoint.reachable
                            ? "可达"
                            : "未响应"
                          : loading
                            ? "检测中"
                            : "待检测"}
                      </Badge>
                    </div>
                    <h3>{item.name}</h3>
                    <span className="endpoint-domain">{item.domain}</span>
                    <div
                      className={`endpoint-path ${endpoint?.reachable ? "connected" : ""}`}
                      aria-hidden="true"
                    >
                      <span>
                        <Globe2 />
                      </span>
                      <i />
                      <span>
                        {endpoint ? (
                          endpoint.reachable ? (
                            <Check />
                          ) : (
                            <TriangleAlert />
                          )
                        ) : (
                          <Radio />
                        )}
                      </span>
                      <i />
                      <span>
                        <Icon />
                      </span>
                    </div>
                    <div className="endpoint-bottom">
                      <span>{item.desc}</span>
                      <strong>
                        {endpoint?.rttMs != null ? (
                          <>
                            {endpoint.rttMs}
                            <small>ms</small>
                          </>
                        ) : (
                          "—"
                        )}
                      </strong>
                    </div>
                    {endpoint && (
                      <p className="endpoint-note">{endpoint.note}</p>
                    )}
                  </article>
                );
              })}
            </div>
            <p className="section-footnote">
              <CircleHelp />
              结果表示浏览器探针是否收到响应，不代表账号登录或 API 鉴权成功。
            </p>
          </section>

          <section id="diagnostics">
            <SectionTitle
              number="02"
              title="网络的细节，也值得看见"
              description="从出口到浏览器，找出连接路径中不一致的地方。"
            >
              <button
                className="text-button"
                onClick={() => setHideIp((value) => !value)}
              >
                {hideIp ? <Eye /> : <EyeOff />}
                {hideIp ? "显示 IP 地址" : "隐藏 IP 地址"}
              </button>
            </SectionTitle>
            <div className="diagnostics-grid">
              <DiagnosticCard
                icon={<Network />}
                title="DNS 泄露"
                badge={
                  <Badge
                    tone={
                      visibleReport?.dnsLeak.status === "leaked"
                        ? "danger"
                        : visibleReport?.dnsLeak.status === "safe"
                          ? "pass"
                          : "neutral"
                    }
                  >
                    {visibleReport
                      ? visibleReport.dnsLeak.status === "leaked"
                        ? "存在泄露"
                        : visibleReport.dnsLeak.status === "safe"
                          ? "未发现泄露"
                          : "未知"
                      : "待检测"}
                  </Badge>
                }
              >
                <DetailRows
                  rows={[
                    [
                      "DNS 出口",
                      visibleReport
                        ? ipButton(visibleReport.dnsLeak.dnsIp)
                        : "—",
                    ],
                    ["解析归属", visibleReport?.dnsLeak.dnsGeo || "—"],
                    [
                      "EDNS 网段",
                      visibleReport
                        ? ipButton(visibleReport.dnsLeak.ednsIp)
                        : "—",
                    ],
                  ]}
                />
                <div className="card-tip">检查域名解析是否绕过代理出口。</div>
              </DiagnosticCard>
              <DiagnosticCard
                icon={<AudioLines />}
                title="WebRTC / UDP"
                badge={
                  <Badge
                    tone={
                      visibleReport?.webrtc.status === "leaked"
                        ? "danger"
                        : visibleReport &&
                            visibleReport.webrtc.status !== "unknown"
                          ? "pass"
                          : "neutral"
                    }
                  >
                    {visibleReport
                      ? {
                          leaked: "存在泄露",
                          matched: "出口一致",
                          protected: "未暴露公网 IP",
                          unknown: "未知",
                        }[visibleReport.webrtc.status]
                      : "待检测"}
                  </Badge>
                }
              >
                <DetailRows
                  rows={[
                    [
                      "UDP 出口",
                      visibleReport?.webrtc.publicIps.length ? (
                        <>
                          {visibleReport.webrtc.publicIps.map((ip) => (
                            <span key={ip}>{ipButton(ip)} </span>
                          ))}
                        </>
                      ) : visibleReport ? (
                        "未检测到公网地址"
                      ) : (
                        "—"
                      ),
                    ],
                    [
                      "出口归属",
                      visibleReport?.webrtc.ipDetails
                        .map((item) =>
                          [item.country, item.city].filter(Boolean).join(" · "),
                        )
                        .filter(Boolean)
                        .join(", ") || "—",
                    ],
                    [
                      "ICE 候选",
                      visibleReport
                        ? `${visibleReport.webrtc.candidateCount} 个`
                        : "—",
                    ],
                  ]}
                />
                <div className="card-tip">
                  检查实时通信是否暴露额外公网地址。
                </div>
              </DiagnosticCard>
              <DiagnosticCard
                icon={<Globe2 />}
                title="出口与网络属性"
                badge={<span className="card-micro">IP INTELLIGENCE</span>}
              >
                <DetailRows
                  rows={[
                    ["网络机构", visibleReport?.server.network.asOrg || "—"],
                    [
                      "国内直连",
                      visibleReport
                        ? ipButton(visibleReport.domesticIp.ip)
                        : "—",
                    ],
                    [
                      "IPv6 地址",
                      visibleReport
                        ? ipButton(visibleReport.dualStack.ipv6)
                        : "—",
                    ],
                    [
                      "出口稳定性",
                      visibleReport
                        ? {
                            first: "首次检测",
                            same: "与上次一致",
                            changed: "出口已变化",
                          }[visibleReport.history.status]
                        : "—",
                    ],
                  ]}
                />
                <div className="intel-flags">
                  {(
                    [
                      "isDatacenter",
                      "isVpn",
                      "isProxy",
                      "isTor",
                      "isAbuser",
                    ] as const
                  ).map((key, i) => (
                    <span
                      key={key}
                      className={
                        visibleReport?.server.network.intel[key]
                          ? "flagged"
                          : ""
                      }
                    >
                      {["机房", "VPN", "Proxy", "Tor", "滥用库"][i]}
                      <b>
                        {visibleReport
                          ? visibleReport.server.network.intel[key] === null
                            ? "未知"
                            : visibleReport.server.network.intel[key]
                              ? "是"
                              : "否"
                          : "—"}
                      </b>
                    </span>
                  ))}
                </div>
              </DiagnosticCard>
              <DiagnosticCard
                icon={<Fingerprint />}
                title="浏览器与分流"
                badge={<span className="card-micro">ENVIRONMENT</span>}
              >
                <DetailRows
                  rows={[
                    ["系统时区", visibleReport?.browser.timezone || "—"],
                    ["IP 时区", visibleReport?.server.geo.timezone || "—"],
                    ["浏览器语言", visibleReport?.browser.language || "—"],
                    ["设备平台", visibleReport?.browser.platform || "—"],
                  ]}
                />
                <div className="card-tip">
                  {visibleReport?.splitTunnel.summary ||
                    "检查本机环境与网络出口的一致性。"}
                </div>
              </DiagnosticCard>
            </div>
          </section>

          <section id="recommendations">
            <SectionTitle
              number="03"
              title="下一步，把问题交给 Agent"
              description="无需猜测配置，让本机 AI 从这次检测结果开始排查。"
            />
            <div className="action-grid">
              <article className="agent-card">
                <span className="agent-icon">
                  <Sparkles />
                </span>
                <span className="mini-label">FROM DIAGNOSIS TO ACTION</span>
                <h3>检测之后，不止于报告。</h3>
                <p>
                  复制包含本轮网络观测和排查任务的 Prompt，粘贴到这台电脑上的
                  Claude Code 或 Codex。
                </p>
                <button
                  className="button primary"
                  disabled={!ready}
                  onClick={copyPrompt}
                >
                  {copied === "prompt" ? <CheckCheck /> : <Bot />}
                  {copied === "prompt"
                    ? "已复制，去交给 Agent 吧"
                    : "复制 Agent 修复 Prompt"}
                  <ArrowUpRight />
                </button>
                <span className="agent-privacy">
                  <CircleHelp />
                  Prompt 包含完整 IP，请仅交给信任的本机 Agent。
                </span>
              </article>
              <article className="terminal-card">
                <div className="terminal-top">
                  <span>
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>claude-code / environment</span>
                  <button
                    className="icon-button"
                    aria-label="复制 CLI 环境变量"
                    disabled={!ready}
                    onClick={() =>
                      visibleReport &&
                      void copyText(
                        visibleReport.assessment.cliRecommendations
                          .map(
                            (item) => `export ${item.envKey}=${item.envValue}`,
                          )
                          .join("\n"),
                        "shell",
                      )
                    }
                  >
                    {copied === "shell" ? <Check /> : <Copy />}
                  </button>
                </div>
                <div className="terminal-body">
                  <span className="terminal-comment">
                    # 按需减少非必要流量与遥测
                  </span>
                  {(
                    visibleReport?.assessment.cliRecommendations || [
                      {
                        envKey: "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC",
                        envValue: "1",
                      },
                      { envKey: "DISABLE_TELEMETRY", envValue: "1" },
                      { envKey: "DISABLE_ERROR_REPORTING", envValue: "1" },
                    ]
                  ).map((item) => (
                    <code key={item.envKey}>
                      <span>export</span> {item.envKey}
                      <b>={item.envValue}</b>
                    </code>
                  ))}
                  <span className="terminal-cursor">
                    ❯ <i />
                  </span>
                </div>
                <p>
                  <ShieldCheck />
                  配置只影响 CLI 行为，不能替代网络或账号排查。
                </p>
              </article>
            </div>
            {visibleReport && (
              <div className="recommendation-list">
                {visibleReport.assessment.recommendations.map((item, i) => (
                  <div key={i}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <p>{redact(item)}</p>
                    <ArrowRight />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="audit">
            <SectionTitle
              number="04"
              title="每一项判断，都有依据"
              description="展开检测明细，查看观测结果与对应建议。"
            >
              <button
                className="text-button"
                disabled={!ready}
                onClick={copyReport}
              >
                {copied === "report" ? <Check /> : <Copy />}
                {copied === "report" ? "已复制报告" : "复制文本报告"}
              </button>
            </SectionTitle>
            {visibleReport ? (
              <div className="audit-panel">
                {visibleReport.assessment.findings.map((item) => (
                  <details key={item.id} className="audit-item">
                    <summary>
                      <span className={`finding-icon ${item.severity}`}>
                        {item.severity === "pass" ? (
                          <Check />
                        ) : item.severity === "info" ? (
                          <CircleHelp />
                        ) : (
                          <TriangleAlert />
                        )}
                      </span>
                      <strong>{item.title}</strong>
                      <Badge tone={item.severity}>
                        {severityLabel[item.severity]}
                      </Badge>
                      <span className="finding-impact">{item.impact}</span>
                      <ChevronRight className="audit-chevron" />
                    </summary>
                    <div className="audit-detail">
                      <p>{redact(item.detail)}</p>
                      {item.remediation && (
                        <p className="remediation">
                          <strong>建议</strong>
                          {redact(item.remediation)}
                        </p>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="empty-audit">
                <ScanLine />
                <p>
                  {loading
                    ? "检测完成后，这里会显示完整的审计依据。"
                    : "完成一次检测后查看明细。"}
                </p>
              </div>
            )}
          </section>

          <div className="report-share">
            <div>
              <span className="share-icon">
                <Share2 />
              </span>
              <div>
                <h3>分享一份清晰的环境快照</h3>
                <p>生成可保存的检测海报，IP 按当前隐私设置展示。</p>
              </div>
            </div>
            <button
              className="button secondary"
              disabled={!ready}
              onClick={() => setShareOpen(true)}
            >
              <Share2 />
              分享检测报告
              <ArrowUpRight />
            </button>
          </div>
          <footer className="page-footer">
            <div>
              <span className="footer-brand">
                <AudioLines />
                ccenv.
              </span>
              <span>让连接更清晰，让创作更专注。</span>
            </div>
            <div>
              <a href="https://modeldial.com" target="_blank" rel="noreferrer">
                ModelDial
                <ArrowUpRight />
              </a>
              <a
                href="https://github.com/NanmiCoder/cc-haha"
                target="_blank"
                rel="noreferrer"
              >
                CC Haha
                <ArrowUpRight />
              </a>
              <a href="mailto:relakkes@gmail.com">
                合作与支持
                <ArrowUpRight />
              </a>
            </div>
          </footer>
          <div className="footer-disclaimer">
            <LockKeyhole />
            检测结果仅反映当前浏览器的网络观测，不保证账号安全或终端连通性。
            <span>Built for the Claude community.</span>
          </div>
        </main>
      </div>
      <div className="copy-announcement" role="status">
        {copied ? "已复制到剪贴板" : ""}
      </div>
      {copyError && (
        <div className="toast" role="alert">
          无法访问剪贴板，请检查浏览器权限。
          <button aria-label="关闭提示" onClick={() => setCopyError(false)}>
            <X />
          </button>
        </div>
      )}
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
          onCopyText={copyReport}
          copied={copied === "report"}
        />
      )}
    </div>
  );
}

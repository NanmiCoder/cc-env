import { useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  Check,
  Copy,
  Eye,
  Globe,
  Mail,
  Moon,
  RefreshCw,
  Server,
  Share2,
  Sun,
  Terminal,
  Wifi,
} from 'lucide-react';
import { ClaudeFlowerLogo } from './BrandAndText';

type SchemeId = 'swiss' | 'bento' | 'cockpit';

const SAMPLE = {
  score: 62,
  grade: 'B',
  gradeLabel: 'B 级 · 轻度风控 · 建议优化',
  ipTier: '普通商业 / 未知网络',
  scannedAt: '2026/11/14 20:35:34',
  colo: 'LAX',
  rtt: 38,
  domesticIp: '113.116.***.***',
  domesticLoc: '广东深圳 · 电信',
  proxyIp: '204.170.***.***',
  proxyGeo: 'US · Los Angeles',
  asn: 'AS2914',
  isp: 'NTT America, Inc.',
  dnsIp: '113.116.***.***',
  dnsGeo: 'China - Chinanet',
  webrtcIp: '113.116.***.***',
  webrtcGeo: 'CN · Shenzhen',
  timezone: 'Asia/Shanghai',
  ipTimezone: 'America/Los_Angeles',
  language: 'zh-CN',
  categories: [
    { name: 'IP 纯净度', score: 22, max: 30, status: 'warn' as const },
    { name: '分流隔离', score: 10, max: 20, status: 'danger' as const },
    { name: 'DNS 安全', score: 8, max: 20, status: 'danger' as const },
    { name: 'WebRTC', score: 12, max: 15, status: 'warn' as const },
    { name: '环境指纹', score: 10, max: 15, status: 'warn' as const },
  ],
  endpoints: [
    { domain: 'claude.ai', label: 'Web 控制台', policy: 'CF Bot / 严格', rtt: 142, ok: true },
    { domain: 'api.anthropic.com', label: 'API 接口', policy: '相对宽松', rtt: 89, ok: true },
    { domain: 'platform.claude.com', label: 'OAuth / Console', policy: 'CF WAF / 严控', rtt: 168, ok: true },
  ],
  findings: [
    {
      severity: 'danger' as const,
      title: '检测到国内直连分流与 DNS 泄露',
      impact: '-18 分',
      detail: '国内直连出口 (113.116.***.***) 与 DNS 解析器均落在中国大陆，容易被联动判定为规则代理。',
    },
    {
      severity: 'warn' as const,
      title: '系统时区与出口 IP 地理时区不一致',
      impact: '-8 分',
      detail: '浏览器时区为 Asia/Shanghai，而海外出口归属 America/Los_Angeles。',
    },
    {
      severity: 'pass' as const,
      title: 'ISP 归属与黑名单库未见高危标记',
      impact: '+0 分',
      detail: 'NTT America, Inc. (AS2914) 未命中 Tor / 公开滥用黑名单。',
    },
  ],
  cliEnv: [
    { key: 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC', val: '1', tag: '强烈建议' },
    { key: 'DISABLE_TELEMETRY', val: '1', tag: '推荐开启' },
    { key: 'DISABLE_ERROR_REPORTING', val: '1', tag: '推荐开启' },
  ],
};

function SchemeSwitcherBar({
  scheme,
  setScheme,
  dark,
  setDark,
}: {
  scheme: SchemeId;
  setScheme: (s: SchemeId) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
}) {
  const options: { id: SchemeId; name: string; desc: string }[] = [
    { id: 'swiss', name: '方案 A · 瑞士精密仪器', desc: '无边框网格 + 极简排版' },
    { id: 'bento', name: '方案 B · Bento 2.0 画廊', desc: '大圆角浮雕 + 非对称层次' },
    { id: 'cockpit', name: '方案 C · NOC 极客驾驶舱', desc: '高密度等宽 + 运维台风' },
  ];

  return (
    <div className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 px-4 py-2.5 text-zinc-100 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="rounded bg-[#D97757] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
            Design Preview
          </span>
          <span className="text-xs text-zinc-400">本地预览对比（未发布线上）— 请选择你更喜欢的方向</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScheme(opt.id)}
                className={`rounded-md px-3 py-1.5 text-left transition ${
                  scheme === opt.id
                    ? 'bg-[#D97757] text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
              >
                <div className="text-xs font-semibold leading-tight">{opt.name}</div>
                <div className={`text-[10px] ${scheme === opt.id ? 'text-orange-100' : 'text-zinc-500'}`}>
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setDark(!dark)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-200 hover:border-zinc-700"
          >
            {dark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
            {dark ? '切换亮色' : '切换暗色'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 方案 A：Swiss Editorial Instrument（瑞士精密仪器风：无多余卡片框，1px 规则线 + 大数字排版）
 * ============================================================================ */
function SwissEditorialScheme({ dark }: { dark: boolean }) {
  const [copied, setCopied] = useState(false);
  const bg = dark ? 'bg-[#0B0B0D] text-zinc-100' : 'bg-[#FAF9F5] text-zinc-900';
  const border = dark ? 'border-zinc-800/90' : 'border-zinc-200';
  const muted = dark ? 'text-zinc-400' : 'text-zinc-500';
  const subtleBg = dark ? 'bg-zinc-900/50' : 'bg-white';

  return (
    <div className={`min-h-[100dvh] ${bg} transition-colors`}>
      {/* Minimal Top Bar */}
      <header className={`border-b ${border}`}>
        <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <ClaudeFlowerLogo className="h-5 w-5 text-[#D97757]" />
            <span className="font-mono text-sm font-bold tracking-tight">CC Env</span>
            <span className={`font-mono text-[11px] ${muted}`}>/ LABS · {SAMPLE.colo} {SAMPLE.rtt}ms</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <button type="button" className={`${muted} hover:text-[#D97757]`}>显示 IP</button>
            <button type="button" className={`${muted} hover:text-[#D97757]`}>分享海报</button>
            <button
              type="button"
              className="rounded-md bg-[#D97757] px-3 py-1.5 font-semibold text-white hover:opacity-90"
            >
              重新检测
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-10 px-6 py-10 xl:grid-cols-[1fr_280px]">
        <main className="min-w-0 space-y-10">
          {/* Editorial Hero: Giant Typographic Score + Summary */}
          <section className={`grid grid-cols-1 gap-8 border-b pb-10 lg:grid-cols-[240px_1fr] ${border}`}>
            <div className="flex flex-col justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#D97757]">
                  Risk Index
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-7xl font-bold tracking-tighter text-amber-500">
                    {SAMPLE.score}
                  </span>
                  <span className={`font-mono text-lg ${muted}`}>/100</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 font-mono text-xs font-semibold text-amber-500">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  {SAMPLE.gradeLabel}
                </div>
              </div>

              <div className={`mt-6 font-mono text-[11px] ${muted}`}>
                {SAMPLE.scannedAt}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Anthropic 网络环境与 IP 纯净度自检
                </h1>
                <p className={`mt-2.5 max-w-[62ch] text-sm leading-relaxed ${muted}`}>
                  当前出口为 {SAMPLE.ipTier}（{SAMPLE.isp}），但检测到国内直连分流与 DNS 泄露。建议优先收紧代理规则，再同步调整系统时区与浏览器语言。
                </p>
              </div>

              {/* Horizontal 5-Bar Meter — Zero Boxes */}
              <div className={`grid grid-cols-2 gap-6 border-t pt-5 sm:grid-cols-5 ${border}`}>
                {SAMPLE.categories.map((c) => (
                  <div key={c.name}>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className={muted}>{c.name}</span>
                      <span className="font-semibold">{c.score}/{c.max}</span>
                    </div>
                    <div className={`mt-2 h-[3px] w-full ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                      <div
                        className={`h-full ${
                          c.status === 'danger' ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${(c.score / c.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Clean Prompt Action Line */}
              <div className={`flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${border}`}>
                <div className={`flex items-center gap-2 text-xs ${muted}`}>
                  <Bot className="h-4 w-4 text-[#D97757]" />
                  <span>复制诊断指令发给 Claude Code / Codex / CC Haha，协同优化系统与浏览器设置</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="inline-flex items-center gap-1.5 border border-[#D97757] bg-[#D97757]/10 px-3 py-1.5 font-mono text-xs font-medium text-[#D97757] hover:bg-[#D97757] hover:text-white"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? '已复制 Prompt' : '复制 Agent 修复 Prompt'}
                </button>
              </div>
            </div>
          </section>

          {/* Pure Tabular Telemetry Matrix — No Nested Cards */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#D97757]">
                01 / Network & Leak Telemetry
              </h2>
              <span className={`font-mono text-xs ${muted}`}>点击任意 IP 展开</span>
            </div>

            <div className={`grid grid-cols-1 divide-y border-y md:grid-cols-2 md:divide-x md:divide-y-0 ${border}`}>
              <div className={`divide-y ${border} md:pr-8`}>
                {[
                  ['海外代理出口', `${SAMPLE.proxyIp} (${SAMPLE.proxyGeo})`, 'text-emerald-500'],
                  ['ISP / 机构', `${SAMPLE.isp} · ${SAMPLE.asn}`, ''],
                  ['国内直连出口', `${SAMPLE.domesticIp} (${SAMPLE.domesticLoc})`, 'text-amber-500'],
                  ['DNS 解析出口', `${SAMPLE.dnsIp} (${SAMPLE.dnsGeo})`, 'text-rose-500'],
                ].map(([k, v, cls]) => (
                  <div key={k} className="flex items-center justify-between py-3.5 text-xs">
                    <span className={muted}>{k}</span>
                    <span className={`font-mono font-medium ${cls}`}>{v}</span>
                  </div>
                ))}
              </div>

              <div className={`divide-y ${border} md:pl-8`}>
                {[
                  ['WebRTC UDP', `${SAMPLE.webrtcIp} (异常泄露)`, 'text-rose-500'],
                  ['系统时区 / IP 时区', `${SAMPLE.timezone} ≠ ${SAMPLE.ipTimezone}`, 'text-rose-500'],
                  ['浏览器语言', SAMPLE.language, 'text-amber-500'],
                  ['IPv6 双栈', '已关闭 (安全)', 'text-emerald-500'],
                ].map(([k, v, cls]) => (
                  <div key={k} className="flex items-center justify-between py-3.5 text-xs">
                    <span className={muted}>{k}</span>
                    <span className={`font-mono font-medium ${cls}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Anthropic Endpoints & CLI Table */}
          <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#D97757]">
                02 / Anthropic Endpoints
              </h2>
              <div className={`divide-y border-y ${border}`}>
                {SAMPLE.endpoints.map((ep) => (
                  <div key={ep.domain} className="flex items-center justify-between py-3.5 text-xs">
                    <div>
                      <div className="font-mono font-semibold">{ep.domain}</div>
                      <div className={`mt-0.5 text-[11px] ${muted}`}>
                        {ep.label} · {ep.policy}
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-emerald-500">{ep.rtt} ms</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#D97757]">
                  03 / Claude Code CLI Env
                </h2>
                <button type="button" className="font-mono text-[11px] text-[#D97757] hover:underline">
                  复制 export 配置
                </button>
              </div>
              <div className={`border p-4 font-mono text-xs leading-loose ${border} ${subtleBg}`}>
                {SAMPLE.cliEnv.map((e) => (
                  <div key={e.key} className="truncate">
                    <span className="text-[#D97757]">export</span> {e.key}={e.val}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Findings */}
          <section>
            <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#D97757]">
              04 / Audit Findings
            </h2>
            <div className={`divide-y border-y ${border}`}>
              {SAMPLE.findings.map((f) => (
                <div key={f.title} className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-[1fr_80px]">
                  <div>
                    <div className="text-sm font-medium">{f.title}</div>
                    <p className={`mt-1 text-xs ${muted}`}>{f.detail}</p>
                  </div>
                  <div className="font-mono text-xs font-semibold sm:text-right">{f.impact}</div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Minimalist Text-First Sidebar */}
        <aside className={`space-y-8 border-t pt-8 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0 ${border}`}>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#D97757]">
              Ecosystem
            </div>
            <div className="mt-4 space-y-6">
              <div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>ModelDial</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
                <p className={`mt-1 text-xs leading-relaxed ${muted}`}>
                  主流大模型实测评测、编程/文本能力排行榜与套餐性价比对比。
                </p>
                <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px] text-[#D97757]">
                  <span>编程榜 ↗</span>
                  <span>文本榜 ↗</span>
                  <span>模型掺假指纹验证 ↗</span>
                </div>
              </div>

              <div className={`border-t pt-5 ${border}`}>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>CC Haha · 开源桌面端</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
                <p className={`mt-1 text-xs leading-relaxed ${muted}`}>
                  跨平台 Claude Code 桌面工作台：集成 Codex 级 Computer Use、多模型切换与手机扫码远程审批。
                </p>
              </div>
            </div>
          </div>

          <div className={`border-t pt-6 ${border}`}>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#D97757]">
              Sponsors
            </div>
            <p className={`mt-2 text-xs leading-relaxed ${muted}`}>
              支持独立开源项目长期运行，联系赞助：
            </p>
            <div className="mt-2 font-mono text-xs font-medium">relakkes@gmail.com</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============================================================================
 * 方案 B：Bento 2.0 Asymmetric Studio（Apple / Linear 级大圆角柔和扩散阴影画廊）
 * ============================================================================ */
function BentoGalleryScheme({ dark }: { dark: boolean }) {
  const bg = dark ? 'bg-[#0E0F12] text-zinc-100' : 'bg-[#F5F5F7] text-zinc-900';
  const card = dark
    ? 'bg-[#16171C] border border-white/[0.07] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)]'
    : 'bg-white border border-black/[0.05] shadow-[0_20px_40px_-18px_rgba(0,0,0,0.06)]';
  const inner = dark ? 'bg-white/[0.04]' : 'bg-zinc-100/80';
  const muted = dark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className={`min-h-[100dvh] ${bg} pb-16 transition-colors`}>
      <div className="mx-auto max-w-[1380px] px-4 pt-5 sm:px-8">
        {/* Floating Pill Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className={`flex items-center gap-3 rounded-full px-4 py-2 ${card}`}>
            <ClaudeFlowerLogo className="h-5 w-5 text-[#D97757]" />
            <span className="text-sm font-semibold tracking-tight">CC Env</span>
            <span className="h-3 w-[1px] bg-zinc-500/30" />
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {SAMPLE.colo} · {SAMPLE.rtt}ms
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className={`rounded-full px-4 py-2 font-mono text-xs ${card}`}>
              <Eye className="mr-1.5 inline h-3.5 w-3.5" />
              显示 IP
            </button>
            <button type="button" className={`rounded-full px-4 py-2 font-mono text-xs ${card}`}>
              <Share2 className="mr-1.5 inline h-3.5 w-3.5 text-[#D97757]" />
              分享报告
            </button>
            <button
              type="button"
              className="rounded-full bg-[#D97757] px-5 py-2 font-mono text-xs font-semibold text-white shadow-lg shadow-[#D97757]/20"
            >
              <RefreshCw className="mr-1.5 inline h-3.5 w-3.5" />
              重新检测
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
          <main className="space-y-6">
            {/* Bento Row 1: Asymmetric 7 / 5 Split */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Big Hero Score Tile */}
              <div className={`flex flex-col justify-between rounded-[2rem] p-7 lg:col-span-7 ${card}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D97757]/12 px-3 py-1 font-mono text-[11px] font-semibold text-[#D97757]">
                      ANTHROPIC TELEMETRY
                    </span>
                    <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                      Anthropic 环境与 IP 纯净度
                    </h1>
                    <p className={`mt-2 text-sm leading-relaxed ${muted}`}>
                      检测到国内直连分流与 DNS 泄露，建议优先收敛代理规则。
                    </p>
                  </div>

                  <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-3xl bg-amber-500/12 text-amber-500">
                    <span className="font-mono text-4xl font-bold tracking-tight">{SAMPLE.score}</span>
                    <span className="font-mono text-[10px] font-semibold uppercase">Grade {SAMPLE.grade}</span>
                  </div>
                </div>

                {/* 5-Category Pills */}
                <div className="mt-7 grid grid-cols-5 gap-2">
                  {SAMPLE.categories.map((c) => (
                    <div key={c.name} className={`rounded-2xl p-3 ${inner}`}>
                      <div className={`truncate text-[10px] ${muted}`}>{c.name}</div>
                      <div className="mt-1 font-mono text-sm font-bold">
                        {c.score}
                        <span className={`text-[10px] font-normal ${muted}`}>/{c.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Bento Stack: Exit Summary + Agent Fix */}
              <div className="flex flex-col gap-6 lg:col-span-5">
                <div className={`rounded-[2rem] p-6 ${card}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${muted}`}>海外代理出口</span>
                    <span className="rounded-full bg-emerald-500/12 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-500">
                      {SAMPLE.ipTier}
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-2xl font-bold tracking-tight">
                    {SAMPLE.proxyIp}
                  </div>
                  <div className={`mt-1 text-xs ${muted}`}>
                    {SAMPLE.proxyGeo} · {SAMPLE.isp} ({SAMPLE.asn})
                  </div>

                  <div className={`mt-4 flex items-center justify-between rounded-2xl px-4 py-3 ${inner}`}>
                    <div>
                      <div className={`text-[10px] ${muted}`}>国内直连分流</div>
                      <div className="font-mono text-xs font-semibold text-amber-500">
                        {SAMPLE.domesticIp}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] ${muted}`}>WebRTC UDP</div>
                      <div className="font-mono text-xs font-semibold text-rose-500">异常泄露</div>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-between gap-4 rounded-[2rem] p-5 ${card}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Bot className="h-4 w-4 text-[#D97757]" />
                      <span>交给 AI Agent 一键优化</span>
                    </div>
                    <p className={`mt-1 truncate text-xs ${muted}`}>
                      复制指令给 Claude Code / Codex / CC Haha
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-2xl bg-[#D97757] px-4 py-2.5 font-mono text-xs font-semibold text-white"
                  >
                    复制 Prompt
                  </button>
                </div>
              </div>
            </div>

            {/* Bento Row 2: 3-Tile Asymmetric Telemetry */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className={`rounded-[2rem] p-6 ${card}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">DNS 泄露</span>
                  <span className="rounded-full bg-rose-500/12 px-2.5 py-0.5 font-mono text-[10px] text-rose-500">
                    存在泄露
                  </span>
                </div>
                <div className="mt-4 font-mono text-lg font-bold">{SAMPLE.dnsIp}</div>
                <div className={`mt-1 text-xs ${muted}`}>{SAMPLE.dnsGeo}</div>
              </div>

              <div className={`rounded-[2rem] p-6 ${card}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">时区与语言指纹</span>
                  <span className="rounded-full bg-amber-500/12 px-2.5 py-0.5 font-mono text-[10px] text-amber-500">
                    不匹配
                  </span>
                </div>
                <div className="mt-4 font-mono text-lg font-bold">{SAMPLE.timezone}</div>
                <div className={`mt-1 text-xs ${muted}`}>
                  IP 时区 {SAMPLE.ipTimezone} · {SAMPLE.language}
                </div>
              </div>

              <div className={`rounded-[2rem] p-6 ${card}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Anthropic 端点</span>
                  <Wifi className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="mt-4 space-y-2">
                  {SAMPLE.endpoints.map((ep) => (
                    <div key={ep.domain} className="flex justify-between font-mono text-xs">
                      <span className={muted}>{ep.domain}</span>
                      <span className="text-emerald-500">{ep.rtt} ms</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* Bento Sidebar */}
          <aside className="space-y-6">
            <div className={`rounded-[2rem] p-6 ${card}`}>
              <div className={`font-mono text-[10px] uppercase tracking-wider ${muted}`}>Ecosystem</div>
              <div className="mt-4 space-y-4">
                <div className={`rounded-2xl p-4 ${inner}`}>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>ModelDial</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <p className={`mt-1 text-xs ${muted}`}>大模型评测与模型掺假指纹验证</p>
                </div>
                <div className={`rounded-2xl p-4 ${inner}`}>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>CC Haha</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <p className={`mt-1 text-xs ${muted}`}>Codex 级 Computer Use · 手机远程</p>
                </div>
              </div>
            </div>

            <div className={`rounded-[2rem] p-6 ${card}`}>
              <div className={`font-mono text-[10px] uppercase tracking-wider ${muted}`}>Sponsors</div>
              <p className={`mt-2 text-xs leading-relaxed ${muted}`}>欢迎优质 AI / 云基础设施服务商赞助</p>
              <div className="mt-3 flex items-center gap-2 font-mono text-xs text-[#D97757]">
                <Mail className="h-3.5 w-3.5" />
                relakkes@gmail.com
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 方案 C：NOC Telemetry Cockpit（Cloudflare Radar / Raycast 极客高密度驾驶舱）
 * ============================================================================ */
function NocCockpitScheme({ dark }: { dark: boolean }) {
  const bg = dark ? 'bg-[#090A0D] text-zinc-100' : 'bg-[#F3F4F6] text-zinc-900';
  const panel = dark ? 'bg-[#101217] border-zinc-800' : 'bg-white border-zinc-200';
  const border = dark ? 'border-zinc-800' : 'border-zinc-200';
  const muted = dark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className={`min-h-[100dvh] font-mono ${bg}`}>
      {/* Command Bar */}
      <header className={`border-b ${border} ${dark ? 'bg-[#0D0F14]' : 'bg-white'}`}>
        <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-between px-4 text-xs">
          <div className="flex items-center gap-3">
            <ClaudeFlowerLogo className="h-4 w-4 text-[#D97757]" />
            <span className="font-bold">CC-ENV//AUDIT</span>
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-500">
              LIVE · {SAMPLE.colo} {SAMPLE.rtt}ms
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline ${muted}`}>{SAMPLE.scannedAt}</span>
            <button type="button" className={`border px-2.5 py-1 ${border}`}>MASK: ON</button>
            <button type="button" className="bg-[#D97757] px-3 py-1 font-semibold text-white">
              RE-SCAN
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-3 p-4 xl:grid-cols-[1fr_290px]">
        <main className="space-y-3">
          {/* Top KPI Strip */}
          <div className={`grid grid-cols-2 divide-x divide-y border md:grid-cols-5 md:divide-y-0 ${panel}`}>
            <div className="p-3.5">
              <div className={`text-[10px] uppercase ${muted}`}>RISK SCORE</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-amber-500">{SAMPLE.score}</span>
                <span className="text-xs text-amber-500">GRADE {SAMPLE.grade}</span>
              </div>
            </div>
            <div className="p-3.5">
              <div className={`text-[10px] uppercase ${muted}`}>EGRESS IP</div>
              <div className="mt-1 truncate text-sm font-bold">{SAMPLE.proxyIp}</div>
              <div className={`text-[10px] ${muted}`}>{SAMPLE.proxyGeo}</div>
            </div>
            <div className="p-3.5">
              <div className={`text-[10px] uppercase ${muted}`}>NETWORK TIER</div>
              <div className="mt-1 truncate text-xs font-bold">{SAMPLE.ipTier}</div>
              <div className={`truncate text-[10px] ${muted}`}>{SAMPLE.isp}</div>
            </div>
            <div className="p-3.5">
              <div className={`text-[10px] uppercase ${muted}`}>DNS / WEBRTC</div>
              <div className="mt-1 text-xs font-bold text-rose-500">LEAK DETECTED</div>
              <div className={`text-[10px] ${muted}`}>{SAMPLE.dnsIp}</div>
            </div>
            <div className="col-span-2 flex items-center justify-between gap-2 p-3.5 md:col-span-1">
              <button
                type="button"
                className="w-full border border-[#D97757] bg-[#D97757]/15 py-2 text-[11px] font-semibold text-[#D97757] hover:bg-[#D97757] hover:text-white"
              >
                COPY AGENT PROMPT
              </button>
            </div>
          </div>

          {/* 3-Column Dense Grid */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className={`border p-4 ${panel}`}>
              <div className="mb-3 flex items-center justify-between border-b pb-2 text-[11px] font-bold uppercase tracking-wider text-[#D97757]">
                <span>01. TELEMETRY MATRIX</span>
                <Globe className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className={muted}>ASN</span>
                  <span>{SAMPLE.asn}</span>
                </div>
                <div className="flex justify-between">
                  <span className={muted}>DIRECT_CN</span>
                  <span className="text-amber-500">{SAMPLE.domesticIp}</span>
                </div>
                <div className="flex justify-between">
                  <span className={muted}>TIMEZONE</span>
                  <span className="text-rose-500">{SAMPLE.timezone}</span>
                </div>
                <div className="flex justify-between">
                  <span className={muted}>LOCALE</span>
                  <span>{SAMPLE.language}</span>
                </div>
              </div>
            </div>

            <div className={`border p-4 ${panel}`}>
              <div className="mb-3 flex items-center justify-between border-b pb-2 text-[11px] font-bold uppercase tracking-wider text-[#D97757]">
                <span>02. ENDPOINT PROBE</span>
                <Server className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-2 text-[11px]">
                {SAMPLE.endpoints.map((ep) => (
                  <div key={ep.domain} className="flex items-center justify-between">
                    <span className="truncate">{ep.domain}</span>
                    <span className="text-emerald-500">200 OK · {ep.rtt}ms</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`border p-4 ${panel}`}>
              <div className="mb-3 flex items-center justify-between border-b pb-2 text-[11px] font-bold uppercase tracking-wider text-[#D97757]">
                <span>03. CLI GUARD EXPORTS</span>
                <Terminal className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-1 text-[10px]">
                {SAMPLE.cliEnv.map((e) => (
                  <div key={e.key} className="truncate">
                    <span className="text-emerald-500">$</span> export {e.key}={e.val}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Log */}
          <div className={`border ${panel}`}>
            <div className={`border-b px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#D97757] ${border}`}>
              04. RISK AUDIT LOG
            </div>
            <div className={`divide-y text-xs ${border}`}>
              {SAMPLE.findings.map((f) => (
                <div key={f.title} className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <div>
                    <span
                      className={`mr-2 text-[10px] font-bold uppercase ${
                        f.severity === 'danger'
                          ? 'text-rose-500'
                          : f.severity === 'warn'
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                      }`}
                    >
                      [{f.severity}]
                    </span>
                    <span className="font-semibold">{f.title}</span>
                    <div className={`mt-0.5 text-[11px] ${muted}`}>{f.detail}</div>
                  </div>
                  <span className="shrink-0 font-bold">{f.impact}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Cockpit Right Rail */}
        <aside className="space-y-3">
          <div className={`border p-4 ${panel}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#D97757]">
              ECOSYSTEM // TOOLS
            </div>
            <div className="mt-3 space-y-3 text-xs">
              <div className={`border p-2.5 ${border}`}>
                <div className="font-bold">ModelDial ↗</div>
                <div className={`mt-1 text-[10px] ${muted}`}>模型评测 / 模型掺假指纹验证</div>
              </div>
              <div className={`border p-2.5 ${border}`}>
                <div className="font-bold">CC Haha ↗</div>
                <div className={`mt-1 text-[10px] ${muted}`}>Codex 级 Computer Use / 手机远程</div>
              </div>
            </div>
          </div>

          <div className={`border p-4 ${panel}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#D97757]">
              SPONSORS
            </div>
            <div className={`mt-2 text-[11px] ${muted}`}>relakkes@gmail.com</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function DesignPreviewStudio() {
  const [scheme, setScheme] = useState<SchemeId>('swiss');
  const [dark, setDark] = useState(true);

  return (
    <div>
      <SchemeSwitcherBar scheme={scheme} setScheme={setScheme} dark={dark} setDark={setDark} />
      {scheme === 'swiss' && <SwissEditorialScheme dark={dark} />}
      {scheme === 'bento' && <BentoGalleryScheme dark={dark} />}
      {scheme === 'cockpit' && <NocCockpitScheme dark={dark} />}
    </div>
  );
}

import { useState } from 'react';
import { Check, Copy, ShieldCheck, Terminal, Wifi, WifiOff } from 'lucide-react';
import type { AnthropicEndpointCheck, CliEnvRecommendation } from '../types/telemetry';

interface EndpointsProps {
  endpoints: AnthropicEndpointCheck[];
  isProxyOrDatacenter: boolean;
}

export function AnthropicEndpointsSection({ endpoints, isProxyOrDatacenter }: EndpointsProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-[#D97757]" />
          <h2 className="font-mono text-sm font-semibold text-[var(--text-primary)]">
            Anthropic 多端点可达性与策略差异
          </h2>
        </div>
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inner)] px-2.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
          Web / API / OAuth 独立探测
        </span>
      </div>

      {isProxyOrDatacenter && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-3.5 py-2.5 text-xs leading-relaxed text-amber-500">
          联动提示：当前出口属于机房 VPS 或商业代理，访问{' '}
          <code className="font-mono font-semibold">claude.ai</code> 更容易触发 Cloudflare Bot
          Challenge (<code className="font-mono">cf-mitigated</code> / 1020)，而{' '}
          <code className="font-mono font-semibold">api.anthropic.com</code>{' '}
          通常相对宽松；若网页端打不开但 CLI 可用，优先更换住宅 ISP 节点。
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {endpoints.map((ep) => (
          <div
            key={ep.id}
            className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3.5 transition hover:border-[#D97757]/35"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-xs font-bold text-[var(--text-primary)]">
                {ep.domain}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-medium ${
                  ep.reachable
                    ? (ep.rttMs ?? 999) < 220
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-amber-500/15 text-amber-500'
                    : 'bg-rose-500/15 text-rose-500'
                }`}
              >
                {ep.reachable ? (
                  <>
                    <Wifi className="h-2.5 w-2.5" />
                    {ep.rttMs !== null ? `${ep.rttMs} ms` : '可达'}
                  </>
                ) : (
                  <>
                    <WifiOff className="h-2.5 w-2.5" />
                    不可达
                  </>
                )}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-medium text-[var(--text-secondary)]">{ep.label}</span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="font-mono text-[10px] text-[#D97757]">{ep.wafPolicy}</span>
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">{ep.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CliGuardProps {
  items: CliEnvRecommendation[];
}

const PRIORITY_STYLE: Record<
  CliEnvRecommendation['priority'],
  { label: string; badge: string }
> = {
  required: {
    label: '强烈建议',
    badge: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
  },
  recommended: {
    label: '推荐开启',
    badge: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  },
  optional: {
    label: '按需开启',
    badge: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  },
};

export function ClaudeCliGuardSection({ items }: CliGuardProps) {
  const [copiedShell, setCopiedShell] = useState(false);

  const shellSnippet = items
    .map((item) => `export ${item.envKey}=${item.envValue}`)
    .join('\n');

  const handleCopyShell = async () => {
    try {
      await navigator.clipboard.writeText(shellSnippet);
      setCopiedShell(true);
      setTimeout(() => setCopiedShell(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[#D97757]" />
          <h2 className="font-mono text-sm font-semibold text-[var(--text-primary)]">
            Claude Code CLI 防风控配置建议
          </h2>
        </div>

        <button
          type="button"
          onClick={handleCopyShell}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inner)] px-3 py-1.5 font-mono text-[11px] font-medium text-[var(--text-primary)] transition hover:border-[#D97757]/50"
        >
          {copiedShell ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-500">已复制环境变量</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-[#D97757]" />
              <span>一键复制 export 配置</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {items.map((item) => {
          const style = PRIORITY_STYLE[item.priority];
          return (
            <div
              key={item.envKey}
              className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${style.badge}`}
                >
                  {style.label}
                </span>
                <span className="truncate font-mono text-[10px] text-[var(--text-muted)]">
                  ={item.envValue}
                </span>
              </div>
              <div className="mt-2 truncate font-mono text-xs font-bold text-[var(--text-primary)]">
                {item.envKey}
              </div>
              <div className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                {item.title}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
                {item.reason}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] px-3.5 py-2.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-500" />
        <span>
          <strong className="text-[var(--text-secondary)]">第三方中转 / AI 网关提醒：</strong>
          若配置了自定义 <code className="font-mono">ANTHROPIC_BASE_URL</code>，CLI 会通过
          GrowthBook 上报 <code className="font-mono">apiBaseUrlHost</code>，并自动检测响应头中的{' '}
          <code className="font-mono">x-litellm-</code>、<code className="font-mono">helicone-</code>
          、<code className="font-mono">x-portkey-</code>、<code className="font-mono">cf-aig-</code>{' '}
          等网关标记；建议将中转配置与主力官方账号环境隔离。
        </span>
      </div>
    </div>
  );
}

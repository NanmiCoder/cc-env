import { useState } from 'react';
import { Check, Copy, ShieldCheck, Terminal, Wifi, WifiOff } from 'lucide-react';
import type { AnthropicEndpointCheck, CliEnvRecommendation } from '../types/telemetry';

interface EndpointsProps {
  endpoints: AnthropicEndpointCheck[];
  isProxyOrDatacenter: boolean;
}

export function AnthropicEndpointsSection({ endpoints, isProxyOrDatacenter }: EndpointsProps) {
  return (
    <div className="surface-card overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-[#D97757]" />
          <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Anthropic 多端点可达性与策略差异
          </h2>
        </div>
        <span className="font-mono text-[11px] text-[var(--text-muted)]">
          Web / API / OAuth 独立探测
        </span>
      </div>

      {isProxyOrDatacenter && (
        <div className="border-b border-amber-500/20 bg-amber-500/[0.06] px-5 py-2.5 text-xs leading-relaxed text-amber-500">
          联动提示：当前出口属于机房 VPS 或商业代理，访问{' '}
          <code className="font-mono font-semibold">claude.ai</code> 更容易触发 Cloudflare Bot
          Challenge (<code className="font-mono">cf-mitigated</code> / 1020)，而{' '}
          <code className="font-mono font-semibold">api.anthropic.com</code>{' '}
          通常相对宽松；若网页端打不开但 CLI 可用，优先更换住宅 ISP 节点。
        </div>
      )}

      <div className="grid grid-cols-1 divide-y divide-[var(--border-soft)] md:grid-cols-3 md:divide-x md:divide-y-0">
        {endpoints.map((ep) => (
          <div key={ep.id} className="min-w-0 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-xs font-semibold text-[var(--text-primary)]">
                {ep.domain}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-medium ${
                  ep.reachable
                    ? (ep.rttMs ?? 999) < 220
                      ? 'bg-emerald-500/12 text-emerald-500'
                      : 'bg-amber-500/12 text-amber-500'
                    : 'bg-rose-500/12 text-rose-500'
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

            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-medium text-[var(--text-secondary)]">{ep.label}</span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="font-mono text-[10px] text-[#D97757]">{ep.wafPolicy}</span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{ep.note}</p>
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
    badge: 'bg-rose-500/12 text-rose-500 border-rose-500/25',
  },
  recommended: {
    label: '推荐开启',
    badge: 'bg-amber-500/12 text-amber-500 border-amber-500/25',
  },
  optional: {
    label: '按需开启',
    badge: 'bg-zinc-500/12 text-[var(--text-secondary)] border-[var(--border-subtle)]',
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
    <div className="surface-card overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[#D97757]" />
          <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Claude Code CLI 防风控配置建议
          </h2>
        </div>

        <button
          type="button"
          onClick={handleCopyShell}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-inner)] px-3 py-1.5 font-mono text-[11px] font-medium text-[var(--text-primary)] transition hover:border-[#D97757]/50 active:scale-[0.98]"
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

      <div className="grid grid-cols-1 divide-y divide-[var(--border-soft)] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {items.map((item) => {
          const style = PRIORITY_STYLE[item.priority];
          return (
            <div key={item.envKey} className="min-w-0 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${style.badge}`}
                >
                  {style.label}
                </span>
                <span className="truncate font-mono text-[11px] text-[var(--text-muted)]">
                  ={item.envValue}
                </span>
              </div>
              <div className="mt-2.5 truncate font-mono text-xs font-semibold text-[var(--text-primary)]">
                {item.envKey}
              </div>
              <div className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                {item.title}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
                {item.reason}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2.5 border-t border-[var(--border-soft)] bg-[var(--bg-inner)]/60 px-5 py-3 text-xs leading-relaxed text-[var(--text-muted)]">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D97757]" />
        <span>
          <strong className="font-medium text-[var(--text-secondary)]">第三方中转 / AI 网关提醒：</strong>
          若配置了自定义 <code className="font-mono text-[11px]">ANTHROPIC_BASE_URL</code>，CLI 会通过
          GrowthBook 上报 <code className="font-mono text-[11px]">apiBaseUrlHost</code>，并自动检测响应头中的{' '}
          <code className="font-mono text-[11px]">x-litellm-</code>、<code className="font-mono text-[11px]">helicone-</code>
          、<code className="font-mono text-[11px]">x-portkey-</code>、<code className="font-mono text-[11px]">cf-aig-</code>{' '}
          等网关标记；建议将中转配置与主力官方账号环境隔离。
        </span>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Mail } from 'lucide-react';

interface EcosystemSidebarProps {
  isRestrictedOrHighRisk?: boolean;
}

function ModelDialSymbol({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 236 144"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M69.7724 49.8883C60.5626 61.5501 56.816 77.3159 56.706 91.9188C56.6472 99.7427 57.6647 116.5936 55.8376 123.3236C51.4581 139.4545 32.3013 142.6894 18.0914 143.3597C12.9216 143.6035 3.1369 145.0394 0.8921 138.9633C-0.4868 135.2314 0.322 119.5489 0.3107 114.5787C0.2917 106.3045 -0.4711 94.6979 0.7368 86.802C2.8646 72.8943 12.1124 59.9687 24.2322 52.867C34.9094 46.611 46.6363 43.2654 59.067 45.5501C62.5384 46.1878 67.3708 47.277 69.7724 49.8883Z" />
      <path d="M75.028 42.5787C78.5173 38.1878 83.3416 34.3349 87.8451 31.0097C107.7836 16.2874 139.7312 3.4827 155.8891 30.6789C161.4883 40.1033 160.4456 51.465 160.454 61.9492C160.4595 68.893 160.496 75.8379 160.4573 82.7817C160.3678 98.92 163.3866 118.383 149.889 130.3156C134.5629 143.8648 113.9088 133.9748 108.6473 116.0026C106.7522 109.5295 107.0647 102.9808 107.0322 96.3046C106.981 85.8693 107.5702 75.2901 106.9745 64.8731C106.2921 52.9346 100.2229 43.204 87.8323 41.0923C83.2952 40.3189 79.3173 41.9563 75.028 42.5787Z" />
      <path d="M143.553 140.8934C147.687 138.8555 151.6028 136.7437 155.2649 133.912C169.0322 123.2662 177.7238 105.4869 178.5516 88.2256C179.0282 78.2889 178.67 68.2425 178.655 58.2944C178.6386 47.6293 178.3148 37.1834 182.7846 27.2547C188.7771 13.9442 202.6975 3.7148 216.9126 1.0599C221.0535 0.2865 228.5591 -0.9068 232.2607 1.4579C236.6128 4.2378 235.7773 9.5756 235.7645 14.0711C235.7328 25.1572 235.7591 36.2438 235.7565 47.3299C235.7539 59.9186 236.6399 72.6739 233.481 84.9717C226.8132 110.9315 203.7754 130.919 178.9068 138.9216C170.1024 141.7552 152.0479 144.5555 143.553 140.8934Z" />
    </svg>
  );
}

function GitHubSymbol({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export default function EcosystemSidebar({ isRestrictedOrHighRisk }: EcosystemSidebarProps) {
  const [copiedMail, setCopiedMail] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('relakkes@gmail.com');
      setCopiedMail(true);
      setTimeout(() => setCopiedMail(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <aside className="space-y-4 xl:sticky xl:top-5">
      {/* Ecosystem Projects */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 backdrop-blur-md">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Ecosystem
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">作者开源与工具矩阵</span>
        </div>

        <div className="space-y-2.5">
          {/* 1. ModelDial */}
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3.5 transition hover:border-[#254BB5]/40">
            <a
              href="https://modeldial.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-strong)] text-[var(--text-primary)] shadow-sm">
                  <ModelDialSymbol className="h-4 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      ModelDial
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#254BB5]" />
                  </div>
                  <div className="truncate font-mono text-[10px] text-[var(--text-muted)]">
                    modeldial.com
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--text-primary)]" />
            </a>

            <p className="mt-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              主流大模型实测评测、编程/文本能力排行榜与套餐性价比对比。
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <a
                href="https://modeldial.com/#radar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-[10px] text-[var(--text-secondary)] transition hover:border-[#254BB5]/45 hover:text-[var(--text-primary)]"
              >
                编程能力榜
                <ArrowUpRight className="h-2.5 w-2.5" />
              </a>
              <a
                href="https://modeldial.com/#writing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-[10px] text-[var(--text-secondary)] transition hover:border-[#254BB5]/45 hover:text-[var(--text-primary)]"
              >
                文本能力榜
                <ArrowUpRight className="h-2.5 w-2.5" />
              </a>
              <a
                href="https://modeldial.com/model-detector"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10px] transition ${
                  isRestrictedOrHighRisk
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-500 hover:border-amber-500/60'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[#254BB5]/45 hover:text-[var(--text-primary)]'
                }`}
              >
                模型掺假指纹验证
                <ArrowUpRight className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>

          {/* 2. CC Haha Open-Source Desktop */}
          <a
            href="https://github.com/NanmiCoder/cc-haha"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-[var(--border-soft)] bg-[var(--bg-inner)] p-3.5 transition hover:border-[#D97757]/45"
          >
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-strong)] text-[var(--text-primary)] shadow-sm">
                  <GitHubSymbol className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      CC Haha
                    </span>
                    <span className="rounded bg-[#D97757]/12 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#D97757]">
                      开源桌面端
                    </span>
                  </div>
                  <div className="truncate font-mono text-[10px] text-[var(--text-muted)]">
                    NanmiCoder/cc-haha
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#D97757]" />
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              跨平台 Claude Code 桌面工作台：集成 Agent Teams、Worktree 审阅与手机扫码远程审批派单。
            </p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                Codex 级 Computer Use
              </span>
              <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                多模型切换
              </span>
              <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                手机 App / H5 远程
              </span>
            </div>
          </a>
        </div>
      </div>

      {/* Minimalist Sponsors Footer Card */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Sponsors
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">合作与支持</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
          支持独立开源项目与免费检测站长期稳定运行，欢迎优质 AI / 云基础设施服务商联系赞助。
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-inner)] px-2.5 py-1.5">
          <a
            href="mailto:relakkes@gmail.com"
            className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-[var(--text-primary)] transition hover:text-[#D97757]"
          >
            <Mail className="h-3.5 w-3.5 shrink-0 text-[#D97757]" />
            <span className="truncate">relakkes@gmail.com</span>
          </a>
          <button
            type="button"
            onClick={handleCopyEmail}
            title="复制邮箱"
            aria-label="复制联系邮箱"
            className="shrink-0 rounded p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          >
            {copiedMail ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

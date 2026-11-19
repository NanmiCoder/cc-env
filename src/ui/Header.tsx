import { Eye, EyeOff, Github, Moon, RefreshCw, Share2, Sun } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';
import { BTN, Logo } from './shared';

const NAV = [
  { href: '#route', label: '流量路径' },
  { href: '#audit', label: '审计明细' },
  { href: '#fix', label: '修复方案' },
  { href: '#data', label: '原始数据' },
];

export default function Header({
  theme,
  onToggleTheme,
  hideIp,
  onToggleIp,
  loading,
  hasReport,
  onShare,
  onRescan,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  hideIp: boolean;
  onToggleIp: () => void;
  loading: boolean;
  hasReport: boolean;
  onShare: () => void;
  onRescan: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center gap-2 px-4 sm:gap-4 sm:px-8">
        <a href="/" className="flex shrink-0 items-center gap-2.5" aria-label="CC Env 首页">
          <Logo className="h-6 w-6 text-clay" />
          <span className="font-serif text-xl font-semibold tracking-tight">CC Env</span>
        </a>

        {hasReport && !loading && (
          <nav className="ml-6 hidden items-center gap-6 text-sm text-ink-2 lg:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-ink">
                {item.label}
              </a>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <a
            href="https://github.com/NanmiCoder/cc-env"
            target="_blank"
            rel="noopener noreferrer"
            title="查看源码，给 CC Env 点个 Star"
            aria-label="在新标签页打开 CC Env 的 GitHub 仓库"
            className={`${BTN.icon} max-[419px]:hidden`}
          >
            <Github className="h-[18px] w-[18px]" />
          </a>
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? '切换为亮色主题' : '切换为暗色主题'}
            aria-label="切换亮色/暗色主题"
            className={BTN.icon}
          >
            {theme === 'dark' ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggleIp}
            title={hideIp ? '显示完整 IP' : '隐藏 IP'}
            aria-label={hideIp ? '显示完整 IP' : '隐藏 IP'}
            aria-pressed={!hideIp}
            className={BTN.icon}
          >
            {hideIp ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
          <button
            type="button"
            onClick={onShare}
            disabled={!hasReport || loading}
            title="生成分享海报"
            aria-label="分享报告"
            className={BTN.icon}
          >
            <Share2 className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={onRescan}
            disabled={loading}
            className={`${BTN.primary} ml-1.5 !h-9 !px-4 sm:ml-2`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '检测中' : '重新检测'}
          </button>
        </div>
      </div>
    </header>
  );
}

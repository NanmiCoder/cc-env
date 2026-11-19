import type { ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import type { CliEnvRecommendation } from '../types/telemetry';
import { Section, useCopy } from './shared';

const PRIORITY_LABEL: Record<CliEnvRecommendation['priority'], string> = {
  required: '强烈建议',
  recommended: '推荐开启',
  optional: '按需开启',
};

function Terminal({
  name,
  copied,
  copyLabel,
  onCopy,
  children,
}: {
  name: string;
  copied: boolean;
  copyLabel: string;
  onCopy: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-term text-term-ink shadow-[0_24px_60px_-32px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <i className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <i className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </span>
        <span className="num truncate text-xs text-white/50">{name}</span>
        <button
          type="button"
          onClick={onCopy}
          className="ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-xs font-medium text-white transition hover:bg-white/20"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? '已复制' : copyLabel}
        </button>
      </div>
      <div className="num overflow-x-auto p-5 text-[13px] leading-[1.75]">{children}</div>
    </div>
  );
}

export default function Remedy({
  recommendations,
  cliItems,
  agentPrompt,
}: {
  recommendations: string[];
  cliItems: CliEnvRecommendation[];
  agentPrompt: string;
}) {
  const shell = useCopy();
  const prompt = useCopy(2200);
  const shellSnippet = cliItems.map((item) => `export ${item.envKey}=${item.envValue}`).join('\n');
  const promptLines = agentPrompt.split('\n').filter((line) => line.trim().length > 0);

  return (
    <Section id="fix" index="03" title="修复方案" aside="按顺序处理，或直接交给 AI Agent">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-14">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">修复与防封建议</h3>
          <ol className="mt-4">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-5 border-b border-line py-4 first:pt-0">
                <span className="font-serif text-2xl font-medium leading-none text-clay">
                  {idx + 1}
                </span>
                <p className="min-w-0 break-words text-[15px] leading-relaxed text-ink-2">{rec}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[13px] leading-relaxed text-ink-3">
            <strong className="font-medium text-ink-2">第三方中转 / AI 网关提醒：</strong>
            若配置了自定义 <code className="num">ANTHROPIC_BASE_URL</code>，CLI 会通过 GrowthBook 上报{' '}
            <code className="num">apiBaseUrlHost</code>，并自动检测响应头中的{' '}
            <code className="num">x-litellm-</code>、<code className="num">helicone-</code>、
            <code className="num">x-portkey-</code>、<code className="num">cf-aig-</code>{' '}
            等网关标记；建议将中转配置与主力官方账号环境隔离。
          </p>
        </div>

        <div className="min-w-0 space-y-6">
          <div>
            <h3 className="text-sm font-semibold">交给 AI Agent 自动优化</h3>
            <p className="mb-3 mt-1 text-[13px] leading-relaxed text-ink-2">
              把这段诊断指令发给 Claude Code、Codex 或{' '}
              <a
                href="https://github.com/NanmiCoder/cc-haha"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-clay"
              >
                CC Haha
              </a>
              ，即可协同调整浏览器语言与系统底层配置。
            </p>
            <Terminal
              name="agent-fix.prompt"
              copied={prompt.copied}
              copyLabel="复制 Prompt"
              onCopy={() => void prompt.copy(agentPrompt)}
            >
              <div className="relative max-h-40 overflow-hidden whitespace-pre-wrap break-words text-white/75">
                {promptLines.slice(0, 8).join('\n')}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-term to-transparent" />
              </div>
            </Terminal>
          </div>

          {cliItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold">Claude Code CLI 防风控配置</h3>
              <p className="mb-3 mt-1 text-[13px] leading-relaxed text-ink-2">
                追加到 <code className="num">~/.zshrc</code> 或 <code className="num">~/.bashrc</code>，重开终端生效。
              </p>
              <Terminal
                name="~/.zshrc"
                copied={shell.copied}
                copyLabel="复制 export 配置"
                onCopy={() => void shell.copy(shellSnippet)}
              >
                <div className="space-y-4">
                  {cliItems.map((item) => (
                    <div key={item.envKey} className="min-w-0">
                      <div className="whitespace-pre-wrap break-words font-sans text-white/45">
                        # {PRIORITY_LABEL[item.priority]} · {item.title}：{item.reason}
                      </div>
                      <div className="break-all">
                        <span className="text-[#e0805f]">export</span> {item.envKey}=
                        <span className="text-[#8fcf9f]">{item.envValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Terminal>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

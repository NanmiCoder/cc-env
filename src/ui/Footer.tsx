import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { Logo, useCopy } from './shared';

const EMAIL = 'relakkes@gmail.com';

const PRINCIPLES = [
  {
    title: '出口与家宽分级',
    body: '结合边缘遥测与多源 IP 情报，区分原生家宽 ISP、商业机房 VPS 与共享滥用节点。',
  },
  {
    title: '分流与泄露探针',
    body: '并发探测国内直连出口、EDNS 解析归属与 WebRTC UDP 通道，抓出规则分流与底层泄露。',
  },
  {
    title: '中文指纹一致性',
    body: '核验系统时区、浏览器语言偏好与中文字体特征，避免环境穿帮。',
  },
];

function Out({ href, children, strong = false }: { href: string; children: string; strong?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-0.5 underline decoration-line underline-offset-4 transition hover:decoration-clay ${strong ? 'font-medium text-clay' : 'text-ink-2 hover:text-ink'}`}
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5" />
    </a>
  );
}

export default function Footer({ highRisk }: { highRisk: boolean }) {
  const mail = useCopy();

  return (
    <footer className="mt-16 border-t border-line bg-sunk sm:mt-24">
      <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 sm:py-16">
        <section id="how">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">检测原理</h2>
          <p className="mt-2 max-w-[40em] text-[15px] leading-relaxed text-ink-2">
            专为规避 Claude / Anthropic 账号风控打造的实验性体检台。默认脱敏隐藏公网 IP，点击任意 IP 字段即可展开。
          </p>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {PRINCIPLES.map((item, idx) => (
              <li key={item.title} className="border-t border-line pt-4">
                <span className="num text-xs text-clay">0{idx + 1}</span>
                <h3 className="mt-2 text-[15px] font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 grid gap-10 border-t border-line pt-10 md:grid-cols-3">
          <div>
            <div className="text-xs text-ink-3">作者开源与工具矩阵</div>
            <a
              href="https://modeldial.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 font-serif text-xl font-semibold hover:text-clay"
            >
              ModelDial
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
              主流大模型实测评测、编程/文本能力排行榜与套餐性价比对比。
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
              <Out href="https://modeldial.com/#radar">编程能力榜</Out>
              <Out href="https://modeldial.com/#writing">文本能力榜</Out>
              <Out href="https://modeldial.com/model-detector" strong={highRisk}>
                模型掺假指纹验证
              </Out>
            </div>
          </div>

          <div>
            <div className="text-xs text-ink-3">开源桌面端</div>
            <a
              href="https://github.com/NanmiCoder/cc-haha"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 font-serif text-xl font-semibold hover:text-clay"
            >
              CC Haha
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
              跨平台 Claude Code 桌面工作台：集成 Agent Teams、Worktree 审阅与手机扫码远程审批派单。
            </p>
            <p className="mt-3 text-[13px] text-ink-3">
              Codex 级 Computer Use · 多模型切换 · 手机 App / H5 远程
            </p>
          </div>

          <div>
            <div className="text-xs text-ink-3">合作与支持</div>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              支持独立开源项目与免费检测站长期稳定运行，欢迎优质 AI / 云基础设施服务商联系赞助。
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <a
                href={`mailto:${EMAIL}`}
                className="num truncate underline decoration-line underline-offset-4 hover:decoration-clay"
              >
                {EMAIL}
              </a>
              <button
                type="button"
                onClick={() => void mail.copy(EMAIL)}
                title="复制邮箱"
                aria-label="复制联系邮箱"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-2 transition hover:bg-line hover:text-ink"
              >
                {mail.copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </section>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pt-6 text-[13px] text-ink-3">
          <span className="inline-flex items-center gap-2">
            <Logo className="h-4 w-4 text-clay" />
            CC Env · 实验性工具，检测结果仅供参考
          </span>
          <Out href="https://github.com/NanmiCoder/cc-env">GitHub 开源</Out>
        </div>
      </div>
    </footer>
  );
}

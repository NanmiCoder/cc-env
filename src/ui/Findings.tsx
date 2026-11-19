import { AlertTriangle, Check, Info, XCircle } from 'lucide-react';
import type { AuditFinding } from '../types/telemetry';
import { Section, SEVERITY_TONE, TONE_BG, TONE_TEXT } from './shared';

const CATEGORY_LABEL: Record<AuditFinding['category'], string> = {
  region: '地区合规',
  ip: 'IP 纯净度',
  leak: '防泄露',
  env: '环境一致性',
  routing: '分流与宿主',
};

const ORDER: Record<AuditFinding['severity'], number> = { danger: 0, warn: 1, info: 2, pass: 3 };

export default function Findings({ findings }: { findings: AuditFinding[] }) {
  const sorted = [...findings].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  const issues = sorted.filter((f) => f.severity === 'danger' || f.severity === 'warn');
  const rest = sorted.filter((f) => f.severity === 'info' || f.severity === 'pass');

  return (
    <Section
      id="audit"
      index="02"
      title="审计明细"
      aside={
        <span className="num">
          {issues.length} 项需处理 · {rest.length} 项通过
        </span>
      }
    >
      {issues.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card px-6 py-5 text-[15px] text-ink-2">
          <Check className="mr-2 inline h-4 w-4 text-ok" />
          没有发现需要处理的问题。
        </p>
      ) : (
        <ol className="space-y-4">
          {issues.map((item) => {
            const tone = SEVERITY_TONE[item.severity];
            const Icon = item.severity === 'danger' ? XCircle : AlertTriangle;
            return (
              <li
                key={item.id}
                className="relative overflow-hidden rounded-2xl border border-line bg-card p-5 pl-7 sm:p-7 sm:pl-9"
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${TONE_BG[tone]}`} />
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-10">
                  <div className="min-w-0">
                    <div className={`flex items-center gap-2 text-xs font-medium ${TONE_TEXT[tone]}`}>
                      <Icon className="h-4 w-4" />
                      {item.severity === 'danger' ? '高危' : '警告'}
                      <span className="text-ink-3">· {CATEGORY_LABEL[item.category]}</span>
                    </div>
                    <h3 className="mt-2.5 font-serif text-[22px] font-semibold leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 break-words text-[15px] leading-relaxed text-ink-2">
                      {item.detail}
                    </p>
                  </div>
                  <dl className="min-w-0 space-y-4 text-sm leading-relaxed lg:border-l lg:border-line lg:pl-10">
                    <div>
                      <dt className="text-xs text-ink-3">影响</dt>
                      <dd className="mt-1 text-ink-2">{item.impact}</dd>
                    </div>
                    {item.remediation && (
                      <div>
                        <dt className="text-xs text-ink-3">建议</dt>
                        <dd className="mt-1 font-medium text-ink">{item.remediation}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {rest.length > 0 && (
        <ul className="mt-8 grid gap-x-12 sm:grid-cols-2">
          {rest.map((item) => (
            <li key={item.id} className="flex gap-3 border-b border-line py-4">
              {item.severity === 'pass' ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
              )}
              <div className="min-w-0">
                <div className="text-[15px] font-medium">{item.title}</div>
                <p className="mt-1 break-words text-[13px] leading-relaxed text-ink-2">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

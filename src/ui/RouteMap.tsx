import type { ReactNode } from 'react';
import { Globe, Laptop, Smartphone } from 'lucide-react';
import type { FullReport } from '../hooks/useScan';
import { Dot, Ip, Logo, Section, TONE_TEXT, type Tone } from './shared';

const STROKE: Record<Tone, string> = {
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  bad: 'var(--bad)',
  mute: 'var(--ink-3)',
};

function Link({ tone }: { tone: Tone }) {
  return (
    <div className="flex items-center justify-center" aria-hidden="true">
      <svg className="hidden h-3 w-full lg:block" preserveAspectRatio="none">
        <line x1="0" y1="6" x2="100%" y2="6" stroke={STROKE[tone]} strokeWidth="1.5" className="flow" />
      </svg>
      <svg className="h-8 w-3 lg:hidden">
        <line x1="6" y1="0" x2="6" y2="100%" stroke={STROKE[tone]} strokeWidth="1.5" className="flow" />
      </svg>
    </div>
  );
}

function Hop({
  step,
  icon,
  title,
  children,
}: {
  step: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between text-[13px] text-ink-2">
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <span className="num text-xs text-ink-3">{step}</span>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Bypass({
  label,
  tone,
  status,
  children,
}: {
  label: string;
  tone: Tone;
  status: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 bg-card p-5">
      <div className="text-[13px] text-ink-2">{label}</div>
      <div className={`mt-2 flex items-center gap-2 font-serif text-xl font-semibold ${TONE_TEXT[tone === 'mute' ? 'mute' : tone]}`}>
        <Dot tone={tone} />
        {status}
      </div>
      <div className="mt-3 space-y-1 text-[13px] leading-relaxed text-ink-2">{children}</div>
    </div>
  );
}

export default function RouteMap({
  report,
  hideIp,
  onToggleIp,
}: {
  report: FullReport;
  hideIp: boolean;
  onToggleIp: () => void;
}) {
  const { server, browser, domesticIp, dnsLeak, webrtc, dualStack, history, anthropicEndpoints } =
    report;
  const tzMismatch = Boolean(server.geo.timezone && browser.timezone !== server.geo.timezone);
  const exitTone: Tone =
    server.geo.regionPolicy === 'blocked'
      ? 'bad'
      : server.network.intel.isAbuser || server.network.intel.isTor
        ? 'bad'
        : server.network.intel.isDatacenter ||
            server.network.intel.isVpn ||
            server.network.intel.isProxy ||
            server.network.heuristicType === 'datacenter'
          ? 'warn'
          : 'ok';
  const reachable = anthropicEndpoints.filter((ep) => ep.reachable).length;
  const destTone: Tone =
    reachable === anthropicEndpoints.length ? 'ok' : reachable === 0 ? 'bad' : 'warn';

  const dnsTone: Tone = dnsLeak.status === 'leaked' ? 'bad' : dnsLeak.status === 'safe' ? 'ok' : 'mute';
  const rtcTone: Tone = webrtc.status === 'leaked' ? 'bad' : webrtc.status === 'unknown' ? 'mute' : 'ok';
  const DeviceIcon = browser.isMobile ? Smartphone : Laptop;

  return (
    <Section
      id="route"
      index="01"
      title="流量路径"
      aside="你的请求从本机出发，经出口节点抵达 Anthropic"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_48px_minmax(0,1.1fr)_48px_minmax(0,1.15fr)]">
        <Hop step="本机" icon={<DeviceIcon className="h-4 w-4" />} title="浏览器环境">
          <div className="font-serif text-2xl font-semibold leading-snug">
            {browser.timezone}
          </div>
          <dl className="mt-4 space-y-2 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">时区一致性</dt>
              <dd className={`flex items-center gap-1.5 ${tzMismatch ? 'text-warn' : ''}`}>
                <Dot tone={tzMismatch ? 'warn' : 'ok'} />
                {tzMismatch ? '与出口 IP 不一致' : '与出口 IP 一致'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">首选语言</dt>
              <dd className="num">{browser.language}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">平台</dt>
              <dd className="truncate">{browser.platform || '-'}</dd>
            </div>
          </dl>
        </Hop>

        <Link tone={tzMismatch ? 'warn' : 'ok'} />

        <Hop step="出口" icon={<Globe className="h-4 w-4" />} title="海外代理出口">
          <Ip
            value={server.ip}
            hidden={hideIp}
            onToggle={onToggleIp}
            className="text-2xl font-medium leading-snug"
          />
          <dl className="mt-4 space-y-2 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">位置</dt>
              <dd className="truncate">
                {[server.geo.country, server.geo.region, server.geo.city].filter(Boolean).join(' · ')}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-ink-3">网络</dt>
              <dd className="truncate">
                <span className="num">AS{server.network.asn ?? '-'}</span>{' '}
                {server.network.asOrg ?? ''}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">性质</dt>
              <dd className={`flex items-center gap-1.5 ${exitTone === 'ok' ? '' : TONE_TEXT[exitTone]}`}>
                <Dot tone={exitTone} />
                {report.assessment.ipTierLabel}
              </dd>
            </div>
          </dl>
        </Hop>

        <Link tone={destTone} />

        <Hop step="目的地" icon={<Logo className="h-4 w-4 text-clay" />} title="Anthropic">
          <ul className="space-y-3">
            {anthropicEndpoints.map((ep) => (
              <li key={ep.id} className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <div className="num truncate text-[15px] font-medium">{ep.domain}</div>
                  <div className="truncate text-xs text-ink-3">{ep.label}</div>
                </div>
                <span
                  className={`num flex shrink-0 items-center gap-1.5 text-[13px] ${ep.reachable ? 'text-ink-2' : 'text-bad'}`}
                >
                  <Dot tone={ep.reachable ? 'ok' : 'bad'} />
                  {!ep.reachable ? '不可达' : ep.rttMs !== null ? `${ep.rttMs} ms` : '可达'}
                </span>
              </li>
            ))}
          </ul>
        </Hop>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-semibold">旁路检查</h3>
          <p className="text-[13px] text-ink-3">这些通道可能绕过代理，把真实网络暴露出去</p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          <Bypass
            label="国内直连"
            tone={domesticIp.isChinaDirect ? 'warn' : 'ok'}
            status={domesticIp.isChinaDirect ? '分流直连' : '未检出'}
          >
            <div>
              <Ip value={domesticIp.ip} hidden={hideIp} onToggle={onToggleIp} fallback="未直连" />
            </div>
            <div className="truncate text-ink-3">
              {domesticIp.locationLabel || '全局代理或海外原生'}
            </div>
          </Bypass>

          <Bypass
            label="DNS 解析"
            tone={dnsTone}
            status={dnsLeak.status === 'leaked' ? '存在泄露' : dnsLeak.status === 'safe' ? '正常' : '未知'}
          >
            <div>
              <Ip value={dnsLeak.dnsIp} hidden={hideIp} onToggle={onToggleIp} />
            </div>
            <div className="truncate text-ink-3">{dnsLeak.dnsGeo || '-'}</div>
          </Bypass>

          <Bypass
            label="WebRTC UDP"
            tone={rtcTone}
            status={
              webrtc.status === 'leaked'
                ? '异常泄露'
                : webrtc.status === 'unknown'
                  ? '未知'
                  : webrtc.status === 'matched'
                    ? '与代理一致'
                    : '已屏蔽'
            }
          >
            {webrtc.publicIps.length > 0 ? (
              webrtc.publicIps.slice(0, 2).map((ip) => (
                <div key={ip}>
                  <Ip value={ip} hidden={hideIp} onToggle={onToggleIp} />
                </div>
              ))
            ) : (
              <div>{webrtc.status === 'unknown' ? '未能完成探测' : '无公网暴露'}</div>
            )}
            <div className="num text-ink-3">{webrtc.candidateCount} 个 ICE 候选</div>
          </Bypass>

          <Bypass
            label="IPv6"
            tone={dualStack.ipv6 ? (dualStack.mismatchWithMainIp ? 'warn' : 'ok') : 'ok'}
            status={dualStack.ipv6 ? (dualStack.mismatchWithMainIp ? '双栈不一致' : '已启用') : '已关闭'}
          >
            <div>
              <Ip value={dualStack.ipv6} hidden={hideIp} onToggle={onToggleIp} fallback="无 IPv6 出口" />
            </div>
            <div className="text-ink-3">
              IPv4 <Ip value={dualStack.ipv4} hidden={hideIp} onToggle={onToggleIp} />
            </div>
          </Bypass>

          <Bypass
            label="出口稳定性"
            tone={history.status === 'changed' ? 'warn' : 'ok'}
            status={
              history.status === 'same' ? '稳定未变' : history.status === 'changed' ? 'IP 已变更' : '已建立基线'
            }
          >
            <div>
              {history.previousIp ? (
                <>
                  上次 <Ip value={history.previousIp} hidden={hideIp} onToggle={onToggleIp} />
                </>
              ) : (
                '首次检测'
              )}
            </div>
            <div className="text-ink-3">刷新后自动对比</div>
          </Bypass>
        </div>
      </div>
    </Section>
  );
}

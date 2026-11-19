import type { ReactNode } from 'react';
import type { FullReport } from '../hooks/useScan';
import { Dot, Ip, Section, type Tone } from './shared';

function Group({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {note && <span className="num text-xs text-ink-3">{note}</span>}
      </div>
      <dl>{children}</dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3 text-sm">
      <dt className="shrink-0 text-ink-3">{label}</dt>
      <dd className="min-w-0 break-words text-right">{children}</dd>
    </div>
  );
}

function Flag({ label, value }: { label: string; value: boolean | null }) {
  const tone: Tone = value === null ? 'mute' : value ? 'bad' : 'ok';
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]">
      <Dot tone={tone} />
      <span className="text-ink-3">{label}</span>
      <span className={value ? 'font-medium text-bad' : ''}>
        {value === null ? '未知' : value ? '是' : '否'}
      </span>
    </span>
  );
}

export default function Ledger({
  report,
  hideIp,
  onToggleIp,
}: {
  report: FullReport;
  hideIp: boolean;
  onToggleIp: () => void;
}) {
  const { server, dnsLeak, webrtc, dualStack, browser, splitTunnel, anthropicEndpoints } = report;
  const intel = server.network.intel;
  const tzMismatch = Boolean(server.geo.timezone && browser.timezone !== server.geo.timezone);
  const proxyExit = Boolean(
    intel.isDatacenter || intel.isProxy || intel.isVpn || server.network.heuristicType === 'datacenter'
  );
  const ip = (value: string | null | undefined, fallback = '-') => (
    <Ip value={value} hidden={hideIp} onToggle={onToggleIp} fallback={fallback} />
  );

  return (
    <Section id="data" index="04" title="原始数据" aside="点击任意 IP 可切换显示 / 隐藏">
      <div className="grid gap-x-14 gap-y-10 md:grid-cols-2">
        <Group title="IP 属性与安全" note={intel.source}>
          <Row label="网络性质">{report.assessment.ipTierLabel}</Row>
          <Row label="ISP / 机构">{intel.companyName || server.network.asOrg || '未知'}</Row>
          <Row label="ASN">
            <span className="num">AS{server.network.asn ?? '-'}</span>
          </Row>
          <Row label="IPv6 出口">{ip(dualStack.ipv6, '已关闭 (安全)')}</Row>
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-line py-3">
            <Flag label="机房" value={intel.isDatacenter} />
            <Flag label="VPN" value={intel.isVpn} />
            <Flag label="Proxy" value={intel.isProxy} />
            <Flag label="Tor" value={intel.isTor} />
            <Flag label="滥用库" value={intel.isAbuser} />
          </div>
        </Group>

        <Group title="DNS 泄露检测">
          <Row label="DNS 出口">{ip(dnsLeak.dnsIp)}</Row>
          <Row label="归属地">
            <span className={dnsLeak.status === 'leaked' ? 'font-medium text-bad' : ''}>
              {dnsLeak.dnsGeo || '-'}
            </span>
          </Row>
          <Row label="EDNS 网段">{ip(dnsLeak.ednsIp)}</Row>
          <Row label="EDNS 归属">{dnsLeak.ednsGeo || '-'}</Row>
        </Group>

        <Group title="WebRTC UDP">
          <Row label="UDP 出口">
            {webrtc.publicIps.length > 0 ? (
              <span className={`flex flex-col items-end gap-1 ${webrtc.status === 'leaked' ? 'text-bad' : ''}`}>
                {webrtc.publicIps.map((value) => (
                  <span key={value}>{ip(value)}</span>
                ))}
              </span>
            ) : webrtc.status === 'unknown' ? (
              '未知'
            ) : (
              '无公网暴露'
            )}
          </Row>
          <Row label="归属地">
            {webrtc.ipDetails.length > 0
              ? webrtc.ipDetails
                  .map((d) => [d.country, d.region, d.city].filter(Boolean).join(' ') || '-')
                  .join(', ')
              : '-'}
          </Row>
          <Row label="运营商">
            {webrtc.ipDetails.length > 0 ? webrtc.ipDetails.map((d) => d.isp || '-').join(', ') : '-'}
          </Row>
          <Row label="ICE 候选">
            <span className="num">{webrtc.candidateCount}</span>
          </Row>
        </Group>

        <Group title="生态可达与指纹">
          {splitTunnel.endpoints.map((ep) => (
            <Row key={ep.name} label={ep.name}>
              <span className={`num inline-flex items-center gap-1.5 ${ep.reachable ? '' : 'text-ink-3'}`}>
                <Dot tone={ep.reachable ? 'ok' : 'mute'} />
                {ep.reachable && ep.rttMs !== null ? `${ep.rttMs} ms` : '不可达'}
              </span>
            </Row>
          ))}
          <Row label="时区 / 语言">
            <span className={tzMismatch ? 'font-medium text-warn' : ''}>
              {browser.timezone} ({browser.language})
            </span>
          </Row>
        </Group>
      </div>

      <div className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink pb-2.5">
          <h3 className="text-sm font-semibold">Anthropic 多端点可达性与策略差异</h3>
          <span className="text-xs text-ink-3">Web / API / OAuth 独立探测</span>
        </div>
        <ul>
          {anthropicEndpoints.map((ep) => (
            <li
              key={ep.id}
              className="grid gap-x-8 gap-y-2 border-b border-line py-4 text-sm md:grid-cols-[220px_minmax(0,1fr)_110px]"
            >
              <div className="min-w-0">
                <div className="num truncate font-medium">{ep.domain}</div>
                <div className="mt-0.5 text-[13px] text-ink-3">{ep.label}</div>
              </div>
              <div className="min-w-0 text-[13px] leading-relaxed text-ink-2">
                <div>
                  {ep.role}
                  <span className="mx-2 text-line">|</span>
                  {ep.wafPolicy}
                </div>
                <div className="mt-0.5 break-words text-ink-3">{ep.note}</div>
              </div>
              <div
                className={`num flex items-center gap-1.5 md:justify-end ${ep.reachable ? '' : 'text-bad'}`}
              >
                <Dot tone={ep.reachable ? 'ok' : 'bad'} />
                {!ep.reachable ? '不可达' : ep.rttMs !== null ? `${ep.rttMs} ms` : '可达'}
              </div>
            </li>
          ))}
        </ul>
        {proxyExit && (
          <p className="mt-4 text-[13px] leading-relaxed text-ink-2">
            <strong className="font-semibold text-ink">联动提示：</strong>
            当前出口属于机房 VPS 或商业代理，访问 <code className="num">claude.ai</code> 更容易触发 Cloudflare
            Bot Challenge（<code className="num">cf-mitigated</code> / 1020），而{' '}
            <code className="num">api.anthropic.com</code>{' '}
            通常相对宽松；若网页端打不开但 CLI 可用，优先更换住宅 ISP 节点。
          </p>
        )}
      </div>
    </Section>
  );
}

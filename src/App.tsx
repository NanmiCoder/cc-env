import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useScan } from './hooks/useScan';
import { useTheme } from './hooks/useTheme';
import { buildAgentFixPrompt } from './utils/agentPrompt';
import Findings from './ui/Findings';
import Footer from './ui/Footer';
import Header from './ui/Header';
import Ledger from './ui/Ledger';
import Remedy from './ui/Remedy';
import RouteMap from './ui/RouteMap';
import Scanning from './ui/Scanning';
import ShareReportModal from './ui/ShareReportModal';
import Verdict from './ui/Verdict';
import { BTN, maskIp, maskIpsInText, useCopy } from './ui/shared';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { loading, stage, error, report, runScan } = useScan();
  const [hideIp, setHideIp] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const reportCopy = useCopy();
  const promptCopy = useCopy(2200);
  const toggleIp = () => setHideIp((v) => !v);

  const agentPrompt = useMemo(
    () =>
      report
        ? buildAgentFixPrompt({
            server: report.server,
            domesticIp: report.domesticIp,
            dnsLeak: report.dnsLeak,
            webrtc: report.webrtc,
            splitTunnel: report.splitTunnel,
            browser: report.browser,
            assessment: report.assessment,
          })
        : '',
    [report]
  );

  // Finding and advice prose embeds raw IPs, so it follows the same mask as the IP fields.
  const shown = useMemo(() => {
    if (!report) return null;
    const known = [
      report.server.ip,
      report.domesticIp.ip,
      report.dnsLeak.dnsIp,
      report.dnsLeak.ednsIp,
      report.dualStack.ipv4,
      report.dualStack.ipv6,
      report.history.previousIp,
      ...report.webrtc.publicIps,
    ].filter((ip): ip is string => Boolean(ip));
    const mask = (text: string) => maskIpsInText(text, known, hideIp);
    return {
      findings: report.assessment.findings.map((f) => ({
        ...f,
        title: mask(f.title),
        detail: mask(f.detail),
        impact: mask(f.impact),
        remediation: f.remediation ? mask(f.remediation) : f.remediation,
      })),
      recommendations: report.assessment.recommendations.map(mask),
    };
  }, [report, hideIp]);

  const handleCopyReport = () => {
    if (!report) return;
    const webrtcText =
      report.webrtc.publicIps.length > 0
        ? report.webrtc.publicIps.map((i) => maskIp(i, hideIp)).join(', ')
        : report.webrtc.status === 'unknown'
          ? '未知'
          : '无公网暴露';
    const summaryText = [
      `=== CC Env 实验性风控体检报告 ===`,
      `检测时间: ${report.scannedAt}`,
      `综合评分: ${report.assessment.score}/100 (${report.assessment.grade} 级 - ${report.assessment.gradeLabel})`,
      `海外代理出口: ${maskIp(report.server.ip, hideIp)} (${report.server.geo.country} ${report.server.geo.city || ''})`,
      `国内直连出口: ${report.domesticIp.ip ? `${maskIp(report.domesticIp.ip, hideIp)} (${report.domesticIp.locationLabel || ''})` : '未检出'}`,
      `DNS 出口: ${report.dnsLeak.dnsIp ? `${maskIp(report.dnsLeak.dnsIp, hideIp)} (${report.dnsLeak.dnsGeo || ''})` : '未知'}`,
      `WebRTC UDP: ${report.webrtc.status} (${webrtcText})`,
      `网络类型: ${report.assessment.ipTierLabel} | AS${report.server.network.asn ?? '-'} ${report.server.network.asOrg ?? ''}`,
      `系统时区: ${report.browser.timezone} (IP 时区: ${report.server.geo.timezone || '-'})`,
      `检测地址: https://ccenv.app`,
    ].join('\n');
    void reportCopy.copy(summaryText);
  };

  const showReport = Boolean(report) && !loading && !error;

  return (
    <div className="grain relative flex min-h-screen flex-col">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        hideIp={hideIp}
        onToggleIp={toggleIp}
        loading={loading}
        hasReport={showReport}
        onShare={() => setShareOpen(true)}
        onRescan={() => void runScan()}
      />

      <main className="relative z-10 mx-auto w-full max-w-[1120px] flex-1 px-5 sm:px-8">
        {loading && <Scanning stage={stage} />}

        {!loading && error && (
          <section className="py-16 sm:py-24" role="alert">
            <p className="text-[13px] text-bad">检测未完成</p>
            <h1 className="mt-4 font-serif text-[40px] font-semibold leading-[1.1] tracking-tight sm:text-[56px]">
              这次体检没能跑完。
            </h1>
            <p className="mt-5 max-w-[36em] break-words text-[17px] leading-[1.75] text-ink-2">{error}</p>
            <button type="button" onClick={() => void runScan()} className={`${BTN.primary} mt-8`}>
              <RefreshCw className="h-4 w-4" />
              重试
            </button>
          </section>
        )}

        {showReport && report && shown && (
          <>
            <Verdict
              report={report}
              promptCopied={promptCopy.copied}
              onCopyPrompt={() => void promptCopy.copy(agentPrompt)}
              reportCopied={reportCopy.copied}
              onCopyReport={handleCopyReport}
              onShare={() => setShareOpen(true)}
            />
            <div className="space-y-14 sm:space-y-20">
              <RouteMap report={report} hideIp={hideIp} onToggleIp={toggleIp} />
              <Findings findings={shown.findings} />
              <Remedy
                recommendations={shown.recommendations}
                cliItems={report.assessment.cliRecommendations}
                agentPrompt={agentPrompt}
              />
              <Ledger report={report} hideIp={hideIp} onToggleIp={toggleIp} />
            </div>
          </>
        )}
      </main>

      <Footer
        highRisk={Boolean(
          report && (report.assessment.score < 75 || report.server.geo.regionPolicy === 'blocked')
        )}
      />

      {report && (
        <ShareReportModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          theme={theme}
          hideIp={hideIp}
          maskIp={maskIp}
          server={report.server}
          domesticIp={report.domesticIp}
          dnsLeak={report.dnsLeak}
          webrtc={report.webrtc}
          browser={report.browser}
          assessment={report.assessment}
          scannedAt={report.scannedAt}
          onCopyText={handleCopyReport}
          copied={reportCopy.copied}
        />
      )}
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collectBrowserEnv,
  compareAndSaveIpHistory,
  probeAnthropicEndpoints,
  probeDnsLeak,
  probeDomesticIp,
  probeDualStack,
  probeSplitTunnel,
  probeWebRTC,
} from '../detectors/clientProbes';
import { evaluateRisk } from '../engine/riskEngine';
import type {
  AnthropicEndpointCheck,
  BrowserEnvResult,
  DnsLeakResult,
  DomesticIpResult,
  DualStackResult,
  IpHistoryComparison,
  RiskAssessment,
  ServerInspectResult,
  SplitTunnelResult,
  WebRtcResult,
} from '../types/telemetry';

export interface FullReport {
  server: ServerInspectResult;
  domesticIp: DomesticIpResult;
  dnsLeak: DnsLeakResult;
  dualStack: DualStackResult;
  webrtc: WebRtcResult;
  splitTunnel: SplitTunnelResult;
  anthropicEndpoints: AnthropicEndpointCheck[];
  browser: BrowserEnvResult;
  history: IpHistoryComparison;
  assessment: RiskAssessment;
  scannedAt: string;
}

export const SCAN_STAGES = [
  { title: '边缘出口与 IP 情报', hint: '向 Cloudflare 边缘节点确认你的出口 IP、ASN 与多源情报' },
  { title: '泄露与分流探针', hint: '并发探测国内直连、DNS、WebRTC、IPv6 与 Anthropic 各端点' },
  { title: '评分与审计报告', hint: '汇总五个维度的得分，生成修复清单' },
] as const;

export function useScan() {
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FullReport | null>(null);
  const runRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const runScan = useCallback(async () => {
    const run = ++runRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const stale = () => run !== runRef.current || controller.signal.aborted;

    setLoading(true);
    setError(null);
    setStage(0);

    try {
      const inspectRes = await fetch('/api/inspect', {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!inspectRes.ok) {
        throw new Error(`边缘检测接口返回异常 (${inspectRes.status})`);
      }
      const server = (await inspectRes.json()) as ServerInspectResult;
      if (stale()) return;

      setStage(1);
      const browser = collectBrowserEnv();
      const [domesticIp, dnsLeak, dualStack, webrtc, splitTunnel, anthropicEndpoints] =
        await Promise.all([
          probeDomesticIp(server.ip, controller.signal),
          probeDnsLeak(server.geo.country, controller.signal),
          probeDualStack(server.ip, controller.signal),
          probeWebRTC(server.ip, controller.signal),
          probeSplitTunnel(controller.signal),
          probeAnthropicEndpoints(controller.signal),
        ]);
      if (stale()) return;

      setStage(2);
      const history = compareAndSaveIpHistory(server.ip, server.geo.country, server.network.asn);
      const assessment = evaluateRisk(
        server,
        domesticIp,
        dnsLeak,
        dualStack,
        webrtc,
        splitTunnel,
        browser
      );

      setReport({
        server,
        domesticIp,
        dnsLeak,
        dualStack,
        webrtc,
        splitTunnel,
        anthropicEndpoints,
        browser,
        history,
        assessment,
        scannedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      });
    } catch (err) {
      if (stale()) return;
      setError(err instanceof Error ? err.message : '检测过程中发生未知错误');
    } finally {
      if (!stale()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runScan();
    return () => {
      runRef.current += 1;
      controllerRef.current?.abort();
    };
  }, [runScan]);

  return { loading, stage, error, report, runScan };
}

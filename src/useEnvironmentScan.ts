import { useCallback, useEffect, useRef, useState } from "react";
import {
  collectBrowserEnv,
  compareAndSaveIpHistory,
  probeAnthropicEndpoints,
  probeDnsLeak,
  probeDomesticIp,
  probeDualStack,
  probeSplitTunnel,
  probeWebRTC,
} from "./detectors/clientProbes";
import { evaluateRisk } from "./engine/riskEngine";
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
} from "./types/telemetry";

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

export function useEnvironmentScan() {
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FullReport | null>(null);
  const runRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const runScan = useCallback(async () => {
    const run = ++runRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    setStage(1);
    try {
      const response = await fetch("/api/inspect", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(`边缘检测接口返回异常 (${response.status})`);
      const server = (await response.json()) as ServerInspectResult;
      if (run !== runRef.current || controller.signal.aborted) return;
      setStage(2);
      const browser = collectBrowserEnv();
      const [
        domesticIp,
        dnsLeak,
        dualStack,
        webrtc,
        splitTunnel,
        anthropicEndpoints,
      ] = await Promise.all([
        probeDomesticIp(server.ip, controller.signal),
        probeDnsLeak(server.geo.country, controller.signal),
        probeDualStack(server.ip, controller.signal),
        probeWebRTC(server.ip, controller.signal),
        probeSplitTunnel(controller.signal),
        probeAnthropicEndpoints(controller.signal),
      ]);
      if (run !== runRef.current || controller.signal.aborted) return;
      setStage(3);
      const history = compareAndSaveIpHistory(
        server.ip,
        server.geo.country,
        server.network.asn,
      );
      const assessment = evaluateRisk(
        server,
        domesticIp,
        dnsLeak,
        dualStack,
        webrtc,
        splitTunnel,
        browser,
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
        scannedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      });
    } catch (err) {
      if (run !== runRef.current || controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "检测过程中发生未知错误");
    } finally {
      if (run === runRef.current && !controller.signal.aborted)
        setLoading(false);
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

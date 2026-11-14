import type {
  AnthropicEndpointCheck,
  BrowserEnvResult,
  DnsLeakResult,
  DomesticIpResult,
  DualStackResult,
  IpHistoryComparison,
  ProbeEndpointResult,
  SplitTunnelResult,
  WebRtcIpGeo,
  WebRtcResult,
} from '../types/telemetry';

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function probeDomesticIp(proxyIp: string): Promise<DomesticIpResult> {
  interface IpipNetResponse {
    ret?: string;
    data?: {
      ip?: string;
      location?: string[];
    };
  }

  const res = await fetchJsonWithTimeout<IpipNetResponse>('https://myip.ipip.net/json', 3200);
  if (res?.ret === 'ok' && res.data?.ip) {
    const loc = (res.data.location || []).filter(Boolean);
    const country = loc[0] || '';
    const isp = loc[loc.length - 1] || null;
    const isChina = country.includes('中国') || country.toLowerCase() === 'china';
    return {
      ip: res.data.ip,
      locationLabel: loc.join(' ') || null,
      isp,
      isChinaDirect: isChina && res.data.ip !== proxyIp,
      source: 'myip.ipip.net',
    };
  }

  return {
    ip: null,
    locationLabel: null,
    isp: null,
    isChinaDirect: false,
    source: 'myip.ipip.net',
  };
}

export async function probeDnsLeak(exitCountryCode: string): Promise<DnsLeakResult> {
  interface EdnsResponse {
    dns?: { ip?: string; geo?: string };
    edns?: { ip?: string; geo?: string };
  }

  const res = await fetchJsonWithTimeout<EdnsResponse>('https://edns.ip-api.com/json', 3500);
  if (!res?.dns?.ip) {
    return {
      dnsIp: null,
      dnsGeo: null,
      ednsIp: null,
      ednsGeo: null,
      isChinaDns: false,
      status: 'unknown',
    };
  }

  const dnsGeo = res.dns.geo || '';
  const isChinaDns = /china|chinanet|cmcc|unicom|telecom|mobile/i.test(dnsGeo);
  const isLeaked = isChinaDns && exitCountryCode !== 'CN';

  return {
    dnsIp: res.dns.ip,
    dnsGeo: dnsGeo || null,
    ednsIp: res.edns?.ip || null,
    ednsGeo: res.edns?.geo || null,
    isChinaDns,
    status: isLeaked ? 'leaked' : 'safe',
  };
}

export async function probeDualStack(mainIp: string): Promise<DualStackResult> {
  const [v4Res, v6Res] = await Promise.all([
    fetchJsonWithTimeout<{ ip?: string }>('https://api4.ipify.org?format=json', 3000),
    fetchJsonWithTimeout<{ ip?: string }>('https://api6.ipify.org?format=json', 3000),
  ]);

  const ipv4 = v4Res?.ip ?? null;
  const ipv6 = v6Res?.ip ?? null;
  const validIpv6 = ipv6 && ipv6.includes(':') ? ipv6 : null;
  const hasIpv6 = Boolean(validIpv6);

  const mismatchWithMainIp = Boolean(
    (ipv4 && !mainIp.includes(':') && ipv4 !== mainIp) ||
      (validIpv6 && mainIp.includes(':') && validIpv6 !== mainIp)
  );

  return {
    ipv4,
    ipv6: validIpv6,
    hasIpv6,
    mismatchWithMainIp,
  };
}

function isPrivateOrMdnsIp(ip: string): boolean {
  if (ip.endsWith('.local')) return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('127.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd') || ip === '::1') return true;
  return false;
}

export async function probeWebRTC(expectedExitIp: string): Promise<WebRtcResult> {
  const raw = await new Promise<Omit<WebRtcResult, 'ipDetails'>>((resolve) => {
    const RTCPeer =
      window.RTCPeerConnection ||
      (window as unknown as { webkitRTCPeerConnection?: typeof RTCPeerConnection })
        .webkitRTCPeerConnection;

    if (!RTCPeer) {
      resolve({
        supported: false,
        status: 'protected',
        publicIps: [],
        localCandidates: [],
        candidateCount: 0,
      });
      return;
    }

    const publicIps = new Set<string>();
    const localCandidates = new Set<string>();
    let candidateCount = 0;
    let settled = false;

    let pc: RTCPeerConnection;
    try {
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.cloudflare.com:3478' },
          { urls: 'stun:stun.l.google.com:19302' },
        ],
      });
    } catch {
      resolve({
        supported: false,
        status: 'protected',
        publicIps: [],
        localCandidates: [],
        candidateCount: 0,
      });
      return;
    }

    const finish = (timedOut = false) => {
      if (settled) return;
      settled = true;
      try {
        pc.close();
      } catch {
        // ignore
      }

      const pubs = Array.from(publicIps);
      let status: WebRtcResult['status'] = 'protected';
      if (pubs.length > 0) {
        const hasDiff = pubs.some((ip) => ip !== expectedExitIp);
        status = hasDiff ? 'leaked' : 'matched';
      } else if (timedOut && candidateCount === 0) {
        status = 'protected';
      }

      resolve({
        supported: true,
        status,
        publicIps: pubs,
        localCandidates: Array.from(localCandidates),
        candidateCount,
      });
    };

    const timer = setTimeout(() => finish(true), 2800);

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        clearTimeout(timer);
        finish(false);
        return;
      }
      candidateCount += 1;
      const cand = event.candidate.candidate;
      const parts = cand.split(' ');
      const addr = parts[4];
      if (!addr) return;

      if (isPrivateOrMdnsIp(addr)) {
        localCandidates.add(addr);
      } else {
        publicIps.add(addr);
      }
    };

    try {
      pc.createDataChannel('probe');
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {
          clearTimeout(timer);
          finish(false);
        });
    } catch {
      clearTimeout(timer);
      finish(false);
    }
  });

  // Lookup geo/ISP for any exposed WebRTC public IPs
  const ipDetails: WebRtcIpGeo[] = [];
  if (raw.publicIps.length > 0) {
    const lookups = await Promise.all(
      raw.publicIps.slice(0, 3).map((ip) =>
        fetchJsonWithTimeout<WebRtcIpGeo>(`/api/lookup?ip=${encodeURIComponent(ip)}`, 3200)
      )
    );
    for (const item of lookups) {
      if (item && item.ip) ipDetails.push(item);
    }
  }

  return {
    ...raw,
    ipDetails,
  };
}

async function measureEndpoint(
  name: string,
  url: string,
  region: ProbeEndpointResult['region'],
  timeoutMs = 2800
): Promise<ProbeEndpointResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    await fetch(url, {
      mode: region === 'edge' ? 'cors' : 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    const rttMs = Math.round(performance.now() - start);
    return { name, region, reachable: true, rttMs };
  } catch {
    return { name, region, reachable: false, rttMs: null };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeSplitTunnel(): Promise<SplitTunnelResult> {
  const targets: Array<{ name: string; url: string; region: ProbeEndpointResult['region'] }> = [
    { name: 'Cloudflare Edge', url: '/api/ping', region: 'edge' },
    { name: 'claude.ai', url: 'https://claude.ai/favicon.ico', region: 'overseas' },
    { name: 'api.anthropic.com', url: 'https://api.anthropic.com/', region: 'overseas' },
    { name: 'Baidu 国内直连', url: 'https://www.baidu.com/favicon.ico', region: 'cn' },
  ];

  const endpoints = await Promise.all(
    targets.map((t) => measureEndpoint(t.name, t.url, t.region, 2800))
  );

  const cnResults = endpoints.filter((e) => e.region === 'cn' && e.reachable && e.rttMs !== null);
  const overseas = endpoints.find((e) => e.name === 'claude.ai');
  const cnFastCount = cnResults.filter((e) => (e.rttMs ?? 999) < 120).length;
  const overseasReachable = Boolean(overseas?.reachable);

  const minCn = cnResults.length ? Math.min(...cnResults.map((e) => e.rttMs ?? 999)) : null;
  const overseasRtt = overseas?.rttMs ?? null;

  const suspectedSplitTunnel = Boolean(
    cnFastCount >= 1 &&
      overseasReachable &&
      minCn !== null &&
      overseasRtt !== null &&
      minCn < 110 &&
      overseasRtt > minCn * 1.6
  );

  let summary = '未发现明显国内分流特征';
  if (suspectedSplitTunnel) {
    summary = `国内节点极速直连 (${minCn}ms)，海外节点走代理链路 (${overseasRtt}ms)，疑似处于规则分流模式`;
  } else if (cnFastCount >= 1 && !overseasReachable) {
    summary = '国内节点畅通但无法连接 claude.ai，当前可能未开启代理或代理失效';
  } else if (cnResults.length === 0 && overseasReachable) {
    summary = '国内节点不可达或高延迟，更符合纯海外全局/真实海外网络特征';
  }

  return {
    endpoints,
    cnFastCount,
    overseasReachable,
    suspectedSplitTunnel,
    summary,
  };
}

function detectChineseFonts(): string[] {
  const candidates = [
    'PingFang SC',
    'Microsoft YaHei',
    'SimHei',
    'Hiragino Sans GB',
    'STHeiti',
    'Noto Sans CJK SC',
    'Source Han Sans SC',
  ];

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const testStr = 'mmmmmmmmmmlli中文测试123';
    const size = '72px';
    const baseFonts = ['monospace', 'sans-serif', 'serif'];

    const baselines: Record<string, number> = {};
    for (const base of baseFonts) {
      ctx.font = `${size} ${base}`;
      baselines[base] = ctx.measureText(testStr).width;
    }

    const found: string[] = [];
    for (const font of candidates) {
      const matched = baseFonts.some((base) => {
        ctx.font = `${size} "${font}", ${base}`;
        return ctx.measureText(testStr).width !== baselines[base];
      });
      if (matched) found.push(font);
    }
    return found;
  } catch {
    return [];
  }
}

function detectWebViewApp(ua: string): string | null {
  if (/MicroMessenger/i.test(ua)) return '微信内置浏览器 (WeChat)';
  if (/QQ\//i.test(ua)) return 'QQ 内置浏览器';
  if (/AlipayClient/i.test(ua)) return '支付宝内置浏览器';
  if (/BytedanceWebview|Douyin/i.test(ua)) return '抖音内置浏览器';
  if (/DingTalk/i.test(ua)) return '钉钉内置浏览器';
  if (/Weibo/i.test(ua)) return '微博内置浏览器';
  return null;
}

function getWebGLRenderer(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    const webgl = gl as WebGLRenderingContext;
    const ext = webgl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return null;
    return String(webgl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
  } catch {
    return null;
  }
}

export function collectBrowserEnv(): BrowserEnvResult {
  const ua = navigator.userAgent || '';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
  const timezoneOffsetMin = new Date().getTimezoneOffset();
  const language = navigator.language || 'unknown';
  const languages = Array.from(navigator.languages || [language]);
  const intlLocale = Intl.NumberFormat().resolvedOptions().locale || language;

  const hasChineseLanguage = [language, ...languages, intlLocale].some((l) =>
    /^zh(-|_|$)/i.test(l)
  );

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    navigator.maxTouchPoints > 1;

  return {
    timezone,
    timezoneOffsetMin,
    language,
    languages,
    intlLocale,
    hasChineseLanguage,
    detectedChineseFonts: detectChineseFonts(),
    webViewApp: detectWebViewApp(ua),
    isMobile,
    webdriver: Boolean(navigator.webdriver),
    platform: navigator.platform || 'Unknown',
    cores: typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null,
    memoryGb:
      typeof (navigator as unknown as { deviceMemory?: number }).deviceMemory === 'number'
        ? (navigator as unknown as { deviceMemory: number }).deviceMemory
        : null,
    screen: `${window.screen.width}×${window.screen.height} @${window.devicePixelRatio || 1}x`,
    webglRenderer: getWebGLRenderer(),
  };
}

export function compareAndSaveIpHistory(
  currentIp: string,
  country: string,
  asn: number | null
): IpHistoryComparison {
  const key = 'claudeguard:last_ip:v1';
  let result: IpHistoryComparison = {
    status: 'first',
    previousIp: null,
    previousCountry: null,
    previousAsn: null,
    previousAt: null,
  };

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const prev = JSON.parse(raw) as {
        ip?: string;
        country?: string;
        asn?: number | null;
        at?: string;
      };
      if (prev.ip) {
        result = {
          status: prev.ip === currentIp ? 'same' : 'changed',
          previousIp: prev.ip,
          previousCountry: prev.country ?? null,
          previousAsn: prev.asn ?? null,
          previousAt: prev.at ?? null,
        };
      }
    }

    localStorage.setItem(
      key,
      JSON.stringify({
        ip: currentIp,
        country,
        asn,
        at: new Date().toLocaleString('zh-CN', { hour12: false }),
      })
    );
  } catch {
    // ignore storage errors
  }

  return result;
}

export async function probeAnthropicEndpoints(): Promise<AnthropicEndpointCheck[]> {
  const specs: Array<{
    id: AnthropicEndpointCheck['id'];
    domain: string;
    url: string;
    label: string;
    role: string;
    wafPolicy: string;
    note: string;
  }> = [
    {
      id: 'claude_web',
      domain: 'claude.ai',
      url: 'https://claude.ai/favicon.ico',
      label: 'Web 主站',
      role: '网页对话 / 账号登录',
      wafPolicy: '严格 JA3 + cf-mitigated',
      note: 'Cloudflare Zone 对非浏览器指纹及机房出口极易触发 Bot Challenge 或 1020 拦截。',
    },
    {
      id: 'api_anthropic',
      domain: 'api.anthropic.com',
      url: 'https://api.anthropic.com/',
      label: 'API & CLI 主通道',
      role: 'Claude Code CLI / 1P 遥测',
      wafPolicy: '相对宽松 · 受地区与 ASN 限制',
      note: 'CLI 语音流与 API 请求优先走此域名以避开 claude.ai 的浏览器 JA3 拦截，但仍受国家封控与高危 ASN 约束。',
    },
    {
      id: 'platform_console',
      domain: 'platform.claude.com',
      url: 'https://platform.claude.com/favicon.ico',
      label: 'Console & OAuth 鉴权',
      role: '组织管理 / OAuth Token 授权',
      wafPolicy: '账号风控敏感区',
      note: '负责 Console 控制台与 CLI OAuth 授权登录，组织禁用或 Token 吊销会在此链路直接报错。',
    },
  ];

  const probes = await Promise.all(
    specs.map((spec) => measureEndpoint(spec.domain, spec.url, 'overseas', 2600))
  );

  return specs.map((spec, idx) => ({
    id: spec.id,
    domain: spec.domain,
    label: spec.label,
    role: spec.role,
    reachable: probes[idx].reachable,
    rttMs: probes[idx].rttMs,
    wafPolicy: spec.wafPolicy,
    note: spec.note,
  }));
}

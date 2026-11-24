interface Env {
  IP_CACHE?: KVNamespace;
}

interface IpIntelResult {
  source: 'ipapi.is' | 'ipwho.is' | 'cf-local';
  isDatacenter: boolean | null;
  isProxy: boolean | null;
  isVpn: boolean | null;
  isTor: boolean | null;
  isAbuser: boolean | null;
  isMobile: boolean | null;
  companyType: string | null;
  companyName: string | null;
  asnType?: string | null;
  abuserScore: string | null;
  timezone: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
  asn: number | null;
  org: string | null;
}

// Anthropic / Claude 明确不支持或高风险封控的地区代码
const BLOCKED_REGIONS = new Set([
  'CN', 'HK', 'MO', 'RU', 'BY', 'KP', 'IR', 'SY', 'CU', 'AF', 'VE', 'MM',
]);

// 一线稳定支持地区（通常风控容忍度较高）
const TIER1_REGIONS = new Set([
  'US', 'GB', 'CA', 'AU', 'NZ', 'JP', 'SG', 'KR', 'TW',
  'DE', 'FR', 'NL', 'CH', 'SE', 'NO', 'FI', 'DK', 'IE', 'IT', 'ES',
]);

// 常见云厂商 / VPS / 机场高发 ASN
const KNOWN_DATACENTER_ASNS = new Set([
  16509, 14618, 8987, // AWS
  15169, 396982, 36040, // Google Cloud
  8075, 8068, // Microsoft Azure
  14061, // DigitalOcean
  20473, // Vultr / Choopa
  63949, // Linode / Akamai
  24940, // Hetzner
  16276, // OVH
  13335, // Cloudflare
  31898, // Oracle Cloud
  25820, // IT7 / BandwagonHost (搬瓦工)
  36352, // ColoCrossing / RackNerd
  45102, // Alibaba Cloud
  132203, 45090, // Tencent Cloud
  136907, // Huawei Cloud
  9009, // M247 (VPN/Proxy 重灾区)
  60068, // Datacamp / CDN77
  51167, // Contabo
  47583, // Hostinger
  21859, // Zenlayer
  199524, // Gcore
  53667, // FranTech / BuyVM
  46562, // Performive / Total Server Solutions
  398101, // GoDaddy
  174, 3356, 1299, // Cogent / Lumen / Arelion transit
]);

// 常见高质量家宽 / 移动运营商 ASN
const KNOWN_RESIDENTIAL_ASNS = new Set([
  7922, // Comcast
  7018, // AT&T
  701, 22394, // Verizon
  20115, 11351, 12271, // Charter / Spectrum
  21928, // T-Mobile US
  22773, // Cox
  4713, 2516, 17676, // NTT / KDDI / SoftBank (JP)
  2856, 5089, 12576, // BT / Virgin Media / EE (UK)
  3320, 3209, // Deutsche Telekom / Vodafone (DE)
  3215, // Orange (FR)
  9506, 17547, // Singtel / StarHub (SG)
  3462, // Chunghwa Telecom / HiNet (TW)
  812, 577, // Rogers / Bell (CA)
  1221, // Telstra (AU)
]);

function classifyOrgHeuristic(asn: number | null, org: string | null): {
  type: 'residential' | 'datacenter' | 'unknown';
  reason: string;
} {
  if (asn && KNOWN_DATACENTER_ASNS.has(asn)) {
    return { type: 'datacenter', reason: `AS${asn} 属于已知云厂商/VPS/机房网络` };
  }
  if (asn && KNOWN_RESIDENTIAL_ASNS.has(asn)) {
    return { type: 'residential', reason: `AS${asn} 属于已知主流宽带/移动运营商` };
  }
  const lower = (org || '').toLowerCase();
  if (!lower) return { type: 'unknown', reason: '未识别到机构名称' };

  const dcKeywords = [
    'cloud', 'hosting', 'vps', 'datacenter', 'data center', 'server',
    'colocation', 'colo', 'digitalocean', 'vultr', 'linode', 'amazon',
    'aws', 'google', 'microsoft', 'azure', 'oracle', 'alibaba', 'tencent',
    'hetzner', 'ovh', 'contabo', 'racknerd', 'bandwagon', 'it7', 'm247',
    'leaseweb', 'choopa', 'zenlayer', 'gcore', 'vpn', 'proxy',
  ];
  if (dcKeywords.some((kw) => lower.includes(kw))) {
    return { type: 'datacenter', reason: `机构名 "${org}" 匹配机房/云服务特征` };
  }

  const ispKeywords = [
    'telecom', 'communications', 'broadband', 'cable', 'fiber', 'fibre',
    'wireless', 'mobile', 'cellular', 'comcast', 'verizon', 'at&t', 'spectrum',
    'charter', 'ntt', 'kddi', 'softbank', 'vodafone', 'telefonica', 'orange',
    'telstra', 'rogers', 'singtel', 'chunghwa',
  ];
  if (ispKeywords.some((kw) => lower.includes(kw))) {
    return { type: 'residential', reason: `机构名 "${org}" 匹配宽带/运营商特征` };
  }

  return { type: 'unknown', reason: `机构名 "${org}" 需结合情报库进一步判定` };
}

function isLocalIp(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('fc') ||
    ip.startsWith('fd')
  );
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'ClaudeGuard-Edge/1.0' },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function queryIpIntel(ip: string, env: Env): Promise<IpIntelResult> {
  const cacheKey = `ip-intel:v3:${ip}`;

  // 1. Check KV if bound
  if (env.IP_CACHE) {
    try {
      const cached = await env.IP_CACHE.get<IpIntelResult>(cacheKey, 'json');
      if (cached) return cached;
    } catch {
      // ignore KV read failure
    }
  }

  // 2. Check CF Cache API
  const cacheUrl = new URL(`https://cache.claudeguard.internal/${cacheKey}`);
  const cfCache = (caches as unknown as { default?: Cache }).default;
  if (cfCache) {
    try {
      const matched = await cfCache.match(cacheUrl);
      if (matched) {
        return (await matched.json()) as IpIntelResult;
      }
    } catch {
      // ignore cache match failure
    }
  }

  let result: IpIntelResult | null = null;

  // 3. Primary: ipapi.is (check carefully for Free-Tier degraded response)
  try {
    const res = await fetchWithTimeout(`https://api.ipapi.is/?q=${encodeURIComponent(ip)}`, 3000);
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      if (!data.error) {
        const hasFullFlags = typeof data.is_datacenter === 'boolean';
        const companyObj =
          data.company && typeof data.company === 'object'
            ? (data.company as Record<string, unknown>)
            : null;
        const asnObj =
          data.asn && typeof data.asn === 'object'
            ? (data.asn as Record<string, unknown>)
            : null;
        const loc =
          data.location && typeof data.location === 'object'
            ? (data.location as Record<string, unknown>)
            : {};

        let parsedAsn: number | null = typeof asnObj?.asn === 'number' ? asnObj.asn : null;
        let parsedOrg: string | null = typeof asnObj?.org === 'string' ? asnObj.org : null;
        if (!parsedAsn && typeof data.asn === 'string') {
          const m = data.asn.match(/^AS(\d+)\s*(.*)$/i);
          if (m) {
            parsedAsn = Number(m[1]);
            parsedOrg = m[2]?.trim() || parsedOrg;
          }
        }

        const parsedCompanyName =
          typeof companyObj?.name === 'string'
            ? companyObj.name
            : typeof data.company === 'string'
              ? data.company
              : null;

        if (hasFullFlags) {
          result = {
            source: 'ipapi.is',
            isDatacenter: Boolean(data.is_datacenter),
            isProxy: typeof data.is_proxy === 'boolean' ? data.is_proxy : null,
            isVpn: typeof data.is_vpn === 'boolean' ? data.is_vpn : null,
            isTor: typeof data.is_tor === 'boolean' ? data.is_tor : null,
            isAbuser: typeof data.is_abuser === 'boolean' ? data.is_abuser : null,
            isMobile: typeof data.is_mobile === 'boolean' ? data.is_mobile : null,
            companyType: typeof companyObj?.type === 'string' ? companyObj.type : null,
            companyName: parsedCompanyName,
            asnType: typeof asnObj?.type === 'string' ? asnObj.type : null,
            abuserScore: typeof asnObj?.abuser_score === 'string' ? asnObj.abuser_score : null,
            timezone: typeof loc.timezone === 'string' ? loc.timezone : null,
            countryCode: typeof loc.country_code === 'string' ? loc.country_code : null,
            city: typeof loc.city === 'string' ? loc.city : null,
            region: typeof loc.state === 'string' ? loc.state : null,
            asn: parsedAsn,
            org: parsedOrg,
          };
        } else {
          // Preserve partial data without inferring provider flags.
          result = {
            source: 'ipapi.is',
            isDatacenter: null,
            isProxy: null,
            isVpn: null,
            isTor: null,
            isAbuser: null,
            isMobile: null,
            companyType: null,
            companyName: parsedCompanyName,
            asnType: null,
            abuserScore: null,
            timezone: typeof data.timezone === 'string' ? data.timezone : null,
            countryCode: null,
            city: typeof data.city === 'string' ? data.city : null,
            region: typeof data.region === 'string' ? data.region : null,
            asn: parsedAsn,
            org: parsedOrg,
          };
        }
      }
    }
  } catch {
    // fallback below
  }

  // 4. Fallback: ipwho.is
  if (!result) {
    try {
      const res = await fetchWithTimeout(`https://ipwho.is/${encodeURIComponent(ip)}`, 3000);
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        if (data.success !== false) {
          const conn = (data.connection as Record<string, unknown> | undefined) ?? {};
          const tz = (data.timezone as Record<string, unknown> | undefined) ?? {};
          result = {
            source: 'ipwho.is',
            isDatacenter: null,
            isProxy: null,
            isVpn: null,
            isTor: null,
            isAbuser: null,
            isMobile: null,
            companyType: null,
            companyName: typeof conn.isp === 'string' ? conn.isp : null,
            asnType: null,
            abuserScore: null,
            timezone: typeof tz.id === 'string' ? tz.id : null,
            countryCode: typeof data.country_code === 'string' ? data.country_code : null,
            city: typeof data.city === 'string' ? data.city : null,
            region: typeof data.region === 'string' ? data.region : null,
            asn: typeof conn.asn === 'number' ? conn.asn : null,
            org: typeof conn.org === 'string' ? conn.org : null,
          };
        }
      }
    } catch {
      // fallback to cf-local
    }
  }

  if (!result) {
    result = {
      source: 'cf-local',
      isDatacenter: null,
      isProxy: null,
      isVpn: null,
      isTor: null,
      isAbuser: null,
      isMobile: null,
      companyType: null,
      companyName: null,
      abuserScore: null,
      timezone: null,
      countryCode: null,
      city: null,
      region: null,
      asn: null,
      org: null,
    };
  }

  // Store in caches (1 hour)
  if (result.source !== 'cf-local') {
    if (env.IP_CACHE) {
      env.IP_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 }).catch(() => {});
    }
    if (cfCache) {
      cfCache
        .put(
          cacheUrl,
          new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=3600' },
          })
        )
        .catch(() => {});
    }
  }

  return result;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const cf = (request as Request & { cf?: IncomingRequestCfProperties }).cf;

  let clientIp =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1';

  let isLocalDev = isLocalIp(clientIp);

  // In local wrangler dev, resolve actual public IP so developer can test real scoring
  if (isLocalDev) {
    try {
      const echo = await fetchWithTimeout('https://api.ipify.org?format=json', 2500);
      if (echo.ok) {
        const j = (await echo.json()) as { ip?: string };
        if (j.ip) {
          clientIp = j.ip;
        }
      }
    } catch {
      // keep local ip
    }
  }

  const intel = isLocalIp(clientIp)
    ? {
        source: 'cf-local' as const,
        isDatacenter: null,
        isProxy: null,
        isVpn: null,
        isTor: null,
        isAbuser: null,
        isMobile: null,
        companyType: null,
        companyName: null,
        abuserScore: null,
        timezone: null,
        countryCode: null,
        city: null,
        region: null,
        asn: null,
        org: null,
      }
    : await queryIpIntel(clientIp, env);

  const country = (cf?.country as string | undefined) || intel.countryCode || 'UNKNOWN';
  const asn = (cf?.asn as number | undefined) ?? intel.asn ?? null;
  const asOrg = (cf?.asOrganization as string | undefined) || intel.org || intel.companyName || null;
  const timezone = (cf?.timezone as string | undefined) || intel.timezone || null;
  const heuristic = classifyOrgHeuristic(asn, asOrg);

  const regionPolicy = BLOCKED_REGIONS.has(country)
    ? 'blocked'
    : TIER1_REGIONS.has(country)
      ? 'tier1'
      : country === 'UNKNOWN'
        ? 'unknown'
        : 'supported_other';

  const payload = {
    ip: clientIp,
    ipVersion: clientIp.includes(':') ? 'IPv6' : 'IPv4',
    isLocalDev,
    edge: {
      colo: cf?.colo ?? 'LOCAL',
      clientTcpRtt: typeof cf?.clientTcpRtt === 'number' ? cf.clientTcpRtt : null,
      httpProtocol: cf?.httpProtocol ?? null,
      tlsVersion: cf?.tlsVersion ?? null,
    },
    geo: {
      country,
      region: (cf?.region as string | undefined) || intel.region || null,
      city: (cf?.city as string | undefined) || intel.city || null,
      timezone,
      regionPolicy,
    },
    network: {
      asn,
      asOrg,
      heuristicType: heuristic.type,
      heuristicReason: heuristic.reason,
      intel,
    },
    headers: {
      acceptLanguage: request.headers.get('Accept-Language') ?? null,
      userAgent: request.headers.get('User-Agent') ?? null,
      secChUaPlatform: request.headers.get('Sec-CH-UA-Platform') ?? null,
      secChUaMobile: request.headers.get('Sec-CH-UA-Mobile') ?? null,
    },
    serverTime: Date.now(),
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

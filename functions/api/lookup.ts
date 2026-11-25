interface Env {}

function isValidPublicIp(ip: string): boolean {
  if (!ip || ip.length > 64) return false;
  if (ip === '127.0.0.1' || ip === '::1') return false;
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return false;
  return /^[0-9a-fA-F:.]+$/.test(ip);
}

async function fetchJson(url: string, ms: number): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'ClaudeGuard-Edge/1.0' },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const ip = (url.searchParams.get('ip') || '').trim();

  if (!isValidPublicIp(ip)) {
    return new Response(JSON.stringify({ error: 'Invalid IP' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const cfCache = (caches as unknown as { default?: Cache }).default;
  const cacheUrl = new URL(`https://cache.claudeguard.internal/lookup:v2:${ip}`);
  if (cfCache) {
    try {
      const hit = await cfCache.match(cacheUrl);
      if (hit) return hit;
    } catch {
      // ignore
    }
  }

  let info = {
    ip,
    country: null as string | null,
    countryCode: null as string | null,
    region: null as string | null,
    city: null as string | null,
    isp: null as string | null,
    asn: null as number | null,
  };

  const ipapi = await fetchJson(`https://api.ipapi.is/?q=${encodeURIComponent(ip)}`, 3000);
  if (ipapi && !ipapi.error) {
    const loc = (ipapi.location as Record<string, unknown> | undefined) ?? {};
    const company = (ipapi.company as Record<string, unknown> | undefined) ?? {};
    const asnObj = (ipapi.asn as Record<string, unknown> | undefined) ?? {};
    info = {
      ip,
      country: typeof loc.country === 'string' ? loc.country : null,
      countryCode: typeof loc.country_code === 'string' ? loc.country_code : null,
      region: typeof loc.state === 'string' ? loc.state : null,
      city: typeof loc.city === 'string' ? loc.city : null,
      isp: typeof company.name === 'string' ? company.name : typeof asnObj.org === 'string' ? asnObj.org : null,
      asn: typeof asnObj.asn === 'number' ? asnObj.asn : null,
    };
  }

  if (!info.countryCode) {
    const ipwho = await fetchJson(`https://ipwho.is/${encodeURIComponent(ip)}`, 3000);
    if (ipwho && ipwho.success !== false && typeof ipwho.country_code === 'string') {
      const conn = (ipwho.connection as Record<string, unknown> | undefined) ?? {};
      info = {
        ip,
        country: typeof ipwho.country === 'string' ? ipwho.country : null,
        countryCode: ipwho.country_code,
        region: typeof ipwho.region === 'string' ? ipwho.region : null,
        city: typeof ipwho.city === 'string' ? ipwho.city : null,
        isp: typeof conn.isp === 'string' ? conn.isp : typeof conn.org === 'string' ? conn.org : null,
        asn: typeof conn.asn === 'number' ? conn.asn : null,
      };
    }
  }

  const response = new Response(JSON.stringify(info), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });

  if (cfCache && info.countryCode) {
    cfCache.put(cacheUrl, response.clone()).catch(() => {});
  }

  return response;
};

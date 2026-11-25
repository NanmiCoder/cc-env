import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestGet as inspect } from '../functions/api/inspect.ts';
import { onRequestGet as lookup } from '../functions/api/lookup.ts';

const ip = '198.51.100.19'; // Documentation-only address
const primary = `https://api.ipapi.is/?q=${ip}`;
const secondary = `https://ipwho.is/${ip}`;

function mockedFetch(t, responses, cache = {}) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async url => {
    calls.push(String(url));
    const response = responses[url];
    return response === undefined
      ? new Response(null, { status: 503 })
      : Response.json(response);
  });
  const existing = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: cache });
  t.after(() => {
    if (existing) Object.defineProperty(globalThis, 'caches', existing);
    else delete globalThis.caches;
  });
  return calls;
}

async function inspectIp(cf, env = {}) {
  const request = new Request('https://example.test/api/inspect', {
    headers: { 'CF-Connecting-IP': ip },
  });
  if (cf) Object.defineProperty(request, 'cf', { value: cf });
  return (await inspect({ request, env })).json();
}

async function lookupIp() {
  const request = new Request(`https://example.test/api/lookup?ip=${ip}`);
  return (await lookup({ request })).json();
}

test('inspect preserves partial intel and edge metadata without fetching an enrichment URL', async t => {
  const calls = mockedFetch(t, {
    [primary]: { asn: 'AS64496 Example', company: 'Example ISP', city: 'Example City' },
  });
  const result = await inspectIp({ country: 'JP', asn: 64497, asOrganization: 'Edge Example' });
  assert.deepEqual(calls, [primary]);
  assert.equal(result.geo.country, 'JP');
  assert.equal(result.network.asn, 64497);
  assert.equal(result.network.intel.companyName, 'Example ISP');
  assert.equal(result.network.intel.city, 'Example City');
  assert.equal(result.network.intel.isDatacenter, null);
  assert.equal(result.network.intel.isProxy, null);
});

test('inspect falls back only to HTTPS ipwho or reports unknown when neither provider succeeds', async t => {
  const responses = { [secondary]: { country_code: 'JP', connection: { asn: 64496 } } };
  const calls = mockedFetch(t, responses);
  const fallback = await inspectIp();
  assert.equal(fallback.network.intel.source, 'ipwho.is');
  assert.equal(fallback.network.intel.isProxy, null);
  assert.equal(fallback.geo.country, 'JP');
  delete responses[secondary];
  const unknown = await inspectIp();
  assert.deepEqual(calls, [primary, secondary, primary, secondary]);
  assert.equal(unknown.network.intel.source, 'cf-local');
  assert.equal(unknown.network.intel.isDatacenter, null);
  assert.equal(unknown.geo.regionPolicy, 'unknown');
});

test('lookup uses only the existing HTTPS providers and retains unknown fields on failure', async t => {
  const responses = { [primary]: { company: { name: 'Example ISP' } } };
  const calls = mockedFetch(t, responses);
  const partial = await lookupIp();
  assert.equal(partial.isp, 'Example ISP');
  assert.equal(partial.countryCode, null);
  responses[secondary] = { country_code: 'JP', connection: { isp: 'HTTPS ISP' } };
  const fallback = await lookupIp();
  assert.equal(fallback.countryCode, 'JP');
  assert.equal(fallback.isp, 'HTTPS ISP');
  assert.deepEqual(calls, [primary, secondary, primary, secondary]);
});

test('prior cache namespaces cannot return data gathered by the old fallback', async t => {
  const keys = [];
  const calls = mockedFetch(t, {}, {
    default: {
      async match(url) {
        keys.push(String(url));
        if (String(url).includes('lookup:v1:')) return Response.json({ countryCode: 'XX' });
      },
    },
  });
  const result = await inspectIp(null, {
    IP_CACHE: {
      async get(key) {
        keys.push(key);
        if (key.startsWith('ip-intel:v2:')) return { source: 'ip-api.com' };
      },
    },
  });
  assert.equal(result.network.intel.source, 'cf-local');
  assert.equal((await lookupIp()).countryCode, null);
  assert.deepEqual(keys, [
    `ip-intel:v3:${ip}`,
    `https://cache.claudeguard.internal/ip-intel:v3:${ip}`,
    `https://cache.claudeguard.internal/lookup:v2:${ip}`,
  ]);
  assert.deepEqual(calls, [primary, secondary, primary, secondary]);
});

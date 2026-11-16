import assert from 'node:assert/strict';
import test from 'node:test';
import { isPrivateOrMdnsIp, probeWebRTC } from '../src/detectors/clientProbes.ts';
import { evaluateRisk } from '../src/engine/riskEngine.ts';

function mockWebRtcPeer(t, { useWebkitFallback = false, throwOnConstruct = false, unsupported = false } = {}) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousPeer = Object.getOwnPropertyDescriptor(globalThis, 'RTCPeerConnection');

  class FakePeer {
    static instance;
    constructor() {
      if (throwOnConstruct) {
        throw new Error('blocked');
      }
      this.closed = false;
      FakePeer.instance = this;
    }
    createDataChannel() {}
    createOffer() {
      return Promise.resolve({});
    }
    setLocalDescription() {
      return Promise.resolve();
    }
    close() {
      this.closed = true;
    }
  }

  const windowMock = unsupported
    ? {}
    : useWebkitFallback
      ? { webkitRTCPeerConnection: FakePeer }
      : { RTCPeerConnection: FakePeer };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: windowMock,
  });

  if (unsupported || useWebkitFallback) {
    delete globalThis.RTCPeerConnection;
  } else {
    Object.defineProperty(globalThis, 'RTCPeerConnection', {
      configurable: true,
      writable: true,
      value: FakePeer,
    });
  }

  t.after(() => {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
    if (previousPeer) Object.defineProperty(globalThis, 'RTCPeerConnection', previousPeer);
    else delete globalThis.RTCPeerConnection;
  });

  t.mock.method(globalThis, 'fetch', async () => new Response('{}'));
  t.mock.timers.enable({ apis: ['setTimeout'] });
  return FakePeer;
}

function iceCandidate(address) {
  return { candidate: { candidate: `candidate:1 1 UDP 2130706431 ${address} 5000 typ srflx` } };
}

function riskFixture() {
  return {
    server: {
      ip: '172.238.0.1',
      ipVersion: 'IPv4',
      isLocalDev: false,
      edge: { colo: 'LAX', clientTcpRtt: 24, httpProtocol: 'h3', tlsVersion: 'TLSv1.3' },
      geo: {
        country: 'US',
        region: 'California',
        city: 'Los Angeles',
        timezone: 'America/Los_Angeles',
        regionPolicy: 'tier1',
      },
      network: {
        asn: 7922,
        asOrg: 'Comcast',
        heuristicType: 'residential',
        heuristicReason: 'fixture',
        intel: {
          source: 'ipapi.is',
          isDatacenter: false,
          isProxy: false,
          isVpn: false,
          isTor: false,
          isAbuser: false,
          isMobile: false,
          companyType: 'isp',
          companyName: 'Comcast',
          asnType: 'isp',
          abuserScore: null,
          timezone: 'America/Los_Angeles',
          countryCode: 'US',
          city: 'Los Angeles',
          region: 'California',
          asn: 7922,
          org: 'Comcast',
        },
      },
      headers: {
        acceptLanguage: 'en-US',
        userAgent: 'test',
        secChUaPlatform: null,
        secChUaMobile: null,
      },
      serverTime: 0,
    },
    domesticIp: {
      ip: null,
      locationLabel: null,
      isp: null,
      isChinaDirect: false,
      source: 'myip.ipip.net',
    },
    dnsLeak: {
      dnsIp: '198.51.100.8',
      dnsGeo: 'United States',
      ednsIp: null,
      ednsGeo: null,
      isChinaDns: false,
      status: 'safe',
    },
    dualStack: {
      ipv4: '172.238.0.1',
      ipv6: null,
      hasIpv6: false,
      mismatchWithMainIp: false,
    },
    webrtc: {
      supported: true,
      status: 'matched',
      publicIps: ['172.238.0.1'],
      ipDetails: [],
      localCandidates: [],
      candidateCount: 1,
      iceErrorCount: 0,
    },
    splitTunnel: {
      endpoints: [],
      cnFastCount: 0,
      overseasReachable: true,
      suspectedSplitTunnel: false,
      summary: 'No split routing',
    },
    browser: {
      timezone: 'America/Los_Angeles',
      timezoneOffsetMin: 480,
      language: 'en-US',
      languages: ['en-US'],
      intlLocale: 'en-US',
      hasChineseLanguage: false,
      detectedChineseFonts: [],
      webViewApp: null,
      isMobile: false,
      webdriver: false,
      platform: 'MacIntel',
      cores: 8,
      memoryGb: 16,
      screen: '1920x1080 @2x',
      webglRenderer: null,
    },
  };
}

test('isPrivateOrMdnsIp classifies local, CGNAT, link-local, multicast, and mDNS addresses', () => {
  for (const ip of [
    'host.local',
    'HOST.LOCAL',
    '10.0.0.1',
    '172.16.0.1',
    '192.168.1.1',
    '127.0.0.1',
    '169.254.1.1',
    '100.64.0.1',
    '100.127.255.254',
    '0.0.0.0',
    '::',
    '::1',
    '::ffff:192.168.1.1',
    'fe80::1',
    'fe90::1',
    'fc00::1',
    'fd12:3456::1',
    'ff02::1',
  ]) {
    assert.equal(isPrivateOrMdnsIp(ip), true, `expected private/local for ${ip}`);
  }

  for (const ip of ['8.8.8.8', '100.63.255.255', '100.128.0.1', '171.212.0.1', '172.238.0.1', '2606:4700:4700::1111']) {
    assert.equal(isPrivateOrMdnsIp(ip), false, `expected public for ${ip}`);
  }
});

test('ICE 701 errors do not hide a delayed public srflx candidate', async (t) => {
  const FakePeer = mockWebRtcPeer(t);
  const pending = probeWebRTC('172.238.0.1');
  const peer = FakePeer.instance;

  peer.onicecandidate(iceCandidate('host.local'));
  t.mock.timers.tick(3);
  peer.onicecandidateerror({ errorCode: 701 });
  t.mock.timers.tick(88);
  peer.onicecandidateerror({ errorCode: 701 });
  t.mock.timers.tick(118);
  peer.onicecandidate(iceCandidate('171.212.0.1'));
  t.mock.timers.tick(41);
  peer.onicecandidate({ candidate: null });

  const result = await pending;
  assert.equal(result.supported, true);
  assert.equal(result.status, 'leaked');
  assert.deepEqual(result.publicIps, ['171.212.0.1']);
  assert.deepEqual(result.localCandidates, ['host.local']);
  assert.equal(result.candidateCount, 2);
  assert.equal(result.iceErrorCount, 2);
  assert.equal(peer.closed, true);
});

test('host-only mDNS candidates remain unknown after ICE completes', async (t) => {
  const FakePeer = mockWebRtcPeer(t);
  const pending = probeWebRTC('172.238.0.1');
  const peer = FakePeer.instance;

  peer.onicecandidate(iceCandidate('host.local'));
  t.mock.timers.tick(3);
  peer.onicecandidateerror({ errorCode: 701 });
  t.mock.timers.tick(250);
  peer.onicecandidate({ candidate: null });

  const result = await pending;
  assert.equal(result.supported, true);
  assert.equal(result.status, 'unknown');
  assert.deepEqual(result.publicIps, []);
  assert.deepEqual(result.localCandidates, ['host.local']);
  assert.equal(result.iceErrorCount, 1);
  assert.equal(peer.closed, true);
});

test('matched public candidate returns matched status', async (t) => {
  const FakePeer = mockWebRtcPeer(t);
  const pending = probeWebRTC('172.238.0.1');
  const peer = FakePeer.instance;

  peer.onicecandidate(iceCandidate('172.238.0.1'));
  peer.onicecandidate({ candidate: null });

  const result = await pending;
  assert.equal(result.status, 'matched');
  assert.deepEqual(result.publicIps, ['172.238.0.1']);
  assert.equal(peer.closed, true);
});

test('WebRTC waits five seconds for candidates before returning unknown', async (t) => {
  const FakePeer = mockWebRtcPeer(t);
  const pending = probeWebRTC('172.238.0.1');
  const peer = FakePeer.instance;
  let completed = false;
  void pending.then(() => {
    completed = true;
  });

  t.mock.timers.tick(4999);
  await Promise.resolve();
  assert.equal(completed, false);

  t.mock.timers.tick(1);
  const result = await pending;
  assert.equal(result.status, 'unknown');
  assert.equal(result.iceErrorCount, 0);
  assert.equal(peer.closed, true);
});

test('abort closes the peer and does not wait for the WebRTC timeout', async (t) => {
  const FakePeer = mockWebRtcPeer(t);
  const controller = new AbortController();
  const pending = probeWebRTC('172.238.0.1', controller.signal);
  const peer = FakePeer.instance;

  t.mock.timers.tick(100);
  controller.abort();

  const result = await pending;
  assert.equal(result.status, 'unknown');
  assert.equal(peer.closed, true);
});

test('uses webkitRTCPeerConnection fallback when RTCPeerConnection is unavailable', async (t) => {
  const FakePeer = mockWebRtcPeer(t, { useWebkitFallback: true });
  const pending = probeWebRTC('172.238.0.1');
  const peer = FakePeer.instance;
  peer.onicecandidate(iceCandidate('171.212.0.1'));
  peer.onicecandidate({ candidate: null });
  const fallbackResult = await pending;
  assert.equal(fallbackResult.supported, true);
  assert.equal(fallbackResult.status, 'leaked');
  assert.equal(peer.closed, true);
});

test('returns unsupported unknown result when WebRTC is missing', async (t) => {
  mockWebRtcPeer(t, { unsupported: true });
  const unsupportedResult = await probeWebRTC('172.238.0.1');
  assert.deepEqual(unsupportedResult, {
    supported: false,
    status: 'unknown',
    publicIps: [],
    ipDetails: [],
    localCandidates: [],
    candidateCount: 0,
    iceErrorCount: 0,
  });
});

test('returns unsupported unknown result when RTCPeer constructor throws', async (t) => {
  mockWebRtcPeer(t, { throwOnConstruct: true });
  const blockedResult = await probeWebRTC('172.238.0.1');
  assert.deepEqual(blockedResult, {
    supported: false,
    status: 'unknown',
    publicIps: [],
    ipDetails: [],
    localCandidates: [],
    candidateCount: 0,
    iceErrorCount: 0,
  });
});

test('evaluateRisk treats unknown WebRTC as incomplete info rather than protected pass', () => {
  const input = riskFixture();
  input.webrtc = {
    supported: true,
    status: 'unknown',
    publicIps: [],
    ipDetails: [],
    localCandidates: ['host.local'],
    candidateCount: 1,
    iceErrorCount: 2,
  };

  const assessment = evaluateRisk(
    input.server,
    input.domesticIp,
    input.dnsLeak,
    input.dualStack,
    input.webrtc,
    input.splitTunnel,
    input.browser
  );

  const webrtcFinding = assessment.findings.find((f) => f.id === 'webrtc-unknown');
  assert.ok(webrtcFinding);
  assert.equal(webrtcFinding.severity, 'info');
  assert.equal(assessment.findings.find((f) => f.id === 'webrtc-protected'), undefined);
  assert.equal(assessment.categories.find((c) => c.key === 'leak')?.score, 13);
  assert.equal(assessment.score, 98);
});

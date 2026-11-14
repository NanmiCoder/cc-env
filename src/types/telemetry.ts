export interface IpIntelResult {
  source: 'ipapi.is' | 'ip-api.com' | 'ipwho.is' | 'cf-local';
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

export interface ServerInspectResult {
  ip: string;
  ipVersion: 'IPv4' | 'IPv6';
  isLocalDev: boolean;
  edge: {
    colo: string;
    clientTcpRtt: number | null;
    httpProtocol: string | null;
    tlsVersion: string | null;
  };
  geo: {
    country: string;
    region: string | null;
    city: string | null;
    timezone: string | null;
    regionPolicy: 'blocked' | 'tier1' | 'supported_other' | 'unknown';
  };
  network: {
    asn: number | null;
    asOrg: string | null;
    heuristicType: 'residential' | 'datacenter' | 'unknown';
    heuristicReason: string;
    intel: IpIntelResult;
  };
  headers: {
    acceptLanguage: string | null;
    userAgent: string | null;
    secChUaPlatform: string | null;
    secChUaMobile: string | null;
  };
  serverTime: number;
}

export interface DomesticIpResult {
  ip: string | null;
  locationLabel: string | null;
  isp: string | null;
  isChinaDirect: boolean;
  source: string;
}

export interface DnsLeakResult {
  dnsIp: string | null;
  dnsGeo: string | null;
  ednsIp: string | null;
  ednsGeo: string | null;
  isChinaDns: boolean;
  status: 'safe' | 'leaked' | 'unknown';
}

export interface WebRtcIpGeo {
  ip: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  isp: string | null;
  asn: number | null;
}

export interface WebRtcResult {
  supported: boolean;
  status: 'protected' | 'matched' | 'leaked' | 'timeout';
  publicIps: string[];
  ipDetails: WebRtcIpGeo[];
  localCandidates: string[];
  candidateCount: number;
}

export interface DualStackResult {
  ipv4: string | null;
  ipv6: string | null;
  hasIpv6: boolean;
  mismatchWithMainIp: boolean;
}

export interface ProbeEndpointResult {
  name: string;
  region: 'cn' | 'overseas' | 'edge';
  reachable: boolean;
  rttMs: number | null;
}

export interface SplitTunnelResult {
  endpoints: ProbeEndpointResult[];
  cnFastCount: number;
  overseasReachable: boolean;
  suspectedSplitTunnel: boolean;
  summary: string;
}

export interface BrowserEnvResult {
  timezone: string;
  timezoneOffsetMin: number;
  language: string;
  languages: string[];
  intlLocale: string;
  hasChineseLanguage: boolean;
  detectedChineseFonts: string[];
  webViewApp: string | null;
  isMobile: boolean;
  webdriver: boolean;
  platform: string;
  cores: number | null;
  memoryGb: number | null;
  screen: string;
  webglRenderer: string | null;
}

export interface IpHistoryComparison {
  status: 'first' | 'same' | 'changed';
  previousIp: string | null;
  previousCountry: string | null;
  previousAsn: number | null;
  previousAt: string | null;
}

export type RiskGrade = 'S' | 'A' | 'B' | 'C' | 'F';

export type FindingSeverity = 'pass' | 'info' | 'warn' | 'danger';

export interface AuditFinding {
  id: string;
  category: 'region' | 'ip' | 'leak' | 'env' | 'routing';
  title: string;
  severity: FindingSeverity;
  detail: string;
  impact: string;
  remediation?: string;
}

export interface CategoryScore {
  key: 'region' | 'ip' | 'leak' | 'env' | 'routing';
  label: string;
  score: number;
  maxScore: number;
  status: FindingSeverity;
}

export interface AnthropicEndpointCheck {
  id: 'claude_web' | 'api_anthropic' | 'platform_console';
  domain: string;
  label: string;
  role: string;
  reachable: boolean;
  rttMs: number | null;
  wafPolicy: string;
  note: string;
}

export interface CliEnvRecommendation {
  envKey: string;
  envValue: string;
  priority: 'required' | 'recommended' | 'optional';
  title: string;
  reason: string;
}

export interface RiskAssessment {
  score: number;
  grade: RiskGrade;
  gradeLabel: string;
  gradeSummary: string;
  ipTierLabel: string;
  categories: CategoryScore[];
  findings: AuditFinding[];
  recommendations: string[];
  cliRecommendations: CliEnvRecommendation[];
}

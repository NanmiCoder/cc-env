import type {
  AuditFinding,
  BrowserEnvResult,
  CategoryScore,
  CliEnvRecommendation,
  DnsLeakResult,
  DomesticIpResult,
  DualStackResult,
  FindingSeverity,
  RiskAssessment,
  RiskGrade,
  ServerInspectResult,
  SplitTunnelResult,
  WebRtcResult,
} from '../types/telemetry';

function worstSeverity(list: FindingSeverity[]): FindingSeverity {
  if (list.includes('danger')) return 'danger';
  if (list.includes('warn')) return 'warn';
  if (list.includes('info')) return 'info';
  return 'pass';
}

export function evaluateRisk(
  server: ServerInspectResult,
  domesticIp: DomesticIpResult,
  dnsLeak: DnsLeakResult,
  dualStack: DualStackResult,
  webrtc: WebRtcResult,
  splitTunnel: SplitTunnelResult,
  browser: BrowserEnvResult
): RiskAssessment {
  const findings: AuditFinding[] = [];
  const recommendations: string[] = [];

  // 1. Region Policy (25 pts)
  let regionScore = 25;
  const { country, regionPolicy, timezone: ipTimezone } = server.geo;

  if (regionPolicy === 'blocked') {
    regionScore = 0;
    findings.push({
      id: 'region-blocked',
      category: 'region',
      title: `出口地区受限 (${country})`,
      severity: 'danger',
      detail: `当前出口位于 ${country}，属于 Anthropic 明确不支持或高风险封控区域。`,
      impact: '极易触发拒访或风控限制',
      remediation: '立即切换至美国、日本、新加坡、英国等 Anthropic 支持地区的干净节点。',
    });
    recommendations.push(`当前出口国家/地区为 ${country}，属于封控区，请先切换至 US/JP/SG/UK 等支持地区。`);
  } else if (regionPolicy === 'tier1') {
    findings.push({
      id: 'region-tier1',
      category: 'region',
      title: `一线合规地区 (${country})`,
      severity: 'pass',
      detail: `出口位于 ${country}（${server.geo.city || '未知城市'}），属于 Anthropic 一线稳定支持区。`,
      impact: '地区合规通过',
    });
  } else if (regionPolicy === 'supported_other') {
    regionScore = 21;
    findings.push({
      id: 'region-other',
      category: 'region',
      title: `支持地区 (${country})`,
      severity: 'info',
      detail: `出口位于 ${country}，通常可正常访问，但风控容忍度略低于美/日/英等一线区。`,
      impact: '-4 分',
    });
  } else {
    regionScore = 15;
    findings.push({
      id: 'region-unknown',
      category: 'region',
      title: '地区未知',
      severity: 'warn',
      detail: '未能准确识别当前出口国家/地区，可能处于本地调试或异常网络环境。',
      impact: '-10 分',
    });
  }

  // 2. IP Purity & Type (35 pts)
  let ipScore = 35;
  const intel = server.network.intel;
  const heuristic = server.network.heuristicType;
  let ipTierLabel = '未分类网络';

  const isDatacenter =
    intel.isDatacenter === true ||
    intel.companyType === 'hosting' ||
    intel.asnType === 'hosting' ||
    heuristic === 'datacenter';

  const isResidential =
    !isDatacenter &&
    (intel.companyType === 'isp' ||
      intel.asnType === 'isp' ||
      intel.isMobile === true ||
      heuristic === 'residential');

  if (intel.isTor) {
    ipScore -= 35;
    ipTierLabel = 'Tor 匿名节点';
    findings.push({
      id: 'ip-tor',
      category: 'ip',
      title: '命中 Tor 出口节点',
      severity: 'danger',
      detail: '当前 IP 为公开 Tor 出口节点，几乎所有主流风控都会直接拦截。',
      impact: '-35 分',
      remediation: '请勿使用 Tor 访问 Claude，改用独立住宅或优质商宽代理。',
    });
    recommendations.push('检测到 Tor 出口节点，请更换为普通住宅或干净独享线路。');
  } else if (intel.isAbuser) {
    ipScore -= 26;
    ipTierLabel = '高危滥用/万人骑 IP';
    findings.push({
      id: 'ip-abuser',
      category: 'ip',
      title: 'IP 命中滥用黑名单 (Abuser)',
      severity: 'danger',
      detail: `情报库 (${intel.source}) 标记该 IP 存在高频滥用/欺诈记录${intel.abuserScore ? `（风险分 ${intel.abuserScore}）` : ''}，典型“万人骑”共享节点特征。`,
      impact: '-26 分',
      remediation: '立刻更换节点，避免使用多人共享的公共机场节点注册或登录主力账号。',
    });
    recommendations.push('当前 IP 已被标记为高频滥用（万人骑特征），极易连坐封号，建议更换独享 IP。');
  } else if (intel.isProxy || intel.isVpn) {
    ipScore -= 18;
    ipTierLabel = isDatacenter ? '机房商业 VPN/代理' : '标记代理/VPN';
    findings.push({
      id: 'ip-proxy',
      category: 'ip',
      title: '识别为商业 VPN / 公共代理',
      severity: 'warn',
      detail: `情报库标记：${intel.isVpn ? 'VPN ' : ''}${intel.isProxy ? 'Proxy' : ''}。此类出口在 claude.ai 极易触发 Cloudflare Bot Challenge (cf-mitigated) / 1020 拦截，并影响 Stripe 支付风控。`,
      impact: '-18 分',
      remediation: '若遇到 claude.ai 反复人机验证或 CLI OAuth 握手失败，建议升级为独享静态住宅 ISP 或原生家宽。',
    });
    recommendations.push('IP 被识别为商业 VPN/代理，易触发 claude.ai 的 Cloudflare 验证 (cf-mitigated)，建议重要账号换用静态住宅 ISP。');
  } else if (isDatacenter) {
    ipScore -= 15;
    ipTierLabel = '机房 / VPS (Datacenter)';
    findings.push({
      id: 'ip-dc',
      category: 'ip',
      title: '机房 / 云服务器 IP (Datacenter)',
      severity: 'warn',
      detail: `${server.network.asOrg || '未知机构'} (${server.network.heuristicReason})。机房 ASN 在 claude.ai 容易遭遇 cf-mitigated / JA3 严格质询，且注册与绑卡权重较低。`,
      impact: '-15 分',
      remediation: '日常调用 api.anthropic.com 尚可；若网页端频繁弹 Cloudflare 验证或需注册/绑卡，请切换住宅家宽节点。',
    });
    recommendations.push('当前为机房/VPS IP，claude.ai 网页端可能触发 Cloudflare Challenge (cf-mitigated)，敏感操作建议换用住宅 ISP。');
  } else if (isResidential) {
    ipTierLabel = intel.isMobile ? '原生移动蜂窝 (Mobile)' : '原生家宽 / ISP';
    findings.push({
      id: 'ip-residential',
      category: 'ip',
      title: `纯净${intel.isMobile ? '移动蜂窝' : '住宅家宽 / ISP'} IP`,
      severity: 'pass',
      detail: `ISP 运营商：${intel.companyName || server.network.asOrg || '未知'}（非机房段），未命中代理/VPN/滥用黑名单。`,
      impact: 'IP 纯净度满分',
    });
  } else {
    ipScore -= 6;
    ipTierLabel = '普通商业/未知网络';
    findings.push({
      id: 'ip-business',
      category: 'ip',
      title: '商业宽带或未明确定性网络',
      severity: 'info',
      detail: `机构：${server.network.asOrg || '未知'}（${intel.companyType || 'unknown'}），暂未命中黑名单。`,
      impact: '-6 分',
    });
  }
  ipScore = Math.max(0, ipScore);

  // 3. Leak Protection: WebRTC, DNS & Dual-Stack (15 pts)
  let leakScore = 15;
  if (webrtc.status === 'leaked') {
    leakScore -= 8;
    const detailLocations = webrtc.ipDetails
      .map((d) => `${d.ip}${d.country ? ` (${d.country}${d.city ? ` · ${d.city}` : ''}${d.isp ? ` · ${d.isp}` : ''})` : ''}`)
      .join('；');
    findings.push({
      id: 'webrtc-leak',
      category: 'leak',
      title: 'WebRTC UDP 真实公网 IP 泄露',
      severity: 'danger',
      detail: `STUN 探测暴露出与 HTTP 出口 (${server.ip}) 不一致的公网 IP：${detailLocations || webrtc.publicIps.join(', ')}。`,
      impact: '-8 分',
      remediation: '请在代理工具中开启 UDP 转发，或在浏览器中禁用 WebRTC（或安装 WebRTC Control 扩展）。',
    });
    recommendations.push('检测到 WebRTC UDP 泄露真实 IP，请开启代理 UDP 转发或在浏览器禁用 WebRTC。');
  } else if (webrtc.status === 'matched') {
    findings.push({
      id: 'webrtc-matched',
      category: 'leak',
      title: 'WebRTC UDP 出口与代理一致',
      severity: 'pass',
      detail: `WebRTC 探测到的公网 IP (${webrtc.publicIps.join(', ')}) 与 HTTP 出口完全一致。`,
      impact: '无泄露',
    });
  } else {
    findings.push({
      id: 'webrtc-protected',
      category: 'leak',
      title: 'WebRTC 已被浏览器屏蔽或受保护',
      severity: 'pass',
      detail: '未能通过 STUN 提取到公网 IP，有效防止了底层 UDP 泄露。',
      impact: '安全',
    });
  }

  if (dnsLeak.status === 'leaked') {
    leakScore -= 5;
    findings.push({
      id: 'dns-leak',
      category: 'leak',
      title: 'DNS 解析疑似泄露至国内运营商',
      severity: 'danger',
      detail: `检测到当前 DNS 出口为 ${dnsLeak.dnsIp} (${dnsLeak.dnsGeo || 'China'})，与海外代理出口 (${country}) 不一致。`,
      impact: '-5 分',
      remediation: '请在代理软件中开启 Fake-IP 或远程 DNS（DoH/隧道 DNS），避免本地 DNS 直连解析。',
    });
    recommendations.push(`DNS 解析出口 (${dnsLeak.dnsIp}) 位于国内，建议开启隧道 DNS / Fake-IP 模式防止 DNS 泄露。`);
  } else if (dnsLeak.status === 'safe') {
    findings.push({
      id: 'dns-safe',
      category: 'leak',
      title: 'DNS 解析出口正常',
      severity: 'pass',
      detail: `DNS 出口 IP 为 ${dnsLeak.dnsIp}（${dnsLeak.dnsGeo || '非国内运营商'}），未发现国内 DNS 泄露。`,
      impact: '无泄露',
    });
  }

  if (dualStack.mismatchWithMainIp) {
    leakScore -= 4;
    findings.push({
      id: 'dualstack-mismatch',
      category: 'leak',
      title: 'IPv4 / IPv6 出口不一致',
      severity: 'warn',
      detail: `检测到双栈出口分流：IPv4=${dualStack.ipv4 || '无'}，IPv6=${dualStack.ipv6 || '无'}，可能存在 IPv6 绕过代理直连泄露。`,
      impact: '-4 分',
      remediation: '建议在系统或代理软件中关闭 IPv6，或确保 IPv6 同样走同一海外节点。',
    });
    recommendations.push('IPv4 与 IPv6 出口不一致，建议关闭 IPv6 或开启全局 IPv6 代理防止直连泄露。');
  } else {
    findings.push({
      id: 'dualstack-ok',
      category: 'leak',
      title: dualStack.hasIpv6 ? 'IPv4 / IPv6 双栈一致' : '纯 IPv4 出口（无 IPv6 泄露）',
      severity: 'pass',
      detail: dualStack.hasIpv6
        ? `IPv4 (${dualStack.ipv4 || '-'}) 与 IPv6 (${dualStack.ipv6 || '-'}) 均在管控内。`
        : '未检测到公开 IPv6 出口，避免了常见的 IPv6 直连泄露风险。',
      impact: '正常',
    });
  }
  leakScore = Math.max(0, leakScore);

  // 4. Environment Consistency: Timezone / Language / Fonts (15 pts)
  let envScore = 15;
  const isChinaTimezone =
    browser.timezone === 'Asia/Shanghai' ||
    browser.timezone === 'Asia/Chongqing' ||
    browser.timezone === 'Asia/Harbin' ||
    browser.timezone === 'Asia/Urumqi' ||
    browser.timezoneOffsetMin === -480;

  if (ipTimezone && browser.timezone !== 'Unknown' && ipTimezone !== browser.timezone && regionPolicy !== 'blocked') {
    const deduction = isChinaTimezone ? 8 : 4;
    envScore -= deduction;
    findings.push({
      id: 'env-tz-mismatch',
      category: 'env',
      title: isChinaTimezone ? '系统时区暴露东八区 (UTC+8)' : '系统时区与 IP 归属地不匹配',
      severity: isChinaTimezone ? 'danger' : 'warn',
      detail: `浏览器/系统时区为 ${browser.timezone}，而出口 IP 所在时区为 ${ipTimezone}。实测 Claude Code CLI 的 1P 遥测也会直接采集并上报系统 timeZone。`,
      impact: `-${deduction} 分`,
      remediation: '将设备/指纹浏览器的系统时区修改为与出口 IP 一致（例如 America/Los_Angeles），或在 CLI 中关闭遥测。',
    });
    recommendations.push(`系统时区 (${browser.timezone}) 与出口时区 (${ipTimezone}) 冲突（CLI 1P 遥测同样会采集此字段），建议同步时区或开启 CLI 隐私开关。`);
  } else {
    findings.push({
      id: 'env-tz-ok',
      category: 'env',
      title: '系统时区与出口一致',
      severity: 'pass',
      detail: `当前时区 ${browser.timezone} 与出口地匹配。`,
      impact: '一致',
    });
  }

  if (browser.hasChineseLanguage && regionPolicy !== 'blocked') {
    envScore -= 5;
    findings.push({
      id: 'env-lang-zh',
      category: 'env',
      title: '浏览器首选语言包含中文',
      severity: 'warn',
      detail: `检测到语言列表 [${browser.languages.slice(0, 3).join(', ')}]，Accept-Language 请求头与 CLI 1P 上报的 systemLocaleLanguage 均会反映此信号。`,
      impact: '-5 分',
      remediation: '建议将浏览器首选语言设为 English (United States) [en-US] 并置于第一位。',
    });
    recommendations.push('浏览器语言包含中文 (zh-CN)，建议将系统/浏览器首选语言改为 en-US。');
  } else {
    findings.push({
      id: 'env-lang-ok',
      category: 'env',
      title: '浏览器语言特征干净',
      severity: 'pass',
      detail: `首选语言为 ${browser.language}，未暴露中文语言偏好。`,
      impact: '正常',
    });
  }

  if (browser.detectedChineseFonts.length > 0 && regionPolicy !== 'blocked') {
    envScore -= 2;
    findings.push({
      id: 'env-fonts-zh',
      category: 'env',
      title: `检测到 ${browser.detectedChineseFonts.length} 种中文系统字体`,
      severity: 'info',
      detail: `命中字体：${browser.detectedChineseFonts.slice(0, 4).join('、')}。属于较弱的指纹辅助特征。`,
      impact: '-2 分',
    });
  }
  envScore = Math.max(0, envScore);

  // 5. Routing & Client Environment (10 pts)
  let routingScore = 10;
  if (domesticIp.isChinaDirect) {
    routingScore -= 4;
    findings.push({
      id: 'routing-cn-direct',
      category: 'routing',
      title: '检出国内真实直连出口 (规则分流环境)',
      severity: 'warn',
      detail: `国内接口返回直连 IP ${domesticIp.ip}（${domesticIp.locationLabel || '中国'}），与海外代理出口 (${server.ip}) 不一致。`,
      impact: '-4 分',
      remediation: '关键账号注册/绑卡时建议临时切换为「全局代理模式 (Global)」，避免规则分流导致部分第三方接口直连。',
    });
    recommendations.push(`检测到国内直连 IP (${domesticIp.ip})，敏感操作建议切换为全局模式。`);
  } else if (splitTunnel.suspectedSplitTunnel) {
    routingScore -= 4;
    findings.push({
      id: 'routing-split',
      category: 'routing',
      title: '疑似国内规则分流代理环境',
      severity: 'warn',
      detail: splitTunnel.summary,
      impact: '-4 分',
      remediation: '建议在访问/注册 Claude 时临时切换为「全局代理模式 (Global)」。',
    });
    recommendations.push('检测到国内直连+海外代理的分流特征，关键账号操作建议切换为全局模式。');
  } else {
    findings.push({
      id: 'routing-clean',
      category: 'routing',
      title: '路由与分流探测',
      severity: 'pass',
      detail: splitTunnel.summary,
      impact: '正常',
    });
  }

  if (browser.webViewApp) {
    routingScore -= 4;
    findings.push({
      id: 'client-webview',
      category: 'routing',
      title: `运行于 ${browser.webViewApp}`,
      severity: 'danger',
      detail: '国产 App 内置 WebView 极易携带环境特征且常绕过系统代理/暴露指纹。',
      impact: '-4 分',
      remediation: '请点击右上角「在系统默认浏览器打开」（Safari / Chrome）。',
    });
    recommendations.push(`当前处于 ${browser.webViewApp}，请改用手机系统 Safari 或 Chrome 打开。`);
  }

  if (browser.webdriver) {
    routingScore -= 4;
    findings.push({
      id: 'client-webdriver',
      category: 'routing',
      title: '检测到自动化控制特征 (webdriver=true)',
      severity: 'danger',
      detail: '浏览器暴露了 navigator.webdriver 标记，极易触发人机验证或风控拦截。',
      impact: '-4 分',
    });
  }
  routingScore = Math.max(0, routingScore);

  // Total score & grade
  let totalScore = regionScore + ipScore + leakScore + envScore + routingScore;
  if (regionPolicy === 'blocked') {
    totalScore = Math.min(totalScore, 24);
  }
  totalScore = Math.max(0, Math.min(100, totalScore));

  let grade: RiskGrade = 'F';
  let gradeLabel = '极高风险 · 地区或环境受限';
  let gradeSummary = '当前网络地区受限或存在多项高危泄露特征，建议先优化节点与环境后再登录主力账号。';

  if (regionPolicy !== 'blocked') {
    if (totalScore >= 90) {
      grade = 'S';
      gradeLabel = '极净家宽 · 顶级安全';
      gradeSummary = '出口纯净、无底层泄露且指纹高度一致，非常适合注册、绑卡与主力账号长期使用。';
    } else if (totalScore >= 75) {
      grade = 'A';
      gradeLabel = '优质可用 · 风控较低';
      gradeSummary = '网络质量良好，无明显致命短板，可稳健用于日常 Claude 访问。';
    } else if (totalScore >= 55) {
      grade = 'B';
      gradeLabel = '轻度风控 · 建议优化';
      gradeSummary = '存在时区/语言错位、分流或机房 IP 特征，建议按下方清单修复后再进行敏感操作。';
    } else if (totalScore >= 30) {
      grade = 'C';
      gradeLabel = '高危预警 · 易触发封控';
      gradeSummary = '检测到多人共享代理、滥用记录或严重泄露冲突，极易触发验证码或风控封号。';
    }
  }

  const categoryFindings = (cat: CategoryScore['key']) =>
    worstSeverity(findings.filter((f) => f.category === cat).map((f) => f.severity));

  const categories: CategoryScore[] = [
    { key: 'region', label: '地区合规', score: regionScore, maxScore: 25, status: categoryFindings('region') },
    { key: 'ip', label: 'IP 纯净度', score: ipScore, maxScore: 35, status: categoryFindings('ip') },
    { key: 'leak', label: '防泄露审计', score: leakScore, maxScore: 15, status: categoryFindings('leak') },
    { key: 'env', label: '环境一致性', score: envScore, maxScore: 15, status: categoryFindings('env') },
    { key: 'routing', label: '分流与宿主', score: routingScore, maxScore: 10, status: categoryFindings('routing') },
  ];

  if (recommendations.length === 0) {
    recommendations.push('当前环境各项指标表现优秀，建议保持固定 IP 与浏览器环境，避免频繁跨区切换节点。');
  }

  const hasLeakOrSplit =
    dnsLeak.status === 'leaked' ||
    domesticIp.isChinaDirect ||
    splitTunnel.suspectedSplitTunnel ||
    webrtc.status === 'leaked';

  const hasEnvExposure = isChinaTimezone || browser.hasChineseLanguage;

  const cliRecommendations: CliEnvRecommendation[] = [
    {
      envKey: 'CLAUDE_CODE_PROXY_RESOLVES_HOSTS',
      envValue: '1',
      priority: hasLeakOrSplit ? 'required' : 'recommended',
      title: '代理远端解析 DNS，防止本地解析泄露',
      reason: hasLeakOrSplit
        ? '当前检出分流/DNS 泄露风险：设置此项后 CLI 将跳过本地 DNS 查询，完全交由代理远端解析。'
        : '使用本地 HTTP/SOCKS 代理运行 Claude Code 时，开启此项可避免终端发起本地 DNS 解析泄露真实归属地。',
    },
    {
      envKey: 'DISABLE_TELEMETRY',
      envValue: '1',
      priority: hasEnvExposure ? 'recommended' : 'optional',
      title: '关闭 1P / Datadog 遥测外发',
      reason: hasEnvExposure
        ? `当前系统暴露中文环境特征 (${browser.timezone} / ${browser.language})：开启后可阻断 timeZone、systemLocaleLanguage、device_id 等遥测事件上报。`
        : '阻断 CLI 向 api.anthropic.com/api/event_logging/batch 及 Datadog 上报设备指纹与会话事件。',
    },
    {
      envKey: 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC',
      envValue: '1',
      priority: hasEnvExposure ? 'recommended' : 'optional',
      title: '禁用非必要后台流量与 GrowthBook 上报',
      reason:
        '同步停用 GrowthBook 实验特性拉取与非核心后台请求，避免 apiBaseUrlHost、组织 ID 等上下文被动上报。',
    },
  ];

  return {
    score: totalScore,
    grade,
    gradeLabel,
    gradeSummary,
    ipTierLabel,
    categories,
    findings,
    recommendations,
    cliRecommendations,
  };
}

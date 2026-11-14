import type {
  BrowserEnvResult,
  DnsLeakResult,
  DomesticIpResult,
  RiskAssessment,
  ServerInspectResult,
  SplitTunnelResult,
  WebRtcResult,
} from '../types/telemetry';

export interface PromptContext {
  server: ServerInspectResult;
  domesticIp: DomesticIpResult;
  dnsLeak: DnsLeakResult;
  webrtc: WebRtcResult;
  splitTunnel?: SplitTunnelResult;
  browser: BrowserEnvResult;
  assessment: RiskAssessment;
}

export function buildPosterSummary(ctx: PromptContext): string {
  const issues: string[] = [];
  const actions: string[] = [];

  if (ctx.server.geo.regionPolicy === 'blocked') {
    issues.push(`出口地区 (${ctx.server.geo.country}) 受限`);
    actions.push('先切换至美/日/英等支持地区节点');
  }

  if (
    ctx.server.network.intel.isAbuser ||
    ctx.server.network.intel.isTor ||
    ctx.server.network.intel.isProxy ||
    ctx.server.network.intel.isVpn ||
    ctx.server.network.intel.isDatacenter ||
    ctx.server.network.heuristicType === 'datacenter'
  ) {
    issues.push(`出口属性为「${ctx.assessment.ipTierLabel}」`);
    actions.push('主力注册/付费建议换用独享静态住宅 ISP');
  }

  if (ctx.domesticIp.isChinaDirect || ctx.splitTunnel?.suspectedSplitTunnel) {
    issues.push('检出国内直连分流');
    actions.push('敏感操作时开启全局代理');
  }

  if (ctx.dnsLeak.status === 'leaked') {
    issues.push(`DNS 泄露 (${ctx.dnsLeak.dnsGeo || 'CN'})`);
    actions.push('开启代理远端 DNS / Fake-IP');
  }

  if (ctx.webrtc.status === 'leaked') {
    issues.push('WebRTC UDP 暴露真实 IP');
    actions.push('在浏览器禁用或限制 WebRTC 公网暴露');
  }

  const tzMismatch = Boolean(
    ctx.server.geo.timezone && ctx.browser.timezone !== ctx.server.geo.timezone
  );
  if (tzMismatch || ctx.browser.hasChineseLanguage) {
    issues.push(`中文环境指纹 (${ctx.browser.timezone} · ${ctx.browser.language})`);
    actions.push('将系统时区与浏览器首选语言同步为目标地区 (如 en-US)');
  }

  if (issues.length === 0) {
    return `诊断结论：当前网络环境表现优异（${ctx.assessment.score}/100 · ${ctx.assessment.grade} 级），无底层泄露与明显指纹冲突。建议保持固定节点与当前浏览器环境，避免频繁跨区切换。`;
  }

  const uniqueActions = Array.from(new Set(actions));
  return `当前问题：${issues.join('、')}。处理建议：${uniqueActions.join('；')}。`;
}

export function buildAgentFixPrompt(ctx: PromptContext): string {
  const { server, domesticIp, dnsLeak, webrtc, splitTunnel, browser, assessment } = ctx;
  const tzMismatch = Boolean(server.geo.timezone && browser.timezone !== server.geo.timezone);

  const tasks: string[] = [];

  if (server.geo.regionPolicy === 'blocked') {
    tasks.push(
      `1. [出口地区受限] 当前出口为 ${server.geo.country}（不支持地区）。请提醒并协助我切换代理节点到 US / JP / SG / UK 等 Anthropic 支持地区。`
    );
  }

  if (dnsLeak.status === 'leaked') {
    tasks.push(
      `${tasks.length + 1}. [修复 DNS 泄露] 当前 DNS 解析归属地为 ${dnsLeak.dnsGeo || 'CN'}。
   - 检查本机代理客户端配置，开启 Fake-IP 或强制由代理服务器远端解析 DNS；
   - 在终端 Shell 配置中追加：export CLAUDE_CODE_PROXY_RESOLVES_HOSTS=1（防止 Claude Code CLI 本地 DNS 泄露）。`
    );
  }

  if (webrtc.status === 'leaked') {
    tasks.push(
      `${tasks.length + 1}. [修复 WebRTC UDP 泄露] 当前浏览器 WebRTC 暴露了真实公网 IP。
   - 请使用 Computer Use 或引导我在当前浏览器中开启防 WebRTC 泄露策略（如 Chrome flags / WebRTC Control 扩展 / 浏览器隐私设置限制非代理 UDP 路由）。`
    );
  }

  if (domesticIp.isChinaDirect || splitTunnel?.suspectedSplitTunnel) {
    tasks.push(
      `${tasks.length + 1}. [处理规则分流直连] 检测到国内外分流特征。
   - 协助我将代理客户端切换为「全局模式 (Global)」，或确认 claude.ai、api.anthropic.com、platform.claude.com、edns.ip-api.com 均走代理通道。`
    );
  }

  if (tzMismatch) {
    tasks.push(
      `${tasks.length + 1}. [同步系统时区] 当前系统时区为 ${browser.timezone}，与出口 IP 时区 (${server.geo.timezone}) 不一致（Claude Code 1P 遥测也会采集该字段）。
   - 若我同意修改系统级时区，请协助或通过 Computer Use 打开系统设置，将时区调整为 ${server.geo.timezone}（或配合指纹浏览器隔离）。`
    );
  }

  if (browser.hasChineseLanguage) {
    tasks.push(
      `${tasks.length + 1}. [修改浏览器首选语言] 当前浏览器语言包含中文（${browser.languages.slice(0, 3).join(', ')}）。
   - 请使用 Computer Use 打开浏览器语言设置，将 English (United States) [en-US] 添加并置顶为首选语言。`
    );
  }

  if (
    server.network.intel.isDatacenter ||
    server.network.intel.isProxy ||
    server.network.intel.isVpn ||
    server.network.intel.isAbuser ||
    server.network.heuristicType === 'datacenter'
  ) {
    tasks.push(
      `${tasks.length + 1}. [出口 IP 纯净度优化] 当前出口类型为「${assessment.ipTierLabel}」（AS${server.network.asn ?? '-'} ${server.network.asOrg || ''}），在 claude.ai 容易触发 Cloudflare Challenge (cf-mitigated)。
   - 请提示我在注册/绑卡或高频使用时更换为住宅 ISP 节点；并在终端中按需配置：
     export DISABLE_TELEMETRY=1
     export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`
    );
  }

  if (tasks.length === 0) {
    tasks.push(
      `1. 当前环境（${assessment.score}/100 · ${assessment.grade} 级）各项指标均通过，无需修改系统或浏览器配置。请帮我确认终端已开启 export CLAUDE_CODE_PROXY_RESOLVES_HOSTS=1（如使用本地代理）即可。`
    );
  }

  return [
    `请作为我的桌面自动化与网络环境排障助手（支持终端命令与 Computer Use），根据以下来自 https://ccenv.app 的实测体检结果，协同我逐项修复本机的 Claude / Anthropic 访问环境：`,
    ``,
    `## 当前体检摘要`,
    `- 操作系统平台：${browser.platform}`,
    `- 综合评分：${assessment.score}/100（${assessment.grade} 级 · ${assessment.gradeLabel}）`,
    `- 出口归属地：${server.geo.country} ${server.geo.city || ''}（${assessment.ipTierLabel} · AS${server.network.asn ?? '-'}）`,
    `- 系统时区 / 语言：${browser.timezone} / ${browser.language}（出口时区：${server.geo.timezone || '未知'}）`,
    `- DNS 状态：${dnsLeak.status}（${dnsLeak.dnsGeo || '-'}）`,
    `- WebRTC 状态：${webrtc.status}`,
    ``,
    `## 需要执行的排查与修复任务`,
    ...tasks,
    ``,
    `## 协作与安全要求`,
    `1. 涉及浏览器设置或系统偏好设置（如修改语言、系统时区、代理模式）时，可通过 Computer Use 辅助打开对应界面或逐步指导我完成；`,
    `2. 修改系统级时区、网络代理或写入 Shell 配置文件前，先向我简要确认修改内容，确保不会中断当前网络连接；`,
    `3. 全部调整完成后，请重新打开或刷新 https://ccenv.app 复测，确认分数提升且无高危泄露项。`,
  ].join('\n');
}

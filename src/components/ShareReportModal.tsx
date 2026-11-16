import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, X } from 'lucide-react';
import { ClaudeFlowerLogo } from './BrandAndText';
import { buildPosterSummary } from '../utils/agentPrompt';
import type {
  BrowserEnvResult,
  DnsLeakResult,
  DomesticIpResult,
  RiskAssessment,
  RiskGrade,
  ServerInspectResult,
  WebRtcResult,
} from '../types/telemetry';

interface ShareReportModalProps {
  open: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  hideIp: boolean;
  maskIp: (ip: string | null | undefined, hidden: boolean) => string;
  server: ServerInspectResult;
  domesticIp: DomesticIpResult;
  dnsLeak: DnsLeakResult;
  webrtc: WebRtcResult;
  browser: BrowserEnvResult;
  assessment: RiskAssessment;
  scannedAt: string;
  onCopyText: () => void;
  copied: boolean;
}

const GRADE_HEX_DARK: Record<RiskGrade, { accent: string; bg: string }> = {
  S: { accent: '#34d399', bg: 'rgba(16, 185, 129, 0.14)' },
  A: { accent: '#22d3ee', bg: 'rgba(6, 182, 212, 0.14)' },
  B: { accent: '#fbbf24', bg: 'rgba(245, 158, 11, 0.14)' },
  C: { accent: '#fb923c', bg: 'rgba(249, 115, 22, 0.14)' },
  F: { accent: '#fb7185', bg: 'rgba(244, 63, 94, 0.16)' },
};

const GRADE_HEX_LIGHT: Record<RiskGrade, { accent: string; bg: string }> = {
  S: { accent: '#059669', bg: 'rgba(16, 185, 129, 0.10)' },
  A: { accent: '#0891b2', bg: 'rgba(6, 182, 212, 0.10)' },
  B: { accent: '#d97706', bg: 'rgba(245, 158, 11, 0.10)' },
  C: { accent: '#ea580c', bg: 'rgba(249, 115, 22, 0.10)' },
  F: { accent: '#e11d48', bg: 'rgba(244, 63, 94, 0.10)' },
};

function drawClaudeFlower(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  const r = size / 2;
  const rayLen = r * 0.64;
  const rayW = r * 0.18;
  for (let i = 0; i < 12; i += 1) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 6);
    ctx.beginPath();
    ctx.roundRect(-rayW / 2, -r * 0.86, rayW, rayLen, rayW / 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export default function ShareReportModal({
  open,
  onClose,
  theme,
  hideIp,
  maskIp,
  server,
  domesticIp,
  dnsLeak,
  webrtc,
  browser,
  assessment,
  scannedAt,
}: ShareReportModalProps) {
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [imageCopied, setImageCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const shareUrl =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname.includes('ccenv')
      ? window.location.origin
      : 'https://ccenv.app';

  const isLight = theme === 'light';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const generatePoster = async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(shareUrl, {
          width: 260,
          margin: 1,
          color: { dark: '#141413', light: '#ffffff' },
        });

        const w = 900;
        const measureCanvas = document.createElement('canvas');
        const mCtx = measureCanvas.getContext('2d');
        const summaryText = buildPosterSummary({
          server,
          domesticIp,
          dnsLeak,
          webrtc,
          browser,
          assessment,
        });
        const summaryLines: string[] = [];
        if (mCtx) {
          mCtx.font = '17px -apple-system, BlinkMacSystemFont, sans-serif';
          const maxTextW = w - 168;
          let current = '';
          for (const ch of summaryText) {
            const test = current + ch;
            if (mCtx.measureText(test).width > maxTextW && current.length > 0) {
              summaryLines.push(current);
              current = ch;
            } else {
              current = test;
            }
          }
          if (current) summaryLines.push(current);
        } else {
          summaryLines.push(summaryText);
        }

        const lineHeight = 27;
        const summaryCardH = 56 + summaryLines.length * lineHeight + 18;
        const summaryY = 920;
        const footerY = summaryY + summaryCardH + 22;
        const h = footerY + 194 + 56;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const gColor = (isLight ? GRADE_HEX_LIGHT : GRADE_HEX_DARK)[assessment.grade];
        const tzMismatch = Boolean(
          server.geo.timezone && browser.timezone !== server.geo.timezone
        );

        const palette = isLight
          ? {
              bg: '#f6f4ef',
              card: 'rgba(255, 255, 255, 0.94)',
              cardBorder: 'rgba(20, 20, 19, 0.12)',
              dot: 'rgba(20, 20, 19, 0.075)',
              divider: 'rgba(20, 20, 19, 0.08)',
              textPrimary: '#141413',
              textSecondary: '#3d3c38',
              textMuted: '#6e6c65',
              ringTrack: 'rgba(20, 20, 19, 0.1)',
              rowBg: '#f3f0e8',
              rowBorder: 'rgba(20, 20, 19, 0.08)',
              footerBg: '#ede9df',
              footerBorder: 'rgba(20, 20, 19, 0.1)',
              pillBg: 'rgba(217, 119, 87, 0.12)',
              pillText: '#b85435',
              okColor: '#059669',
              warnColor: '#d97706',
            }
          : {
              bg: '#050507',
              card: 'rgba(13, 16, 26, 0.88)',
              cardBorder: 'rgba(255, 255, 255, 0.12)',
              dot: 'rgba(255, 255, 255, 0.06)',
              divider: 'rgba(255, 255, 255, 0.08)',
              textPrimary: '#ffffff',
              textSecondary: 'rgba(255, 255, 255, 0.78)',
              textMuted: 'rgba(255, 255, 255, 0.48)',
              ringTrack: 'rgba(255, 255, 255, 0.1)',
              rowBg: 'rgba(255, 255, 255, 0.035)',
              rowBorder: 'rgba(255, 255, 255, 0.07)',
              footerBg: 'rgba(0, 0, 0, 0.55)',
              footerBorder: 'rgba(255, 255, 255, 0.1)',
              pillBg: 'rgba(217, 119, 87, 0.14)',
              pillText: '#f3a68c',
              okColor: '#34d399',
              warnColor: '#fbbf24',
            };

        // 1. Background
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, w, h);

        // Subtle terracotta radial glow at top
        const topGlow = ctx.createRadialGradient(w / 2, 0, 20, w / 2, 0, 520);
        topGlow.addColorStop(0, isLight ? 'rgba(217, 119, 87, 0.18)' : 'rgba(217, 119, 87, 0.26)');
        topGlow.addColorStop(0.55, 'rgba(16, 185, 129, 0.05)');
        topGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, w, 520);

        // Subtle dot-grid pattern
        ctx.fillStyle = palette.dot;
        for (let gx = 24; gx < w; gx += 28) {
          for (let gy = 24; gy < h; gy += 28) {
            ctx.fillRect(gx, gy, 1.5, 1.5);
          }
        }

        // 2. Outer Card Frame
        ctx.fillStyle = palette.card;
        ctx.strokeStyle = palette.cardBorder;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(28, 28, w - 56, h - 56, 28);
        ctx.fill();
        ctx.stroke();

        // 3. Top Brand Header: Claude 菊花 Logo + CC Env + Domain
        drawClaudeFlower(ctx, 92, 94, 44, '#D97757');

        ctx.fillStyle = palette.textPrimary;
        ctx.font = 'bold 34px "Space Mono", ui-monospace, monospace';
        ctx.fillText('CC Env', 130, 104);

        ctx.fillStyle = palette.textMuted;
        ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Anthropic / Claude 环境风控自检', 130, 132);

        // Right domain pill
        ctx.fillStyle = palette.pillBg;
        ctx.strokeStyle = 'rgba(217, 119, 87, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(w - 256, 72, 196, 40, 20);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = palette.pillText;
        ctx.font = 'bold 16px "Space Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ccenv.app', w - 158, 98);
        ctx.textAlign = 'left';

        // Divider
        ctx.strokeStyle = palette.divider;
        ctx.beginPath();
        ctx.moveTo(60, 162);
        ctx.lineTo(w - 60, 162);
        ctx.stroke();

        // 4. Score Hero Card with Ring
        ctx.fillStyle = gColor.bg;
        ctx.strokeStyle = gColor.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(60, 188, w - 120, 186, 22);
        ctx.fill();
        ctx.stroke();

        // Score ring
        const rCx = 152;
        const rCy = 281;
        const rRad = 56;
        ctx.strokeStyle = palette.ringTrack;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.arc(rCx, rCy, rRad, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = gColor.accent;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(
          rCx,
          rCy,
          rRad,
          -Math.PI / 2,
          -Math.PI / 2 + (Math.PI * 2 * assessment.score) / 100
        );
        ctx.stroke();

        ctx.fillStyle = gColor.accent;
        ctx.font = 'bold 40px "Space Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${assessment.score}`, rCx, rCy + 10);
        ctx.fillStyle = palette.textMuted;
        ctx.font = 'bold 13px "Space Mono", ui-monospace, monospace';
        ctx.fillText(`${assessment.grade} 级风险`, rCx, rCy + 32);
        ctx.textAlign = 'left';

        // Grade text
        ctx.fillStyle = palette.textPrimary;
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`${assessment.grade} 级 · ${assessment.gradeLabel}`, 240, 254);

        ctx.fillStyle = palette.textSecondary;
        ctx.font = '19px "Space Mono", ui-monospace, monospace';
        ctx.fillText(assessment.ipTierLabel, 240, 294);

        ctx.fillStyle = palette.textMuted;
        ctx.font = '15px "Space Mono", ui-monospace, monospace';
        ctx.fillText(`检测时间: ${scannedAt}`, 240, 330);

        // 5. Telemetry Rows
        const metrics = [
          {
            label: '海外代理出口',
            value: `${server.geo.country}${server.geo.city ? ` · ${server.geo.city}` : ''} (${maskIp(server.ip, hideIp)})`,
            ok: server.geo.regionPolicy !== 'blocked',
          },
          {
            label: 'ASN / 机构',
            value: `AS${server.network.asn ?? '-'} · ${server.network.asOrg || '未知'}`,
            ok: assessment.grade === 'S' || assessment.grade === 'A',
          },
          {
            label: '国内直连分流',
            value: domesticIp.isChinaDirect
              ? `已检出直连 (${maskIp(domesticIp.ip, hideIp)})`
              : '未检出国内直连',
            ok: !domesticIp.isChinaDirect,
          },
          {
            label: 'DNS 泄露检测',
            value:
              dnsLeak.status === 'leaked'
                ? `疑似泄露 (${dnsLeak.dnsGeo || 'CN'})`
                : dnsLeak.status === 'safe'
                  ? '正常无泄露'
                  : '未知',
            ok: dnsLeak.status !== 'leaked',
          },
          {
            label: 'WebRTC UDP',
            value:
              webrtc.status === 'leaked'
                ? `异常泄露 (${maskIp(webrtc.publicIps[0], hideIp)})`
                : webrtc.status === 'matched'
                  ? '与代理出口一致'
                  : webrtc.status === 'unknown'
                    ? '未知'
                    : '已屏蔽安全',
            ok: webrtc.status !== 'leaked',
          },
          {
            label: '时区 / 语言',
            value: `${browser.timezone} · ${browser.language}`,
            ok: !tzMismatch && !browser.hasChineseLanguage,
          },
        ];

        let y = 416;
        for (const m of metrics) {
          ctx.fillStyle = palette.rowBg;
          ctx.strokeStyle = palette.rowBorder;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(60, y, w - 120, 68, 14);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = palette.textMuted;
          ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(m.label, 84, y + 40);

          ctx.fillStyle = m.ok ? palette.okColor : palette.warnColor;
          ctx.font = 'bold 18px "Space Mono", ui-monospace, monospace';
          ctx.textAlign = 'right';
          const textVal = m.value.length > 36 ? `${m.value.slice(0, 35)}…` : m.value;
          ctx.fillText(textVal, w - 84, y + 40);
          ctx.textAlign = 'left';

          y += 82;
        }

        // 5.5 Diagnostic Summary & Actionable Advice Card
        ctx.fillStyle = gColor.bg;
        ctx.strokeStyle = gColor.accent;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.roundRect(60, summaryY, w - 120, summaryCardH, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = gColor.accent;
        ctx.font = 'bold 16px "Space Mono", ui-monospace, sans-serif';
        ctx.fillText('诊断摘要与处理建议', 84, summaryY + 34);

        ctx.fillStyle = palette.textPrimary;
        ctx.font = '17px -apple-system, BlinkMacSystemFont, sans-serif';
        summaryLines.forEach((line, idx) => {
          ctx.fillText(line, 84, summaryY + 66 + idx * lineHeight);
        });

        // 6. Bottom QR Code Footer
        const qrImg = new Image();
        await new Promise<void>((resolve, reject) => {
          qrImg.onload = () => resolve();
          qrImg.onerror = () => reject(new Error('QR load error'));
          qrImg.src = qrDataUrl;
        });

        ctx.fillStyle = palette.footerBg;
        ctx.strokeStyle = palette.footerBorder;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(60, footerY, w - 120, 194, 20);
        ctx.fill();
        ctx.stroke();

        // White QR box
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(88, footerY + 24, 146, 146, 14);
        ctx.fill();
        ctx.drawImage(qrImg, 95, footerY + 31, 132, 132);

        ctx.fillStyle = palette.textPrimary;
        ctx.font = 'bold 25px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('扫码立即测试你的 Claude 环境', 260, footerY + 72);

        ctx.fillStyle = '#D97757';
        ctx.font = 'bold 20px "Space Mono", ui-monospace, monospace';
        ctx.fillText(shareUrl, 260, footerY + 110);

        ctx.fillStyle = palette.textMuted;
        ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('出口纯净度 · 国内分流 · DNS/WebRTC 泄露 · 中文指纹', 260, footerY + 148);

        if (!cancelled) {
          setPosterUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        // ignore
      }
    };

    generatePoster();
    return () => {
      cancelled = true;
    };
  }, [open, theme, isLight, shareUrl, hideIp, maskIp, server, domesticIp, dnsLeak, webrtc, browser, assessment, scannedAt]);

  if (!open) return null;

  const handleDownload = () => {
    if (!posterUrl) return;
    const link = document.createElement('a');
    link.download = `CC-Env-${assessment.grade}-${assessment.score}.png`;
    link.href = posterUrl;
    link.click();
  };

  const handleCopyImage = async () => {
    if (!posterUrl) return;
    setCopyError(false);
    try {
      const res = await fetch(posterUrl);
      const blob = await res.blob();
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 2000);
      } else {
        setCopyError(true);
        setTimeout(() => setCopyError(false), 2500);
      }
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-page)] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <ClaudeFlowerLogo className="h-4 w-4 text-[var(--text-primary)]" />
            <span className="font-mono">CC Env</span>
            <span className="text-xs font-normal text-[var(--text-muted)]">· 分享海报</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-strong)] hover:text-[var(--text-primary)]"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Rendered Poster Image Preview */}
        <div className="max-h-[72vh] overflow-y-auto bg-[var(--bg-inner)] p-4">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt="CC Env 体检分享报告"
              className="mx-auto w-full rounded-xl border border-[var(--border-subtle)] shadow-lg"
            />
          ) : (
            <div className="flex h-96 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-mono text-xs text-[var(--text-muted)]">
              正在生成高清分享海报...
            </div>
          )}
          <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
            手机端可直接长按图片保存或转发，桌面端可点击下方保存 PNG
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-3.5">
          <button
            onClick={handleCopyImage}
            disabled={!posterUrl}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inner)] px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] transition hover:opacity-90 disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" />
            {imageCopied ? '已复制图片' : copyError ? '请长按或保存' : '复制图片'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!posterUrl}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-[var(--accent-fg)] transition hover:opacity-90 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            保存分享图
          </button>
        </div>
      </div>
    </div>
  );
}

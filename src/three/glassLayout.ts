import { BANNER_NAV_ITEMS } from '../data/portfolioData';

export interface BannerNavLayout {
  fontSize: number;
  slotWidth: number;
  centersX: number[];
}

export function getBannerNavLayout(navW: number, S: number): BannerNavLayout {
  const count = BANNER_NAV_ITEMS.length;
  const fontSize = Math.max(13, 18 * S);
  const slotWidth = Math.min(navW / (count + 0.5), Math.max(76, 136 * S));
  const centersX = BANNER_NAV_ITEMS.map((_, idx) => {
    const offset = idx - (count - 1) * 0.5;
    return navW * 0.5 + offset * slotWidth;
  });
  return { fontSize, slotWidth, centersX };
}

export interface PortraitFrameRect {
  visible: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
}

export function getPortraitFrameRect(
  panelW: number,
  panelH: number,
  S: number
): PortraitFrameRect {
  if (panelW < 620 || panelH < 320) {
    return { visible: false, x: 0, y: 0, w: 0, h: 0, radius: 0 };
  }
  const rightPad = Math.max(12, 26 * S);
  const w = Math.min(panelW * 0.36, panelH * 0.78);
  const h = Math.min(panelH * 0.86, w * 1.18);
  const x = panelW - rightPad - w;
  const y = (panelH - h) * 0.46;
  const radius = Math.max(10, 20 * S);
  return { visible: true, x, y, w, h, radius };
}

let measureCtx: CanvasRenderingContext2D | null = null;

export function wrapCanvasLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

export function getWrappedLineCount(
  text: string,
  fontSizePx: number,
  maxWidth: number
): number {
  if (typeof document === 'undefined') return 3;
  if (!measureCtx) {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  if (!measureCtx) return 3;
  measureCtx.font = `500 ${fontSizePx}px Inter, system-ui, sans-serif`;
  return wrapCanvasLines(measureCtx, text, maxWidth).length;
}
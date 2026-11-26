import * as THREE from 'three';
import { BANNER_NAV_ITEMS, PORTFOLIO_IDENTITY } from '../data/portfolioData';
import {
  getBannerNavLayout,
  getPortraitFrameRect,
  wrapCanvasLines,
} from './glassLayout';

export interface PrintedGlassTextures {
  navTexture: THREE.CanvasTexture;
  panelTexture: THREE.CanvasTexture;
  dispose: () => void;
}

export function createPrintedGlassTextures(
  navW: number,
  navH: number,
  panelW: number,
  panelH: number,
  S: number,
  dpr: number,
  portraitImage: HTMLImageElement | null = null
): PrintedGlassTextures {
  const texDpr = Math.max(dpr, 1.5);

  // ------------------------------------------------------------------
  // 1. Nav Slab Canvas Texture (Only: Home, About, Services, Portfolio, Contact)
  // ------------------------------------------------------------------
  const navCanvas = document.createElement('canvas');
  navCanvas.width = Math.max(2, Math.round(navW * texDpr));
  navCanvas.height = Math.max(2, Math.round(navH * texDpr));
  const nCtx = navCanvas.getContext('2d')!;
  nCtx.scale(texDpr, texDpr);
  nCtx.clearRect(0, 0, navW, navH);

  const midY = navH * 0.5;
  const navLayout = getBannerNavLayout(navW, S);

  nCtx.save();
  nCtx.font = `600 ${navLayout.fontSize}px Inter, system-ui, sans-serif`;
  nCtx.textBaseline = 'middle';
  nCtx.textAlign = 'center';
  nCtx.shadowColor = 'rgba(2, 8, 5, 0.85)';
  nCtx.shadowBlur = 8;

  BANNER_NAV_ITEMS.forEach((item, idx) => {
    const cx = navLayout.centersX[idx];
    const isHome = item.id === 'home';
    nCtx.fillStyle = isHome
      ? '#ffffff'
      : 'rgba(235, 248, 241, 0.9)';
    nCtx.fillText(item.label, cx, midY);

    if (isHome) {
      nCtx.fillStyle = '#36d67e';
      nCtx.beginPath();
      nCtx.arc(cx, midY + navLayout.fontSize * 0.88, Math.max(2, 2.4 * S), 0, Math.PI * 2);
      nCtx.fill();
    }
  });
  nCtx.restore();

  const navTexture = new THREE.CanvasTexture(navCanvas);
  navTexture.colorSpace = THREE.SRGBColorSpace;
  navTexture.minFilter = THREE.LinearFilter;
  navTexture.magFilter = THREE.LinearFilter;

  // ------------------------------------------------------------------
  // 2. Hero Panel Canvas Texture (Printed directly onto the 5 shards)
  // ------------------------------------------------------------------
  const panelCanvas = document.createElement('canvas');
  panelCanvas.width = Math.max(2, Math.round(panelW * texDpr));
  panelCanvas.height = Math.max(2, Math.round(panelH * texDpr));
  const pCtx = panelCanvas.getContext('2d')!;
  pCtx.scale(texDpr, texDpr);
  pCtx.clearRect(0, 0, panelW, panelH);

  const leftX = Math.max(20, 62 * S);
  const bottomPad = Math.max(18, 38 * S);

  // Right-Side Portrait Blended Into Smoked-Emerald Glass (Printed across shards C & E)
  const frame = getPortraitFrameRect(panelW, panelH, S);
  if (frame.visible) {
    if (portraitImage && portraitImage.naturalWidth > 0) {
      // Subtle ambient emerald glow behind the portrait inside the glass
      const cx = frame.x + frame.w * 0.54;
      const cy = frame.y + frame.h * 0.45;
      const haloR = Math.max(frame.w, frame.h) * 0.58;
      const halo = pCtx.createRadialGradient(cx, cy, haloR * 0.08, cx, cy, haloR);
      halo.addColorStop(0, 'rgba(54, 214, 126, 0.16)');
      halo.addColorStop(0.55, 'rgba(18, 68, 44, 0.10)');
      halo.addColorStop(1, 'rgba(4, 10, 7, 0)');
      pCtx.fillStyle = halo;
      pCtx.fillRect(frame.x - 40, frame.y - 40, frame.w + 80, frame.h + 80);

      // Offscreen portrait buffer for smoked-emerald grading + soft multi-edge feathering
      const offCanvas = document.createElement('canvas');
      offCanvas.width = Math.max(2, Math.round(frame.w * texDpr));
      offCanvas.height = Math.max(2, Math.round(frame.h * texDpr));
      const oCtx = offCanvas.getContext('2d')!;
      oCtx.scale(texDpr, texDpr);

      // Object-cover center-top crop so faces stay well framed
      const imgAspect = portraitImage.naturalWidth / portraitImage.naturalHeight;
      const boxAspect = frame.w / frame.h;
      let sx = 0;
      let sy = 0;
      let sw = portraitImage.naturalWidth;
      let sh = portraitImage.naturalHeight;
      if (imgAspect > boxAspect) {
        sw = sh * boxAspect;
        sx = (portraitImage.naturalWidth - sw) * 0.5;
      } else {
        sh = sw / boxAspect;
        sy = (portraitImage.naturalHeight - sh) * 0.28;
      }

      oCtx.save();
      oCtx.filter = 'contrast(1.1) brightness(0.9) saturate(0.68)';
      oCtx.drawImage(portraitImage, sx, sy, sw, sh, 0, 0, frame.w, frame.h);
      oCtx.restore();

      // Atmospheric dark-emerald color grade wash over photo pixels
      oCtx.save();
      oCtx.globalCompositeOperation = 'source-atop';
      oCtx.fillStyle = 'rgba(18, 64, 42, 0.28)';
      oCtx.fillRect(0, 0, frame.w, frame.h);

      const depthShade = oCtx.createLinearGradient(0, 0, 0, frame.h);
      depthShade.addColorStop(0, 'rgba(5, 16, 11, 0.14)');
      depthShade.addColorStop(0.55, 'rgba(5, 16, 11, 0.08)');
      depthShade.addColorStop(1, 'rgba(3, 9, 6, 0.58)');
      oCtx.fillStyle = depthShade;
      oCtx.fillRect(0, 0, frame.w, frame.h);
      oCtx.restore();

      // Radial elliptical fade so all outer edges melt smoothly into the glass
      oCtx.save();
      oCtx.globalCompositeOperation = 'destination-in';
      const rx = frame.w * 0.52;
      const ry = frame.h * 0.45;
      oCtx.translate(rx, ry);
      oCtx.scale(1, (frame.h * 0.54) / Math.max(1, frame.w * 0.52));
      const radMask = oCtx.createRadialGradient(0, 0, frame.w * 0.16, 0, 0, frame.w * 0.52);
      radMask.addColorStop(0, 'rgba(0, 0, 0, 1)');
      radMask.addColorStop(0.45, 'rgba(0, 0, 0, 0.92)');
      radMask.addColorStop(0.74, 'rgba(0, 0, 0, 0.42)');
      radMask.addColorStop(0.92, 'rgba(0, 0, 0, 0.08)');
      radMask.addColorStop(1, 'rgba(0, 0, 0, 0)');
      oCtx.fillStyle = radMask;
      oCtx.fillRect(-frame.w, -frame.h, frame.w * 2, frame.h * 2);
      oCtx.restore();

      // Extra left-edge soft fade so it never clips hard near the hero typography
      oCtx.save();
      oCtx.globalCompositeOperation = 'destination-in';
      const leftMask = oCtx.createLinearGradient(0, 0, frame.w, 0);
      leftMask.addColorStop(0, 'rgba(0, 0, 0, 0)');
      leftMask.addColorStop(0.24, 'rgba(0, 0, 0, 1)');
      leftMask.addColorStop(0.86, 'rgba(0, 0, 0, 1)');
      leftMask.addColorStop(1, 'rgba(0, 0, 0, 0)');
      oCtx.fillStyle = leftMask;
      oCtx.fillRect(0, 0, frame.w, frame.h);
      oCtx.restore();

      // Composite feathered portrait onto panel texture with slight translucency
      // so the underlying dark-green glass reflections & cursor glow pass through
      pCtx.save();
      pCtx.globalAlpha = 0.86;
      pCtx.drawImage(offCanvas, frame.x, frame.y, frame.w, frame.h);
      pCtx.restore();
    } else {
      const phCx = frame.x + frame.w * 0.5;
      const phCy = frame.y + frame.h * 0.5;
      const phGrad = pCtx.createRadialGradient(
        phCx,
        phCy,
        frame.w * 0.05,
        phCx,
        phCy,
        frame.w * 0.52
      );
      phGrad.addColorStop(0, 'rgba(54, 214, 126, 0.12)');
      phGrad.addColorStop(0.6, 'rgba(18, 48, 34, 0.16)');
      phGrad.addColorStop(1, 'rgba(6, 16, 11, 0)');
      pCtx.fillStyle = phGrad;
      pCtx.fillRect(frame.x, frame.y, frame.w, frame.h);

      pCtx.save();
      roundRect(
        pCtx,
        frame.x + frame.w * 0.12,
        frame.y + frame.h * 0.12,
        frame.w * 0.76,
        frame.h * 0.76,
        frame.radius
      );
      pCtx.setLineDash([4 * S, 5 * S]);
      pCtx.strokeStyle = 'rgba(54, 214, 126, 0.22)';
      pCtx.lineWidth = Math.max(1, 1.2 * S);
      pCtx.stroke();
      pCtx.restore();

      pCtx.font = `600 ${Math.max(12, 14 * S)}px Inter, system-ui, sans-serif`;
      pCtx.fillStyle = 'rgba(232, 248, 239, 0.88)';
      pCtx.textAlign = 'center';
      pCtx.textBaseline = 'middle';
      pCtx.fillText('+ ADD YOUR PHOTO', phCx, phCy);
    }
  }

  pCtx.save();
  pCtx.shadowColor = 'rgba(2, 8, 5, 0.72)';
  pCtx.shadowBlur = 10;

  // Eyebrow at 13.5% of height
  const eyebrowY = panelH * 0.135;
  const eyebrowSize = 16;
  pCtx.font = `600 ${eyebrowSize}px Inter, system-ui, sans-serif`;
  pCtx.fillStyle = 'rgba(104, 232, 160, 0.95)';
  pCtx.textBaseline = 'top';
  pCtx.textAlign = 'left';
  drawTrackedText(pCtx, PORTFOLIO_IDENTITY.eyebrow, leftX, eyebrowY, eyebrowSize * 0.18);

  // Oversized Headline "Sayan / Deep Roy."
  const headSize = Math.min(panelW * 0.078, panelH * 0.2);
  const headLeading = headSize * 0.97;
  const headY = eyebrowY + eyebrowSize + Math.max(14, 26 * S);

  const headGrad = pCtx.createLinearGradient(0, headY, 0, headY + headLeading * 2);
  headGrad.addColorStop(0, '#ffffff');
  headGrad.addColorStop(1, '#d2e6db');

  pCtx.font = `600 ${headSize}px Inter, system-ui, sans-serif`;
  pCtx.fillStyle = headGrad;
  pCtx.textBaseline = 'top';
  drawTrackedText(
    pCtx,
    PORTFOLIO_IDENTITY.headlineLine1,
    leftX,
    headY,
    -headSize * 0.045
  );
  drawTrackedText(
    pCtx,
    PORTFOLIO_IDENTITY.headlineLine2,
    leftX,
    headY + headLeading,
    -headSize * 0.045
  );

  // Wrapped Subtitle (15.5px)
  const subSize = 15.5;
  const subY = headY + headLeading * 2 + Math.max(14, 24 * S);
  const subMaxW = frame.visible
    ? Math.max(220, frame.x - leftX - Math.max(20, 28 * S))
    : Math.max(220, panelW - leftX * 2);
  const subText = [PORTFOLIO_IDENTITY.subLine1, PORTFOLIO_IDENTITY.subLine2]
    .filter(Boolean)
    .join(' ');
  const subFont = `500 ${subSize}px Inter, system-ui, sans-serif`;
  pCtx.font = subFont;
  pCtx.fillStyle = 'rgba(242, 250, 246, 0.9)';
  const subLines = wrapCanvasLines(pCtx, subText, subMaxW);
  const subLineHeight = subSize * 1.45;
  subLines.forEach((line, idx) => {
    pCtx.fillText(line, leftX, subY + idx * subLineHeight);
  });
  pCtx.restore();

  // Pill CTA "Open studio" + Link "Read paper →"
  const ctaY = subY + subLines.length * subLineHeight + Math.max(16, 26 * S);
  const pillW = Math.max(146, 174 * S);
  const pillH = Math.max(36, 44 * S);
  const pillR = Math.max(4, 6 * S);

  pCtx.fillStyle = '#ffffff';
  roundRect(pCtx, leftX, ctaY, pillW, pillH, pillR);
  pCtx.fill();

  pCtx.font = `600 ${Math.max(12.5, 15.5 * S)}px Inter, system-ui, sans-serif`;
  pCtx.fillStyle = '#030a06';
  pCtx.textAlign = 'center';
  pCtx.textBaseline = 'middle';
  pCtx.fillText(PORTFOLIO_IDENTITY.primaryCta, leftX + pillW * 0.5, ctaY + pillH * 0.5 + 0.5);

  pCtx.save();
  pCtx.shadowColor = 'rgba(2, 8, 5, 0.72)';
  pCtx.shadowBlur = 8;
  pCtx.fillStyle = '#f2faf5';
  pCtx.textAlign = 'left';
  pCtx.fillText(
    PORTFOLIO_IDENTITY.secondaryCta,
    leftX + pillW + Math.max(18, 28 * S),
    ctaY + pillH * 0.5 + 0.5
  );
  pCtx.restore();

  // Footer micro-labels
  const footSize = Math.max(11, 13 * S);
  pCtx.save();
  pCtx.shadowColor = 'rgba(2, 8, 5, 0.72)';
  pCtx.shadowBlur = 6;
  pCtx.font = `500 ${footSize}px Inter, system-ui, sans-serif`;
  pCtx.fillStyle = 'rgba(232, 245, 238, 0.72)';
  pCtx.textBaseline = 'bottom';
  pCtx.textAlign = 'left';
  pCtx.fillText(PORTFOLIO_IDENTITY.footerLeft, leftX, panelH - bottomPad);
  pCtx.restore();

  const panelTexture = new THREE.CanvasTexture(panelCanvas);
  panelTexture.colorSpace = THREE.SRGBColorSpace;
  panelTexture.minFilter = THREE.LinearFilter;
  panelTexture.magFilter = THREE.LinearFilter;

  return {
    navTexture,
    panelTexture,
    dispose: () => {
      navTexture.dispose();
      panelTexture.dispose();
    },
  };
}

function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  trackingPx: number
): void {
  let cursorX = x;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    ctx.fillText(ch, cursorX, y);
    cursorX += ctx.measureText(ch).width + trackingPx;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}


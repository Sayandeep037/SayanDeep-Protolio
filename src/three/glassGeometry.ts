import * as THREE from 'three';

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Insets a convex/star polygon (counter-clockwise or clockwise) inward by `dist`.
 * Automatically handles orientation so pieces separate cleanly.
 */
export function insetPolygon(points: Vec2[], dist: number): Vec2[] {
  const n = points.length;
  if (n < 3) return points;

  // Determine signed area in XY (standard Y-up or Y-down)
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    area += a.x * b.y - b.x * a.y;
  }
  const sign = area >= 0 ? 1 : -1;

  // Build offset lines for each edge
  const lines: { p: Vec2; dir: Vec2 }[] = [];
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    // Inward normal
    const nx = -uy * sign;
    const ny = ux * sign;
    lines.push({
      p: { x: a.x + nx * dist, y: a.y + ny * dist },
      dir: { x: ux, y: uy },
    });
  }

  const out: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const l1 = lines[(i - 1 + n) % n];
    const l2 = lines[i];
    const cross = l1.dir.x * l2.dir.y - l1.dir.y * l2.dir.x;
    if (Math.abs(cross) < 1e-6) {
      out.push({ x: l2.p.x, y: l2.p.y });
    } else {
      const dx = l2.p.x - l1.p.x;
      const dy = l2.p.y - l1.p.y;
      const t = (dx * l2.dir.y - dy * l2.dir.x) / cross;
      out.push({
        x: l1.p.x + l1.dir.x * t,
        y: l1.p.y + l1.dir.y * t,
      });
    }
  }
  return out;
}

/**
 * Builds a THREE.Shape with smooth quadratic corners of radius `cornerRadius`.
 */
export function buildRoundedPolygonShape(
  points: Vec2[],
  cornerRadius: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const n = points.length;
  if (n < 3) return shape;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;

    const len1 = Math.hypot(v1x, v1y) || 1;
    const len2 = Math.hypot(v2x, v2y) || 1;

    const r = Math.min(cornerRadius, len1 * 0.42, len2 * 0.42);
    const p1x = curr.x + (v1x / len1) * r;
    const p1y = curr.y + (v1y / len1) * r;
    const p2x = curr.x + (v2x / len2) * r;
    const p2y = curr.y + (v2y / len2) * r;

    if (i === 0) {
      shape.moveTo(p1x, p1y);
    } else {
      shape.lineTo(p1x, p1y);
    }
    shape.quadraticCurveTo(curr.x, curr.y, p2x, p2y);
  }
  shape.closePath();
  return shape;
}

export function createShardExtrudeGeometry(
  localPoints: Vec2[],
  cornerRadius: number,
  depth: number,
  bevel: number
): THREE.ExtrudeGeometry {
  const shape = buildRoundedPolygonShape(localPoints, cornerRadius);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 8,
  });
  return geo;
}

/**
 * Creates a flat ShapeGeometry aligned to the shard's top face with UVs mapped
 * directly into the full panel texture space [0..1, 0..1].
 */
export function createPrintedFaceGeometry(
  localPoints: Vec2[],
  cornerRadius: number,
  centerX: number,
  centerY: number,
  panelW: number,
  panelH: number
): THREE.ShapeGeometry {
  const shape = buildRoundedPolygonShape(localPoints, cornerRadius);
  const geo = new THREE.ShapeGeometry(shape, 8);
  const posAttr = geo.attributes.position;
  const uvs = new Float32Array(posAttr.count * 2);

  for (let i = 0; i < posAttr.count; i++) {
    const px = posAttr.getX(i) + centerX;
    const py = posAttr.getY(i) + centerY;
    uvs[i * 2] = (px + panelW * 0.5) / panelW;
    uvs[i * 2 + 1] = (py + panelH * 0.5) / panelH;
  }

  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return geo;
}

export interface CutCellResult {
  id: 'A' | 'B' | 'C' | 'D' | 'E';
  /** Points in panel-local coordinates (centered at 0,0, Y-up) */
  points: Vec2[];
}

/**
 * Evaluates the 5 cut cells with slow sine drift + pointer repulsion.
 * Coordinates are returned in panel-local space (X right, Y up, centered at 0,0).
 */
export function computeCutCells(
  panelW: number,
  panelH: number,
  time: number,
  pointerNormX: number,
  pointerNormY: number,
  pointerActive: boolean,
  isPortrait: boolean,
  gapPx: number
): CutCellResult[] {
  // Base normalized points in panel space (x right 0..1, y down 0..1)
  const pts: Record<string, Vec2> = {
    TL: { x: 0, y: 0 },
    TR: { x: 1, y: 0 },
    BL: { x: 0, y: 1 },
    BR: { x: 1, y: 1 },
    tAB: {
      x: 0.22 + Math.sin(time * ((Math.PI * 2) / 13.5) + 0.4) * 0.03,
      y: 0,
    },
    tBC: {
      x: 0.515 + Math.sin(time * ((Math.PI * 2) / 17.2) + 1.9) * 0.03,
      y: 0,
    },
    tCE: {
      x: 0.84 + Math.sin(time * ((Math.PI * 2) / 11.8) + 3.1) * 0.03,
      y: 0,
    },
    bAD: {
      x: 0.34 + Math.sin(time * ((Math.PI * 2) / 15.1) + 2.4) * 0.03,
      y: 1,
    },
    bDE: {
      x: 0.865 + Math.sin(time * ((Math.PI * 2) / 19.3) + 0.8) * 0.03,
      y: 1,
    },
    J0: {
      x: 0.385 + Math.sin(time * ((Math.PI * 2) / 14.0) + 1.1) * 0.03,
      y: 0.72 + Math.cos(time * ((Math.PI * 2) / 16.5) + 0.5) * 0.05,
    },
    J1: {
      x: 0.48 + Math.sin(time * ((Math.PI * 2) / 18.4) + 2.7) * 0.03,
      y: 0.62 + Math.cos(time * ((Math.PI * 2) / 12.6) + 1.8) * 0.05,
    },
    J2: {
      x: 0.716 + Math.sin(time * ((Math.PI * 2) / 12.2) + 4.2) * 0.03,
      y: 0.49 + Math.cos(time * ((Math.PI * 2) / 15.8) + 3.3) * 0.05,
    },
  };

  // Portrait orientation transposes coordinates so hero cell A sits on top
  if (isPortrait) {
    Object.keys(pts).forEach((key) => {
      if (key === 'TL' || key === 'TR' || key === 'BL' || key === 'BR') return;
      const p = pts[key];
      pts[key] = { x: p.y, y: p.x };
    });
  }

  // Cursor push: points within 0.6 of pointer are pushed away by up to 0.05
  if (pointerActive) {
    const movableKeys = ['tAB', 'tBC', 'tCE', 'bAD', 'bDE', 'J0', 'J1', 'J2'];
    movableKeys.forEach((key) => {
      const p = pts[key];
      const dx = p.x - pointerNormX;
      const dy = p.y - pointerNormY;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.6 && dist > 1e-4) {
        const push = Math.pow(1 - dist / 0.6, 1.4) * 0.05;
        if (key.startsWith('J')) {
          p.x = THREE.MathUtils.clamp(p.x + (dx / dist) * push, 0.08, 0.92);
          p.y = THREE.MathUtils.clamp(p.y + (dy / dist) * push, 0.08, 0.92);
        } else if (isPortrait) {
          p.y = THREE.MathUtils.clamp(p.y + (dy / dist) * push, 0.08, 0.92);
        } else {
          p.x = THREE.MathUtils.clamp(p.x + (dx / dist) * push, 0.08, 0.92);
        }
      }
    });
  }

  const rawDefs: { id: CutCellResult['id']; keys: string[] }[] = isPortrait
    ? [
        { id: 'A', keys: ['TL', 'TR', 'bAD', 'J0', 'tAB'] },
        { id: 'B', keys: ['tAB', 'J0', 'J1', 'tBC'] },
        { id: 'C', keys: ['tBC', 'J1', 'J2', 'tCE'] },
        { id: 'D', keys: ['J0', 'bAD', 'bDE', 'J2', 'J1'] },
        { id: 'E', keys: ['tCE', 'J2', 'bDE', 'BR', 'BL'] },
      ]
    : [
        { id: 'A', keys: ['TL', 'tAB', 'J0', 'bAD', 'BL'] },
        { id: 'B', keys: ['tAB', 'tBC', 'J1', 'J0'] },
        { id: 'C', keys: ['tBC', 'tCE', 'J2', 'J1'] },
        { id: 'D', keys: ['J0', 'J1', 'J2', 'bDE', 'bAD'] },
        { id: 'E', keys: ['tCE', 'TR', 'BR', 'bDE', 'J2'] },
      ];

  const halfGap = gapPx * 0.5;

  return rawDefs.map((def) => {
    const worldPoly: Vec2[] = def.keys.map((k) => ({
      x: (pts[k].x - 0.5) * panelW,
      y: (0.5 - pts[k].y) * panelH,
    }));
    const inset = insetPolygon(worldPoly, halfGap);
    return {
      id: def.id,
      points: inset,
    };
  });
}

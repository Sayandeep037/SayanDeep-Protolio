export interface Point2D {
  x: number;
  y: number;
}

/**
 * Computes a CSS matrix3d(...) string mapping a DOM rectangle
 * (0,0)-(w,h) to four arbitrary 2D screen points [TL, TR, BR, BL].
 */
export function computeHomographyMatrix3d(
  w: number,
  h: number,
  dst: [Point2D, Point2D, Point2D, Point2D]
): string {
  if (w <= 0 || h <= 0) {
    return 'matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)';
  }

  const src: [Point2D, Point2D, Point2D, Point2D] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];

  // Solve 8x8 linear system A * x = b for projective transform coefficients
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    b.push(dx);

    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    b.push(dy);
  }

  const hVec = solveLinear8(A, b);
  if (!hVec) {
    return 'matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)';
  }

  const [a, c, tx, d, e, ty, g, f] = hVec;
  // Column-major 4x4 matrix for CSS matrix3d
  return `matrix3d(${a.toFixed(6)},${d.toFixed(6)},0,${g.toFixed(8)},${c.toFixed(6)},${e.toFixed(6)},0,${f.toFixed(8)},0,0,1,0,${tx.toFixed(4)},${ty.toFixed(4)},0,1)`;
}

function solveLinear8(A: number[][], b: number[]): number[] | null {
  const n = 8;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      const v = Math.abs(M[row][col]);
      if (v > maxVal) {
        maxVal = v;
        maxRow = row;
      }
    }
    if (maxVal < 1e-10) return null;

    if (maxRow !== col) {
      const tmp = M[col];
      M[col] = M[maxRow];
      M[maxRow] = tmp;
    }

    const pivot = M[col][col];
    for (let j = col; j <= n; j++) {
      M[col][j] /= pivot;
    }

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col];
      if (Math.abs(factor) < 1e-12) continue;
      for (let j = col; j <= n; j++) {
        M[row][j] -= factor * M[col][j];
      }
    }
  }

  return M.map((row) => row[n]);
}

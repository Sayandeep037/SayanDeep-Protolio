import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { computeHomographyMatrix3d, Point2D } from './homography';
import {
  computeCutCells,
  createPrintedFaceGeometry,
  createShardExtrudeGeometry,
  Vec2,
} from './glassGeometry';
import { createPrintedGlassTextures, PrintedGlassTextures } from './glassTextures';

export type HeroPhase = 'entering' | 'idle' | 'shattering' | 'shattered' | 'reassembling';

export interface GlassHeroCallbacks {
  onPhaseChange: (phase: HeroPhase) => void;
  onHomographyUpdate: (
    navMatrix: string,
    panelMatrix: string,
    navW: number,
    navH: number,
    panelW: number,
    panelH: number
  ) => void;
  onBackSliverHoverChange: (hovered: boolean) => void;
  onBackSliverClick: () => void;
  onContextLostChange: (lost: boolean) => void;
}

interface ShardPiece {
  id: 'nav' | 'A' | 'B' | 'C' | 'D' | 'E';
  group: THREE.Group;
  glassMesh: THREE.Mesh;
  printMesh: THREE.Mesh;
  material: THREE.MeshPhysicalMaterial;
  printMaterial: THREE.MeshBasicMaterial;
  baseCenter: THREE.Vector3;
  // Spring hover state
  liftPos: number;
  liftVel: number;
  tipX: number;
  tipXVel: number;
  tipY: number;
  tipYVel: number;
  hoverBlend: number;
  // Shatter/fly-in trajectory
  shatterDelay: number;
  shatterVel: THREE.Vector3;
  tumbleAxis: THREE.Vector3;
  tumbleAngle: number;
  currentLocalPoints: Vec2[];
}

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// Pre-allocated math helpers for zero-GC render loop
const _vec3 = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _planeHit = new THREE.Vector3();
const _localHit = new THREE.Vector3();
const _cornersWorld = [
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
];

export class GlassHeroSceneController {
  private container: HTMLElement;
  private callbacks: GlassHeroCallbacks;
  private isSoftwareGl: boolean;

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private envRT: THREE.WebGLRenderTarget;
  private textures!: PrintedGlassTextures;
  private portraitImage: HTMLImageElement | null = null;

  private slabRoot = new THREE.Group();
  private pieces: ShardPiece[] = [];
  private backSliverGroup = new THREE.Group();
  private backSliverMesh!: THREE.Mesh;
  private backSliverMat!: THREE.MeshPhysicalMaterial;

  // Shared cursor glow uniform refs
  private glowUniforms = {
    uCursorWorld: { value: new THREE.Vector3(0, 0, 0) },
    uGlowStrength: { value: 0 },
    uGlowRadius: { value: 300 },
  };

  // Layout dimensions
  private viewW = 1440;
  private viewH = 960;
  private S = 1;
  private blockW = 1280;
  private blockH = 800;
  private navW = 1280;
  private navH = 86;
  private panelW = 1280;
  private panelH = 700;
  private navCenterY = 0;
  private panelCenterY = 0;
  private gapPx = 14;
  private depthPx = 13;
  private bevelPx = 2.6;
  private cornerR = 20;

  // Pointer & tilt state
  private pointerX = 0; // -1..1
  private pointerY = 0; // -1..1
  private pointerInside = false;
  private pointerMoved = false;
  private hoveredPieceId: ShardPiece['id'] | null = null;
  private backSliverHovered = false;
  private backSliverTipX = 0;
  private backSliverTipY = 0;
  private backSliverScale = 0;

  // Animation state
  private phase: HeroPhase = 'entering';
  private phaseElapsed = 0;
  private rebuildAccumulator = 0;
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;

  constructor(container: HTMLElement, callbacks: GlassHeroCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    this.viewW = container.clientWidth || window.innerWidth;
    this.viewH = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
    );
    this.renderer.setSize(this.viewW, this.viewH);
    this.renderer.setClearColor(0x030806, 0);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // Camera positioned so 1 world unit = 1 CSS px at z = 0
    this.camera = new THREE.PerspectiveCamera(30, this.viewW / this.viewH, 10, 12000);
    this.updateCameraDistance();

    // Environment & Lighting
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    (this.scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = 0.42;
    pmrem.dispose();

    const keyLight = new THREE.DirectionalLight(0xd8f5e8, 2.2);
    keyLight.position.set(-900, 1100, 1600);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x36d67e, 0.9);
    rimLight.position.set(1100, -700, 800);
    this.scene.add(rimLight);

    this.scene.add(this.slabRoot);
    this.scene.add(this.backSliverGroup);

    this.computeLayoutMetrics();
    this.textures = createPrintedGlassTextures(
      this.navW,
      this.navH,
      this.panelW,
      this.panelH,
      this.S,
      this.renderer.getPixelRatio(),
      this.portraitImage
    );

    this.buildSlabPieces();
    this.buildBackSliver();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.callbacks.onPhaseChange('entering');
    this.clock.start();
    this.tick();
  }

  private updateCameraDistance(): void {
    const halfFovRad = THREE.MathUtils.degToRad(15);
    const camZ = (this.viewH * 0.5) / Math.tan(halfFovRad);
    this.camera.aspect = this.viewW / Math.max(1, this.viewH);
    this.camera.position.set(0, 0, camZ);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld(true);
  }

  private computeLayoutMetrics(): void {
    const isPhone = this.viewW <= 640;
    const marginX = isPhone ? 16 : this.viewW * 0.055;
    const marginY = isPhone ? 16 : this.viewH * 0.085;

    this.blockW = Math.max(280, this.viewW - marginX * 2);
    this.blockH = Math.max(360, this.viewH - marginY * 2);
    this.S = this.blockW / 1730;

    this.gapPx = Math.max(8, 14 * this.S);
    this.navW = this.blockW;
    this.navH = this.blockH * 0.108;
    this.panelW = this.blockW;
    this.panelH = this.blockH - this.navH - this.gapPx;

    this.navCenterY = this.blockH * 0.5 - this.navH * 0.5;
    this.panelCenterY = -this.blockH * 0.5 + this.panelH * 0.5;

    this.depthPx = Math.max(6, 13 * this.S);
    this.bevelPx = Math.max(1.4, 2.6 * this.S);
    this.cornerR = Math.max(8, 20 * this.S);
    this.glowUniforms.uGlowRadius.value = Math.max(120, 300 * this.S);
  }

  private createGlassMaterial(withCursorGlow: boolean, baseIridescence: number): THREE.MeshPhysicalMaterial {
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x101714,
      roughness: 0.36,
      metalness: 0.08,
      clearcoat: 0.7,
      clearcoatRoughness: 0.12,
      specularIntensity: 0.7,
      iridescence: baseIridescence,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [250, 650],
      envMapIntensity: 1.0,
    });

    if (withCursorGlow) {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uCursorWorld = this.glowUniforms.uCursorWorld;
        shader.uniforms.uGlowStrength = this.glowUniforms.uGlowStrength;
        shader.uniforms.uGlowRadius = this.glowUniforms.uGlowRadius;

        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
             varying vec3 vFacetWorldPos;`
          )
          .replace(
            '#include <worldpos_vertex>',
            `#include <worldpos_vertex>
             vFacetWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
          );

        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
             uniform vec3 uCursorWorld;
             uniform float uGlowStrength;
             uniform float uGlowRadius;
             varying vec3 vFacetWorldPos;`
          )
          .replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
             float facetDist = distance(vFacetWorldPos.xy, uCursorWorld.xy);
             float glowFactor = exp(-1.6 * pow(facetDist / max(uGlowRadius, 1.0), 2.0));
             totalEmissiveRadiance += vec3(0.18, 0.75, 0.48) * 0.18 * glowFactor * uGlowStrength;`
          );
      };
    }

    return mat;
  }

  private buildSlabPieces(): void {
    // Clear previous pieces
    this.pieces.forEach((p) => {
      p.glassMesh.geometry.dispose();
      p.printMesh.geometry.dispose();
      p.material.dispose();
      p.printMaterial.dispose();
      this.slabRoot.remove(p.group);
    });
    this.pieces = [];

    const zTopFace = this.depthPx + this.bevelPx + 0.35;

    // 1. Nav Slab Piece
    {
      const navPoly: Vec2[] = [
        { x: -this.navW * 0.5, y: this.navH * 0.5 },
        { x: -this.navW * 0.5, y: -this.navH * 0.5 },
        { x: this.navW * 0.5, y: -this.navH * 0.5 },
        { x: this.navW * 0.5, y: this.navH * 0.5 },
      ];
      const group = new THREE.Group();
      const baseCenter = new THREE.Vector3(0, this.navCenterY, 0);
      group.position.copy(baseCenter);

      const glassMat = this.createGlassMaterial(true, 0.55);
      const glassGeo = createShardExtrudeGeometry(
        navPoly,
        this.cornerR,
        this.depthPx,
        this.bevelPx
      );
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.userData.pieceId = 'nav';
      group.add(glassMesh);

      const printMat = new THREE.MeshBasicMaterial({
        map: this.textures.navTexture,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const printGeo = createPrintedFaceGeometry(
        navPoly,
        this.cornerR,
        0,
        0,
        this.navW,
        this.navH
      );
      const printMesh = new THREE.Mesh(printGeo, printMat);
      printMesh.position.z = zTopFace;
      group.add(printMesh);

      this.slabRoot.add(group);
      this.pieces.push({
        id: 'nav',
        group,
        glassMesh,
        printMesh,
        material: glassMat,
        printMaterial: printMat,
        baseCenter,
        liftPos: 0,
        liftVel: 0,
        tipX: 0,
        tipXVel: 0,
        tipY: 0,
        tipYVel: 0,
        hoverBlend: 0,
        shatterDelay: 0,
        shatterVel: new THREE.Vector3(
          (Math.random() - 0.5) * 260 * this.S,
          320 * this.S,
          (480 + Math.random() * 240) * this.S
        ),
        tumbleAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        tumbleAngle: 2.0 + Math.random() * 1.4,
        currentLocalPoints: navPoly,
      });
    }

    // 2. Five Cut Cells (A, B, C, D, E)
    const isPortrait = this.viewH > this.viewW;
    const cells = computeCutCells(
      this.panelW,
      this.panelH,
      0,
      0.5,
      0.5,
      false,
      isPortrait,
      this.gapPx
    );

    cells.forEach((cell, idx) => {
      const centroid = this.computeCentroid(cell.points);
      const localPts = cell.points.map((p) => ({
        x: p.x - centroid.x,
        y: p.y - centroid.y,
      }));

      const group = new THREE.Group();
      const baseCenter = new THREE.Vector3(
        centroid.x,
        this.panelCenterY + centroid.y,
        0
      );
      group.position.copy(baseCenter);

      const glassMat = this.createGlassMaterial(true, 0.55);
      const glassGeo = createShardExtrudeGeometry(
        localPts,
        this.cornerR,
        this.depthPx,
        this.bevelPx
      );
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.userData.pieceId = cell.id;
      group.add(glassMesh);

      const printMat = new THREE.MeshBasicMaterial({
        map: this.textures.panelTexture,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const printGeo = createPrintedFaceGeometry(
        localPts,
        this.cornerR,
        centroid.x,
        centroid.y,
        this.panelW,
        this.panelH
      );
      const printMesh = new THREE.Mesh(printGeo, printMat);
      printMesh.position.z = zTopFace;
      group.add(printMesh);

      this.slabRoot.add(group);

      const outDirX = centroid.x / Math.max(1, this.panelW * 0.5);
      const outDirY = centroid.y / Math.max(1, this.panelH * 0.5);

      this.pieces.push({
        id: cell.id,
        group,
        glassMesh,
        printMesh,
        material: glassMat,
        printMaterial: printMat,
        baseCenter,
        liftPos: 0,
        liftVel: 0,
        tipX: 0,
        tipXVel: 0,
        tipY: 0,
        tipYVel: 0,
        hoverBlend: 0,
        shatterDelay: (idx + 1) * 0.03,
        shatterVel: new THREE.Vector3(
          (outDirX * 520 + (Math.random() - 0.5) * 180) * this.S,
          (outDirY * 320 - 160) * this.S,
          (420 + Math.random() * 380) * this.S
        ),
        tumbleAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        tumbleAngle: 2.0 + Math.random() * 1.6,
        currentLocalPoints: localPts,
      });
    });
  }

  private buildBackSliver(): void {
    if (this.backSliverMesh) {
      this.backSliverMesh.geometry.dispose();
      this.backSliverMat.dispose();
      this.backSliverGroup.remove(this.backSliverMesh);
    }

    const k = this.viewW / 1918;
    // Viewport fractions (.147,.243) (.252,.169) (.287,.277) (.151,.258)
    const rawPts: Vec2[] = [
      { x: (0.147 - 0.5) * this.viewW, y: (0.5 - 0.243) * this.viewH },
      { x: (0.252 - 0.5) * this.viewW, y: (0.5 - 0.169) * this.viewH },
      { x: (0.287 - 0.5) * this.viewW, y: (0.5 - 0.277) * this.viewH },
      { x: (0.151 - 0.5) * this.viewW, y: (0.5 - 0.258) * this.viewH },
    ];
    const center = this.computeCentroid(rawPts);
    const localPts = rawPts.map((p) => ({
      x: p.x - center.x,
      y: p.y - center.y,
    }));

    this.backSliverGroup.position.set(center.x, center.y, 40);
    this.backSliverMat = this.createGlassMaterial(false, 0.35);
    this.backSliverMat.envMapIntensity = 1.45;

    const geo = createShardExtrudeGeometry(
      localPts,
      Math.max(4, 14 * k),
      Math.max(5, 11 * k),
      Math.max(1.2, 2.2 * k)
    );
    this.backSliverMesh = new THREE.Mesh(geo, this.backSliverMat);
    this.backSliverMesh.userData.isBackSliver = true;
    this.backSliverGroup.add(this.backSliverMesh);
    this.backSliverGroup.scale.setScalar(0.0001);
    this.backSliverGroup.visible = false;
  }

  private computeCentroid(pts: Vec2[]): Vec2 {
    let sx = 0;
    let sy = 0;
    for (let i = 0; i < pts.length; i++) {
      sx += pts[i].x;
      sy += pts[i].y;
    }
    const n = Math.max(1, pts.length);
    return { x: sx / n, y: sy / n };
  }

  private rebuildLiveCutGeometry(time: number): void {
    const isPortrait = this.viewH > this.viewW;
    // Map pointer NDC (-1..1) into panel normalized coordinates (0..1)
    const worldX = this.pointerX * (this.viewW * 0.5);
    const worldY = this.pointerY * (this.viewH * 0.5);
    const pNormX = THREE.MathUtils.clamp(
      (worldX + this.panelW * 0.5) / this.panelW,
      0,
      1
    );
    const pNormY = THREE.MathUtils.clamp(
      0.5 - (worldY - this.panelCenterY) / this.panelH,
      0,
      1
    );

    const cells = computeCutCells(
      this.panelW,
      this.panelH,
      time,
      pNormX,
      pNormY,
      this.pointerInside && this.phase === 'idle',
      isPortrait,
      this.gapPx
    );

    const zTopFace = this.depthPx + this.bevelPx + 0.35;

    cells.forEach((cell) => {
      const piece = this.pieces.find((p) => p.id === cell.id);
      if (!piece) return;

      const centroid = this.computeCentroid(cell.points);
      const localPts = cell.points.map((p) => ({
        x: p.x - centroid.x,
        y: p.y - centroid.y,
      }));

      piece.baseCenter.set(centroid.x, this.panelCenterY + centroid.y, 0);
      piece.currentLocalPoints = localPts;

      const newGlassGeo = createShardExtrudeGeometry(
        localPts,
        this.cornerR,
        this.depthPx,
        this.bevelPx
      );
      const newPrintGeo = createPrintedFaceGeometry(
        localPts,
        this.cornerR,
        centroid.x,
        centroid.y,
        this.panelW,
        this.panelH
      );

      piece.glassMesh.geometry.dispose();
      piece.printMesh.geometry.dispose();
      piece.glassMesh.geometry = newGlassGeo;
      piece.printMesh.geometry = newPrintGeo;
      piece.printMesh.position.z = zTopFace;
    });
  }

  public setPortraitImage(img: HTMLImageElement | null): void {
    this.portraitImage = img;
    const oldTextures = this.textures;
    this.textures = createPrintedGlassTextures(
      this.navW,
      this.navH,
      this.panelW,
      this.panelH,
      this.S,
      this.renderer.getPixelRatio(),
      this.portraitImage
    );
    this.pieces.forEach((p) => {
      p.printMaterial.map =
        p.id === 'nav' ? this.textures.navTexture : this.textures.panelTexture;
      p.printMaterial.needsUpdate = true;
    });
    oldTextures.dispose();
  }

  public shatter(): void {
    if (this.phase === 'shattering' || this.phase === 'shattered') return;
    this.phase = 'shattering';
    this.phaseElapsed = 0;
    this.hoveredPieceId = null;
    this.renderer.domElement.style.cursor = 'default';
    this.callbacks.onPhaseChange('shattering');
  }

  public reassemble(): void {
    if (this.phase === 'reassembling' || this.phase === 'idle') return;
    this.phase = 'reassembling';
    this.phaseElapsed = 0;
    this.backSliverHovered = false;
    this.callbacks.onBackSliverHoverChange(false);
    this.renderer.domElement.style.cursor = 'default';
    this.callbacks.onPhaseChange('reassembling');
    this.scheduleTick();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerleave', this.handlePointerLeave);
    window.addEventListener('click', this.handleClick);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private handlePointerMove = (e: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.pointerInside = true;
    this.pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointerMoved = true;

    // Update cursor world position on z = 0 plane for glow shader
    _ndc.set(this.pointerX, this.pointerY);
    _raycaster.setFromCamera(_ndc, this.camera);
    if (_raycaster.ray.intersectPlane(_plane, _planeHit)) {
      this.glowUniforms.uCursorWorld.value.copy(_planeHit);
    }
  };

  private handlePointerLeave = (): void => {
    this.pointerInside = false;
    this.hoveredPieceId = null;
    if (this.backSliverHovered) {
      this.backSliverHovered = false;
      this.callbacks.onBackSliverHoverChange(false);
    }
  };

  private handleClick = (e: MouseEvent): void => {
    if (this.phase !== 'shattered') return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    _ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    _raycaster.setFromCamera(_ndc, this.camera);
    const hits = _raycaster.intersectObject(this.backSliverMesh, false);
    if (hits.length > 0) {
      this.callbacks.onBackSliverClick();
    }
  };

  private handleResize = (): void => {
    if (this.disposed) return;
    this.viewW = this.container.clientWidth || window.innerWidth;
    this.viewH = this.container.clientHeight || window.innerHeight;

    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
    );
    this.renderer.setSize(this.viewW, this.viewH);
    this.updateCameraDistance();

    this.computeLayoutMetrics();
    this.textures.dispose();
    this.textures = createPrintedGlassTextures(
      this.navW,
      this.navH,
      this.panelW,
      this.panelH,
      this.S,
      this.renderer.getPixelRatio(),
      this.portraitImage
    );
    this.buildSlabPieces();
    this.buildBackSliver();
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.callbacks.onContextLostChange(true);
  };

  private handleContextRestored = (): void => {
    this.callbacks.onContextLostChange(false);
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private scheduleTick(): void {
    if (this.disposed || this.phase === 'shattered') return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private emitHomography(): void {
    const zSurface = this.depthPx + this.bevelPx + 0.35;
    this.slabRoot.updateMatrixWorld(true);

    const projectRect = (w: number, h: number, centerY: number): [Point2D, Point2D, Point2D, Point2D] => {
      _cornersWorld[0].set(-w * 0.5, centerY + h * 0.5, zSurface);
      _cornersWorld[1].set(w * 0.5, centerY + h * 0.5, zSurface);
      _cornersWorld[2].set(w * 0.5, centerY - h * 0.5, zSurface);
      _cornersWorld[3].set(-w * 0.5, centerY - h * 0.5, zSurface);

      const pts: Point2D[] = [];
      for (let i = 0; i < 4; i++) {
        _cornersWorld[i].applyMatrix4(this.slabRoot.matrixWorld);
        _cornersWorld[i].project(this.camera);
        pts.push({
          x: (_cornersWorld[i].x * 0.5 + 0.5) * this.viewW,
          y: (-_cornersWorld[i].y * 0.5 + 0.5) * this.viewH,
        });
      }
      return [pts[0], pts[1], pts[2], pts[3]];
    };

    const navMatrix = computeHomographyMatrix3d(
      this.navW,
      this.navH,
      projectRect(this.navW, this.navH, this.navCenterY)
    );
    const panelMatrix = computeHomographyMatrix3d(
      this.panelW,
      this.panelH,
      projectRect(this.panelW, this.panelH, this.panelCenterY)
    );

    this.callbacks.onHomographyUpdate(
      navMatrix,
      panelMatrix,
      this.navW,
      this.navH,
      this.panelW,
      this.panelH
    );
  }

  private tick = (): void => {
    if (this.disposed) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.getElapsedTime();
    this.phaseElapsed += dt;

    // 1. Smooth Cursor Glow Strength
    const targetGlow = this.pointerInside && this.phase === 'idle' ? 1.0 : 0.0;
    this.glowUniforms.uGlowStrength.value = THREE.MathUtils.damp(
      this.glowUniforms.uGlowStrength.value,
      targetGlow,
      8.0,
      dt
    );

    // 2. Global Slab Tilt (0.3s exponential smooth)
    const targetRotY = this.pointerInside
      ? THREE.MathUtils.degToRad(this.pointerX * 7.0 - 1.2)
      : THREE.MathUtils.degToRad(-1.2);
    const targetRotX = this.pointerInside
      ? THREE.MathUtils.degToRad(-this.pointerY * 5.5 + 0.8)
      : THREE.MathUtils.degToRad(0.8);

    const tiltLambda = 1 / 0.12;
    this.slabRoot.rotation.y = THREE.MathUtils.damp(
      this.slabRoot.rotation.y,
      targetRotY,
      tiltLambda,
      dt
    );
    this.slabRoot.rotation.x = THREE.MathUtils.damp(
      this.slabRoot.rotation.x,
      targetRotX,
      tiltLambda,
      dt
    );

    // Rebuild costly shard geometry only while the pointer is changing its layout.
    if (this.phase === 'idle' && this.pointerMoved) {
      this.rebuildAccumulator += dt;
      if (this.rebuildAccumulator >= 1 / 30) {
        this.rebuildAccumulator = 0;
        this.rebuildLiveCutGeometry(elapsed);
        this.pointerMoved = false;
      }
    }

    // 4. Raycast hovered piece in idle state
    let hitPointWorld: THREE.Vector3 | null = null;
    if (this.phase === 'idle' && this.pointerInside) {
      _ndc.set(this.pointerX, this.pointerY);
      _raycaster.setFromCamera(_ndc, this.camera);
      const meshes = this.pieces.map((p) => p.glassMesh);
      const hits = _raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        this.hoveredPieceId = hits[0].object.userData.pieceId as ShardPiece['id'];
        hitPointWorld = hits[0].point;
      } else {
        this.hoveredPieceId = null;
      }
    } else if (this.phase !== 'idle') {
      this.hoveredPieceId = null;
    }

    // 5. Phase Transitions & Per-Piece Kinematics
    const duration = 0.72;
    if (this.phase === 'entering') {
      const maxEnd = duration + 5 * 0.03;
      if (this.phaseElapsed >= maxEnd) {
        this.phase = 'idle';
        this.phaseElapsed = 0;
        this.callbacks.onPhaseChange('idle');
      }
    } else if (this.phase === 'shattering') {
      const maxEnd = duration + 5 * 0.03;
      if (this.phaseElapsed >= maxEnd) {
        this.phase = 'shattered';
        this.phaseElapsed = 0;
        this.callbacks.onPhaseChange('shattered');
      }
    } else if (this.phase === 'reassembling') {
      const maxEnd = duration + 5 * 0.03;
      if (this.phaseElapsed >= maxEnd) {
        this.phase = 'idle';
        this.phaseElapsed = 0;
        this.callbacks.onPhaseChange('idle');
      }
    }

    // Spring constants (k=170, c=19)
    const springK = 170;
    const springC = 19;

    this.pieces.forEach((piece) => {
      const isHovered = this.hoveredPieceId === piece.id;
      piece.hoverBlend = THREE.MathUtils.damp(
        piece.hoverBlend,
        isHovered ? 1 : 0,
        10,
        dt
      );
      piece.material.iridescence = 0.55 + piece.hoverBlend * 0.45;
      piece.material.envMapIntensity = 1.0 + piece.hoverBlend * 0.9;

      // Hover spring lift + edge-dip tilt
      const targetLift = isHovered
        ? (piece.id === 'nav' ? 32 : 50) * this.S
        : 0;
      let targetTipX = 0;
      let targetTipY = 0;

      if (isHovered && hitPointWorld) {
        _localHit.copy(hitPointWorld);
        piece.group.worldToLocal(_localHit);
        const normDx = THREE.MathUtils.clamp(_localHit.x / (this.panelW * 0.25), -1, 1);
        const normDy = THREE.MathUtils.clamp(_localHit.y / (this.panelH * 0.25), -1, 1);
        // Nearest edge dips away
        targetTipY = normDx * 0.24;
        targetTipX = -normDy * 0.24;
      }

      const accLift = springK * (targetLift - piece.liftPos) - springC * piece.liftVel;
      piece.liftVel += accLift * dt;
      piece.liftPos += piece.liftVel * dt;

      const accTipX = springK * (targetTipX - piece.tipX) - springC * piece.tipXVel;
      piece.tipXVel += accTipX * dt;
      piece.tipX += piece.tipXVel * dt;

      const accTipY = springK * (targetTipY - piece.tipY) - springC * piece.tipYVel;
      piece.tipYVel += accTipY * dt;
      piece.tipY += piece.tipYVel * dt;

      // Evaluate trajectory offset based on phase
      let trajProgress = 0;
      if (this.phase === 'idle') {
        trajProgress = 0;
      } else if (this.phase === 'shattered') {
        trajProgress = 1;
      } else if (this.phase === 'shattering') {
        const localT = THREE.MathUtils.clamp(
          (this.phaseElapsed - piece.shatterDelay) / duration,
          0,
          1
        );
        trajProgress = easeInCubic(localT);
      } else if (this.phase === 'entering' || this.phase === 'reassembling') {
        const localT = THREE.MathUtils.clamp(
          (this.phaseElapsed - piece.shatterDelay) / duration,
          0,
          1
        );
        trajProgress = 1 - easeOutBack(localT);
      }

      const gravityDrop = -480 * this.S * trajProgress * trajProgress;
      piece.group.position.set(
        piece.baseCenter.x + piece.shatterVel.x * trajProgress,
        piece.baseCenter.y + piece.shatterVel.y * trajProgress + gravityDrop,
        piece.baseCenter.z + piece.liftPos + piece.shatterVel.z * trajProgress
      );

      // Rotation: hover tip + shatter tumble
      _quat.setFromAxisAngle(piece.tumbleAxis, piece.tumbleAngle * trajProgress);
      piece.group.quaternion.copy(_quat);
      piece.group.rotateX(piece.tipX);
      piece.group.rotateY(piece.tipY);
    });

    // 6. Floating "← Back" 3D Smoked-Glass Sliver
    const showBack =
      this.phase === 'shattered' ||
      (this.phase === 'shattering' && this.phaseElapsed >= 0.3);

    const targetSliverScale = showBack ? 1.0 : 0.0;
    this.backSliverScale = THREE.MathUtils.damp(
      this.backSliverScale,
      targetSliverScale,
      10,
      dt
    );

    if (this.backSliverScale > 0.01) {
      this.backSliverGroup.visible = true;
      this.backSliverGroup.scale.setScalar(this.backSliverScale);

      if (this.phase === 'shattered' && this.pointerInside) {
        _ndc.set(this.pointerX, this.pointerY);
        _raycaster.setFromCamera(_ndc, this.camera);
        const hits = _raycaster.intersectObject(this.backSliverMesh, false);
        const nextHover = hits.length > 0;
        if (nextHover !== this.backSliverHovered) {
          this.backSliverHovered = nextHover;
          this.renderer.domElement.style.cursor = nextHover ? 'pointer' : 'default';
          this.callbacks.onBackSliverHoverChange(nextHover);
        }
      }

      const wobbleX = Math.sin(elapsed * Math.PI * 2 * 0.9) * 0.035;
      const wobbleY = Math.cos(elapsed * Math.PI * 2 * 0.75) * 0.035;
      const targetTipY = this.backSliverHovered ? this.pointerX * 0.14 : 0;
      const targetTipX = this.backSliverHovered ? -this.pointerY * 0.14 : 0;

      this.backSliverTipX = THREE.MathUtils.damp(this.backSliverTipX, targetTipX, 8, dt);
      this.backSliverTipY = THREE.MathUtils.damp(this.backSliverTipY, targetTipY, 8, dt);

      this.backSliverGroup.rotation.y = -0.16 + wobbleY + this.backSliverTipY;
      this.backSliverGroup.rotation.x = 0.08 + wobbleX + this.backSliverTipX;
      this.backSliverMat.iridescence = THREE.MathUtils.damp(
        this.backSliverMat.iridescence,
        this.backSliverHovered ? 0.85 : 0.35,
        8,
        dt
      );
    } else {
      this.backSliverGroup.visible = false;
    }

    // 7. Emit Homography for tilted DOM overlay
    this.emitHomography();

    this.renderer.render(this.scene, this.camera);

    this.scheduleTick();
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerleave', this.handlePointerLeave);
    window.removeEventListener('click', this.handleClick);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener(
      'webglcontextrestored',
      this.handleContextRestored
    );

    this.pieces.forEach((p) => {
      p.glassMesh.geometry.dispose();
      p.printMesh.geometry.dispose();
      p.material.dispose();
      p.printMaterial.dispose();
    });

    if (this.backSliverMesh) {
      this.backSliverMesh.geometry.dispose();
      this.backSliverMat.dispose();
    }

    this.textures.dispose();
    this.envRT.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

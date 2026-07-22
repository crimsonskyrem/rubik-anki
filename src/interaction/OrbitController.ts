import * as THREE from 'three';

interface RendererLike {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

/**
 * Orbit controller: drag to rotate, scroll to zoom, click to interact.
 * Distinguishes click from drag via movement threshold.
 */
export class OrbitController {
  private renderer: RendererLike;
  private isDragging = false;
  private isClick = false;
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastY = 0;
  private spherical = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 8.5 };
  private readonly _initialSpherical = { ...this.spherical };
  private onClickCallback: ((e: MouseEvent) => void) | null = null;
  private _enabled = true;

  private static readonly CLICK_THRESHOLD = 3; // px — max movement to count as click

  constructor(renderer: RendererLike) {
    this.renderer = renderer;
    const canvas = renderer.renderer.domElement;

    // Mouse events
    canvas.addEventListener('mousedown', (e: MouseEvent) => this._onPointerDown(e));
    canvas.addEventListener('mousemove', (e: MouseEvent) => this._onPointerMove(e));
    canvas.addEventListener('mouseup', (e: MouseEvent) => this._onPointerUp(e));
    canvas.addEventListener('mouseleave', () => this._onCancel());

    // Touch events
    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this._onPointerDown(e.touches[0]);
      }
    }, { passive: false });
    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this._onPointerMove(e.touches[0]);
      }
    });
    canvas.addEventListener('touchend', (e: TouchEvent) => {
      // For touch, use last touch position
      const fakeEvent = { clientX: this.lastX, clientY: this.lastY } as MouseEvent;
      this._onPointerUp(fakeEvent);
    });

    // Scroll zoom
    canvas.addEventListener('wheel', (e: WheelEvent) => {
      if (!this._enabled) return;
      e.preventDefault();
      this.spherical.radius = Math.max(4, Math.min(20, this.spherical.radius + e.deltaY * 0.01));
      this._updateCamera();
    }, { passive: false });

    this._updateCamera();
  }

  /** Register a callback for clicks (not drags) on the canvas */
  onClick(cb: (e: MouseEvent) => void): void {
    this.onClickCallback = cb;
  }

  /** Reset camera to the initial view. */
  reset(): void {
    this.spherical = { ...this._initialSpherical };
    this._updateCamera();
  }

  /** Enable or disable orbit/drag/zoom. */
  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  private _onPointerDown(e: MouseEvent | Touch): void {
    if (!this._enabled) return;
    this.isDragging = true;
    this.isClick = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  private _onPointerMove(e: MouseEvent | Touch): void {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    // Check if moved beyond click threshold
    const totalDx = e.clientX - this.startX;
    const totalDy = e.clientY - this.startY;
    if (Math.abs(totalDx) > OrbitController.CLICK_THRESHOLD ||
        Math.abs(totalDy) > OrbitController.CLICK_THRESHOLD) {
      this.isClick = false;
    }

    this.spherical.theta -= dx * 0.005;
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi - dy * 0.005));
    this._updateCamera();
  }

  private _onPointerUp(e: MouseEvent): void {
    if (this.isClick && this.onClickCallback) {
      this.onClickCallback(e);
    }
    this.isDragging = false;
    this.isClick = false;
  }

  private _onCancel(): void {
    this.isDragging = false;
    this.isClick = false;
  }

  private _updateCamera(): void {
    const { theta, phi, radius } = this.spherical;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    this.renderer.camera.position.set(x, y, z);
    this.renderer.camera.lookAt(0, 0, 0);
  }
}

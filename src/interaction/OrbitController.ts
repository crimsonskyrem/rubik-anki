import * as THREE from 'three';

/**
 * Drag rotates the CUBE (not the camera); mirrors stay fixed in world space.
 * Camera position is fixed (no zoom) so mirror edges stay off-screen.
 * Distinguishes click from drag via movement threshold.
 */
export class OrbitController {
  private cubeGroup: THREE.Group;
  private camera: THREE.PerspectiveCamera;
  private isDragging = false;
  private isClick = false;
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastY = 0;
  private onClickCallback: ((e: MouseEvent) => void) | null = null;
  private _enabled = true;


  private static readonly CLICK_THRESHOLD = 3; // px — max movement to count as click
  private static readonly Y_AXIS = new THREE.Vector3(0, 1, 0);
  private static readonly X_AXIS = new THREE.Vector3(1, 0, 0);

  constructor(cubeGroup: THREE.Group, camera: THREE.PerspectiveCamera) {
    this.cubeGroup = cubeGroup;
    this.camera = camera;
  }

  /** Wire input listeners to the renderer's canvas (called once by the app). */
  bindCanvas(canvas: HTMLElement): void {
    this._bindCanvas(canvas);
  }

  private _bindCanvas(canvas: HTMLElement | null): void {
    if (!canvas) return;
    canvas.addEventListener('mousedown', (e: MouseEvent) => this._onPointerDown(e));
    canvas.addEventListener('mousemove', (e: MouseEvent) => this._onPointerMove(e));
    canvas.addEventListener('mouseup', (e: MouseEvent) => this._onPointerUp(e));
    canvas.addEventListener('mouseleave', () => this._onCancel());

    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 1) this._onPointerDown(e.touches[0]);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 1) this._onPointerMove(e.touches[0]);
    });
    canvas.addEventListener('touchend', () => {
      const fakeEvent = { clientX: this.lastX, clientY: this.lastY } as MouseEvent;
      this._onPointerUp(fakeEvent);
    });
  }


  /** Register a callback for clicks (not drags) on the canvas */
  onClick(cb: (e: MouseEvent) => void): void {
    this.onClickCallback = cb;
  }

  /** Reset the cube orientation (mirrors untouched). */
  reset(): void {
    this.cubeGroup.quaternion.identity();
  }

  /** Enable or disable drag/click (zoom is always disabled). */
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

    const totalDx = e.clientX - this.startX;
    const totalDy = e.clientY - this.startY;
    if (Math.abs(totalDx) > OrbitController.CLICK_THRESHOLD ||
        Math.abs(totalDy) > OrbitController.CLICK_THRESHOLD) {
      this.isClick = false;
    }

    // Rotate the cube around world axes; mirrors and camera stay put.
    this.cubeGroup.rotateOnWorldAxis(OrbitController.Y_AXIS, dx * 0.005);
    this.cubeGroup.rotateOnWorldAxis(OrbitController.X_AXIS, dy * 0.005);
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

}

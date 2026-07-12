import * as THREE from 'three';
import { CubeRenderer } from '../cube/renderer';

/**
 * Simple orbit controller: drag to rotate, scroll to zoom.
 */
export class OrbitController {
  private renderer: CubeRenderer;
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private spherical = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 8.5 };

  constructor(renderer: CubeRenderer) {
    this.renderer = renderer;
    const canvas = renderer.renderer.domElement;

    // Mouse events
    canvas.addEventListener('mousedown', (e: MouseEvent) => this._onPointerDown(e));
    canvas.addEventListener('mousemove', (e: MouseEvent) => this._onPointerMove(e));
    canvas.addEventListener('mouseup', () => this._onPointerUp());
    canvas.addEventListener('mouseleave', () => this._onPointerUp());

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
    canvas.addEventListener('touchend', () => this._onPointerUp());

    // Scroll zoom
    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      this.spherical.radius = Math.max(4, Math.min(20, this.spherical.radius + e.deltaY * 0.01));
      this._updateCamera();
    }, { passive: false });

    this._updateCamera();
  }

  private _onPointerDown(e: MouseEvent | Touch): void {
    this.isDragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  private _onPointerMove(e: MouseEvent | Touch): void {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    this.spherical.theta -= dx * 0.005;
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi - dy * 0.005));
    this._updateCamera();
  }

  private _onPointerUp(): void {
    this.isDragging = false;
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

import * as THREE from 'three';
import type { FaceLandmarks, ARSettings, ARProduct, IARRenderer, VideoSize, ARObjectType } from '../types';
import type { IObjectLoader } from '../loaders/IObjectLoader';
import type { ITransformCalculator } from '../transforms/ITransformCalculator';
import { Texture2DLoader } from '../loaders/Texture2DLoader';
import { Model3DLoader } from '../loaders/Model3DLoader';
import { GlassesTransform } from '../transforms/GlassesTransform';
import { HatTransform } from '../transforms/HatTransform';

interface ProductSlot {
  product: ARProduct;
  loader: IObjectLoader;
  transform: ITransformCalculator;
}

export class MultiProductRenderer implements IARRenderer {
  protected scene: THREE.Scene | null = null;
  protected camera: THREE.PerspectiveCamera | null = null;
  protected renderer: THREE.WebGLRenderer | null = null;
  protected canvas: HTMLCanvasElement | null = null;
  protected isInitialized = false;

  private productSlots: Map<ARObjectType, ProductSlot> = new Map();

  init(canvas: HTMLCanvasElement): void {
    if (this.isInitialized) {
      return;
    }

    this.canvas = canvas;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.isInitialized = true;
  }

  private createLoader(product: ARProduct): IObjectLoader {
    if (product.modelUrl) {
      return new Model3DLoader();
    }
    return new Texture2DLoader();
  }

  private createTransform(type: ARObjectType): ITransformCalculator {
    switch (type) {
      case 'hat':
        return new HatTransform();
      case 'glasses':
      default:
        return new GlassesTransform();
    }
  }

  async setProduct(product: ARProduct): Promise<void> {
    if (!this.scene) {
      throw new Error('MultiProductRenderer: Not initialized. Call init() first.');
    }

    const productType = product.type;
    const existingSlot = this.productSlots.get(productType);
    if (existingSlot) {
      existingSlot.loader.dispose();
    }

    const url = product.modelUrl || product.overlayUrl;
    if (!url) {
      throw new Error('MultiProductRenderer: Product must have overlayUrl or modelUrl.');
    }

    const loader = this.createLoader(product);
    const transform = this.createTransform(productType);

    try {
      await loader.load(url);
      
      if (!this.scene) {
        throw new Error('MultiProductRenderer: Scene was disposed during loading.');
      }

      loader.attachToScene(this.scene);
      
      this.productSlots.set(productType, {
        product,
        loader,
        transform,
      });
    } catch (error) {
      console.error('MultiProductRenderer: Error setting product:', error);
      throw error;
    }
  }

  clearProduct(type: ARObjectType): void {
    const slot = this.productSlots.get(type);
    if (slot) {
      slot.loader.dispose();
      this.productSlots.delete(type);
    }
  }

  clearAllProducts(): void {
    for (const [type] of this.productSlots) {
      this.clearProduct(type);
    }
  }

  hasProduct(type: ARObjectType): boolean {
    return this.productSlots.has(type);
  }

  getProductTypes(): ARObjectType[] {
    return Array.from(this.productSlots.keys());
  }

  render(landmarks: FaceLandmarks, settings: ARSettings, videoSize: VideoSize): void {
    if (!this.renderer || !this.scene || !this.camera) {
      return;
    }

    if (this.productSlots.size === 0 || !landmarks.scaledMesh) {
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      return;
    }

    for (const [, slot] of this.productSlots) {
      if (!slot.loader.isLoaded()) continue;

      const transform = slot.transform.calculate(
        landmarks,
        settings,
        videoSize,
        slot.product
      );
      slot.loader.applyTransform(transform, settings.opacity);
    }

    this.renderer.render(this.scene, this.camera);
  }

  getScene(): THREE.Scene | null {
    return this.scene;
  }

  getCamera(): THREE.Camera | null {
    return this.camera;
  }

  resize(width: number, height: number): void {
    if (this.camera && this.renderer) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  dispose(): void {
    for (const [, slot] of this.productSlots) {
      slot.loader.dispose();
    }
    this.productSlots.clear();

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          } else if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          }
        }
      });
      this.scene.clear();
      this.scene = null;
    }

    this.camera = null;
    this.canvas = null;
    this.isInitialized = false;
  }
}

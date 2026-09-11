/**
 * Game FreeWorld - AssetManager
 * Generates procedural canvas textures for AAA visuals: skyscraper window grids,
 * neon signs, wet asphalt, pavement curbs, and architectural details without external image downloads.
 */
import * as THREE from 'three';

export class AssetManager {
  static textures = {};

  /**
   * Procedural Skyscraper Window Wall Texture
   * Creates randomized lit/unlit office windows with blinds and mullions
   */
  static getBuildingTexture(theme = 'commercial') {
    const key = `building_${theme}`;
    if (this.textures[key]) return this.textures[key];

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base wall color
    const isFinancial = theme === 'financial';
    ctx.fillStyle = isFinancial ? '#161c26' : '#1e2430';
    ctx.fillRect(0, 0, 512, 1024);

    const cols = 8;
    const rows = 24;
    const padX = 14;
    const padY = 12;
    const winW = (512 - padX * (cols + 1)) / cols;
    const winH = (1024 - padY * (rows + 1)) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padX + c * (winW + padX);
        const y = padY + r * (winH + padY);

        // Window frame
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(x - 2, y - 2, winW + 4, winH + 4);

        // Window light probability
        const isLit = Math.random() > 0.45;
        if (isLit) {
          const warmOrCool = Math.random();
          if (warmOrCool > 0.7) {
            ctx.fillStyle = '#ffe0a0'; // Warm office light
          } else if (warmOrCool > 0.3) {
            ctx.fillStyle = '#a0d8ff'; // Cool fluorescent blue
          } else {
            ctx.fillStyle = '#ffb366'; // Amber glow
          }
        } else {
          ctx.fillStyle = '#0f1724'; // Unlit dark reflection
        }
        ctx.fillRect(x, y, winW, winH);

        // Subtle blinds/mullion detail
        if (isLit && Math.random() > 0.5) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.fillRect(x, y, winW, winH * 0.4);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 2);
    this.textures[key] = texture;
    return texture;
  }

  /**
   * Procedural Concrete Sidewalk Paving Texture
   */
  static getSidewalkTexture() {
    if (this.textures['sidewalk']) return this.textures['sidewalk'];

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#4a5361';
    ctx.fillRect(0, 0, 256, 256);

    // Grid slabs
    ctx.strokeStyle = '#323945';
    ctx.lineWidth = 3;
    const step = 64;
    for (let i = 0; i <= 256; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }

    // Subtle concrete grain noise
    for (let n = 0; n < 2000; n++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const shade = Math.floor(60 + Math.random() * 40);
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.12)`;
      ctx.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    this.textures['sidewalk'] = texture;
    return texture;
  }

  /**
   * Procedural Road Surface Texture with asphalt aggregate and lane markings
   */
  static getRoadTexture() {
    if (this.textures['road']) return this.textures['road'];

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark asphalt
    ctx.fillStyle = '#21262d';
    ctx.fillRect(0, 0, 512, 512);

    // Aggregate noise
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(40 + Math.random() * 30);
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    this.textures['road'] = texture;
    return texture;
  }

  /**
   * Procedural Neon Signboard Texture for shops & landmarks
   */
  static createNeonSignTexture(text, subtitle = '', primaryColor = '#00f0ff', accentColor = '#ff007f') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Black backing
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, 512, 128);

    // Glowing border
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 12;
    ctx.strokeRect(8, 8, 496, 112);

    // Main Neon Text
    ctx.font = 'bold 44px "Arial Black", "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 18;
    ctx.fillText(text, 256, subtitle ? 52 : 64);

    // Accent Subtitle
    if (subtitle) {
      ctx.font = 'bold 18px "Arial", sans-serif';
      ctx.fillStyle = accentColor;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 10;
      ctx.fillText(subtitle, 256, 92);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}

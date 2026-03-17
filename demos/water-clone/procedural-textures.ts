/**
 * Procedural textures to replace the game's .basis textures.
 * Generates normal maps, flow maps, caustics, etc.
 */
import * as THREE from "three";

/** Creates a derivative-height normal map texture (like the game's water normal map). */
export function createNormalMap(size = 512): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      const fx = x / size;
      const fy = y / size;

      // Multi-octave noise for water-like normals
      const n1 = Math.sin(fx * 12.0) * Math.cos(fy * 12.0) * 0.5;
      const n2 = Math.sin(fx * 24.0 + 1.3) * Math.cos(fy * 24.0 + 0.7) * 0.25;
      const n3 = Math.sin(fx * 48.0 + 2.1) * Math.cos(fy * 48.0 + 3.2) * 0.125;
      const height = (n1 + n2 + n3) * 0.5 + 0.5;

      // Derivative approximation
      const dx =
        Math.cos(fx * 12.0) * Math.cos(fy * 12.0) * 12.0 * 0.5 +
        Math.cos(fx * 24.0 + 1.3) * Math.cos(fy * 24.0 + 0.7) * 24.0 * 0.25;
      const dy =
        -Math.sin(fx * 12.0) * Math.sin(fy * 12.0) * 12.0 * 0.5 -
        Math.sin(fx * 24.0 + 1.3) * Math.sin(fy * 24.0 + 0.7) * 24.0 * 0.25;

      // Pack as derivative height map (agb format: alpha=height, green=dx, blue=dy)
      const dxNorm = Math.floor((dx * 0.02 + 0.5) * 255);
      const dyNorm = Math.floor((dy * 0.02 + 0.5) * 255);

      data[i + 0] = Math.floor(height * 255); // R (used as height in some reads)
      data[i + 1] = Math.max(0, Math.min(255, dxNorm)); // G (derivative x)
      data[i + 2] = Math.max(0, Math.min(255, dyNorm)); // B (derivative y)
      data[i + 3] = Math.floor(height * 255); // A (height)
    }
  }

  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/** Creates a flow map texture (RG = flow direction, B = noise). */
export function createFlowMap(size = 256): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      const fx = x / size;
      const fy = y / size;

      // Gentle circular flow pattern
      const cx = fx - 0.5;
      const cy = fy - 0.5;
      const flowX = -cy * 0.3 + Math.sin(fx * 6.0) * 0.1;
      const flowY = cx * 0.3 + Math.cos(fy * 6.0) * 0.1;

      // Random noise for phase offset
      const noise =
        (Math.sin(fx * 37.3 + fy * 59.1) * 0.5 + 0.5) * 0.3 +
        (Math.sin(fx * 73.7 + fy * 23.9) * 0.5 + 0.5) * 0.7;

      data[i + 0] = Math.floor((flowX * 0.5 + 0.5) * 255);
      data[i + 1] = Math.floor((flowY * 0.5 + 0.5) * 255);
      data[i + 2] = Math.floor(noise * 255);
      data[i + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/** Creates a caustics/shore pattern texture (R = shore pattern, A = caustics pattern). */
export function createCausticsMap(size = 512): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      const fx = x / size;
      const fy = y / size;

      // Voronoi-like caustics pattern
      let minDist = 1.0;
      for (let cx = 0; cx < 5; cx++) {
        for (let cy = 0; cy < 5; cy++) {
          const px =
            (cx + 0.5 + Math.sin(cx * 12.9898 + cy * 78.233) * 0.3) / 5.0;
          const py =
            (cy + 0.5 + Math.cos(cx * 78.233 + cy * 12.9898) * 0.3) / 5.0;
          const dx = fx - px;
          const dy = fy - py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          minDist = Math.min(minDist, dist);
        }
      }
      const caustic = Math.pow(minDist * 4.0, 0.5);

      // Shore-like pattern
      const shore =
        (Math.sin(fx * 20.0 + fy * 15.0) * 0.5 + 0.5) *
        (Math.cos(fx * 10.0 - fy * 25.0) * 0.5 + 0.5);

      data[i + 0] = Math.floor(shore * 255); // R - shore
      data[i + 1] = Math.floor(caustic * 255); // G
      data[i + 2] = Math.floor(shore * 200); // B
      data[i + 3] = Math.floor(Math.min(1.0, caustic * 1.5) * 255); // A - caustics
    }
  }

  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

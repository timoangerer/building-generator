/**
 * Procedural island geometry generator.
 * Creates low-poly stylized islands similar to Cannon Clash.
 */
import * as THREE from "three";

/** Simple seeded random. */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** 2D Perlin-ish noise from seed. */
function noise2D(
  x: number,
  y: number,
  seed: number,
  scale: number = 1,
): number {
  const sx = x * scale;
  const sy = y * scale;
  return (
    Math.sin(sx * 1.2 + seed) * Math.cos(sy * 0.8 + seed * 0.7) * 0.5 +
    Math.sin(sx * 2.4 + seed * 1.3) * Math.cos(sy * 1.6 + seed * 0.3) * 0.25 +
    Math.sin(sx * 4.8 + seed * 2.1) * Math.cos(sy * 3.2 + seed * 1.1) * 0.125
  );
}

/**
 * Creates a rocky island mesh.
 * The island is roughly circular with noisy edges and a raised center.
 */
export function createIsland(
  radius: number = 10,
  height: number = 3,
  seed: number = 42,
): THREE.Mesh {
  const segments = 32;
  const rings = 12;
  const rand = seededRandom(seed);

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  // Generate vertices in concentric rings
  // Center vertex
  positions.push(0, height * 0.8, 0);
  normals.push(0, 1, 0);
  colors.push(0.35, 0.55, 0.2, 1); // Green top

  for (let r = 1; r <= rings; r++) {
    const ringRatio = r / rings;
    const ringRadius = radius * ringRatio;

    for (let s = 0; s < segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius;

      // Height profile: raised center, slopes to edges
      const distRatio = ringRatio;
      const noiseVal = noise2D(x, z, seed, 0.3) * 0.5;

      // Edge randomization
      const edgeNoise = noise2D(x * 2, z * 2, seed + 100, 0.5) * 0.3;
      const radiusNoise = 1.0 + edgeNoise;

      let y: number;
      if (distRatio < 0.4) {
        // Flat top plateau
        y = height * (0.85 + noiseVal * 0.15);
      } else if (distRatio < 0.65) {
        // Slope down
        const t = (distRatio - 0.4) / 0.25;
        y = height * (0.85 - t * 0.55) + noiseVal * height * 0.2;
      } else if (distRatio < 0.85) {
        // Beach area
        const t = (distRatio - 0.65) / 0.2;
        y = height * 0.3 * (1.0 - t) + noiseVal * 0.3;
      } else {
        // Shore edge - goes to water level and slightly below
        const t = (distRatio - 0.85) / 0.15;
        y = height * 0.05 * (1.0 - t) - t * 0.5;
        if (r === rings) {
          y = -0.5 + rand() * 0.3;
        }
      }

      const finalX = x * radiusNoise;
      const finalZ = z * radiusNoise;

      positions.push(finalX, y, finalZ);
      normals.push(0, 1, 0); // will be recomputed

      // Color based on height
      if (y > height * 0.4) {
        // Green grass
        const g = 0.45 + rand() * 0.2;
        colors.push(0.25 + rand() * 0.1, g, 0.12 + rand() * 0.08, 1);
      } else if (y > height * 0.15) {
        // Brown dirt/rock
        const b = 0.4 + rand() * 0.15;
        colors.push(b + 0.1, b, b - 0.1, 1);
      } else {
        // Sandy beach
        const s = 0.75 + rand() * 0.15;
        colors.push(s, s - 0.05, s - 0.2, 1);
      }
    }
  }

  // Generate indices
  // Center fan
  for (let s = 0; s < segments; s++) {
    const next = (s + 1) % segments;
    indices.push(0, 1 + s, 1 + next);
  }

  // Ring strips
  for (let r = 1; r < rings; r++) {
    const ringStart = 1 + (r - 1) * segments;
    const nextRingStart = 1 + r * segments;

    for (let s = 0; s < segments; s++) {
      const next = (s + 1) % segments;
      indices.push(
        ringStart + s,
        nextRingStart + s,
        nextRingStart + next,
      );
      indices.push(
        ringStart + s,
        nextRingStart + next,
        ringStart + next,
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(normals, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 4));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });

  return new THREE.Mesh(geometry, material);
}

/** Creates a simple palm tree at position. */
export function createPalmTree(
  position: THREE.Vector3,
  seed: number = 0,
): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(seed);

  // Trunk - slightly curved cylinder
  const trunkHeight = 3 + rand() * 2;
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(
      rand() * 0.5 - 0.25,
      trunkHeight * 0.33,
      rand() * 0.5 - 0.25,
    ),
    new THREE.Vector3(
      rand() * 0.8 - 0.4,
      trunkHeight * 0.66,
      rand() * 0.8 - 0.4,
    ),
    new THREE.Vector3(rand() * 0.3 - 0.15, trunkHeight, rand() * 0.3 - 0.15),
  ]);

  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 8, 0.15, 6, false);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x8b6914,
    roughness: 0.9,
    flatShading: true,
  });
  group.add(new THREE.Mesh(trunkGeo, trunkMat));

  // Leaves - simple elongated shapes
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2d8a2d,
    roughness: 0.7,
    side: THREE.DoubleSide,
    flatShading: true,
  });

  const leafCount = 5 + Math.floor(rand() * 3);
  const topPoint = trunkCurve.getPoint(1);

  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2 + rand() * 0.3;
    const leafLen = 2 + rand() * 1.5;
    const droop = 0.4 + rand() * 0.3;

    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(leafLen * 0.5, 0.3, leafLen, 0);
    leafShape.quadraticCurveTo(leafLen * 0.5, -0.3, 0, 0);

    const leafGeo = new THREE.ShapeGeometry(leafShape, 4);
    const leaf = new THREE.Mesh(leafGeo, leafMat);

    leaf.position.copy(topPoint);
    leaf.rotation.y = angle;
    leaf.rotation.x = droop;
    group.add(leaf);
  }

  group.position.copy(position);
  return group;
}

/** Creates a rock mesh. */
export function createRock(
  scale: number = 1,
  seed: number = 0,
): THREE.Mesh {
  const geo = new THREE.IcosahedronGeometry(scale, 1);

  // Deform vertices
  const rand = seededRandom(seed);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const deform = 0.7 + rand() * 0.6;
    pos.setXYZ(i, x * deform, y * deform * 0.7, z * deform);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  });

  return new THREE.Mesh(geo, mat);
}

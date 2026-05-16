import * as THREE from 'three';

export function createGalaxy(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const deepStars = createStarField({
    count: 6000, spread: 500, size: 0.03, color: 0x3344aa, opacity: 0.2,
  });
  group.add(deepStars);

  const midStars = createStarField({
    count: 4000, spread: 300, size: 0.06, color: 0x5566bb, opacity: 0.3,
  });
  group.add(midStars);

  const brightStars = createStarField({
    count: 1500, spread: 150, size: 0.12, color: 0x99aacc, opacity: 0.45,
  });
  group.add(brightStars);

  const spiral = createSpiralGalaxy();
  group.add(spiral);

  const fgStars = createStarField({
    count: 600, spread: 70, size: 0.25, color: 0xbbccff, opacity: 0.5,
  });
  group.add(fgStars);

  const twinklingStars = createTwinklingStars();
  group.add(twinklingStars.group);

  return {
    update(time, mouseX, mouseY, scrollProgress, warpIntensity) {
      deepStars.rotation.y = time * 0.0008;
      deepStars.position.x = mouseX * 0.3;
      deepStars.position.y = mouseY * 0.2;

      midStars.rotation.y = time * 0.0015;
      midStars.position.x = mouseX * 0.8;
      midStars.position.y = mouseY * 0.5;

      brightStars.rotation.y = time * 0.0025;
      brightStars.position.x = mouseX * 1.5;
      brightStars.position.y = mouseY * 0.8;

      spiral.rotation.y = time * 0.015;
      spiral.rotation.x = Math.sin(time * 0.008) * 0.04;
      spiral.position.x = mouseX * 0.8;
      spiral.position.y = mouseY * 0.4;

      fgStars.rotation.y = time * 0.006 + mouseX * 0.012;
      fgStars.position.x = mouseX * 3;
      fgStars.position.y = mouseY * 1.5;

      twinklingStars.update(time, mouseX, mouseY);
    },
  };
}

function createStarField({ count, spread, size, color, opacity }) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const baseColor = new THREE.Color(color);

  for (let i = 0; i < count; i++) {
    const r = Math.random() * spread;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.25;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const brightness = 0.5 + Math.random() * 0.5;
    const c = baseColor.clone().multiplyScalar(brightness);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = size * (0.5 + Math.random() * 1.5);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    map: starTexture(),
  });

  return new THREE.Points(geometry, material);
}

function createSpiralGalaxy() {
  const count = 6000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const coreColor = new THREE.Color(0x2233aa);
  const armColor = new THREE.Color(0x6644aa);
  const edgeColor = new THREE.Color(0x5577bb);

  const arms = 4;
  const radius = 12;
  const spin = 2.0;
  const randomness = 0.35;

  for (let i = 0; i < count; i++) {
    const r = Math.random() * radius;
    const armAngle = (i % arms) * (Math.PI * 2 / arms);
    const spinAngle = r * spin * 0.1;
    const randomAngle = (Math.random() - 0.5) * randomness;

    const angle = armAngle + spinAngle + randomAngle;
    const rad = r + (Math.random() - 0.5) * randomness;

    positions[i * 3] = Math.cos(angle) * rad;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5 * (r / radius);
    positions[i * 3 + 2] = Math.sin(angle) * rad;

    const mixFactor = r / radius;
    let c;
    if (mixFactor < 0.4) {
      c = coreColor.clone().lerp(armColor, mixFactor / 0.4);
    } else {
      c = armColor.clone().lerp(edgeColor, (mixFactor - 0.4) / 0.6);
    }
    const brightness = 0.5 + Math.random() * 0.5;
    colors[i * 3] = c.r * brightness;
    colors[i * 3 + 1] = c.g * brightness;
    colors[i * 3 + 2] = c.b * brightness;

    sizes[i] = 0.03 + (1 - mixFactor) * 0.08;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    map: starTexture(),
  });

  return new THREE.Points(geometry, material);
}

function createTwinklingStars() {
  const count = 120;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = 10 + Math.random() * 35;
    const height = (Math.random() - 0.5) * 15;
    positions[i * 3] = Math.cos(angle) * rad;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(angle) * rad;

    sizes[i] = 0.15 + Math.random() * 0.4;
    phases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.PointsMaterial({
    size: 0.25,
    color: 0xaabbdd,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    map: starTexture(),
  });

  const points = new THREE.Points(geometry, material);

  const phaseAttr = geometry.attributes.phase;
  const sizeAttr = geometry.attributes.size;

  return {
    group: points,
    update(time, mouseX, mouseY) {
      points.rotation.y = time * 0.004 + mouseX * 0.006;
      points.position.x = mouseX * 1.5;
      points.position.y = mouseY * 1.0;

      const phases = phaseAttr.array;
      const sizes = sizeAttr.array;
      for (let i = 0; i < count; i++) {
        sizes[i] = (0.15 + Math.sin(time * 1.0 + phases[i]) * 0.1) * (0.5 + Math.random() * 0.005);
      }
      sizeAttr.needsUpdate = true;
    },
  };
}

let _starTexture = null;
function starTexture() {
  if (_starTexture) return _starTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.15, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.4, 'rgba(200,210,255,0.2)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  _starTexture = new THREE.CanvasTexture(canvas);
  return _starTexture;
}

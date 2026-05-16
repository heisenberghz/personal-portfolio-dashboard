import * as THREE from 'three';

export function createGalaxy(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const deepStars = createStarLayer({
    count: 15000, spread: 350, size: 0.03, color: 0x5555aa, opacity: 0.4, thickness: 0.25, parallaxFactor: 0.05,
  });
  group.add(deepStars);

  const midStars = createStarLayer({
    count: 10000, spread: 220, size: 0.06, color: 0x7777cc, opacity: 0.55, thickness: 0.35, parallaxFactor: 0.15,
  });
  group.add(midStars);

  const bgStars = createStarLayer({
    count: 8000, spread: 160, size: 0.09, color: 0x9999ff, opacity: 0.6, thickness: 0.45, parallaxFactor: 0.3,
  });
  group.add(bgStars);

  const spiral = createSpiralGalaxy();
  group.add(spiral);

  const fgStars = createStarLayer({
    count: 3000, spread: 70, size: 0.25, color: 0xffffff, opacity: 0.9, thickness: 0.9, parallaxFactor: 0.7,
  });
  group.add(fgStars);

  const brightStars = createBrightStars();
  group.add(brightStars);

  const cosmicFog = createCosmicFog();
  group.add(cosmicFog.group);

  const nebula = createNebulaSystem();
  group.add(nebula.group);

  const dust = createDustField();
  scene.add(dust.group);

  const gradientPlanes = createGalaxyGradients();
  group.add(gradientPlanes.group);

  const shootingStars = createShootingStars();
  group.add(shootingStars.group);

  const warpParticles = createWarpParticles();
  group.add(warpParticles.group);

  return {
    update(time, mouseX, mouseY, scrollProgress, warpIntensity) {
      deepStars.rotation.y = time * 0.002;
      deepStars.position.x = mouseX * 0.6;
      deepStars.position.y = mouseY * 0.4;

      midStars.rotation.y = time * 0.004;
      midStars.rotation.x = Math.sin(time * 0.0015) * 0.015;
      midStars.position.x = mouseX * 1.5;
      midStars.position.y = mouseY * 0.9;

      bgStars.rotation.y = time * 0.006;
      bgStars.rotation.x = Math.sin(time * 0.0025) * 0.02;
      bgStars.position.x = mouseX * 2.5;
      bgStars.position.y = mouseY * 1.5;

      spiral.rotation.y = time * 0.04;
      spiral.rotation.x = Math.sin(time * 0.015) * 0.08;
      spiral.position.x = mouseX * 1.5;
      spiral.position.y = mouseY * 0.8;

      fgStars.rotation.y = time * 0.015 + mouseX * 0.025;
      fgStars.position.x = mouseX * 5;
      fgStars.position.y = mouseY * 3;

      brightStars.update(time, mouseX, mouseY);
      cosmicFog.update(time, mouseX, mouseY);
      nebula.update(time);
      dust.update(time, mouseX, mouseY);
      gradientPlanes.update(time, mouseX, mouseY);
      shootingStars.update(time);
      warpParticles.update(time, warpIntensity);
    },
  };
}

function createStarLayer({ count, spread, size, color, opacity, thickness, parallaxFactor = 0.5 }) {
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
    positions[i * 3 + 1] = r * Math.cos(phi) * thickness;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const brightness = 0.3 + Math.random() * 0.7;
    const c = baseColor.clone().multiplyScalar(brightness);
    const hueShift = (Math.random() - 0.5) * 0.05;
    c.offsetHSL(hueShift, 0, 0);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = size * (0.3 + Math.random() * 2.0);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    map: starGlowTexture(),
  });

  const points = new THREE.Points(geometry, material);
  points.userData.parallaxFactor = parallaxFactor;
  return points;
}

function createBrightStars() {
  const count = 200;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  const palette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xaaccff),
    new THREE.Color(0xffddaa),
    new THREE.Color(0xffaacc),
    new THREE.Color(0xaaffcc),
  ];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = 5 + Math.random() * 50;
    const height = (Math.random() - 0.5) * 30;
    positions[i * 3] = Math.cos(angle) * rad;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(angle) * rad;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = 0.3 + Math.random() * 0.8;
    phases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    map: starGlowTexture(),
  });

  const points = new THREE.Points(geometry, material);

  const phaseAttr = geometry.attributes.phase;
  const sizeAttr = geometry.attributes.size;

  return {
    group: points,
    update(time, mouseX, mouseY) {
      points.rotation.y = time * 0.008 + mouseX * 0.01;
      points.position.x = mouseX * 3;
      points.position.y = mouseY * 2;
      const phases = phaseAttr.array;
      const sizes = sizeAttr.array;
      for (let i = 0; i < count; i++) {
        sizes[i] = (0.3 + Math.sin(time * 1.5 + phases[i]) * 0.3) * (0.5 + Math.random() * 0.01);
      }
      sizeAttr.needsUpdate = true;
    },
  };
}

function createSpiralGalaxy() {
  const count = 12000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const coreColor = new THREE.Color(0x4466ff);
  const armColor = new THREE.Color(0xff44aa);
  const edgeColor = new THREE.Color(0x88ddff);
  const hotColor = new THREE.Color(0xffaa44);

  const arms = 5;
  const radius = 18;
  const spin = 3.2;
  const randomness = 0.55;
  const thickness = 1.8;

  for (let i = 0; i < count; i++) {
    const r = Math.random() * radius;
    const armAngle = (i % arms) * (Math.PI * 2 / arms);
    const spinAngle = r * spin * 0.15;
    const randomAngle = (Math.random() - 0.5) * randomness;
    const randomRad = (Math.random() - 0.5) * randomness;

    const angle = armAngle + spinAngle + randomAngle;
    const rad = r + randomRad;

    positions[i * 3] = Math.cos(angle) * rad;
    positions[i * 3 + 1] = (Math.random() - 0.5) * thickness * (r / radius) * 2;
    positions[i * 3 + 2] = Math.sin(angle) * rad;

    const mixFactor = r / radius;
    let c;
    if (mixFactor < 0.3) {
      c = coreColor.clone().lerp(hotColor, mixFactor / 0.3);
    } else if (mixFactor < 0.7) {
      c = hotColor.clone().lerp(armColor, (mixFactor - 0.3) / 0.4);
    } else {
      c = armColor.clone().lerp(edgeColor, (mixFactor - 0.7) / 0.3);
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = 0.06 + (1 - mixFactor) * 0.15;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.14,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    map: starGlowTexture(),
  });

  return new THREE.Points(geometry, material);
}

function createNebulaSystem() {
  const group = new THREE.Group();
  const texture = nebulaTexture();
  const list = [];

  const hues = [0.7, 0.8, 0.9, 0.6, 0.05, 0.5, 0.15, 0.95, 0.35, 0.55];

  for (let i = 0; i < 30; i++) {
    const size = 4 + Math.random() * 18;
    const hue = hues[Math.floor(Math.random() * hues.length)];

    const material = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color().setHSL(hue, 0.7, 0.45),
      transparent: true,
      opacity: 0.06 + Math.random() * 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    const angle = Math.random() * Math.PI * 2;
    const rad = 5 + Math.random() * 22;
    sprite.position.set(
      Math.cos(angle) * rad,
      (Math.random() - 0.5) * 12,
      Math.sin(angle) * rad,
    );
    sprite.scale.set(size, size, 1);

    sprite.userData = {
      baseY: sprite.position.y,
      angle,
      speed: 0.1 + Math.random() * 0.5,
      radius: rad,
      floatSpeed: 0.2 + Math.random() * 0.7,
      floatOffset: Math.random() * Math.PI * 2,
      hue,
      hueSpeed: 0.02 + Math.random() * 0.1,
      baseOpacity: 0.06 + Math.random() * 0.18,
      pulseSpeed: 0.3 + Math.random() * 0.7,
      baseScale: size,
    };

    group.add(sprite);
    list.push(sprite);
  }

  return {
    group,
    update(time) {
      list.forEach((n) => {
        const d = n.userData;
        d.angle += d.speed * 0.004;
        n.position.x = Math.cos(d.angle) * d.radius;
        n.position.z = Math.sin(d.angle) * d.radius;
        n.position.y = d.baseY + Math.sin(time * d.floatSpeed + d.floatOffset) * 2;

        d.hue += d.hueSpeed * 0.006;
        if (d.hue > 1) d.hue -= 1;
        n.material.color.setHSL(d.hue, 0.7, 0.45);

        const pulse = 0.6 + 0.4 * Math.sin(time * d.pulseSpeed + d.floatOffset);
        n.material.opacity = d.baseOpacity * pulse;

        const s = d.baseScale * (0.85 + 0.15 * Math.sin(time * 0.5 + d.floatOffset));
        n.scale.set(s, s, 1);
      });
    },
  };
}

function createDustField() {
  const count = 800;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
    velocities.push({
      x: (Math.random() - 0.5) * 0.004,
      y: (Math.random() - 0.5) * 0.004,
      z: (Math.random() - 0.5) * 0.004,
    });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    color: 0x8888ff,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    map: starGlowTexture(),
  });

  const points = new THREE.Points(geometry, material);

  const posAttr = geometry.attributes.position;

  return {
    group: points,
    update(time, mouseX, mouseY) {
      const pos = posAttr.array;
      const bounds = 30;
      const halfH = 25;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += velocities[i].x + mouseX * 0.003;
        pos[i * 3 + 1] += velocities[i].y + mouseY * 0.002 + Math.sin(time + i) * 0.0005;
        pos[i * 3 + 2] += velocities[i].z;
        if (pos[i * 3] > bounds) pos[i * 3] = -bounds;
        if (pos[i * 3] < -bounds) pos[i * 3] = bounds;
        if (pos[i * 3 + 1] > halfH) pos[i * 3 + 1] = -halfH;
        if (pos[i * 3 + 1] < -halfH) pos[i * 3 + 1] = halfH;
      }
      posAttr.needsUpdate = true;
    },
  };
}

let _starTexture = null;
function starGlowTexture() {
  if (_starTexture) return _starTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.1, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.3, 'rgba(200,220,255,0.5)');
  g.addColorStop(0.6, 'rgba(150,180,255,0.15)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  _starTexture = new THREE.CanvasTexture(canvas);
  return _starTexture;
}

function createCosmicFog() {
  const group = new THREE.Group();
  const texture = nebulaTexture();
  const layers = [];

  const fogConfigs = [
    { color: 0x1a0a3a, size: 80, opacity: 0.14, y: -5, z: -20 },
    { color: 0x0a1a4a, size: 100, opacity: 0.12, y: 3, z: -30 },
    { color: 0x2a0a2a, size: 70, opacity: 0.13, y: -2, z: -15 },
    { color: 0x0a2a3a, size: 90, opacity: 0.1, y: 8, z: -25 },
    { color: 0x1a1a4a, size: 110, opacity: 0.08, y: 0, z: -35 },
  ];

  fogConfigs.forEach((cfg, i) => {
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: cfg.color,
      transparent: true,
      opacity: cfg.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, cfg.y, cfg.z);
    sprite.scale.set(cfg.size, cfg.size, 1);
    sprite.userData = {
      baseY: cfg.y,
      baseX: 0,
      floatSpeed: 0.1 + i * 0.06,
      floatOffset: i * 1.5,
      pulseSpeed: 0.2 + i * 0.12,
      baseOpacity: cfg.opacity,
      parallaxFactor: 0.2 + i * 0.1,
    };

    group.add(sprite);
    layers.push(sprite);
  });

  return {
    group,
    update(time, mouseX, mouseY) {
      layers.forEach((fog) => {
        const d = fog.userData;
        fog.position.y = d.baseY + Math.sin(time * d.floatSpeed + d.floatOffset) * 2.5;
        fog.position.x = d.baseX + Math.sin(time * d.floatSpeed * 0.5 + d.floatOffset) * 4 + mouseX * d.parallaxFactor * 2.5;

        const pulse = 0.75 + 0.25 * Math.sin(time * d.pulseSpeed + d.floatOffset);
        fog.material.opacity = d.baseOpacity * pulse;

        const scalePulse = 1 + 0.06 * Math.sin(time * 0.3 + d.floatOffset);
        fog.scale.set(fog.scale.x * scalePulse, fog.scale.y * scalePulse, 1);
      });
    },
  };
}

function createGalaxyGradients() {
  const group = new THREE.Group();
  const planes = [];

  const gradientConfigs = [
    { color1: 0x0a0a2a, color2: 0x1a0a3a, size: 160, z: -45, opacity: 0.45 },
    { color1: 0x0a1a2a, color2: 0x2a0a1a, size: 140, z: -35, opacity: 0.35 },
    { color1: 0x1a0a2a, color2: 0x0a2a2a, size: 120, z: -25, opacity: 0.3 },
  ];

  gradientConfigs.forEach((cfg, i) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const c1 = new THREE.Color(cfg.color1);
    const c2 = new THREE.Color(cfg.color2);

    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, `rgba(${Math.floor(c2.r * 255)},${Math.floor(c2.g * 255)},${Math.floor(c2.b * 255)},1)`);
    gradient.addColorStop(0.5, `rgba(${Math.floor((c1.r + c2.r) * 0.5 * 255)},${Math.floor((c1.g + c2.g) * 0.5 * 255)},${Math.floor((c1.b + c2.b) * 0.5 * 255)},0.8)`);
    gradient.addColorStop(1, `rgba(${Math.floor(c1.r * 255)},${Math.floor(c1.g * 255)},${Math.floor(c1.b * 255)},0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: cfg.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, 0, cfg.z);
    sprite.scale.set(cfg.size, cfg.size, 1);
    sprite.userData = {
      baseZ: cfg.z,
      floatSpeed: 0.05 + i * 0.02,
      floatOffset: i * 2,
      parallaxFactor: 0.1 + i * 0.05,
    };

    group.add(sprite);
    planes.push(sprite);
  });

  return {
    group,
    update(time, mouseX, mouseY) {
      planes.forEach((plane) => {
        const d = plane.userData;
        plane.position.x = mouseX * d.parallaxFactor * 4;
        plane.position.y = mouseY * d.parallaxFactor * 3 + Math.sin(time * d.floatSpeed + d.floatOffset) * 1.5;
      });
    },
  };
}

function createShootingStars() {
  const group = new THREE.Group();
  const stars = [];
  const count = 6;

  for (let i = 0; i < count; i++) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    const line = new THREE.Line(geo, mat);
    line.userData = {
      active: false,
      timer: Math.random() * 8 + 3,
      speed: 20 + Math.random() * 30,
      length: 3 + Math.random() * 6,
      life: 0,
      maxLife: 1.2 + Math.random() * 1.2,
      startX: 0, startY: 0, startZ: 0,
      dirX: 0, dirY: 0, dirZ: 0,
    };

    group.add(line);
    stars.push(line);
  }

  return {
    group,
    update(time) {
      stars.forEach((star) => {
        const d = star.userData;
        d.timer -= 0.016;

        if (!d.active && d.timer <= 0) {
          d.active = true;
          d.life = 0;
          d.startX = (Math.random() - 0.5) * 50;
          d.startY = 12 + Math.random() * 18;
          d.startZ = -12 - Math.random() * 25;
          d.dirX = (Math.random() - 0.3) * d.speed;
          d.dirY = -d.speed * (0.5 + Math.random() * 0.5);
          d.dirZ = (Math.random() - 0.5) * d.speed * 0.3;
        }

        if (d.active) {
          d.life += 0.016;
          const progress = d.life / d.maxLife;
          const fade = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;

          const headX = d.startX + d.dirX * d.life;
          const headY = d.startY + d.dirY * d.life;
          const headZ = d.startZ + d.dirZ * d.life;

          const tailX = headX - d.dirX * d.length * 0.04;
          const tailY = headY - d.dirY * d.length * 0.04;
          const tailZ = headZ - d.dirZ * d.length * 0.04;

          const pos = star.geometry.attributes.position.array;
          pos[0] = headX; pos[1] = headY; pos[2] = headZ;
          pos[3] = tailX; pos[4] = tailY; pos[5] = tailZ;
          star.geometry.attributes.position.needsUpdate = true;

          star.material.opacity = fade * 0.9;

          if (d.life >= d.maxLife) {
            d.active = false;
            d.timer = Math.random() * 6 + 3;
            star.material.opacity = 0;
          }
        }
      });
    },
  };
}

function createWarpParticles() {
  const count = 2000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const life = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 2] = -20 - Math.random() * 80;
    velocities[i * 3] = 0;
    velocities[i * 3 + 1] = 0;
    velocities[i * 3 + 2] = 0;
    life[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.15,
    color: 0x4488ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    map: starGlowTexture(),
  });

  const points = new THREE.Points(geometry, material);

  const posAttr = geometry.attributes.position;

  return {
    group: points,
    update(time, intensity) {
      material.opacity = intensity * 0.6;
      material.size = 0.1 + intensity * 0.3;

      if (intensity < 0.01) return;

      const pos = posAttr.array;
      const speed = intensity * 80;

      for (let i = 0; i < count; i++) {
        pos[i * 3 + 2] += speed * 0.016 * (0.5 + life[i]);
        pos[i * 3] += Math.sin(time + i) * 0.02 * intensity;
        pos[i * 3 + 1] += Math.cos(time + i * 0.7) * 0.01 * intensity;

        if (pos[i * 3 + 2] > 20) {
          pos[i * 3] = (Math.random() - 0.5) * 100;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
          pos[i * 3 + 2] = -20 - Math.random() * 80;
          life[i] = Math.random();
        }
      }
      posAttr.needsUpdate = true;
    },
  };
}

let _nebulaTexture = null;
function nebulaTexture() {
  if (_nebulaTexture) return _nebulaTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.05, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.2, 'rgba(220,220,255,0.5)');
  g.addColorStop(0.5, 'rgba(180,180,255,0.2)');
  g.addColorStop(0.8, 'rgba(150,150,255,0.05)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 128;
    const x = 128 + Math.cos(angle) * radius;
    const y = 128 + Math.sin(angle) * radius;
    const size = 2 + Math.random() * 12;
    const alpha = 0.05 + Math.random() * 0.35;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,200,255,${alpha})`;
    ctx.fill();
  }

  _nebulaTexture = new THREE.CanvasTexture(canvas);
  return _nebulaTexture;
}

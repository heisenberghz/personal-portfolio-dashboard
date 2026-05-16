import * as THREE from 'three';

export function createPlanets(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const sunLight = new THREE.DirectionalLight(0xe0e8ff, 5.0);
  sunLight.position.set(16, 8, 12);
  group.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0x3355aa, 0.35);
  rimLight.position.set(-14, -5, -10);
  group.add(rimLight);

  const planetData = [
    {
      offsetX: -9,
      offsetY: -3.5,
      size: 6.5,
      color: 0x0a1030,
      accentColor: 0x2244aa,
      speed: 0.25,
      tilt: 0.15,
      atmosphereColor: 0x4488ff,
      atmosphereIntensity: 0.3,
      surfaceDetail: 'gasGiant',
      hasRing: true,
      ringColor: 0x8899bb,
      ringTiltX: Math.PI * 0.42,
      ringTiltZ: 0.25,
    },
    {
      offsetX: 14,
      offsetY: 2,
      size: 1.6,
      color: 0x0a1525,
      accentColor: 0x1a3366,
      speed: 0.18,
      tilt: 0.25,
      atmosphereColor: 0x3366aa,
      atmosphereIntensity: 0.15,
      surfaceDetail: 'gas',
      ringColor: 0x223355,
    },
    {
      offsetX: 20,
      offsetY: -1,
      size: 2.0,
      color: 0x151008,
      accentColor: 0x554433,
      speed: 0.12,
      tilt: 0.35,
      atmosphereColor: 0x776655,
      atmosphereIntensity: 0.12,
      surfaceDetail: 'rocky',
      ringColor: 0x554433,
    },
  ];

  const planets = [];

  planetData.forEach((data, index) => {
    const planetGroup = new THREE.Group();

    const geometry = new THREE.SphereGeometry(data.size, 128, 128);
    const material = createSurfaceMaterial(data);
    const planet = new THREE.Mesh(geometry, material);
    planet.rotation.z = data.tilt;
    planetGroup.add(planet);

    const atmosphere = createAtmosphere(data);
    planet.add(atmosphere);

    const outerGlow = createOuterGlow(data);
    planet.add(outerGlow);

    if (data.hasRing) {
      const ring = createCinematicRing(data);
      planet.add(ring);
    }

    const orbitLine = createOrbitLine(data);
    group.add(orbitLine);

    planetGroup.position.set(data.offsetX, data.offsetY, 0);
    group.add(planetGroup);

    planets.push({
      group: planetGroup,
      mesh: planet,
      data,
      index,
      angle: 0,
    });
  });

  return {
    group,
    update(time, scrollProgress) {
      const windowWidth = window.innerWidth;
      const scaleMultiplier = Math.min(windowWidth / 1920, 1) * 0.7 + 0.6;

      planets.forEach((p) => {
        p.angle += p.data.speed * 0.006;

        const baseX = p.data.offsetX;
        const baseY = p.data.offsetY;

        if (p.index === 0) {
          p.group.position.x = baseX + Math.sin(p.angle) * 0.5;
          p.group.position.y = baseY + Math.sin(p.angle * 0.4) * 0.3;
        } else {
          p.group.position.x = baseX + Math.cos(p.angle) * p.data.offsetX * 0.08;
          p.group.position.z = Math.sin(p.angle) * p.data.offsetX * 0.04;
          p.group.position.y = baseY + Math.sin(p.angle * 0.5) * 0.8;
        }

        p.mesh.rotation.y += 0.002;

        const depthFade = 0.8 + 0.2 * Math.sin(p.angle + time * 0.1);
        p.group.scale.setScalar(scaleMultiplier * depthFade);

        const scrollFade = 1 - scrollProgress * 0.15;
        p.group.visible = scrollFade > 0.05;
      });
    },
  };
}

function createSurfaceMaterial(data) {
  return new THREE.ShaderMaterial({
    vertexShader: planetVertex,
    fragmentShader: planetFragment,
    uniforms: {
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color(data.color) },
      uAccentColor: { value: new THREE.Color(data.accentColor) },
      uAtmosphereColor: { value: new THREE.Color(data.atmosphereColor) },
      uLightDir: { value: new THREE.Vector3(0.7, 0.3, 0.5).normalize() },
    },
  });
}

function createAtmosphere(data) {
  const geo = new THREE.SphereGeometry(data.size * 1.12, 64, 64);
  const mat = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertex,
    fragmentShader: atmosphereFragment,
    uniforms: {
      uColor: { value: new THREE.Color(data.atmosphereColor) },
      uIntensity: { value: data.atmosphereIntensity },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  return new THREE.Mesh(geo, mat);
}

function createOuterGlow(data) {
  const geo = new THREE.SphereGeometry(data.size * 1.7, 32, 32);
  const mat = new THREE.ShaderMaterial({
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    uniforms: {
      uColor: { value: new THREE.Color(data.atmosphereColor) },
      uIntensity: { value: 0.1 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
  });
  return new THREE.Mesh(geo, mat);
}

function createCinematicRing(data) {
  const innerRadius = data.size * 1.4;
  const outerRadius = data.size * 4.5;
  const segments = 512;

  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, segments, 1);

  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  const baseColor = new THREE.Color(data.ringColor);
  const r = Math.floor(baseColor.r * 255);
  const g = Math.floor(baseColor.g * 255);
  const b = Math.floor(baseColor.b * 255);

  ctx.clearRect(0, 0, 4096, 1);

  const bands = [
    { start: 0.000, end: 0.015, alpha: 0.0 },
    { start: 0.015, end: 0.040, alpha: 0.08 },
    { start: 0.040, end: 0.050, alpha: 0.0 },
    { start: 0.050, end: 0.085, alpha: 0.18 },
    { start: 0.085, end: 0.095, alpha: 0.02 },
    { start: 0.095, end: 0.135, alpha: 0.32 },
    { start: 0.135, end: 0.145, alpha: 0.0 },
    { start: 0.145, end: 0.190, alpha: 0.45 },
    { start: 0.190, end: 0.200, alpha: 0.05 },
    { start: 0.200, end: 0.250, alpha: 0.55 },
    { start: 0.250, end: 0.260, alpha: 0.0 },
    { start: 0.260, end: 0.310, alpha: 0.48 },
    { start: 0.310, end: 0.320, alpha: 0.02 },
    { start: 0.320, end: 0.370, alpha: 0.52 },
    { start: 0.370, end: 0.380, alpha: 0.0 },
    { start: 0.380, end: 0.430, alpha: 0.42 },
    { start: 0.430, end: 0.440, alpha: 0.05 },
    { start: 0.440, end: 0.490, alpha: 0.48 },
    { start: 0.490, end: 0.500, alpha: 0.0 },
    { start: 0.500, end: 0.550, alpha: 0.38 },
    { start: 0.550, end: 0.560, alpha: 0.02 },
    { start: 0.560, end: 0.610, alpha: 0.32 },
    { start: 0.610, end: 0.620, alpha: 0.0 },
    { start: 0.620, end: 0.670, alpha: 0.25 },
    { start: 0.670, end: 0.680, alpha: 0.05 },
    { start: 0.680, end: 0.730, alpha: 0.2 },
    { start: 0.730, end: 0.740, alpha: 0.0 },
    { start: 0.740, end: 0.790, alpha: 0.15 },
    { start: 0.790, end: 0.800, alpha: 0.02 },
    { start: 0.800, end: 0.850, alpha: 0.12 },
    { start: 0.850, end: 0.860, alpha: 0.0 },
    { start: 0.860, end: 0.910, alpha: 0.08 },
    { start: 0.910, end: 0.930, alpha: 0.02 },
    { start: 0.930, end: 0.970, alpha: 0.05 },
    { start: 0.970, end: 1.000, alpha: 0.0 },
  ];

  bands.forEach((band) => {
    const x1 = band.start * 4096;
    const x2 = band.end * 4096;
    ctx.fillStyle = `rgba(${r},${g},${b},${band.alpha})`;
    ctx.fillRect(x1, 0, x2 - x1, 1);
  });

  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * 4096;
    const alpha = Math.random() * 0.03;
    ctx.fillStyle = `rgba(200,210,230,${alpha})`;
    ctx.fillRect(x, 0, 1, 1);
  }

  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 4096;
    ctx.strokeStyle = `rgba(${r},${g},${b},${0.02 + Math.random() * 0.06})`;
    ctx.lineWidth = 0.5 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;

  const uvAttr = geometry.attributes.uv;
  const posAttr = geometry.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.sqrt(x * x + y * y);
    const u = (dist - innerRadius) / (outerRadius - innerRadius);
    uvAttr.setXY(i, u, 0.5);
  }
  uvAttr.needsUpdate = true;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65,
    blending: THREE.NormalBlending,
    depthWrite: false,
    roughness: 0.95,
    metalness: 0.05,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = data.ringTiltX || Math.PI * 0.42;
  ring.rotation.z = data.ringTiltZ || 0.25;
  return ring;
}

function createOrbitLine(data) {
  const geometry = new THREE.BufferGeometry();
  const points = [];
  for (let i = 0; i <= 256; i++) {
    const angle = (i / 256) * Math.PI * 2;
    points.push(
      data.offsetX + Math.cos(angle) * 2,
      data.offsetY,
      Math.sin(angle) * 2
    );
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

  const material = new THREE.LineBasicMaterial({
    color: data.atmosphereColor,
    transparent: true,
    opacity: 0.03,
  });

  return new THREE.Line(geometry, material);
}

const planetVertex = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const planetFragment = `
uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uAccentColor;
uniform vec3 uAtmosphereColor;
uniform vec3 uLightDir;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  float band = sin(vUv.y * 16.0 + uTime * 0.04) * 0.5 + 0.5;
  float n = fbm(vUv * 5.0 + uTime * 0.02) * 0.3;
  float n2 = fbm(vUv * 2.5 - uTime * 0.015) * 0.15;
  float pattern = clamp(band + n + n2, 0.0, 1.0);

  vec3 color = mix(uBaseColor, uAccentColor, pattern * 0.5);

  float storm = fbm(vUv * 8.0 + uTime * 0.06) * 0.08;
  color += uAtmosphereColor * storm;

  vec3 lightDir = normalize(uLightDir);
  float diff = max(dot(vNormal, lightDir), 0.0);
  diff = pow(diff, 1.15);

  float ambient = 0.01;
  float lighting = ambient + diff * 0.99;
  color *= lighting;

  float terminator = smoothstep(0.0, 0.06, diff);
  color = mix(color * 0.12, color, terminator);

  float rim = 1.0 - max(dot(vNormal, normalize(vec3(0.0, 0.0, 1.0))), 0.0);
  rim = pow(rim, 4.5);
  color += uAtmosphereColor * rim * 0.08;

  gl_FragColor = vec4(color, 1.0);
}
`;

const atmosphereVertex = `
varying vec3 vNormal;
varying vec3 vViewPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = mvPos.xyz;
  gl_Position = projectionMatrix * mvPos;
}
`;

const atmosphereFragment = `
uniform vec3 uColor;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vViewPosition;
void main() {
  vec3 viewDir = normalize(-vViewPosition);
  float fresnel = 1.0 - abs(dot(viewDir, vNormal));
  fresnel = pow(fresnel, 3.5);
  float alpha = fresnel * uIntensity;
  gl_FragColor = vec4(uColor, alpha);
}
`;

const glowVertex = `
varying vec3 vNormal;
varying vec3 vViewPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = mvPos.xyz;
  gl_Position = projectionMatrix * mvPos;
}
`;

const glowFragment = `
uniform vec3 uColor;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vViewPosition;
void main() {
  vec3 viewDir = normalize(-vViewPosition);
  float fresnel = 1.0 - abs(dot(viewDir, vNormal));
  fresnel = pow(fresnel, 5.0);
  float alpha = fresnel * uIntensity;
  gl_FragColor = vec4(uColor, alpha);
}
`;

import * as THREE from 'three';

export function createPlanets(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const planetData = [
    { radius: 10, size: 1.5, color: 0xff6633, speed: 0.45, tilt: 0.15, emissive: 0x442200, atmosphereColor: 0xff8844, atmosphereIntensity: 0.6, surfaceDetail: 'rocky' },
    { radius: 15, size: 2.0, color: 0x4488ff, speed: 0.3, tilt: 0.25, emissive: 0x002244, atmosphereColor: 0x66aaff, atmosphereIntensity: 0.7, surfaceDetail: 'gas' },
    { radius: 20, size: 2.5, color: 0xddbb88, speed: 0.2, tilt: 0.35, emissive: 0x443322, atmosphereColor: 0xffddaa, atmosphereIntensity: 0.5, hasRing: true, surfaceDetail: 'ringed' },
    { radius: 25, size: 1.3, color: 0xaa66ff, speed: 0.14, tilt: 0.4, emissive: 0x220044, atmosphereColor: 0xcc88ff, atmosphereIntensity: 0.6, surfaceDetail: 'crystal' },
    { radius: 32, size: 3.2, color: 0x44ffaa, speed: 0.09, tilt: 0.1, emissive: 0x004422, atmosphereColor: 0x88ffcc, atmosphereIntensity: 0.5, surfaceDetail: 'gasGiant' },
  ];

  const planets = [];

  planetData.forEach((data, index) => {
    const planetGroup = new THREE.Group();

    const geometry = new THREE.SphereGeometry(data.size, 64, 64);
    const material = createSurfaceMaterial(data);
    const planet = new THREE.Mesh(geometry, material);
    planet.rotation.z = data.tilt;
    planetGroup.add(planet);

    const atmosphere = createAtmosphere(data);
    planet.add(atmosphere);

    const outerGlow = createOuterGlow(data);
    planet.add(outerGlow);

    if (data.hasRing) {
      const ring = createPlanetRing(data);
      planet.add(ring);
    }

    const orbitLine = createOrbitLine(data);
    group.add(orbitLine);

    planetGroup.position.x = data.radius;
    group.add(planetGroup);

    planets.push({
      group: planetGroup,
      mesh: planet,
      data,
      angle: (index / planetData.length) * Math.PI * 2,
    });
  });

  return {
    group,
    update(time, scrollProgress) {
      const windowWidth = window.innerWidth;
      const scaleMultiplier = Math.min(windowWidth / 1920, 1) * 0.9 + 0.5;

      planets.forEach((p) => {
        p.angle += p.data.speed * 0.01;
        p.group.position.x = Math.cos(p.angle) * p.data.radius;
        p.group.position.z = Math.sin(p.angle) * p.data.radius * 0.45;
        p.group.position.y = Math.sin(p.angle * 0.5) * 2.5;

        p.mesh.rotation.y += 0.006;

        const depthFade = 0.7 + 0.3 * Math.sin(p.angle + time * 0.15);
        p.group.scale.setScalar(scaleMultiplier * depthFade);

        const scrollFade = 1 - scrollProgress * 0.35;
        p.group.visible = scrollFade > 0.1;
      });
    },
  };
}

function createSurfaceMaterial(data) {
  if (data.surfaceDetail === 'gas' || data.surfaceDetail === 'gasGiant') {
    return new THREE.ShaderMaterial({
      vertexShader: gasPlanetVertex,
      fragmentShader: gasPlanetFragment,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(data.color) },
        uColor2: { value: new THREE.Color(data.emissive) },
        uAtmosphereColor: { value: new THREE.Color(data.atmosphereColor) },
      },
      transparent: false,
    });
  }

  if (data.surfaceDetail === 'crystal') {
    return new THREE.ShaderMaterial({
      vertexShader: crystalVertex,
      fragmentShader: crystalFragment,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(data.color) },
        uEmissive: { value: new THREE.Color(data.emissive) },
      },
      transparent: true,
      opacity: 0.85,
    });
  }

  return new THREE.MeshStandardMaterial({
    color: data.color,
    emissive: data.emissive,
    emissiveIntensity: 0.15,
    roughness: 0.7,
    metalness: 0.1,
  });
}

function createAtmosphere(data) {
  const geo = new THREE.SphereGeometry(data.size * 1.3, 64, 64);
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
  const geo = new THREE.SphereGeometry(data.size * 2.5, 32, 32);
  const mat = new THREE.ShaderMaterial({
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    uniforms: {
      uColor: { value: new THREE.Color(data.atmosphereColor) },
      uIntensity: { value: 0.3 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
  });
  return new THREE.Mesh(geo, mat);
}

function createPlanetRing(data) {
  const innerRadius = data.size * 1.8;
  const outerRadius = data.size * 3.2;
  const segments = 128;

  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, segments, 12);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 512, 0);
  gradient.addColorStop(0, 'rgba(200,180,150,0)');
  gradient.addColorStop(0.05, 'rgba(200,180,150,0.4)');
  gradient.addColorStop(0.15, 'rgba(200,180,150,0.7)');
  gradient.addColorStop(0.3, 'rgba(180,160,130,0.3)');
  gradient.addColorStop(0.4, 'rgba(220,200,170,0.5)');
  gradient.addColorStop(0.5, 'rgba(220,200,170,0.9)');
  gradient.addColorStop(0.6, 'rgba(180,160,130,0.4)');
  gradient.addColorStop(0.75, 'rgba(200,180,150,0.6)');
  gradient.addColorStop(0.9, 'rgba(200,180,150,0.3)');
  gradient.addColorStop(1, 'rgba(200,180,150,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 64);

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 64;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    ctx.fillRect(x, y, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = Math.PI * 0.42;
  ring.rotation.z = 0.25;
  return ring;
}

function createOrbitLine(data) {
  const geometry = new THREE.BufferGeometry();
  const points = [];
  for (let i = 0; i <= 256; i++) {
    const angle = (i / 256) * Math.PI * 2;
    points.push(
      Math.cos(angle) * data.radius,
      Math.sin(angle * 2) * 0.4,
      Math.sin(angle) * data.radius * 0.45
    );
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

  const material = new THREE.LineBasicMaterial({
    color: data.atmosphereColor,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Line(geometry, material);
}

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
  fresnel = pow(fresnel, 1.8);
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
  fresnel = pow(fresnel, 2.0);
  float alpha = fresnel * uIntensity;
  gl_FragColor = vec4(uColor, alpha);
}
`;

const gasPlanetVertex = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const gasPlanetFragment = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uAtmosphereColor;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  float band = sin(vUv.y * 25.0 + uTime * 0.15) * 0.5 + 0.5;
  float n = noise(vUv * 10.0 + uTime * 0.08) * 0.35;
  float n2 = noise(vUv * 5.0 - uTime * 0.05) * 0.2;
  float pattern = band + n + n2;

  vec3 color = mix(uColor2, uColor1, pattern);
  color = mix(color, uAtmosphereColor, 0.08);

  vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
  float diff = max(dot(vNormal, lightDir), 0.0) * 0.5 + 0.5;
  color *= diff;

  float storm = noise(vUv * 15.0 + uTime * 0.2) * 0.05;
  color += uAtmosphereColor * storm;

  gl_FragColor = vec4(color, 1.0);
}
`;

const crystalVertex = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
uniform float uTime;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec3 pos = position;
  float displacement = sin(pos.x * 6.0 + uTime * 1.2) * sin(pos.y * 6.0 + uTime * 0.8) * 0.03;
  pos += normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const crystalFragment = `
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uEmissive;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  float facet = fract(sin(dot(vNormal.xy, vec2(12.9898, 78.233))) * 43758.5453);
  float sparkle = pow(facet, 6.0) * (sin(uTime * 3.0 + vPosition.x * 12.0) * 0.5 + 0.5);
  float sparkle2 = pow(1.0 - facet, 8.0) * (sin(uTime * 2.5 + vPosition.z * 10.0) * 0.5 + 0.5);

  vec3 color = mix(uColor, uEmissive, 0.15);
  color += vec3(sparkle + sparkle2) * 0.25;

  float iridescence = sin(vNormal.x * 10.0 + uTime) * 0.5 + 0.5;
  color += vec3(iridescence, 1.0 - iridescence, iridescence * 0.5) * 0.06;

  float alpha = 0.7 + (sparkle + sparkle2) * 0.1;
  gl_FragColor = vec4(color, alpha);
}
`;

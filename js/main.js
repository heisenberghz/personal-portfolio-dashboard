import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createGalaxy } from './galaxy.js';
import { createPlanets } from './planets.js';
import { createCards } from './cards.js';
import { setupScroll } from './scroll.js';

let audio = null;
try {
  const audioMod = await import('./audio.js');
  audio = audioMod.setupAudio();
} catch (e) {
  console.warn('Audio module failed to load:', e);
}

const loadingScreen = document.getElementById('loading-screen');
const loaderBar = document.querySelector('.loader-bar');

function setProgress(pct) {
  loaderBar.style.width = pct + '%';
}

setProgress(10);

const container = document.getElementById('canvas-container');

setProgress(25);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020208);
scene.fog = new THREE.FogExp2(0x020208, 0.008);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 5, 24);

setProgress(40);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

setProgress(55);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,
  0.5,
  0.2,
);
bloomPass.threshold = 0.45;
bloomPass.strength = 0.5;
bloomPass.radius = 0.3;
composer.addPass(bloomPass);

const vignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    darkness: { value: 1.2 },
    offset: { value: 1.1 },
    scrollWarp: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float darkness;
    uniform float offset;
    uniform float scrollWarp;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      float vig = 1.0 - dot(uv, uv);
      vig = clamp(pow(vig, darkness), 0.0, 1.0);
      vec3 col = texel.rgb * vig;
      col += vec3(0.02, 0.01, 0.04) * (1.0 - vig);
      float warpFlash = scrollWarp * 0.15;
      col += vec3(0.0, 0.15, 0.2) * warpFlash * (1.0 - vig);
      col = pow(col, vec3(0.95));
      col = mix(col, col * col * 3.0, 0.05);
      gl_FragColor = vec4(col, texel.a);
    }
  `,
};
const vignettePass = new ShaderPass(vignetteShader);
composer.addPass(vignettePass);

setProgress(70);

const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x8888ff, 0.6);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const pointLight1 = new THREE.PointLight(0x4466ff, 2, 50);
pointLight1.position.set(0, 0, 0);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff44aa, 1.2, 40);
pointLight2.position.set(-10, 5, -12);
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0x44ffaa, 1, 35);
pointLight3.position.set(10, -3, -10);
scene.add(pointLight3);

const pointLight4 = new THREE.PointLight(0xff8844, 0.8, 30);
pointLight4.position.set(0, 8, -15);
scene.add(pointLight4);

setProgress(80);

const galaxy = createGalaxy(scene);
const planets = createPlanets(scene);
const cards = createCards(scene, camera);
const scroll = setupScroll();

setProgress(90);

const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, smoothX: 0, smoothY: 0 };
document.addEventListener('mousemove', (e) => {
  mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
});

const cameraPath = [
  { pos: new THREE.Vector3(0, 5, 24), target: new THREE.Vector3(0, 0, 0) },
  { pos: new THREE.Vector3(14, 5, 18), target: new THREE.Vector3(0, -1, -3) },
  { pos: new THREE.Vector3(0, 14, 16), target: new THREE.Vector3(0, 1, -5) },
  { pos: new THREE.Vector3(0, 3, 9), target: new THREE.Vector3(0, 0.5, 0) },
  { pos: new THREE.Vector3(-12, 6, 20), target: new THREE.Vector3(0, 0, -4) },
  { pos: new THREE.Vector3(0, 18, 32), target: new THREE.Vector3(0, 0, -8) },
];

const currentPos = camera.position.clone();
const currentTarget = new THREE.Vector3(0, 0, 0);

function getCameraTarget(progress) {
  const idx = progress * (cameraPath.length - 1);
  const i = Math.min(Math.floor(idx), cameraPath.length - 2);
  const t = Math.min(Math.max(idx - i, 0), 1);
  const st = t * t * (3 - 2 * t);
  const p1 = cameraPath[i];
  const p2 = cameraPath[Math.min(i + 1, cameraPath.length - 1)];
  return {
    pos: new THREE.Vector3().lerpVectors(p1.pos, p2.pos, st),
    target: new THREE.Vector3().lerpVectors(p1.target, p2.target, st),
  };
}

setProgress(95);

const clock = new THREE.Clock();
let prevScroll = 0;
let warpIntensity = 0;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  const scrollProgress = scroll.getProgress();

  const scrollDelta = Math.abs(scrollProgress - prevScroll);
  prevScroll = scrollProgress;
  warpIntensity = Math.min(warpIntensity + scrollDelta * 8, 1);
  warpIntensity *= 0.96;

  mouse.x += (mouse.targetX - mouse.x) * 0.06;
  mouse.y += (mouse.targetY - mouse.y) * 0.06;
  mouse.smoothX += (mouse.targetX - mouse.smoothX) * 0.035;
  mouse.smoothY += (mouse.targetY - mouse.smoothY) * 0.035;

  const driftX = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.07) * 1.2;
  const driftY = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.04 + 1.3) * 0.6;
  const driftZ = prefersReducedMotion ? 0 : Math.cos(elapsed * 0.025) * 0.5;

  const camTarget = getCameraTarget(scrollProgress);
  const parallaxOffset = new THREE.Vector3(
    mouse.smoothX * 4.0 + driftX,
    mouse.smoothY * 3.0 + 1.5 + driftY,
    driftZ,
  );
  const targetPos = camTarget.pos.clone().add(parallaxOffset);

  currentPos.lerp(targetPos, 0.045);
  currentTarget.lerp(camTarget.target, 0.055);

  const depthOffset = prefersReducedMotion ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(
    Math.sin(elapsed * 0.13) * 0.6,
    Math.cos(elapsed * 0.1) * 0.35,
    Math.sin(elapsed * 0.07) * 0.8,
  );
  camera.position.copy(currentPos).add(depthOffset);
  camera.lookAt(currentTarget);

  galaxy.update(elapsed, mouse.x, mouse.y, scrollProgress, warpIntensity);
  planets.update(elapsed, scrollProgress);
  cards.update(elapsed, scrollProgress);

  pointLight1.intensity = 4 + Math.sin(elapsed * 0.5) * 1;
  pointLight2.intensity = 2.5 + Math.sin(elapsed * 0.7 + 1) * 0.8;

  bloomPass.strength = 0.5 + warpIntensity * 0.3;
  vignettePass.uniforms.scrollWarp.value = warpIntensity;

  renderer.render(scene, camera);
  composer.render();
}

setProgress(100);

let started = false;

function startApp() {
  if (started) return;
  started = true;
  loadingScreen.classList.add('hidden');
  animate();
}

setTimeout(() => startApp(), 800);

setTimeout(() => startApp(), 5000);

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloomPass.resolution.set(w, h);
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

const cursor = document.getElementById('custom-cursor');
const trail = document.getElementById('cursor-trail');
if (cursor && trail && !prefersReducedMotion) {
  let cursorX = 0, cursorY = 0;
  let trailX = 0, trailY = 0;

  document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
  });

  function updateCursor() {
    trailX += (cursorX - trailX) * 0.15;
    trailY += (cursorY - trailY) * 0.15;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    trail.style.left = trailX + 'px';
    trail.style.top = trailY + 'px';
    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  const hoverTargets = document.querySelectorAll('a, button, .about-card, .contact-btn');
  hoverTargets.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });
} else if (cursor) {
  cursor.style.display = 'none';
}
if (trail && prefersReducedMotion) {
  trail.style.display = 'none';
}

const scrollProgressEl = document.getElementById('scroll-progress');
if (scrollProgressEl) {
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgressEl.style.width = scrollPercent + '%';
  });
}

const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 600) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

const audioToggle = document.getElementById('audio-toggle');
if (audioToggle && audio) {
  audioToggle.addEventListener('click', () => {
    audio.toggle();
    audioToggle.classList.toggle('active', audio.isPlaying);
    audioToggle.querySelector('.audio-icon').textContent = audio.isPlaying ? '\u{1F50A}' : '\u{1F507}';
  });
} else if (audioToggle) {
  audioToggle.style.display = 'none';
}

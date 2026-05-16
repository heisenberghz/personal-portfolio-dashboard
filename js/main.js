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
scene.background = new THREE.Color(0x030510);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 2, 24);

setProgress(40);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

setProgress(55);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.2,
  0.7,
  0.08,
);
bloomPass.threshold = 0.65;
bloomPass.strength = 0.2;
bloomPass.radius = 0.15;
composer.addPass(bloomPass);

setProgress(70);

const ambientLight = new THREE.AmbientLight(0x0a0a1a, 0.015);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xe0e8ff, 4.5);
sunLight.position.set(14, 6, 10);
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0x3355aa, 0.3);
rimLight.position.set(-10, -4, -8);
scene.add(rimLight);

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
  { pos: new THREE.Vector3(5, 2, 24), target: new THREE.Vector3(-4, -1, 0) },
  { pos: new THREE.Vector3(14, 4, 20), target: new THREE.Vector3(0, 0, -2) },
  { pos: new THREE.Vector3(2, 10, 18), target: new THREE.Vector3(0, 0, -4) },
  { pos: new THREE.Vector3(2, 1, 12), target: new THREE.Vector3(-2, 0, 0) },
  { pos: new THREE.Vector3(-8, 5, 22), target: new THREE.Vector3(0, 0, -3) },
  { pos: new THREE.Vector3(3, 14, 30), target: new THREE.Vector3(0, 0, -6) },
];

const currentPos = camera.position.clone();
const currentTarget = new THREE.Vector3(-4, -1, 0);

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

  const driftX = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.07) * 0.6;
  const driftY = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.04 + 1.3) * 0.3;
  const driftZ = prefersReducedMotion ? 0 : Math.cos(elapsed * 0.025) * 0.2;

  const camTarget = getCameraTarget(scrollProgress);
  const parallaxOffset = new THREE.Vector3(
    mouse.smoothX * 2.5 + driftX,
    mouse.smoothY * 1.5 + 0.3 + driftY,
    driftZ,
  );
  const targetPos = camTarget.pos.clone().add(parallaxOffset);

  currentPos.lerp(targetPos, 0.04);
  currentTarget.lerp(camTarget.target, 0.05);

  const depthOffset = prefersReducedMotion ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(
    Math.sin(elapsed * 0.13) * 0.3,
    Math.cos(elapsed * 0.1) * 0.15,
    Math.sin(elapsed * 0.07) * 0.4,
  );
  camera.position.copy(currentPos).add(depthOffset);
  camera.lookAt(currentTarget);

  galaxy.update(elapsed, mouse.x, mouse.y, scrollProgress, warpIntensity);
  planets.update(elapsed, scrollProgress);
  cards.update(elapsed, scrollProgress);

  bloomPass.strength = 0.2 + warpIntensity * 0.08;

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
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

const cursorDot = document.getElementById('custom-cursor-dot');
const cursorRing = document.getElementById('custom-cursor-ring');

if (cursorDot && cursorRing && !prefersReducedMotion) {
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  const ringLag = 0.12;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
  });

  function animateRing() {
    ringX += (mouseX - ringX) * ringLag;
    ringY += (mouseY - ringY) * ringLag;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  const hoverTargets = document.querySelectorAll('a, button, .project-card, .cert-card, .about-card, .contact-btn, input, textarea, select, [role="button"]');
  hoverTargets.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursorRing.classList.add('hovering');
      cursorDot.classList.add('hovering');
    });
    el.addEventListener('mouseleave', () => {
      cursorRing.classList.remove('hovering');
      cursorDot.classList.remove('hovering');
    });
  });
} else {
  if (cursorDot) cursorDot.style.display = 'none';
  if (cursorRing) cursorRing.style.display = 'none';
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

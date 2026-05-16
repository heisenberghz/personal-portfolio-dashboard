import * as THREE from 'three';

const projectData = [
  { title: 'Fake News Detection', desc: 'Built a fake news classifier using LLaMA 3.2 (3B) with prompt engineering and CPU-based inference via llama-cpp-python', tags: ['LLaMA 3.2', 'Python', 'NLP'], color: '#00f5ff', icon: '\u25C8' },
  { title: 'Twitter Sentiment Analysis', desc: 'Developed sentiment classification using Logistic Regression and Naive Bayes with TF-IDF feature extraction', tags: ['Scikit-learn', 'TF-IDF', 'ML'], color: '#ff44ff', icon: '\u25C9' },
  { title: 'Deloitte Analytics Sim', desc: 'Created Tableau dashboards and used Excel for business data analysis and forensic technology tasks', tags: ['Tableau', 'Excel', 'Analytics'], color: '#00ff88', icon: '\u25C6' },
];

export function createCards(scene, camera) {
  const group = new THREE.Group();
  scene.add(group);

  const cards = [];
  const cardPositions = [];

  const radius = 8;
  const count = projectData.length;

  projectData.forEach((project, i) => {
    const angle = (i / count) * Math.PI * 0.8 - Math.PI * 0.4;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius - 4;
    const y = (i - (count - 1) / 2) * 0.5;
    cardPositions.push({ x, y, z, angle, baseY: y });
  });

  projectData.forEach((project, i) => {
    const texture = createCardTexture(project);
    const geometry = new THREE.PlaneGeometry(4.0, 2.6, 1, 1);

    const material = new THREE.ShaderMaterial({
      vertexShader: cardVertexShader,
      fragmentShader: cardFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(project.color) },
        uHover: { value: 0 },
        uTexture: { value: texture },
        uOpacity: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uTilt: { value: new THREE.Vector2(0, 0) },
      },
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    const pos = cardPositions[i];
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.userData = {
      index: i,
      project,
      targetHover: 0,
      floatOffset: Math.random() * Math.PI * 2,
      currentTiltX: 0,
      currentTiltY: 0,
    };
    group.add(mesh);

    const glowGeo = new THREE.PlaneGeometry(5.2, 3.4);
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      uniforms: {
        uColor: { value: new THREE.Color(project.color) },
        uIntensity: { value: 0 },
        uTime: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.z = -0.2;
    mesh.add(glowMesh);

    const borderGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(4.1, 2.7));
    const borderMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(project.color),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const borderLine = new THREE.LineSegments(borderGeo, borderMat);
    borderLine.position.z = 0.03;
    mesh.add(borderLine);

    cards.push({ mesh, glowMesh, borderLine, material, glowMat, borderMat });
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredCard = null;
  let pointerDownPos = { x: 0, y: 0 };
  let isClick = false;

  const canvas = document.getElementById('canvas-container');

  canvas.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (hoveredCard !== null) {
      const card = cards[hoveredCard];
      const rect = canvas.getBoundingClientRect();
      const localX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const localY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      card.mesh.userData.targetTiltX = localY * 0.35;
      card.mesh.userData.targetTiltY = -localX * 0.35;
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    pointerDownPos.x = e.clientX;
    pointerDownPos.y = e.clientY;
    isClick = true;
  });

  canvas.addEventListener('pointerup', (e) => {
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      isClick = false;
      return;
    }
    if (isClick && hoveredCard !== null) {
      const data = cards[hoveredCard].mesh.userData.project;
      showProjectModal(data);
    }
    isClick = false;
  });

  return {
    group,
    cards,
    update(time, scrollProgress) {
      const cardReveal = Math.max(0, Math.min(1, (scrollProgress - 0.32) / 0.28));

      cards.forEach((c, i) => {
        const pos = cardPositions[i];
        const floatY = Math.sin(time * 0.9 + c.mesh.userData.floatOffset) * 0.35;
        const floatX = Math.cos(time * 0.6 + c.mesh.userData.floatOffset * 1.5) * 0.18;
        c.mesh.position.y = pos.baseY + floatY;
        c.mesh.position.x = pos.x + floatX;

        const angleToCamera = Math.atan2(
          camera.position.x - c.mesh.position.x,
          camera.position.z - c.mesh.position.z
        );
        c.mesh.rotation.y = -angleToCamera + Math.PI;

        const targetTiltX = c.mesh.userData.targetTiltX || 0;
        const targetTiltY = c.mesh.userData.targetTiltY || 0;
        c.mesh.userData.currentTiltX += (targetTiltX - c.mesh.userData.currentTiltX) * 0.12;
        c.mesh.userData.currentTiltY += (targetTiltY - c.mesh.userData.currentTiltY) * 0.12;

        c.mesh.rotation.x = c.mesh.userData.currentTiltX * c.mesh.userData.targetHover;
        c.mesh.rotation.z = -c.mesh.userData.currentTiltY * c.mesh.userData.targetHover * 0.7;

        const hoverVal = c.mesh.userData.targetHover;
        c.mesh.userData.targetHover += (0 - c.mesh.userData.targetHover) * 0.07;

        c.material.uniforms.uTime.value = time;
        c.material.uniforms.uHover.value = hoverVal;
        c.material.uniforms.uTilt.value.set(c.mesh.userData.currentTiltX, c.mesh.userData.currentTiltY);

        const revealProgress = Math.max(0, Math.min(1, cardReveal * 3 - i * 0.35));
        c.material.uniforms.uOpacity.value = revealProgress;
        c.glowMat.uniforms.uIntensity.value = revealProgress * 0.4 + hoverVal * 0.8;
        c.glowMat.uniforms.uTime.value = time;
        c.borderMat.opacity = revealProgress * 0.5 + hoverVal * 0.9;

        const scale = 0.75 + revealProgress * 0.25 + hoverVal * 0.18;
        c.mesh.scale.set(scale, scale, 1);
        c.glowMesh.scale.set(1 + hoverVal * 0.25, 1 + hoverVal * 0.25, 1);
      });

      raycaster.setFromCamera(pointer, camera);
      const meshes = cards.map((c) => c.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      cards.forEach((c, i) => {
        c.mesh.userData.targetHover = 0;
        c.mesh.userData.targetTiltX = 0;
        c.mesh.userData.targetTiltY = 0;
      });

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const idx = cards.findIndex((c) => c.mesh === hit);
        if (idx >= 0) {
          cards[idx].mesh.userData.targetHover = 1;
          hoveredCard = idx;
          canvas.style.cursor = 'pointer';
        }
      } else {
        hoveredCard = null;
        canvas.style.cursor = 'default';
      }
    },
    getCards: () => cards,
  };
}

function createCardTexture(project) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  const bgGrad = ctx.createRadialGradient(512, 320, 0, 512, 320, 650);
  bgGrad.addColorStop(0, 'rgba(18, 18, 50, 0.96)');
  bgGrad.addColorStop(0.4, 'rgba(12, 12, 35, 0.94)');
  bgGrad.addColorStop(1, 'rgba(6, 6, 22, 0.96)');
  ctx.fillStyle = bgGrad;
  roundRect(ctx, 0, 0, 1024, 640, 32, true, false);

  ctx.strokeStyle = project.color;
  ctx.lineWidth = 5;
  ctx.shadowColor = project.color;
  ctx.shadowBlur = 35;
  roundRect(ctx, 4, 4, 1016, 632, 30, false, true);
  ctx.shadowBlur = 0;

  const shineGrad = ctx.createLinearGradient(0, 0, 1024, 640);
  shineGrad.addColorStop(0, 'rgba(255,255,255,0)');
  shineGrad.addColorStop(0.25, 'rgba(255,255,255,0.04)');
  shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
  shineGrad.addColorStop(0.75, 'rgba(255,255,255,0.04)');
  shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shineGrad;
  roundRect(ctx, 4, 4, 1016, 632, 30, true, false);

  ctx.fillStyle = project.color;
  ctx.shadowColor = project.color;
  ctx.shadowBlur = 25;
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillText(`${project.icon} PROJECT_${String(projectData.indexOf(project) + 1).padStart(2, '0')}`, 48, 85);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px "Segoe UI", "Helvetica Neue", sans-serif';
  ctx.shadowColor = project.color;
  ctx.shadowBlur = 20;
  ctx.fillText(project.title, 48, 170);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '26px "Segoe UI", "Helvetica Neue", sans-serif';
  ctx.fillText(project.desc, 48, 230);

  const lineGrad = ctx.createLinearGradient(48, 265, 580, 265);
  lineGrad.addColorStop(0, project.color);
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 3;
  ctx.shadowColor = project.color;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(48, 265);
  ctx.lineTo(580, 265);
  ctx.stroke();
  ctx.shadowBlur = 0;

  project.tags.forEach((tag, i) => {
    const x = 48 + i * 135;
    const y = 315;
    ctx.fillStyle = 'rgba(10,10,30,0.75)';
    roundRect(ctx, x - 4, y - 4, 120, 42, 10, true, false);
    ctx.strokeStyle = project.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = project.color;
    ctx.shadowBlur = 15;
    roundRect(ctx, x - 4, y - 4, 120, 42, 10, false, true);
    ctx.shadowBlur = 0;
    ctx.fillStyle = project.color;
    ctx.font = 'bold 17px "Courier New", monospace';
    ctx.fillText(tag, x + 10, y + 28);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.font = '18px "Courier New", monospace';
  ctx.fillText('[ Click to explore \u2192 ]', 48, 550);

  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.font = '160px "Courier New", monospace';
  ctx.fillText('{}', 780, 200);

  const gridGrad = ctx.createLinearGradient(0, 430, 0, 640);
  gridGrad.addColorStop(0, 'transparent');
  gridGrad.addColorStop(1, 'rgba(0,245,255,0.05)');
  ctx.fillStyle = gridGrad;
  ctx.fillRect(0, 430, 1024, 210);

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 1024;
    const y = 430 + Math.random() * 210;
    const size = Math.random() * 2.5;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
    ctx.fillRect(x, y, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function showProjectModal(project) {
  const existing = document.querySelector('.project-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'project-modal-overlay';
  overlay.innerHTML = `
    <div class="project-modal">
      <button class="modal-close">&times;</button>
      <h2>${project.title}</h2>
      <p>${project.desc}</p>
      <div class="modal-tags">
        ${project.tags.map(t => `<span>${t}</span>`).join('')}
      </div>
      <a href="#" class="modal-link">View Project \u2192</a>
    </div>
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('active'));

  overlay.querySelector('.modal-close').addEventListener('click', () => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  });
}

const cardVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
uniform vec2 uTilt;

void main() {
  vUv = uv;
  vec3 pos = position;
  pos.z += sin(pos.x * 4.0 + pos.y * 4.0) * 0.04;
  pos.x += uTilt.y * 0.2;
  pos.y += uTilt.x * 0.2;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewPosition = mvPosition.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const cardFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
uniform float uHover;
uniform sampler2D uTexture;
uniform float uOpacity;
uniform vec2 uTilt;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec4 texColor = texture2D(uTexture, vUv);
  float alpha = texColor.a;
  if (alpha < 0.02) discard;

  float scanLine = sin(vUv.y * 150.0 + uTime * 6.0) * 0.12 + 0.88;
  float scanLine2 = sin(vUv.x * 120.0 + uTime * 3.5) * 0.08 + 0.92;

  vec3 viewDir = normalize(-vViewPosition);
  float fresnel = 1.0 - abs(dot(viewDir, vNormal));
  fresnel = pow(fresnel, 1.2);

  float shine = pow(max(dot(viewDir, normalize(vec3(uTilt, 1.0))), 0.0), 2.0);
  shine *= uHover;

  vec3 texColorAdj = texColor.rgb * (0.82 + 0.18 * sin(uTime * 0.7 + vUv.x * 14.0));
  vec3 glowCol = uColor;
  vec3 finalColor = mix(texColorAdj, glowCol, 0.2 + uHover * 0.5);
  finalColor *= scanLine * scanLine2;
  finalColor += glowCol * fresnel * 0.7 * (0.3 + uHover * 0.7);
  finalColor += vec3(1.0) * shine * 0.5;
  finalColor += texColorAdj * 0.12 * sin(uTime * 3.0 + vUv.y * 40.0);

  float holographic = sin(vUv.x * 25.0 + uTime * 2.5) * sin(vUv.y * 18.0 - uTime * 1.8) * 0.5 + 0.5;
  finalColor += uColor * holographic * 0.1 * (0.4 + uHover * 0.6);

  float sweep = pow(max(0.0, sin(vUv.x * 3.14159 + uTime * 1.2)), 12.0);
  finalColor += vec3(1.0) * sweep * 0.15 * (0.3 + uHover * 0.7);

  float finalAlpha = mix(alpha, 1.0, fresnel * 0.6) * uOpacity;
  finalAlpha *= 0.8 + 0.2 * sin(uTime * 2.0 + vUv.y * 7.0);

  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

const glowVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const glowFragment = `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
varying vec2 vUv;
void main() {
  float dist = length(vUv - 0.5) * 2.0;
  float glow = 1.0 - smoothstep(0.15, 1.0, dist);
  glow = pow(glow, 1.5);
  float pulse = 0.6 + 0.4 * sin(uTime * 3.0);
  float sweep = pow(max(0.0, sin(vUv.x * 3.14159 + uTime * 1.8)), 6.0) * 0.4;
  float sweep2 = pow(max(0.0, sin(vUv.y * 3.14159 - uTime * 1.2)), 8.0) * 0.2;
  gl_FragColor = vec4(uColor, (glow + sweep + sweep2) * uIntensity * pulse);
}
`;

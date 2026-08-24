/**
 * NEXUS 3D Subterranean Holographic Digital Twin (Three.js)
 * Features:
 * - Dual 3D Hexapod Spider Robots: R01 Spidy Scout (Purple) & R02 Spidy Standby (Amber-Gold)
 * - Articulated 6-leg alternating tripod crawling gait for both spiders
 * - Continuous animated moving 3D workers along drift trajectories
 * - Dedicated 3D Surface Rescue Team Ingress Path Tube + Worker Egress Route Tube
 * - Floating 3D Billboards & Spidy Reconnaissance Intelligence Tags
 */

import * as THREE from 'three';
import { MINE_TOPOGRAPHY, state } from '../engine/state.js';
import { soundEngine } from '../engine/sound_engine.js';

export class DigitalTwin3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.workerMeshes = {};
    this.spiderR01 = null;
    this.spiderR02 = null;
    this.gasParticles = [];
    this.floodWaterMesh = null;
    this.elevatorMesh = null;
    this.routeCurveMesh = null;
    this.rescueRouteCurveMesh = null;
    this.billboardSprites = [];
    this.isInitialized = false;

    // Orbit Controls State
    this.target = new THREE.Vector3(350, -200, 0);
    this.spherical = { radius: 680, phi: Math.PI / 3.0, theta: Math.PI / 3.8 };
    this.targetSpherical = { radius: 680, phi: Math.PI / 3.0, theta: Math.PI / 3.8 };
    this.isMouseDown = false;
    this.mouseType = 0;
    this.prevMousePos = { x: 0, y: 0 };
    this.autoRotate = true;
    this.activePreset = 'overview';
    this.walkCyclePhase = 0;

    this.init();
  }

  init() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="digital-twin-container" style="position: relative; width: 100%; height: 100%; min-height: 480px; background: #060c18; overflow: hidden; border-radius: var(--radius-md);">
        <div id="threeCanvasContainer" style="width: 100%; height: 100%; cursor: grab;"></div>
        
        <div class="twin-hud" style="position: absolute; top: 12px; left: 12px; background: rgba(6, 12, 24, 0.9); border: 1px solid rgba(0, 240, 255, 0.35); padding: 8px 14px; border-radius: var(--radius-sm); box-shadow: 0 4px 20px rgba(0,0,0,0.6); pointer-events: none; backdrop-filter: blur(10px);">
          <div style="font-family: var(--font-display); font-size: 13px; font-weight: 800; color: #00f0ff; display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
            <i data-lucide="box" class="icon-xs"></i>
            3D DIGITAL TWIN & DUAL SPIDY ROBOTICS
          </div>
          <div class="font-mono" style="font-size: 9.5px; color: #94a3b8; line-height: 1.4;">
            <div>SYNC STATUS: <span style="color: #10b981; font-weight: 700;">99.8% LIVE (12ms)</span></div>
            <div>ROBOTICS: <span style="color: #c084fc; font-weight: 700;">R01 SPIDY SCOUT + R02 SPIDY STANDBY</span></div>
          </div>
        </div>

        <div class="twin-camera-presets" style="position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; z-index: 10;">
          <button class="btn-scenario" id="btnCamOverview" style="font-size: 11px; padding: 4px 10px; background: rgba(255,255,255,0.12); color: #ffffff; border-color: rgba(255,255,255,0.2);">Full Mine</button>
          <button class="btn-scenario" id="btnCamShaft" style="font-size: 11px; padding: 4px 10px; background: rgba(255,255,255,0.12); color: #ffffff; border-color: rgba(255,255,255,0.2);">Shaft 1</button>
          <button class="btn-scenario" id="btnCamFace" style="font-size: 11px; padding: 4px 10px; background: rgba(255,255,255,0.12); color: #ffffff; border-color: rgba(255,255,255,0.2);">Face 4B</button>
          <button class="btn-scenario" id="btnCamFollow" style="font-size: 11px; padding: 4px 10px; background: rgba(124, 58, 237, 0.3); color: #c084fc; border-color: rgba(124, 58, 237, 0.6); font-weight: 800;">Follow Spidy</button>
          <button class="btn-icon" id="btnToggleRotate" title="Toggle Auto Rotation" style="background: rgba(255,255,255,0.15); color: #00f0ff; border-color: rgba(0,240,255,0.4);"><i data-lucide="rotate-3d"></i></button>
        </div>
      </div>
    `;

    const canvasMount = this.container.querySelector('#threeCanvasContainer');
    const rect = canvasMount.getBoundingClientRect();
    const width = rect.width || 640;
    const height = rect.height || 480;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060c18);
    this.scene.fog = new THREE.FogExp2(0x060c18, 0.0006);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 4000);
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasMount.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.0);
    dirLight.position.set(300, 500, 400);
    this.scene.add(dirLight);

    const blueLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    blueLight.position.set(-200, -300, -200);
    this.scene.add(blueLight);

    this.buildSubterraneanLevels();
    this.buildSubterraneanTunnels();
    this.buildElevatorShaft();
    
    // Build Dual Hexapod Spider Robots
    this.spiderR01 = this.createSpiderRobotMesh('r01', 0x6b21a8, 0x7c3aed, '🕷️ R01 SPIDY SCOUT', '#c084fc');
    this.spiderR02 = this.createSpiderRobotMesh('r02', 0xb45309, 0xf59e0b, '🕷️ R02 SPIDY STANDBY', '#fbbf24');

    this.buildWorkerAvatars();
    this.buildVolumetricHazards();
    this.buildEvacuationRoute3D();
    this.buildRescueTeamRoute3D();
    this.buildStaticBillboards();
    this.bindMouseControls(canvasMount);
    this.bindEvents();

    this.isInitialized = true;
    this.animate();
  }

  onShow() {
    this.resize();
    this.updateCameraPosition();
  }

  resize() {
    if (!this.renderer || !this.container) return;
    const canvasMount = this.container.querySelector('#threeCanvasContainer');
    if (!canvasMount) return;
    const rect = canvasMount.getBoundingClientRect();
    const width = rect.width || this.container.clientWidth || 640;
    const height = rect.height || this.container.clientHeight || 480;

    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  buildSubterraneanLevels() {
    MINE_TOPOGRAPHY.levels.forEach(lvl => {
      const grid = new THREE.GridHelper(640, 16, 0x00f0ff, 0x1e293b);
      grid.position.set(350, lvl.depth, 0);
      this.scene.add(grid);

      const ringGeo = new THREE.BoxGeometry(640, 2, 400);
      const ringEdges = new THREE.EdgesGeometry(ringGeo);
      const ringMat = new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.35 });
      const ringMesh = new THREE.LineSegments(ringEdges, ringMat);
      ringMesh.position.set(350, lvl.depth, 0);
      this.scene.add(ringMesh);
    });
  }

  buildSubterraneanTunnels() {
    MINE_TOPOGRAPHY.edges.forEach(edge => {
      const from = MINE_TOPOGRAPHY.nodes[edge.from];
      const to = MINE_TOPOGRAPHY.nodes[edge.to];
      if (!from || !to) return;

      const p1 = new THREE.Vector3(from.x, from.z, (from.y - 250) * 0.8);
      const p2 = new THREE.Vector3(to.x, to.z, (to.y - 250) * 0.8);
      const isShaft = edge.slope === 'vertical_shaft';

      const path = new THREE.LineCurve3(p1, p2);
      const radius = isShaft ? 13 : 9.5;

      const tubeGeo = new THREE.TubeGeometry(path, 16, radius, 10, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: isShaft ? 0x0a1c38 : 0x07152b,
        emissive: isShaft ? 0x00f0ff : 0x0284c7,
        emissiveIntensity: 0.15,
        roughness: 0.3,
        metalness: 0.5,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      this.scene.add(tubeMesh);

      const tubeEdges = new THREE.EdgesGeometry(tubeGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: isShaft ? 0x00f0ff : 0x38bdf8,
        transparent: true,
        opacity: 0.7
      });
      const edgeMesh = new THREE.LineSegments(tubeEdges, edgeMat);
      this.scene.add(edgeMesh);
    });

    Object.values(MINE_TOPOGRAPHY.nodes).forEach(node => {
      const p = new THREE.Vector3(node.x, node.z, (node.y - 250) * 0.8);
      const isPortal = node.type === 'portal';

      const juncGeo = new THREE.SphereGeometry(isPortal ? 14 : 9, 16, 16);
      const juncMat = new THREE.MeshStandardMaterial({
        color: isPortal ? 0x10b981 : 0x00f0ff,
        emissive: isPortal ? 0x10b981 : 0x00f0ff,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2
      });
      const juncMesh = new THREE.Mesh(juncGeo, juncMat);
      juncMesh.position.copy(p);
      this.scene.add(juncMesh);
    });
  }

  buildElevatorShaft() {
    const cageGeo = new THREE.BoxGeometry(16, 22, 16);
    const cageEdges = new THREE.EdgesGeometry(cageGeo);
    const cageMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
    this.elevatorMesh = new THREE.LineSegments(cageEdges, cageMat);
    this.elevatorMesh.position.set(320, -180, (170 - 250) * 0.8);
    this.scene.add(this.elevatorMesh);
  }

  createSpiderRobotMesh(robotKey, bodyColorHex, emissiveHex, labelText, labelColor) {
    const spiderGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CylinderGeometry(8, 9, 4.5, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColorHex,
      emissive: emissiveHex,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.25
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    spiderGroup.add(bodyMesh);

    // Head Turret
    const headGeo = new THREE.SphereGeometry(3.5, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.9 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(7, 0.5, 0);
    spiderGroup.add(headMesh);

    // Rotating LiDAR Dome
    const lidarDomeGeo = new THREE.CylinderGeometry(3, 3, 2, 12);
    const lidarDomeMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.9 });
    const lidarDome = new THREE.Mesh(lidarDomeGeo, lidarDomeMat);
    lidarDome.position.set(0, 3, 0);
    spiderGroup.add(lidarDome);

    // LiDAR Beam Cone
    const lidarConeGeo = new THREE.ConeGeometry(25, 45, 16, 1, true);
    const lidarConeMat = new THREE.MeshBasicMaterial({
      color: labelColor === '#c084fc' ? 0xc084fc : 0xfbbf24,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      wireframe: true
    });
    const lidarCone = new THREE.Mesh(lidarConeGeo, lidarConeMat);
    lidarCone.rotation.z = -Math.PI / 2;
    lidarCone.position.set(22, 3, 0);
    spiderGroup.add(lidarCone);

    // 6 Articulated Spider Legs
    const legs = [];
    const legAngles = [
      Math.PI / 5, 0, -Math.PI / 5,
      Math.PI - Math.PI / 5, Math.PI, Math.PI + Math.PI / 5
    ];

    legAngles.forEach((angle, idx) => {
      const legRoot = new THREE.Group();
      legRoot.position.set(Math.cos(angle) * 7.5, 0, Math.sin(angle) * 7.5);
      legRoot.rotation.y = -angle;

      const coxaGeo = new THREE.BoxGeometry(4, 2, 2);
      const legMat = new THREE.MeshStandardMaterial({ color: bodyColorHex, metalness: 0.7, roughness: 0.3 });
      const coxa = new THREE.Mesh(coxaGeo, legMat);
      coxa.position.set(2, 0, 0);
      legRoot.add(coxa);

      const femurGroup = new THREE.Group();
      femurGroup.position.set(4, 0, 0);
      femurGroup.rotation.z = Math.PI / 4;

      const femurGeo = new THREE.CylinderGeometry(1, 1.2, 9, 8);
      const femur = new THREE.Mesh(femurGeo, legMat);
      femur.position.set(0, 4.5, 0);
      femurGroup.add(femur);

      const tibiaGroup = new THREE.Group();
      tibiaGroup.position.set(0, 9, 0);
      tibiaGroup.rotation.z = -Math.PI / 1.8;

      const tibiaGeo = new THREE.CylinderGeometry(0.6, 1, 11, 8);
      const tibia = new THREE.Mesh(tibiaGeo, legMat);
      tibia.position.set(0, 5.5, 0);
      tibiaGroup.add(tibia);

      const footGeo = new THREE.SphereGeometry(1.2, 8, 8);
      const footMat = new THREE.MeshStandardMaterial({ color: emissiveHex, emissive: emissiveHex, emissiveIntensity: 0.8 });
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(0, 11, 0);
      tibiaGroup.add(foot);

      femurGroup.add(tibiaGroup);
      legRoot.add(femurGroup);
      spiderGroup.add(legRoot);

      legs.push({ root: legRoot, femurGroup, tibiaGroup, baseAngle: angle, idx });
    });

    const labelSprite = this.createTextSprite(labelText, labelColor);
    labelSprite.position.set(0, 18, 0);
    spiderGroup.add(labelSprite);

    const rData = state.robots[robotKey];
    spiderGroup.position.set(rData.x, rData.z, (rData.y - 250) * 0.8);
    this.scene.add(spiderGroup);

    return {
      group: spiderGroup,
      body: bodyMesh,
      head: headMesh,
      lidarCone,
      lidarDome,
      legs,
      label: labelSprite,
      key: robotKey
    };
  }

  buildWorkerAvatars() {
    state.workers.forEach(w => {
      const group = new THREE.Group();

      const bodyGeo = new THREE.CylinderGeometry(3, 2.5, 8, 8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, 4, 0);
      group.add(body);

      const headGeo = new THREE.SphereGeometry(3.2, 12, 12);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, 9.5, 0);
      group.add(head);

      const lampGeo = new THREE.SphereGeometry(1, 8, 8);
      const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0 });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(2.8, 10, 0);
      group.add(lamp);

      const ringGeo = new THREE.RingGeometry(5, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      const label = this.createTextSprite(`${w.id} ${w.name.split(' ')[0]}`, '#10b981');
      label.position.set(0, 16, 0);
      group.add(label);

      group.position.set(w.x, w.z, (w.y - 250) * 0.8);
      this.scene.add(group);

      this.workerMeshes[w.id] = { group, body, head, ring, label };
    });
  }

  buildVolumetricHazards() {
    const gasGroup = new THREE.Group();
    for (let i = 0; i < 22; i++) {
      const pGeo = new THREE.SphereGeometry(12 + Math.random() * 10, 10, 10);
      const pMat = new THREE.MeshBasicMaterial({
        color: 0xd97706,
        transparent: true,
        opacity: 0.32,
        wireframe: true
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 40);
      gasGroup.add(pMesh);
      this.gasParticles.push(pMesh);
    }
    gasGroup.position.set(580, -380, (410 - 250) * 0.8);
    this.scene.add(gasGroup);
    this.gasCloudMesh = gasGroup;

    const waterGeo = new THREE.CylinderGeometry(35, 35, 12, 24);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1
    });
    this.floodWaterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.floodWaterMesh.position.set(150, -260, (340 - 250) * 0.8);
    this.scene.add(this.floodWaterMesh);
  }

  buildEvacuationRoute3D() {
    const route = state.routes.list.find(r => r.id === state.routes.activeRouteId) || state.routes.list[0];
    if (!route || !route.pathNodes) return;

    const points = route.pathNodes.map(nodeId => {
      const n = MINE_TOPOGRAPHY.nodes[nodeId];
      return new THREE.Vector3(n.x, n.z, (n.y - 250) * 0.8);
    });

    const curve = new THREE.CatmullRomCurve3(points);
    const routeGeo = new THREE.TubeGeometry(curve, 32, 4, 8, false);
    const routeMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.85
    });
    this.routeCurveMesh = new THREE.Mesh(routeGeo, routeMat);
    this.scene.add(this.routeCurveMesh);
  }

  buildRescueTeamRoute3D() {
    const rescue = state.rescueTeamRoute;
    if (!rescue || !rescue.pathNodes) return;

    const points = rescue.pathNodes.map(nodeId => {
      const n = MINE_TOPOGRAPHY.nodes[nodeId];
      return new THREE.Vector3(n.x, n.z, (n.y - 250) * 0.8);
    });

    const curve = new THREE.CatmullRomCurve3(points);
    const routeGeo = new THREE.TubeGeometry(curve, 32, 3.5, 8, false);
    const routeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.8
    });
    this.rescueRouteCurveMesh = new THREE.Mesh(routeGeo, routeMat);
    this.scene.add(this.rescueRouteCurveMesh);
  }

  buildStaticBillboards() {
    const sectors = [
      { text: 'SURFACE PORTAL [0m]', pos: [120, 20, (70 - 250) * 0.8], col: '#38bdf8' },
      { text: 'SHAFT 1 COLLAR', pos: [320, 20, (70 - 250) * 0.8], col: '#38bdf8' },
      { text: 'L1 VENTILATION [-120m]', pos: [140, -100, (170 - 250) * 0.8], col: '#38bdf8' },
      { text: 'L2 SUMP PUMP [-240m]', pos: [150, -230, (340 - 250) * 0.8], col: '#0284c7' },
      { text: 'L3 EXTRACTION FACE 4B [-380m]', pos: [580, -360, (410 - 250) * 0.8], col: '#d97706' },
      { text: 'REFUGE CHAMBER [-380m]', pos: [420, -360, (410 - 250) * 0.8], col: '#10b981' }
    ];

    sectors.forEach(s => {
      const sprite = this.createTextSprite(s.text, s.col);
      sprite.position.set(s.pos[0], s.pos[1], s.pos[2]);
      this.scene.add(sprite);
      this.billboardSprites.push(sprite);
    });
  }

  createTextSprite(text, color = '#ffffff') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(6, 12, 24, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 56, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 19px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(36, 9, 1);
    return sprite;
  }

  bindMouseControls(element) {
    element.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.mouseType = e.button;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
      element.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;

      const deltaX = e.clientX - this.prevMousePos.x;
      const deltaY = e.clientY - this.prevMousePos.y;
      this.prevMousePos = { x: e.clientX, y: e.clientY };

      if (this.mouseType === 0) {
        this.targetSpherical.theta -= deltaX * 0.006;
        this.targetSpherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.targetSpherical.phi + deltaY * 0.006));
        this.autoRotate = false;
      } else if (this.mouseType === 2) {
        this.target.x -= deltaX * 0.8;
        this.target.y += deltaY * 0.8;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      element.style.cursor = 'grab';
    });

    element.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.6;
      this.targetSpherical.radius = Math.max(200, Math.min(1400, this.targetSpherical.radius + zoomDelta));
    });

    element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  updateCameraPosition() {
    this.spherical.radius += (this.targetSpherical.radius - this.spherical.radius) * 0.1;
    this.spherical.phi += (this.targetSpherical.phi - this.spherical.phi) * 0.1;
    this.spherical.theta += (this.targetSpherical.theta - this.spherical.theta) * 0.1;

    const x = this.target.x + this.spherical.radius * Math.sin(this.spherical.phi) * Math.sin(this.spherical.theta);
    const y = this.target.y + this.spherical.radius * Math.cos(this.spherical.phi);
    const z = this.target.z + this.spherical.radius * Math.sin(this.spherical.phi) * Math.cos(this.spherical.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  setCameraPreset(preset) {
    this.activePreset = preset;
    this.autoRotate = false;

    if (preset === 'overview') {
      this.target.set(350, -200, 0);
      this.targetSpherical = { radius: 680, phi: Math.PI / 3.0, theta: Math.PI / 3.8 };
    } else if (preset === 'shaft') {
      this.target.set(320, -180, (170 - 250) * 0.8);
      this.targetSpherical = { radius: 380, phi: Math.PI / 2.6, theta: Math.PI / 6 };
    } else if (preset === 'face') {
      this.target.set(580, -380, (410 - 250) * 0.8);
      this.targetSpherical = { radius: 280, phi: Math.PI / 3.4, theta: -Math.PI / 4 };
    }
  }

  bindEvents() {
    const btnOverview = this.container.querySelector('#btnCamOverview');
    const btnShaft = this.container.querySelector('#btnCamShaft');
    const btnFace = this.container.querySelector('#btnCamFace');
    const btnFollow = this.container.querySelector('#btnCamFollow');
    const btnRotate = this.container.querySelector('#btnToggleRotate');

    if (btnOverview) btnOverview.onclick = () => { this.setCameraPreset('overview'); soundEngine.playClick(); };
    if (btnShaft) btnShaft.onclick = () => { this.setCameraPreset('shaft'); soundEngine.playClick(); };
    if (btnFace) btnFace.onclick = () => { this.setCameraPreset('face'); soundEngine.playClick(); };
    if (btnFollow) btnFollow.onclick = () => { this.activePreset = 'follow'; soundEngine.playClick(); };
    if (btnRotate) btnRotate.onclick = () => { this.autoRotate = !this.autoRotate; soundEngine.playClick(); };

    window.addEventListener('resize', () => this.resize());
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.renderer || !this.scene || !this.camera) return;

    // 1. Camera Follow
    if (this.activePreset === 'follow') {
      const activeRobot = (!state.robots.r01.isFailed && state.robots.r01.status !== 'OFFLINE') ? state.robots.r01 : state.robots.r02;
      this.target.set(activeRobot.x, activeRobot.z, (activeRobot.y - 250) * 0.8);
      this.targetSpherical.radius = 240;
    } else if (this.autoRotate) {
      this.targetSpherical.theta += 0.002;
    }

    this.updateCameraPosition();

    // 2. Animate Both Spider Robots with Kinematics
    this.animateSpiderRobot(this.spiderR01, state.robots.r01);
    this.animateSpiderRobot(this.spiderR02, state.robots.r02);

    // 3. Elevator Hoist Movement
    if (this.elevatorMesh) {
      this.elevatorMesh.position.y = -180 + Math.sin(Date.now() * 0.001) * 160;
    }

    // 4. Worker Movement & Vitals Animation
    state.workers.forEach(w => {
      const item = this.workerMeshes[w.id];
      if (item) {
        item.group.position.set(w.x, w.z, (w.y - 250) * 0.8);
        const isSos = w.status === 'SOS' || w.sosActive;
        const col = isSos ? 0xdc2626 : (w.tagWarning ? 0xd97706 : 0x10b981);

        item.body.material.color.setHex(col);
        item.ring.material.color.setHex(col);

        if (isSos) {
          const pulse = 1.0 + Math.sin(Date.now() * 0.008) * 0.4;
          item.ring.scale.set(pulse, pulse, pulse);
        }
      }
    });

    // 5. Hazards Animation
    if (this.gasCloudMesh) {
      this.gasCloudMesh.visible = state.hazards.gasPlume.active;
      if (state.hazards.gasPlume.active) {
        this.gasCloudMesh.position.set(state.hazards.gasPlume.epicenterX, state.hazards.gasPlume.epicenterZ, (state.hazards.gasPlume.epicenterY - 250) * 0.8);
        this.gasCloudMesh.rotation.y += 0.01;
        this.gasParticles.forEach((p, idx) => {
          p.rotation.x += 0.006 * (idx % 2 === 0 ? 1 : -1);
          p.rotation.z += 0.006;
        });
      }
    }

    if (this.floodWaterMesh) {
      this.floodWaterMesh.visible = state.hazards.floodWater.active;
      if (state.hazards.floodWater.active) {
        const scaleY = 1.0 + (state.hazards.floodWater.sumpLevelCm / 30);
        this.floodWaterMesh.scale.set(1.0, scaleY, 1.0);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  animateSpiderRobot(spiderObj, rData) {
    if (!spiderObj || !rData) return;

    spiderObj.group.position.set(rData.x, rData.z, (rData.y - 250) * 0.8);

    if (!rData.isFailed) {
      this.walkCyclePhase += 0.08;

      spiderObj.legs.forEach(leg => {
        const isGroup1 = leg.idx % 2 === 0;
        const phaseOffset = isGroup1 ? 0 : Math.PI;
        const step = Math.sin(this.walkCyclePhase + phaseOffset);

        leg.root.rotation.y = -leg.baseAngle + step * 0.25;
        const lift = Math.max(0, Math.cos(this.walkCyclePhase + phaseOffset));
        leg.femurGroup.rotation.z = Math.PI / 4 + lift * 0.35;
        leg.tibiaGroup.rotation.z = -Math.PI / 1.8 - lift * 0.25;
      });

      spiderObj.body.position.y = Math.sin(this.walkCyclePhase * 2) * 0.8;
      spiderObj.lidarDome.rotation.y += 0.06;
      spiderObj.lidarCone.rotation.x += 0.04;
    } else {
      spiderObj.legs.forEach((leg, i) => {
        leg.femurGroup.rotation.z = Math.PI / 8 + Math.sin(Date.now() * 0.02 + i) * 0.05;
        leg.tibiaGroup.rotation.z = -Math.PI / 1.2;
      });
      spiderObj.body.position.y = -2;
      spiderObj.body.material.color.setHex(0xdc2626);
      spiderObj.head.material.color.setHex(0xdc2626);
    }
  }
}

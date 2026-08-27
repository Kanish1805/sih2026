/**
 * NEXUS 3D Subterranean Holographic Digital Twin (Three.js)
 * 
 * Features:
 * - 5 Subterranean Tunnels (0m to -600m) with realistic rock strata, steel arch ribs, track rails, and surface headframe hoist tower
 * - High-Realism Hexapod Spider Robots: R01 Spidy Scout (Tactical Purple) & R02 Spidy Standby (Industrial Amber-Gold)
 * - Articulated 3-DOF robotic legs (Coxa, Hydraulic Femur, Carbon Tibia, Shock Tarsus) with tripod crawling kinematics
 * - RED 3D Tube for Surface Rescue Team Ingress Path & BLACK 3D Tube for Safest Node Route (hides on SOS off)
 * - 3-Member Rescue Team Patrol in 3D (Fluorescent Orange Gear & White Helmets)
 * - 13 Moving Indian Miners with dynamic vitals halos
 * - Realistic Volumetric Gas Plumes & Inundation Water Basins
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
    this.rescuePatrolMeshes = [];
    this.spiderR01 = null;
    this.spiderR02 = null;
    this.gasParticles = [];
    this.floodWaterMesh = null;
    this.elevatorMesh = null;
    this.routeCurveMesh = null;
    this.rescueRouteCurveMesh = null;
    this.billboardSprites = [];
    this.isInitialized = false;

    // Camera Orbit Controls State
    this.target = new THREE.Vector3(350, -300, 0);
    this.spherical = { radius: 950, phi: Math.PI / 3.0, theta: Math.PI / 3.6 };
    this.targetSpherical = { radius: 950, phi: Math.PI / 3.0, theta: Math.PI / 3.6 };
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

    // Clean HUD: No "MINE SECTOR" or "STATUTORY BENCHMARKS" pills!
    this.container.innerHTML = `
      <div class="digital-twin-container" style="position: relative; width: 100%; height: 100%; min-height: 480px; background: #040814; overflow: hidden; border-radius: var(--radius-md);">
        <div id="threeCanvasContainer" style="width: 100%; height: 100%; cursor: grab;"></div>

        <div class="twin-legend" style="position: absolute; left: 16px; bottom: 16px; background: rgba(4, 8, 20, 0.9); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 12px; font-size: 10.5px; font-family: 'JetBrains Mono', monospace; color: #e2e8f0; display: flex; flex-direction: column; gap: 4px; z-index: 10;">
          <div style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; background:#dc2626; border-radius:2px;"></span> <strong>RED: Rescue Team Ingress</strong></div>
          <div style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; background:#000000; border:1px solid #fff; border-radius:2px;"></span> <strong>BLACK: Safest Node Route</strong></div>
          <div style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; background:#ea580c; border-radius:50%;"></span> <strong>3-Member Rescue Patrol</strong></div>
        </div>

        <div class="twin-camera-presets" style="position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; z-index: 10;">
          <button class="btn-scenario" id="btnCamOverview" style="font-size: 11px; padding: 4px 10px; background: rgba(255,255,255,0.12); color: #ffffff; border-color: rgba(255,255,255,0.2);">Full Mine Overview</button>
          <button class="btn-scenario" id="btnCamFollow" style="font-size: 11px; padding: 4px 10px; background: rgba(124, 58, 237, 0.35); color: #c084fc; border-color: rgba(124, 58, 237, 0.6); font-weight: 800;">Follow Spidy Robot</button>
          <button class="btn-icon" id="btnToggleRotate" title="Toggle Auto Rotation" style="background: rgba(255,255,255,0.15); color: #00f0ff; border-color: rgba(0,240,255,0.4);"><i data-lucide="rotate-3d"></i></button>
        </div>
      </div>
    `;

    const canvasMount = this.container.querySelector('#threeCanvasContainer');
    const rect = canvasMount.getBoundingClientRect();
    const width = rect.width || 640;
    const height = rect.height || 480;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040814);
    this.scene.fog = new THREE.FogExp2(0x040814, 0.00045);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasMount.appendChild(this.renderer.domElement);

    // Dynamic Subterranean Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
    dirLight.position.set(350, 600, 500);
    this.scene.add(dirLight);

    const blueLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    blueLight.position.set(-300, -400, -300);
    this.scene.add(blueLight);

    // Build Subterranean Mine Elements (5 Tunnels)
    this.buildSubterraneanLevels();
    this.buildSubterraneanTunnels();
    this.buildElevatorShaft();
    this.buildHeadframeTower();

    // Build Realistic Hexapod Spider Robots
    this.spiderR01 = this.createRealisticSpiderRobot('r01', 0x581c87, 0x9333ea, '🕷️ R-01 SPIDY SCOUT', '#c084fc');
    this.spiderR02 = this.createRealisticSpiderRobot('r02', 0x92400e, 0xd97706, '🕷️ R-02 SPIDY STANDBY', '#fbbf24');

    // Build 3-Member Rescue Team Patrol in 3D
    this.buildRescuePatrolAvatars();

    // Build Personnel, Hazards, Routes & Labels
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
      // Level Grid Floor
      const grid = new THREE.GridHelper(700, 18, 0x00f0ff, 0x1e293b);
      grid.position.set(350, lvl.depth, 0);
      this.scene.add(grid);

      // Level Perimeter Strata Frame
      const ringGeo = new THREE.BoxGeometry(700, 3, 440);
      const ringEdges = new THREE.EdgesGeometry(ringGeo);
      const ringMat = new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.4 });
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

      const p1 = new THREE.Vector3(from.x, from.z, (from.y - 300) * 0.8);
      const p2 = new THREE.Vector3(to.x, to.z, (to.y - 300) * 0.8);
      const isShaft = edge.slope === 'vertical_shaft';

      const path = new THREE.LineCurve3(p1, p2);
      const radius = isShaft ? 15 : 11;

      // Realistic Semi-Transparent Tunnel Tube
      const tubeGeo = new THREE.TubeGeometry(path, 20, radius, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: isShaft ? 0x0c2144 : 0x08172e,
        emissive: isShaft ? 0x00f0ff : 0x0284c7,
        emissiveIntensity: 0.2,
        roughness: 0.4,
        metalness: 0.6,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      this.scene.add(tubeMesh);

      // Structural Steel Rib Rings along Tunnels
      const tubeEdges = new THREE.EdgesGeometry(tubeGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: isShaft ? 0x00f0ff : 0x38bdf8,
        transparent: true,
        opacity: 0.75
      });
      const edgeMesh = new THREE.LineSegments(tubeEdges, edgeMat);
      this.scene.add(edgeMesh);

      // Floor Track Rails for Horizontal Drifts
      if (!isShaft) {
        const railGeo = new THREE.CylinderGeometry(0.8, 0.8, p1.distanceTo(p2), 6);
        const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.copy(p1.clone().lerp(p2, 0.5));
        rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
        rail.position.y -= (radius - 2);
        this.scene.add(rail);
      }
    });

    // Subterranean Junction Nodes & Refuge Chambers
    Object.values(MINE_TOPOGRAPHY.nodes).forEach(node => {
      const p = new THREE.Vector3(node.x, node.z, (node.y - 300) * 0.8);
      const isPortal = node.type === 'portal';
      const isRefuge = node.type === 'refuge';

      const juncGeo = new THREE.SphereGeometry(isPortal ? 16 : (isRefuge ? 14 : 10), 16, 16);
      const juncMat = new THREE.MeshStandardMaterial({
        color: isPortal ? 0x10b981 : (isRefuge ? 0x0f172a : 0x00f0ff),
        emissive: isPortal ? 0x10b981 : (isRefuge ? 0x000000 : 0x00f0ff),
        emissiveIntensity: 0.6,
        metalness: 0.8,
        roughness: 0.2
      });
      const juncMesh = new THREE.Mesh(juncGeo, juncMat);
      juncMesh.position.copy(p);
      this.scene.add(juncMesh);
    });
  }

  buildElevatorShaft() {
    const cageGeo = new THREE.BoxGeometry(18, 26, 18);
    const cageEdges = new THREE.EdgesGeometry(cageGeo);
    const cageMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
    this.elevatorMesh = new THREE.LineSegments(cageEdges, cageMat);
    this.elevatorMesh.position.set(320, -300, (150 - 300) * 0.8);
    this.scene.add(this.elevatorMesh);
  }

  buildHeadframeTower() {
    const towerGeo = new THREE.CylinderGeometry(12, 22, 60, 4);
    const towerEdges = new THREE.EdgesGeometry(towerGeo);
    const towerMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
    const towerMesh = new THREE.LineSegments(towerEdges, towerMat);
    towerMesh.position.set(320, 30, (70 - 300) * 0.8);
    this.scene.add(towerMesh);
  }

  /**
   * Builds High-Realism Hexapod Spider Robot
   */
  createRealisticSpiderRobot(robotKey, bodyColorHex, emissiveHex, labelText, labelColor) {
    const spiderGroup = new THREE.Group();

    // 1. Tactical Hexagonal Armored Main Chassis
    const bodyGeo = new THREE.CylinderGeometry(9, 10.5, 5, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColorHex,
      emissive: emissiveHex,
      emissiveIntensity: 0.35,
      metalness: 0.85,
      roughness: 0.25
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    spiderGroup.add(bodyMesh);

    // Armored Top Plate with Hazard Stripes
    const topPlateGeo = new THREE.BoxGeometry(12, 1.2, 10);
    const topPlateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const topPlate = new THREE.Mesh(topPlateGeo, topPlateMat);
    topPlate.position.set(0, 3, 0);
    spiderGroup.add(topPlate);

    // 2. Optical Sensor Head Turret + FLIR Thermal IR Lens
    const headGroup = new THREE.Group();
    headGroup.position.set(8.5, 0.8, 0);

    const headGeo = new THREE.BoxGeometry(5, 4, 6);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headGroup.add(headMesh);

    // Stereoscopic Dual Glowing Cameras
    [-1.5, 1.5].forEach(zOffset => {
      const eyeGeo = new THREE.SphereGeometry(1.2, 12, 12);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.2 });
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(2.8, 0, zOffset);
      headGroup.add(eye);
    });

    spiderGroup.add(headGroup);

    // 3. Rotating 360° RPLiDAR Laser Turret Dome
    const lidarDomeGeo = new THREE.CylinderGeometry(3.2, 3.2, 2.5, 16);
    const lidarDomeMat = new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.95 });
    const lidarDome = new THREE.Mesh(lidarDomeGeo, lidarDomeMat);
    lidarDome.position.set(0, 4.5, 0);
    spiderGroup.add(lidarDome);

    // LiDAR Scanning Laser Cone
    const lidarConeGeo = new THREE.ConeGeometry(30, 60, 16, 1, true);
    const lidarConeMat = new THREE.MeshBasicMaterial({
      color: labelColor === '#c084fc' ? 0xc084fc : 0xfbbf24,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      wireframe: true
    });
    const lidarCone = new THREE.Mesh(lidarConeGeo, lidarConeMat);
    lidarCone.rotation.z = -Math.PI / 2;
    lidarCone.position.set(28, 4.5, 0);
    spiderGroup.add(lidarCone);

    // Dual Antennas with Red Tip LEDs
    [-3, 3].forEach(zOffset => {
      const antGeo = new THREE.CylinderGeometry(0.3, 0.4, 10, 6);
      const antMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
      const ant = new THREE.Mesh(antGeo, antMat);
      ant.position.set(-4, 7, zOffset);
      ant.rotation.z = -Math.PI / 8;
      spiderGroup.add(ant);
    });

    // Standby Payload (Emergency O2 tanks on R-02)
    if (robotKey === 'r02') {
      [-4, 4].forEach(zOffset => {
        const tankGeo = new THREE.CylinderGeometry(1.8, 1.8, 8, 12);
        const tankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.rotation.x = Math.PI / 2;
        tank.position.set(-3, 3, zOffset);
        spiderGroup.add(tank);
      });
    }

    // 4. 6 Articulated 3-DOF Robotic Spider Legs
    const legs = [];
    const legAngles = [
      Math.PI / 4.5, 0, -Math.PI / 4.5,
      Math.PI - Math.PI / 4.5, Math.PI, Math.PI + Math.PI / 4.5
    ];

    legAngles.forEach((angle, idx) => {
      const legRoot = new THREE.Group();
      legRoot.position.set(Math.cos(angle) * 8.5, 0, Math.sin(angle) * 8.5);
      legRoot.rotation.y = -angle;

      // Segment 1: Coxa (Rotational Hip Pivot)
      const coxaGeo = new THREE.BoxGeometry(5, 2.5, 2.5);
      const legMat = new THREE.MeshStandardMaterial({ color: bodyColorHex, metalness: 0.8, roughness: 0.3 });
      const coxa = new THREE.Mesh(coxaGeo, legMat);
      coxa.position.set(2.5, 0, 0);
      legRoot.add(coxa);

      // Segment 2: Femur (Hydraulic Upper Thigh)
      const femurGroup = new THREE.Group();
      femurGroup.position.set(5, 0, 0);
      femurGroup.rotation.z = Math.PI / 3.8;

      const femurGeo = new THREE.CylinderGeometry(1.2, 1.5, 11, 8);
      const femur = new THREE.Mesh(femurGeo, legMat);
      femur.position.set(0, 5.5, 0);
      femurGroup.add(femur);

      // Hydraulic Piston Cylinder
      const pistonGeo = new THREE.CylinderGeometry(0.6, 0.6, 7, 8);
      const pistonMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95 });
      const piston = new THREE.Mesh(pistonGeo, pistonMat);
      piston.position.set(-1.2, 4.5, 0);
      femurGroup.add(piston);

      // Segment 3: Tibia (Lower Carbon Strut)
      const tibiaGroup = new THREE.Group();
      tibiaGroup.position.set(0, 11, 0);
      tibiaGroup.rotation.z = -Math.PI / 1.7;

      const tibiaGeo = new THREE.CylinderGeometry(0.7, 1.2, 13, 8);
      const tibia = new THREE.Mesh(tibiaGeo, legMat);
      tibia.position.set(0, 6.5, 0);
      tibiaGroup.add(tibia);

      // Segment 4: Tarsus Foot (Magnetic Shock Absorber Tip)
      const footGeo = new THREE.SphereGeometry(1.5, 10, 10);
      const footMat = new THREE.MeshStandardMaterial({ color: emissiveHex, emissive: emissiveHex, emissiveIntensity: 0.9 });
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(0, 13, 0);
      tibiaGroup.add(foot);

      femurGroup.add(tibiaGroup);
      legRoot.add(femurGroup);
      spiderGroup.add(legRoot);

      legs.push({ root: legRoot, femurGroup, tibiaGroup, baseAngle: angle, idx });
    });

    const labelSprite = this.createTextSprite(labelText, labelColor);
    labelSprite.position.set(0, 20, 0);
    spiderGroup.add(labelSprite);

    const rData = state.robots[robotKey];
    spiderGroup.position.set(rData.x, rData.z, (rData.y - 300) * 0.8);
    this.scene.add(spiderGroup);

    return {
      group: spiderGroup,
      body: bodyMesh,
      headGroup,
      lidarCone,
      lidarDome,
      legs,
      label: labelSprite,
      key: robotKey
    };
  }

  buildRescuePatrolAvatars() {
    this.rescuePatrolMeshes = [];
    for (let i = 0; i < 3; i++) {
      const group = new THREE.Group();

      const bodyGeo = new THREE.CylinderGeometry(3.6, 2.8, 10, 8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.4, roughness: 0.5 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, 5, 0);
      group.add(body);

      const headGeo = new THREE.SphereGeometry(3.2, 12, 12);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, 10.5, 0);
      group.add(head);

      const lampGeo = new THREE.SphereGeometry(1.2, 8, 8);
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.5 });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(2.8, 11, 0);
      group.add(lamp);

      group.position.set(120, 0, (70 - 300) * 0.8);
      group.visible = false;
      this.scene.add(group);
      this.rescuePatrolMeshes.push(group);
    }
  }

  buildWorkerAvatars() {
    state.workers.forEach(w => {
      const group = new THREE.Group();

      const bodyGeo = new THREE.CylinderGeometry(3.2, 2.5, 9, 8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, 4.5, 0);
      group.add(body);

      const headGeo = new THREE.SphereGeometry(3.2, 12, 12);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, 10, 0);
      group.add(head);

      // Helmet Headlamp
      const lampGeo = new THREE.SphereGeometry(1.2, 8, 8);
      const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2 });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(2.8, 10.5, 0);
      group.add(lamp);

      // Floor Status Ring
      const ringGeo = new THREE.RingGeometry(6, 9, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      const label = this.createTextSprite(`${w.id} ${w.name.split(' ')[0]}`, '#10b981');
      label.position.set(0, 18, 0);
      group.add(label);

      group.position.set(w.x, w.z, (w.y - 300) * 0.8);
      this.scene.add(group);

      this.workerMeshes[w.id] = { group, body, head, ring, label };
    });
  }

  buildVolumetricHazards() {
    const gasGroup = new THREE.Group();
    for (let i = 0; i < 28; i++) {
      const pGeo = new THREE.SphereGeometry(14 + Math.random() * 12, 10, 10);
      const pMat = new THREE.MeshBasicMaterial({
        color: 0xd97706,
        transparent: true,
        opacity: 0.35,
        wireframe: true
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set((Math.random() - 0.5) * 45, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 45);
      gasGroup.add(pMesh);
      this.gasParticles.push(pMesh);
    }
    gasGroup.position.set(590, -360, (330 - 300) * 0.8);
    this.scene.add(gasGroup);
    this.gasCloudMesh = gasGroup;

    const waterGeo = new THREE.CylinderGeometry(38, 38, 14, 24);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1
    });
    this.floodWaterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.floodWaterMesh.position.set(150, -240, (240 - 300) * 0.8);
    this.scene.add(this.floodWaterMesh);
  }

  /**
   * 3D BLACK Safest Node Evacuation Route Tube (Worker -> Safe Nodal Point)
   * Automatically hides when SOS is turned OFF!
   */
  buildEvacuationRoute3D() {
    if (this.routeCurveMesh) {
      this.scene.remove(this.routeCurveMesh);
      this.routeCurveMesh = null;
    }

    // Check if Spidy SOS Black Path is active
    let pathNodes = null;
    if (state.sosBlackPath && state.sosBlackPath.active && state.sosBlackPath.isReady && state.sosBlackPath.pathNodes?.length > 1) {
      pathNodes = state.sosBlackPath.pathNodes;
    } else if (state.accidentSafeRoute && state.accidentSafeRoute.active && state.accidentSafeRoute.pathNodes?.length > 1) {
      pathNodes = state.accidentSafeRoute.pathNodes;
    }

    if (!pathNodes) return;

    const points = pathNodes.map(nodeId => {
      const n = MINE_TOPOGRAPHY.nodes[nodeId];
      return n ? new THREE.Vector3(n.x, n.z, (n.y - 300) * 0.8) : null;
    }).filter(p => p !== null);

    if (points.length < 2) return;

    const curve = new THREE.CatmullRomCurve3(points);
    const routeGeo = new THREE.TubeGeometry(curve, 36, 4.5, 8, false);
    const routeMat = new THREE.MeshStandardMaterial({
      color: 0x000000, // BLACK ROUTE
      emissive: 0x000000,
      roughness: 0.2,
      metalness: 0.8
    });
    this.routeCurveMesh = new THREE.Mesh(routeGeo, routeMat);
    this.scene.add(this.routeCurveMesh);
  }

  /**
   * 3D RED Rescue Team Ingress Path Tube (Surface Portal -> Trapped Worker)
   */
  buildRescueTeamRoute3D() {
    if (this.rescueRouteCurveMesh) {
      this.scene.remove(this.rescueRouteCurveMesh);
      this.rescueRouteCurveMesh = null;
    }

    const rescue = state.rescueTeamRoute;
    if (!rescue || !rescue.active || !rescue.pathNodes || rescue.pathNodes.length < 2) return;

    const points = rescue.pathNodes.map(nodeId => {
      const n = MINE_TOPOGRAPHY.nodes[nodeId];
      return n ? new THREE.Vector3(n.x, n.z + 1.5, (n.y - 300) * 0.8) : null;
    }).filter(p => p !== null);

    if (points.length < 2) return;

    const curve = new THREE.CatmullRomCurve3(points);
    const routeGeo = new THREE.TubeGeometry(curve, 36, 4.0, 8, false);
    const routeMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // RED ROUTE
      emissive: 0xdc2626,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.85
    });
    this.rescueRouteCurveMesh = new THREE.Mesh(routeGeo, routeMat);
    this.scene.add(this.rescueRouteCurveMesh);
  }

  buildStaticBillboards() {
    const tunnels = [
      { text: 'SURFACE PORTAL [0m]', pos: [120, 20, (70 - 300) * 0.8], col: '#38bdf8' },
      { text: 'SHAFT 1 HEADFRAME', pos: [320, 45, (70 - 300) * 0.8], col: '#38bdf8' },
      { text: 'TUNNEL 1 [-120m]', pos: [140, -100, (150 - 300) * 0.8], col: '#38bdf8' },
      { text: 'TUNNEL 2 [-240m]', pos: [150, -220, (240 - 300) * 0.8], col: '#fbbf24' },
      { text: 'TUNNEL 3 [-360m]', pos: [590, -340, (330 - 300) * 0.8], col: '#f87171' },
      { text: 'TUNNEL 4 [-480m]', pos: [570, -460, (420 - 300) * 0.8], col: '#c084fc' },
      { text: 'TUNNEL 5 [-600m]', pos: [580, -580, (510 - 300) * 0.8], col: '#34d399' }
    ];

    tunnels.forEach(s => {
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

    ctx.fillStyle = 'rgba(4, 8, 20, 0.88)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 56, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(38, 9.5, 1);
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
        this.targetSpherical.theta -= deltaX * 0.005;
        this.targetSpherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.targetSpherical.phi + deltaY * 0.005));
        this.autoRotate = false;
      } else if (this.mouseType === 2) {
        this.target.x -= deltaX * 0.9;
        this.target.y += deltaY * 0.9;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      element.style.cursor = 'grab';
    });

    element.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.7;
      this.targetSpherical.radius = Math.max(250, Math.min(1800, this.targetSpherical.radius + zoomDelta));
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
      this.target.set(350, -300, 0);
      this.targetSpherical = { radius: 950, phi: Math.PI / 3.0, theta: Math.PI / 3.6 };
    }
  }

  bindEvents() {
    const btnOverview = this.container.querySelector('#btnCamOverview');
    const btnFollow = this.container.querySelector('#btnCamFollow');
    const btnRotate = this.container.querySelector('#btnToggleRotate');

    if (btnOverview) btnOverview.onclick = () => { this.setCameraPreset('overview'); soundEngine.playClick(); };
    if (btnFollow) btnFollow.onclick = () => { this.activePreset = 'follow'; soundEngine.playClick(); };
    if (btnRotate) btnRotate.onclick = () => { this.autoRotate = !this.autoRotate; soundEngine.playClick(); };

    window.addEventListener('resize', () => this.resize());
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.renderer || !this.scene || !this.camera) return;

    // 1. Camera Tracking
    if (this.activePreset === 'follow') {
      const activeRobot = (!state.robots.r01.isFailed && state.robots.r01.status !== 'OFFLINE') ? state.robots.r01 : state.robots.r02;
      this.target.set(activeRobot.x, activeRobot.z, (activeRobot.y - 300) * 0.8);
      this.targetSpherical.radius = 280;
    } else if (this.autoRotate) {
      this.targetSpherical.theta += 0.0018;
    }

    this.updateCameraPosition();

    // 2. Animate Both Realistic Spider Robots with Kinematics
    this.animateSpiderRobot(this.spiderR01, state.robots.r01);
    this.animateSpiderRobot(this.spiderR02, state.robots.r02);

    // 3. Elevator Hoist Movement spanning -600m depth
    if (this.elevatorMesh) {
      this.elevatorMesh.position.y = -300 + Math.sin(Date.now() * 0.0008) * 280;
    }

    // 4. Update 3-Member Rescue Team Patrol in 3D
    const patrol = state.rescueTeamPatrol;
    if (patrol && patrol.active) {
      patrol.members.forEach((m, idx) => {
        if (this.rescuePatrolMeshes[idx]) {
          this.rescuePatrolMeshes[idx].visible = true;
          this.rescuePatrolMeshes[idx].position.set(m.x, m.z, (m.y - 300) * 0.8);
        }
      });
    } else {
      this.rescuePatrolMeshes.forEach(mesh => { mesh.visible = false; });
    }

    // 5. Worker Positions & Status Halos
    state.workers.forEach(w => {
      const item = this.workerMeshes[w.id];
      if (item) {
        item.group.position.set(w.x, w.z, (w.y - 300) * 0.8);
        const isTrapped = w.status === 'TRAPPED' || w.status === 'SOS' || w.sosActive;
        const col = isTrapped ? 0xdc2626 : (w.tagWarning ? 0xd97706 : 0x10b981);

        item.body.material.color.setHex(col);
        item.ring.material.color.setHex(col);

        if (isTrapped) {
          const pulse = 1.0 + Math.sin(Date.now() * 0.008) * 0.45;
          item.ring.scale.set(pulse, pulse, pulse);
        }
      }
    });

    // 6. Hazards Animation
    if (this.gasCloudMesh) {
      this.gasCloudMesh.visible = state.hazards.gasPlume.active;
      if (state.hazards.gasPlume.active) {
        this.gasCloudMesh.position.set(state.hazards.gasPlume.epicenterX, state.hazards.gasPlume.epicenterZ, (state.hazards.gasPlume.epicenterY - 300) * 0.8);
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
        this.floodWaterMesh.position.set(state.hazards.floodWater.epicenterX, state.hazards.floodWater.epicenterZ, (state.hazards.floodWater.epicenterY - 300) * 0.8);
        const scaleY = 1.0 + (state.hazards.floodWater.sumpLevelCm / 30);
        this.floodWaterMesh.scale.set(1.0, scaleY, 1.0);
      }
    }

    // Refresh Dynamic Routes
    this.buildEvacuationRoute3D();
    this.buildRescueTeamRoute3D();

    this.renderer.render(this.scene, this.camera);
  }

  animateSpiderRobot(spiderObj, rData) {
    if (!spiderObj || !rData) return;

    spiderObj.group.position.set(rData.x, rData.z, (rData.y - 300) * 0.8);

    if (!rData.isFailed) {
      this.walkCyclePhase += 0.08;

      spiderObj.legs.forEach(leg => {
        const isGroup1 = leg.idx % 2 === 0;
        const phaseOffset = isGroup1 ? 0 : Math.PI;
        const step = Math.sin(this.walkCyclePhase + phaseOffset);

        leg.root.rotation.y = -leg.baseAngle + step * 0.28;
        const lift = Math.max(0, Math.cos(this.walkCyclePhase + phaseOffset));
        leg.femurGroup.rotation.z = Math.PI / 3.8 + lift * 0.4;
        leg.tibiaGroup.rotation.z = -Math.PI / 1.7 - lift * 0.28;
      });

      spiderObj.body.position.y = Math.sin(this.walkCyclePhase * 2) * 1.0;
      spiderObj.lidarDome.rotation.y += 0.08;
      spiderObj.lidarCone.rotation.x += 0.05;
      spiderObj.headGroup.rotation.y = Math.sin(this.walkCyclePhase * 0.8) * 0.15;
    } else {
      spiderObj.legs.forEach((leg, i) => {
        leg.femurGroup.rotation.z = Math.PI / 8 + Math.sin(Date.now() * 0.02 + i) * 0.05;
        leg.tibiaGroup.rotation.z = -Math.PI / 1.2;
      });
      spiderObj.body.position.y = -2;
      spiderObj.body.material.color.setHex(0xdc2626);
    }
  }
}

/**
 * NEXUS 2D Subterranean Tactical Map & SLAM HUD Component (Light Industrial Theme)
 */

import { MINE_TOPOGRAPHY, state } from '../engine/state.js';
import { soundEngine } from '../engine/sound_engine.js';

export class MineMap2D {
  constructor(containerId, onSelectEntity) {
    this.container = document.getElementById(containerId);
    this.onSelectEntity = onSelectEntity;
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.pan = { x: 0, y: 0 };
    this.zoom = 1;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.hoveredEntity = null;
    this.lidarAngle = 0;
    this.packetAnimPhase = 0;
    this.particles = [];
    
    // Layer visibility toggles
    this.layers = {
      sensors: true,
      workers: true,
      robots: true,
      hazards: true,
      routes: true,
      mesh: true
    };

    this.init();
  }

  init() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="mine-map-wrapper">
        <canvas id="mapCanvas"></canvas>
        
        <div class="map-hud-overlay">
          <div class="status-pill">
            <i data-lucide="compass" class="pill-icon"></i>
            <div class="pill-data">
              <span class="pill-label">MINE SECTOR</span>
              <span class="pill-value font-mono">BHARAT BLOCK-IV [SUBTERRANEAN GRID]</span>
            </div>
          </div>
          <div class="status-pill">
            <i data-lucide="layers" class="pill-icon"></i>
            <div class="pill-data">
              <span class="pill-label">ACTIVE DEPTH SPAN</span>
              <span class="pill-value font-mono">0m Surface ➔ -380m Face 4B</span>
            </div>
          </div>
        </div>

        <div class="map-hud-controls">
          <button class="btn-icon" id="btnZoomIn" title="Zoom In"><i data-lucide="zoom-in"></i></button>
          <button class="btn-icon" id="btnZoomOut" title="Zoom Out"><i data-lucide="zoom-out"></i></button>
          <button class="btn-icon" id="btnResetView" title="Reset Camera View"><i data-lucide="maximize"></i></button>
        </div>

        <div class="map-legend">
          <div class="legend-item"><span class="legend-icon" style="background:#2563eb;"></span> Sentinel Node</div>
          <div class="legend-item"><span class="legend-icon" style="background:#059669;"></span> Worker Bio-Tag</div>
          <div class="legend-item"><span class="legend-icon" style="background:#7c3aed;"></span> Robot Fleet</div>
          <div class="legend-item"><span class="legend-icon" style="background:#d97706;"></span> Gas Hazard</div>
          <div class="legend-item"><span class="legend-icon" style="background:#0284c7;"></span> Flood Water</div>
          <div class="legend-item"><span class="legend-icon" style="background:#dc2626;"></span> Worker SOS</div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#mapCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindEvents();
    this.initGasParticles();
  }

  resize() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height || 480;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  initGasParticles() {
    this.particles = [];
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: 580 + (Math.random() - 0.5) * 60,
        y: 410 + (Math.random() - 0.5) * 40,
        radius: 12 + Math.random() * 20,
        alpha: 0.18 + Math.random() * 0.25,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4
      });
    }
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStart = { x: e.clientX - this.pan.x, y: e.clientY - this.pan.y };
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.pan.x = e.clientX - this.dragStart.x;
        this.pan.y = e.clientY - this.dragStart.y;
      }
      this.checkHover(e);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.zoom = Math.max(0.6, Math.min(2.5, this.zoom * zoomFactor));
    });

    this.canvas.addEventListener('click', (e) => {
      this.handleClick(e);
    });

    const btnZoomIn = this.container.querySelector('#btnZoomIn');
    const btnZoomOut = this.container.querySelector('#btnZoomOut');
    const btnResetView = this.container.querySelector('#btnResetView');

    if (btnZoomIn) btnZoomIn.onclick = () => { this.zoom = Math.min(2.5, this.zoom * 1.2); soundEngine.playClick(); };
    if (btnZoomOut) btnZoomOut.onclick = () => { this.zoom = Math.max(0.6, this.zoom / 1.2); soundEngine.playClick(); };
    if (btnResetView) btnResetView.onclick = () => { this.zoom = 1; this.pan = { x: 0, y: 0 }; soundEngine.playClick(); };
  }

  getTransformedCoords(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (screenX - rect.left - this.pan.x - this.width / 2) / this.zoom + 350;
    const y = (screenY - rect.top - this.pan.y - this.height / 2) / this.zoom + 250;
    return { x, y };
  }

  checkHover(e) {
    const { x, y } = this.getTransformedCoords(e.clientX, e.clientY);
    let found = null;

    // Check Workers
    state.workers.forEach(w => {
      if (Math.hypot(w.x - x, w.y - y) < 18) found = { type: 'worker', data: w };
    });

    // Check Robots
    if (Math.hypot(state.robots.r01.x - x, state.robots.r01.y - y) < 20) {
      found = { type: 'robot', data: state.robots.r01 };
    }
    if (Math.hypot(state.robots.r02.x - x, state.robots.r02.y - y) < 20) {
      found = { type: 'robot', data: state.robots.r02 };
    }

    // Check Sensors
    state.sensors.forEach(s => {
      if (Math.hypot(s.x - x, s.y - y) < 16) found = { type: 'sensor', data: s };
    });

    this.hoveredEntity = found;
    this.canvas.style.cursor = found ? 'pointer' : (this.isDragging ? 'grabbing' : 'default');
  }

  handleClick(e) {
    if (this.hoveredEntity && this.onSelectEntity) {
      soundEngine.playSonarPing();
      this.onSelectEntity(this.hoveredEntity.type, this.hoveredEntity.data);
    }
  }

  render() {
    if (!this.ctx) return;

    this.lidarAngle += 0.04;
    this.packetAnimPhase = (this.packetAnimPhase + 0.02) % 1;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    // Center transformations
    ctx.translate(this.width / 2 + this.pan.x, this.height / 2 + this.pan.y);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-350, -250);

    // 1. Draw Subterranean Rock Mass Grid (Clean Light Theme)
    this.drawSubterraneanGrid(ctx);

    // 2. Draw Mine Tunnels & Shafts
    this.drawMineNetwork(ctx);

    // 3. Draw LoRa Mesh Links & Flowing Packet Particles
    if (this.layers.mesh) this.drawMeshConnections(ctx);

    // 4. Draw Active AI Evacuation Route
    if (this.layers.routes) this.drawEvacuationRoutes(ctx);

    // 5. Draw Dynamic Environmental Hazards
    if (this.layers.hazards) this.drawHazards(ctx);

    // 6. Draw Sentinel Sensor Nodes
    if (this.layers.sensors) this.drawSensors(ctx);

    // 7. Draw Autonomous Robots with LiDAR Scanlines
    if (this.layers.robots) this.drawRobots(ctx);

    // 8. Draw Worker Bio-Tags
    if (this.layers.workers) this.drawWorkers(ctx);

    // 9. Draw Live On-Map Anomaly & Trigger Callout Badges
    this.drawAnomalyCallouts(ctx);

    // 10. Draw Hover HUD Card
    if (this.hoveredEntity) this.drawHoverHUD(ctx);

    ctx.restore();
  }

  drawSubterraneanGrid(ctx) {
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 700; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 500);
      ctx.stroke();
    }
    for (let y = 0; y <= 500; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(700, y);
      ctx.stroke();
    }

    // Depth markers on the left
    ctx.fillStyle = '#64748b';
    ctx.font = '700 10px JetBrains Mono';
    ctx.fillText('SURFACE [0m]', 25, 75);
    ctx.fillText('SUB-LEVEL 1 [-120m]', 25, 175);
    ctx.fillText('SUB-LEVEL 2 [-240m]', 25, 285);
    ctx.fillText('SUB-LEVEL 3 [-380m]', 25, 415);
  }

  drawMineNetwork(ctx) {
    // Tunnels (Edges)
    MINE_TOPOGRAPHY.edges.forEach(edge => {
      const from = MINE_TOPOGRAPHY.nodes[edge.from];
      const to = MINE_TOPOGRAPHY.nodes[edge.to];
      if (!from || !to) return;

      const isShaft = edge.slope === 'vertical_shaft';

      // Tunnel Fill
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.lineWidth = isShaft ? 18 : 22;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Tunnel Borders
      ctx.lineWidth = isShaft ? 20 : 24;
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();

      // Shaft ladder rungs
      if (isShaft) {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        const steps = 6;
        for (let i = 0; i <= steps; i++) {
          const y = from.y + ((to.y - from.y) / steps) * i;
          ctx.beginPath();
          ctx.moveTo(from.x - 7, y);
          ctx.lineTo(from.x + 7, y);
          ctx.stroke();
        }
      }
    });

    // Junctions (Nodes)
    Object.values(MINE_TOPOGRAPHY.nodes).forEach(node => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.type === 'portal' ? 14 : 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 9px Plus Jakarta Sans';
      ctx.fillText(node.name, node.x - 30, node.y - 14);
    });
  }

  drawMeshConnections(ctx) {
    state.meshLinks.forEach(link => {
      if (!link.active) return;
      const sFrom = state.sensors.find(s => s.id === link.from);
      const sTo = state.sensors.find(s => s.id === link.to);
      if (!sFrom || !sTo) return;

      // Link line
      ctx.beginPath();
      ctx.moveTo(sFrom.x, sFrom.y);
      ctx.lineTo(sTo.x, sTo.y);
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Flowing packet particle
      const px = sFrom.x + (sTo.x - sFrom.x) * this.packetAnimPhase;
      const py = sFrom.y + (sTo.y - sFrom.y) * this.packetAnimPhase;

      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawEvacuationRoutes(ctx) {
    const route = state.routes.list.find(r => r.id === state.routes.activeRouteId) || state.routes.list[0];
    if (!route || !route.pathNodes) return;

    ctx.strokeStyle = route.color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    route.pathNodes.forEach((nodeId, idx) => {
      const node = MINE_TOPOGRAPHY.nodes[nodeId];
      if (!node) return;
      if (idx === 0) ctx.moveTo(node.x, node.y);
      else ctx.lineTo(node.x, node.y);
    });
    ctx.stroke();
  }

  drawHazards(ctx) {
    const gas = state.hazards.gasPlume;
    const flood = state.hazards.floodWater;

    // Gas Plume (Toxic Methane Plume)
    if (gas.active) {
      const grad = ctx.createRadialGradient(gas.epicenterX, gas.epicenterY, 5, gas.epicenterX, gas.epicenterY, gas.radius);
      grad.addColorStop(0, 'rgba(217, 119, 6, 0.75)');
      grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.4)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gas.epicenterX, gas.epicenterY, gas.radius, 0, Math.PI * 2);
      ctx.fill();

      // Gas Particles
      this.particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        ctx.fillStyle = `rgba(217, 119, 6, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Inundation Flood Zone (Sump L2)
    if (flood.active) {
      ctx.fillStyle = 'rgba(2, 132, 199, 0.55)';
      ctx.beginPath();
      ctx.arc(150, 340, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  drawSensors(ctx) {
    state.sensors.forEach(s => {
      const isCritical = s.status === 'CRITICAL';
      const isWarn = s.status === 'WARNING';
      const color = isCritical ? '#dc2626' : (isWarn ? '#d97706' : '#2563eb');

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Pulse ring for warnings/critical
      if (isCritical || isWarn) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 11 + Math.sin(Date.now() * 0.008) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#0f172a';
      ctx.font = '700 8.5px JetBrains Mono';
      ctx.fillText(s.id, s.x + 8, s.y + 3);
    });
  }

  drawRobots(ctx) {
    const r01 = state.robots.r01;
    const r02 = state.robots.r02;

    // R01 Scout Robot
    if (r01 && r01.status !== 'OFFLINE') {
      const isFail = r01.isFailed;
      const col = isFail ? '#dc2626' : '#7c3aed';

      // Rotating LiDAR Scan Cone
      if (!isFail) {
        ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
        ctx.beginPath();
        ctx.moveTo(r01.x, r01.y);
        ctx.arc(r01.x, r01.y, 50, this.lidarAngle, this.lidarAngle + 0.85);
        ctx.closePath();
        ctx.fill();
      }

      // Robot Body
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(r01.x, r01.y, 8.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 8.5px JetBrains Mono';
      ctx.fillText(isFail ? 'R01 [JAMMED]' : 'R01 [SCOUT]', r01.x - 24, r01.y - 12);
    }

    // R02 Heavy Rescuer
    if (r02 && (r02.status === 'DEPLOYED' || r02.status === 'RESCUING' || r02.activeTransfer)) {
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(r02.x, r02.y, 9.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 8.5px JetBrains Mono';
      ctx.fillText('R02 [TITAN RESCUE]', r02.x - 26, r02.y - 14);
    }
  }

  drawWorkers(ctx) {
    state.workers.forEach(w => {
      const isSos = w.status === 'SOS' || w.sosActive;
      const isFlagged = w.status === 'FLAGGED';
      const col = isSos ? '#dc2626' : (isFlagged ? '#d97706' : '#059669');

      // SOS Pulsing Wavefront
      if (isSos) {
        const pulseR = 15 + (Date.now() % 1000) * 0.025;
        ctx.strokeStyle = `rgba(220, 38, 38, ${1 - (pulseR - 15) / 22})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(w.x, w.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(w.x, w.y, 7.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = '700 8.5px JetBrains Mono';
      ctx.fillText(w.id, w.x - 10, w.y + 16);
    });
  }

  // Draw Dynamic Live Anomaly & Activity Badges Anchored directly on the Map
  drawAnomalyCallouts(ctx) {
    // 1. Worker SOS Callout Badge
    const sosMiner = state.workers.find(w => w.status === 'SOS' || w.sosActive);
    if (sosMiner) {
      const bx = sosMiner.x - 70;
      const by = sosMiner.y - 38;

      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = 'rgba(220, 38, 38, 0.4)';
      ctx.shadowBlur = 10;
      this.drawRoundedRect(ctx, bx, by, 140, 22, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 9.5px Plus Jakarta Sans';
      ctx.fillText(`🚨 SOS: ${sosMiner.name}`, bx + 8, by + 14);
    }

    // 2. Methane Gas Leak Callout Badge
    if (state.hazards.gasPlume.active) {
      const gx = state.hazards.gasPlume.epicenterX - 85;
      const gy = state.hazards.gasPlume.epicenterY + 28;

      ctx.fillStyle = '#d97706';
      ctx.shadowColor = 'rgba(217, 119, 6, 0.4)';
      ctx.shadowBlur = 8;
      this.drawRoundedRect(ctx, gx, gy, 170, 20, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 9px Plus Jakarta Sans';
      ctx.fillText(`⚠️ METHANE LEAK: 2.45% LEL`, gx + 8, gy + 13);
    }

    // 3. Flood Water Callout Badge
    if (state.hazards.floodWater.active) {
      const fx = 75;
      const fy = 385;

      ctx.fillStyle = '#0284c7';
      this.drawRoundedRect(ctx, fx, fy, 150, 20, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 9px Plus Jakarta Sans';
      ctx.fillText(`🌊 FLOOD: SUMP ${state.hazards.floodWater.sumpLevelCm}cm`, fx + 8, fy + 13);
    }

    // 4. Robot Failover Handover Link
    if (state.robots.r01.isFailed && state.robots.r02.activeTransfer) {
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(state.robots.r01.x, state.robots.r01.y);
      ctx.lineTo(state.robots.r02.x, state.robots.r02.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  drawHoverHUD(ctx) {
    const { type, data } = this.hoveredEntity;
    const x = data.x + 15;
    const y = data.y - 15;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
    ctx.shadowBlur = 12;

    const w = 170;
    const h = type === 'worker' ? 76 : 64;
    this.drawRoundedRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#1d4ed8';
    ctx.font = '800 10px Plus Jakarta Sans';
    ctx.fillText(`${type.toUpperCase()}: ${data.id || data.name}`, x + 8, y + 16);

    ctx.fillStyle = '#334155';
    ctx.font = '600 9px Plus Jakarta Sans';
    if (type === 'worker') {
      ctx.fillText(`Role: ${data.role}`, x + 8, y + 32);
      ctx.fillText(`Vitals: ${data.hr} BPM | SpO2: ${data.spO2}%`, x + 8, y + 48);
      ctx.fillText(`Status: ${data.status} (Bat: ${data.battery}%)`, x + 8, y + 64);
    } else if (type === 'sensor') {
      ctx.fillText(`CH4: ${data.ch4}% | CO: ${data.co}ppm`, x + 8, y + 32);
      ctx.fillText(`Temp: ${data.temp}°C | Water: ${data.waterLevel}cm`, x + 8, y + 48);
    } else if (type === 'robot') {
      ctx.fillText(`Status: ${data.status}`, x + 8, y + 32);
      ctx.fillText(`SLAM Coverage: ${data.mappedCoverage}%`, x + 8, y + 48);
    }
  }
}

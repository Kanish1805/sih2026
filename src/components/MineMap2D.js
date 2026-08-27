/**
 * NEXUS 2D Subterranean Tactical Map & SLAM HUD Component (5 Tunnels)
 * Features:
 * - 5 Subterranean Tunnels (Tunnel 1 to Tunnel 5, Depths 0m to -600m)
 * - Clean HUD without top-left Sector / Benchmark pills
 * - 3-Member Rescue Team Patrol in fluorescent orange gear
 * - RED Route for Surface Rescue Team Ingress
 * - BLACK Route for Shortest Path to Safest Node (Accidents & 3s Spidy SOS, hides on SOS OFF)
 * - Hover-Only Spidy Recon Popups
 * - Click-to-Inspect for Accidental Zone Sensors
 */

import { MINE_TOPOGRAPHY, STATUTORY_LIMITS, state } from '../engine/state.js';
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
    this.zoom = 0.88;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.hoveredEntity = null;
    this.lidarAngle = 0;
    this.packetAnimPhase = 0;
    this.spiderLegCycle = 0;
    this.particles = [];
    
    this.layers = {
      sensors: true,
      workers: true,
      robots: true,
      hazards: true,
      routes: true,
      mesh: true,
      rescueTeam: true
    };

    this.init();
  }

  init() {
    if (!this.container) return;

    // Clean HUD: No "MINE SECTOR" or "STATUTORY BENCHMARKS" overlay pills!
    this.container.innerHTML = `
      <div class="mine-map-wrapper">
        <canvas id="mapCanvas"></canvas>

        <div class="map-hud-controls">
          <button class="btn-icon" id="btnZoomIn" title="Zoom In"><i data-lucide="zoom-in"></i></button>
          <button class="btn-icon" id="btnZoomOut" title="Zoom Out"><i data-lucide="zoom-out"></i></button>
          <button class="btn-icon" id="btnResetView" title="Reset Camera View"><i data-lucide="maximize"></i></button>
        </div>

        <div class="map-legend">
          <div class="legend-item"><span class="legend-icon" style="background:#2563eb;"></span> Sentinel Node (12)</div>
          <div class="legend-item"><span class="legend-icon" style="background:#059669;"></span> Indian Miner (13)</div>
          <div class="legend-item"><span class="legend-icon" style="background:#ea580c;"></span> <strong>3-Member Rescue Patrol</strong></div>
          <div class="legend-item"><span class="legend-icon" style="background:#7c3aed;"></span> Spidy Scout</div>
          <div class="legend-item"><span class="legend-icon" style="background:#dc2626;"></span> <strong>RED: Rescue Ingress Path</strong></div>
          <div class="legend-item"><span class="legend-icon" style="background:#000000; border:1px solid #fff;"></span> <strong>BLACK: Safest Node Route</strong></div>
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
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: 590 + (Math.random() - 0.5) * 60,
        y: 330 + (Math.random() - 0.5) * 40,
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
      this.zoom = Math.max(0.5, Math.min(2.5, this.zoom * zoomFactor));
    });

    this.canvas.addEventListener('click', (e) => {
      this.handleClick(e);
    });

    const btnZoomIn = this.container.querySelector('#btnZoomIn');
    const btnZoomOut = this.container.querySelector('#btnZoomOut');
    const btnResetView = this.container.querySelector('#btnResetView');

    if (btnZoomIn) btnZoomIn.onclick = () => { this.zoom = Math.min(2.5, this.zoom * 1.2); soundEngine.playClick(); };
    if (btnZoomOut) btnZoomOut.onclick = () => { this.zoom = Math.max(0.5, this.zoom / 1.2); soundEngine.playClick(); };
    if (btnResetView) btnResetView.onclick = () => { this.zoom = 0.88; this.pan = { x: 0, y: 0 }; soundEngine.playClick(); };
  }

  getTransformedCoords(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (screenX - rect.left - this.pan.x - this.width / 2) / this.zoom + 350;
    const y = (screenY - rect.top - this.pan.y - this.height / 2) / this.zoom + 300;
    return { x, y };
  }

  checkHover(e) {
    const { x, y } = this.getTransformedCoords(e.clientX, e.clientY);
    let found = null;

    // Check Workers
    state.workers.forEach(w => {
      if (Math.hypot(w.x - x, w.y - y) < 18) found = { type: 'worker', data: w };
    });

    // Check Rescue Patrol
    if (state.rescueTeamPatrol.active) {
      state.rescueTeamPatrol.members.forEach(m => {
        if (Math.hypot(m.x - x, m.y - y) < 16) found = { type: 'rescue_patrol', data: m };
      });
    }

    // Check Robots
    if (Math.hypot(state.robots.r01.x - x, state.robots.r01.y - y) < 24) {
      found = { type: 'robot', data: state.robots.r01 };
    }
    if (Math.hypot(state.robots.r02.x - x, state.robots.r02.y - y) < 24) {
      found = { type: 'robot', data: state.robots.r02 };
    }

    // Check Sensors / Accidental Zone Node
    state.sensors.forEach(s => {
      if (Math.hypot(s.x - x, s.y - y) < 18) found = { type: 'sensor', data: s };
    });

    // Check Incident Node for Spidy Recon Hover
    if (state.reconReport.active) {
      const incNode = MINE_TOPOGRAPHY.nodes[state.reconReport.incidentNodeId];
      if (incNode && Math.hypot(incNode.x - x, incNode.y - y) < 25) {
        found = { type: 'incident_recon', data: state.reconReport };
      }
    }

    this.hoveredEntity = found;
    this.canvas.style.cursor = found ? 'pointer' : (this.isDragging ? 'grabbing' : 'default');
  }

  handleClick(e) {
    if (this.hoveredEntity) {
      soundEngine.playSonarPing();
      if (this.hoveredEntity.type === 'worker') {
        state.selectedWorkerId = this.hoveredEntity.data.id;
      }
      if (this.onSelectEntity) {
        this.onSelectEntity(this.hoveredEntity.type, this.hoveredEntity.data);
      }
    } else {
      state.selectedWorkerId = null;
    }
  }

  render() {
    if (!this.ctx) return;

    this.lidarAngle += 0.05;
    this.spiderLegCycle += 0.08;
    this.packetAnimPhase = (this.packetAnimPhase + 0.02) % 1;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    // Center transformations for 5 subterranean tunnels
    ctx.translate(this.width / 2 + this.pan.x, this.height / 2 + this.pan.y);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-350, -300);

    // 1. Subterranean Grid & 5 Tunnel Depths
    this.drawSubterraneanGrid(ctx);

    // 2. Mine Network Tunnels
    this.drawMineNetwork(ctx);

    // 3. LoRa Mesh Connections
    if (this.layers.mesh) this.drawMeshConnections(ctx);

    // 4. Dedicated Routes:
    // RED: Rescue Ingress Path
    if (this.layers.rescueTeam) this.drawRescueTeamRoute(ctx);

    // BLACK: Shortest Route to Safest Node (Accident & Spidy SOS)
    this.drawSafestNodeBlackPath(ctx);

    // 5. Environmental Hazards
    if (this.layers.hazards) this.drawHazards(ctx);

    // 6. Sentinel Sensor Nodes
    if (this.layers.sensors) this.drawSensors(ctx);

    // 7. Autonomous Spider Robots
    if (this.layers.robots) this.drawSpiderRobots(ctx);

    // 8. 3-Member Rescue Team Patrol
    if (this.layers.rescueTeam) this.drawRescueTeamPatrol(ctx);

    // 9. 13 Indian Miners
    if (this.layers.workers) this.drawWorkers(ctx);

    // 10. Hover HUD Card (Spidy Recon popup appears only on hover)
    if (this.hoveredEntity) this.drawHoverHUD(ctx);

    ctx.restore();
  }

  drawSubterraneanGrid(ctx) {
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 720; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 620);
      ctx.stroke();
    }
    for (let y = 0; y <= 620; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(720, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '700 10px JetBrains Mono';
    ctx.fillText('SURFACE [0m]', 15, 75);
    ctx.fillText('TUNNEL 1 [-120m]', 15, 155);
    ctx.fillText('TUNNEL 2 [-240m]', 15, 245);
    ctx.fillText('TUNNEL 3 [-360m]', 15, 335);
    ctx.fillText('TUNNEL 4 [-480m]', 15, 425);
    ctx.fillText('TUNNEL 5 [-600m]', 15, 515);
  }

  drawMineNetwork(ctx) {
    // Tunnels (Edges)
    MINE_TOPOGRAPHY.edges.forEach(edge => {
      const from = MINE_TOPOGRAPHY.nodes[edge.from];
      const to = MINE_TOPOGRAPHY.nodes[edge.to];
      if (!from || !to) return;

      const isShaft = edge.slope === 'vertical_shaft';

      // Tunnel Body
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.lineWidth = isShaft ? 20 : 24;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Tunnel Borders
      ctx.lineWidth = isShaft ? 22 : 26;
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();

      // Vertical Shaft Rungs
      if (isShaft) {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
          const y = from.y + ((to.y - from.y) / steps) * i;
          ctx.beginPath();
          ctx.moveTo(from.x - 8, y);
          ctx.lineTo(from.x + 8, y);
          ctx.stroke();
        }
      }
    });

    // Junctions (Nodes)
    Object.values(MINE_TOPOGRAPHY.nodes).forEach(node => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = node.type === 'refuge' ? '#0f172a' : '#1e293b';
      ctx.lineWidth = node.type === 'refuge' ? 3.5 : 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.type === 'portal' ? 14 : (node.type === 'refuge' ? 13 : 9), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Simple Label
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 8.5px Plus Jakarta Sans';
      ctx.fillText(node.name.split('(')[0], node.x - 28, node.y - 12);
    });
  }

  drawMeshConnections(ctx) {
    state.meshLinks.forEach(link => {
      if (!link.active) return;
      const sFrom = state.sensors.find(s => s.id === link.from);
      const sTo = state.sensors.find(s => s.id === link.to);
      if (!sFrom || !sTo) return;

      ctx.beginPath();
      ctx.moveTo(sFrom.x, sFrom.y);
      ctx.lineTo(sTo.x, sTo.y);
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const px = sFrom.x + (sTo.x - sFrom.x) * this.packetAnimPhase;
      const py = sFrom.y + (sTo.y - sFrom.y) * this.packetAnimPhase;

      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * RED ROUTE: First-Responder Surface Rescue Team Ingress Path
   */
  drawRescueTeamRoute(ctx) {
    const rescue = state.rescueTeamRoute;
    if (!rescue || !rescue.active || !rescue.pathNodes) return;

    ctx.strokeStyle = '#dc2626'; // RED RESCUE PATH
    ctx.lineWidth = 5.5;
    ctx.setLineDash([8, 6]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    rescue.pathNodes.forEach((nodeId, idx) => {
      const node = MINE_TOPOGRAPHY.nodes[nodeId];
      if (!node) return;
      if (idx === 0) ctx.moveTo(node.x, node.y);
      else ctx.lineTo(node.x, node.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * BLACK ROUTE: Shortest Route to Safest Node (Accidents & Spidy SOS)
   * Automatically hides when SOS is turned OFF!
   */
  drawSafestNodeBlackPath(ctx) {
    // 1. Spidy SOS Black Path (Active only when sosBlackPath.isReady is true)
    if (state.sosBlackPath && state.sosBlackPath.active && state.sosBlackPath.isReady && state.sosBlackPath.pathNodes.length > 0) {
      this.drawSingleBlackPath(ctx, state.sosBlackPath.pathNodes);
      return;
    }

    // 2. Accident Shortest Safe Route
    if (state.accidentSafeRoute && state.accidentSafeRoute.active && state.accidentSafeRoute.pathNodes.length > 0) {
      this.drawSingleBlackPath(ctx, state.accidentSafeRoute.pathNodes);
      return;
    }

    // 3. Worker Manual Selected Route
    const selectedWorker = state.workers.find(w => w.id === state.selectedWorkerId && w.tagRedirectRoute);
    if (selectedWorker && selectedWorker.tagRedirectRoute.pathNodes) {
      this.drawSingleBlackPath(ctx, selectedWorker.tagRedirectRoute.pathNodes);
    }
  }

  drawSingleBlackPath(ctx, pathNodes) {
    ctx.strokeStyle = '#000000'; // BLACK ROUTE
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    pathNodes.forEach((nodeId, idx) => {
      const node = MINE_TOPOGRAPHY.nodes[nodeId];
      if (!node) return;
      if (idx === 0) ctx.moveTo(node.x, node.y);
      else ctx.lineTo(node.x, node.y);
    });
    ctx.stroke();

    // Subtle White Dashed Core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * 3-MEMBER RESCUE TEAM PATROL
   */
  drawRescueTeamPatrol(ctx) {
    const patrol = state.rescueTeamPatrol;
    if (!patrol || !patrol.active) return;

    patrol.members.forEach(m => {
      ctx.fillStyle = m.color || '#ea580c';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // White Rescue Helmet
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(m.x, m.y - 2, 4, 0, Math.PI);
      ctx.fill();

      // Blue Strobe Headlamp
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(m.x + 3, m.y - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#ea580c';
      ctx.font = '800 8px JetBrains Mono';
      ctx.fillText(m.id, m.x - 12, m.y + 15);
    });

    // Formation Connection Line
    ctx.strokeStyle = 'rgba(234, 88, 12, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(patrol.members[0].x, patrol.members[0].y);
    ctx.lineTo(patrol.members[1].x, patrol.members[1].y);
    ctx.moveTo(patrol.members[0].x, patrol.members[0].y);
    ctx.lineTo(patrol.members[2].x, patrol.members[2].y);
    ctx.stroke();
  }

  drawHazards(ctx) {
    const gas = state.hazards.gasPlume;
    const flood = state.hazards.floodWater;

    // Gas Plume
    if (gas.active) {
      const grad = ctx.createRadialGradient(gas.epicenterX, gas.epicenterY, 5, gas.epicenterX, gas.epicenterY, gas.radius);
      grad.addColorStop(0, 'rgba(217, 119, 6, 0.75)');
      grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.4)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gas.epicenterX, gas.epicenterY, gas.radius, 0, Math.PI * 2);
      ctx.fill();

      this.particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        ctx.fillStyle = `rgba(217, 119, 6, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Flood Inundation Basin
    if (flood.active) {
      ctx.fillStyle = 'rgba(2, 132, 199, 0.55)';
      ctx.beginPath();
      ctx.arc(flood.epicenterX, flood.epicenterY, 38, 0, Math.PI * 2);
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

  drawSpiderRobots(ctx) {
    const r01 = state.robots.r01;
    const r02 = state.robots.r02;

    if (r01 && r01.status !== 'OFFLINE') {
      this.drawSingleSpiderRobot(ctx, r01, r01.isFailed ? '#dc2626' : '#7c3aed', 'R-01 (SPIDY SCOUT)');
    }
    if (r02 && (r02.status === 'SPRINTING_TO_INCIDENT' || r02.status === 'CONDUCTING_SLAM_RECON' || r02.activeTransfer)) {
      this.drawSingleSpiderRobot(ctx, r02, '#d97706', 'R-02 (SPIDY STANDBY)');
    }
  }

  drawSingleSpiderRobot(ctx, robot, color, label) {
    const x = robot.x;
    const y = robot.y;
    const isFail = robot.isFailed;

    // Rotating LiDAR Scanning Cone
    if (!isFail) {
      ctx.fillStyle = 'rgba(124, 58, 237, 0.18)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, 60, this.lidarAngle, this.lidarAngle + 0.9);
      ctx.closePath();
      ctx.fill();
    }

    // 6 Articulated Spider Legs
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 6; i++) {
      const isLeft = i < 3;
      const legIndex = i % 3;
      const baseAngle = isLeft ? Math.PI / 4 + (legIndex * Math.PI / 4) : Math.PI + Math.PI / 4 + (legIndex * Math.PI / 4);
      const legStep = isFail ? 0 : Math.sin(this.spiderLegCycle + (i % 2 === 0 ? 0 : Math.PI)) * 4;

      const kneeX = x + Math.cos(baseAngle) * 12;
      const kneeY = y + Math.sin(baseAngle) * 12 + legStep;
      const footX = x + Math.cos(baseAngle) * 22;
      const footY = y + Math.sin(baseAngle) * 22 + legStep * 1.5;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(footX, footY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central Hexagonal Spider Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Optical Eye
    ctx.fillStyle = isFail ? '#ffffff' : '#00f0ff';
    ctx.beginPath();
    ctx.arc(x + 4, y, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = '800 8.5px JetBrains Mono';
    ctx.fillText(isFail ? `${label} [JAMMED]` : `${label}`, x - 32, y - 14);
  }

  drawWorkers(ctx) {
    state.workers.forEach(w => {
      const isTrapped = w.status === 'TRAPPED' || w.status === 'SOS' || w.sosActive;
      const isWarn = w.tagWarning !== null || w.status === 'WARNING';
      const isSelected = w.id === state.selectedWorkerId;
      const col = isTrapped ? '#dc2626' : (isWarn ? '#d97706' : '#059669');

      // Trapped Pulsing Wavefront
      if (isTrapped) {
        const pulseR = 15 + (Date.now() % 1000) * 0.025;
        ctx.strokeStyle = `rgba(220, 38, 38, ${1 - (pulseR - 15) / 22})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(w.x, w.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (isSelected) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w.x, w.y, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Miner Avatar
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(w.x, w.y, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Yellow Hardhat
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(w.x, w.y - 2, 4, 0, Math.PI);
      ctx.fill();

      // Label & Vitals Badge
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 8px JetBrains Mono';
      ctx.fillText(`${w.id} (${w.name.split(' ')[0]})`, w.x - 20, w.y + 16);

      if (isWarn || isTrapped) {
        ctx.fillStyle = isTrapped ? '#dc2626' : '#d97706';
        ctx.font = '800 8px Plus Jakarta Sans';
        ctx.fillText(isTrapped ? '🚨 TRAPPED (STAND STILL)' : '⚠️ ESCAPING', w.x - 30, w.y - 12);
      }
    });
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y + width, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Hover HUD Card (Spidy Recon popup appears ONLY on hover)
   */
  drawHoverHUD(ctx) {
    const { type, data } = this.hoveredEntity;
    const x = data.x !== undefined ? data.x + 15 : 400;
    const y = data.y !== undefined ? data.y - 15 : 200;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = type === 'incident_recon' ? '#7c3aed' : '#2563eb';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
    ctx.shadowBlur = 12;

    const w = type === 'incident_recon' ? 260 : 190;
    const h = type === 'incident_recon' ? 88 : (type === 'worker' ? 88 : 72);
    this.drawRoundedRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (type === 'incident_recon') {
      ctx.fillStyle = '#6b21a8';
      ctx.font = '800 10.5px Plus Jakarta Sans';
      ctx.fillText(`🕷️ SPIDY RECON REPORT: ${data.incidentName.split('(')[0]}`, x + 8, y + 16);

      ctx.fillStyle = '#334155';
      ctx.font = '700 9px JetBrains Mono';
      ctx.fillText(`CH4: ${data.ch4}% LEL | Temp: ${data.temp}°C | CO: ${data.co}ppm`, x + 8, y + 32);
      ctx.fillText(`Victim: ${data.humanDetected ? data.humanName : 'Clear'} [${data.humanStatus}]`, x + 8, y + 48);

      ctx.fillStyle = '#dc2626';
      ctx.font = '800 8.5px Plus Jakarta Sans';
      ctx.fillText(`■ RED: Rescue Team Ingress Path`, x + 8, y + 64);
      ctx.fillStyle = '#000000';
      ctx.fillText(`■ BLACK: Safest Node Route`, x + 8, y + 78);
    } else if (type === 'worker') {
      ctx.fillStyle = '#1d4ed8';
      ctx.font = '800 10.5px Plus Jakarta Sans';
      ctx.fillText(`MINER: ${data.name}`, x + 8, y + 16);

      ctx.fillStyle = '#334155';
      ctx.font = '600 9px Plus Jakarta Sans';
      ctx.fillText(`Role: ${data.role} (${data.tunnelName || data.level.toUpperCase()})`, x + 8, y + 32);
      ctx.fillText(`Vitals: ${data.hr} BPM | SpO2: ${data.spO2}%`, x + 8, y + 46);
      ctx.fillText(`Motion: ${data.motion} (Battery: ${data.battery}%)`, x + 8, y + 60);
      ctx.fillStyle = data.status === 'TRAPPED' ? '#dc2626' : (data.tagWarning ? '#d97706' : '#059669');
      ctx.font = '700 8.5px Plus Jakarta Sans';
      ctx.fillText(`Status: ${data.status} ${data.status === 'TRAPPED' ? '(STAND STILL)' : ''}`, x + 8, y + 76);
    } else if (type === 'rescue_patrol') {
      ctx.fillStyle = '#ea580c';
      ctx.font = '800 10.5px Plus Jakarta Sans';
      ctx.fillText(`RESCUE PATROL: ${data.name}`, x + 8, y + 16);
      ctx.fillStyle = '#334155';
      ctx.font = '600 9px Plus Jakarta Sans';
      ctx.fillText(`Role: ${data.role}`, x + 8, y + 32);
      ctx.fillText(`Status: ${state.rescueTeamPatrol.status}`, x + 8, y + 46);
      ctx.fillText(`Gear: SCBA 60-min + Thermal FLIR`, x + 8, y + 60);
    } else if (type === 'sensor') {
      ctx.fillStyle = '#1d4ed8';
      ctx.font = '800 10.5px Plus Jakarta Sans';
      ctx.fillText(`SENSOR: ${data.id} (${data.name})`, x + 8, y + 16);
      ctx.fillStyle = '#334155';
      ctx.font = '600 9px Plus Jakarta Sans';
      ctx.fillText(`CH4: ${data.ch4}% LEL (Safe: < 0.75%)`, x + 8, y + 32);
      ctx.fillText(`CO: ${data.co}ppm | O2: ${data.o2}%`, x + 8, y + 46);
      ctx.fillText(`Water: ${data.waterLevel}cm | Temp: ${data.temp}°C`, x + 8, y + 60);
    } else if (type === 'robot') {
      ctx.fillStyle = '#7c3aed';
      ctx.font = '800 10.5px Plus Jakarta Sans';
      ctx.fillText(`ROBOT: ${data.name}`, x + 8, y + 16);
      ctx.fillStyle = '#334155';
      ctx.font = '600 9px Plus Jakarta Sans';
      ctx.fillText(`Status: ${data.status}`, x + 8, y + 32);
      ctx.fillText(`SLAM Coverage: ${data.mappedCoverage}%`, x + 8, y + 46);
      ctx.fillText(`Payload: 360° LiDAR + FLIR Thermal`, x + 8, y + 60);
    }
  }
}

/**
 * NEXUS Robotics Fleet & SLAM Mapping Command Module (Light Theme)
 */

import { state } from '../engine/state.js';
import { simEngine } from '../engine/simulation.js';
import { soundEngine } from '../engine/sound_engine.js';

export class RobotModule {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
  }

  render() {
    if (!this.container) return;
    const r01 = state.robots.r01;
    const r02 = state.robots.r02;

    this.container.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <i data-lucide="bot" style="color: var(--purple-bright);"></i>
          <span class="card-title">AUTONOMOUS ROBOTICS FLEET & 360° SLAM RECONNAISSANCE</span>
        </div>
        <div class="card-actions">
          <button class="btn-scenario btn-robot-action" id="btnTriggerRobotFailover">
            <i data-lucide="bot-off"></i>
            <span>Simulate R01 Jam & Failover</span>
          </button>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- R01 Scout Card -->
        <div class="nexus-card" style="border-color: ${r01.isFailed ? 'var(--red-crit)' : 'var(--border-subtle)'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="font-mono" style="font-weight: 800; font-size: 13.5px; color: var(--purple-bright);">${r01.id}</span>
                <span style="font-weight: 700; font-size: 13.5px; color: var(--text-highlight);">${r01.name}</span>
              </div>
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${r01.role}</div>
            </div>
            <span class="nav-badge" style="background: ${r01.isFailed ? 'var(--red-tint)' : 'var(--purple-tint)'}; color: ${r01.isFailed ? 'var(--red-crit)' : 'var(--purple-bright)'}; font-weight: 800; font-size: 10px;">
              ${r01.status}
            </span>
          </div>

          <!-- Live 360 LiDAR Simulation Canvas -->
          <div style="background: #0f172a; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 6px; margin-bottom: 8px; position: relative;">
            <canvas id="r01LidarCanvas" width="300" height="130" style="width: 100%; height: 130px; display: block;"></canvas>
            <div style="position: absolute; left: 10px; bottom: 6px; font-family: var(--font-mono); font-size: 9.5px; color: #c084fc; font-weight: 700;">
              360° RPLiDAR A2 POINT-CLOUD [${r01.lidarPoints} PTS]
            </div>
          </div>

          <!-- Metrics -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; font-family: var(--font-mono); font-size: 10.5px;">
            <div style="background: var(--bg-secondary); padding: 5px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">BATTERY</div>
              <div style="font-weight: 800; color: var(--text-highlight);">${r01.battery}%</div>
            </div>
            <div style="background: var(--bg-secondary); padding: 5px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">SPEED</div>
              <div style="font-weight: 800; color: var(--blue-primary);">${r01.speedMps} m/s</div>
            </div>
            <div style="background: var(--bg-secondary); padding: 5px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">SLAM MAPPED</div>
              <div style="font-weight: 800; color: var(--green-safe);">${r01.mappedCoverage}%</div>
            </div>
          </div>

          <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">
            <strong>Payload:</strong> ${r01.payload}
          </div>
          ${r01.isFailed ? `<div style="background: var(--red-tint); border-left: 3px solid var(--red-crit); padding: 6px 10px; font-size: 11px; color: var(--red-crit); font-weight: 700; margin-top: 6px;">FAILURE: ${r01.failureReason}</div>` : ''}
        </div>

        <!-- R02 Heavy Rescuer Card -->
        <div class="nexus-card" style="border-color: ${r02.status === 'DEPLOYED' ? 'var(--amber-warn)' : 'var(--border-subtle)'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="font-mono" style="font-weight: 800; font-size: 13.5px; color: var(--amber-warn);">${r02.id}</span>
                <span style="font-weight: 700; font-size: 13.5px; color: var(--text-highlight);">${r02.name}</span>
              </div>
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${r02.role}</div>
            </div>
            <span class="nav-badge" style="background: var(--amber-tint); color: var(--amber-warn); font-weight: 800; font-size: 10px;">
              ${r02.status}
            </span>
          </div>

          <!-- FLIR Thermal Feed -->
          <div style="background: #0f172a; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 6px; margin-bottom: 8px; position: relative;">
            <canvas id="r02ThermalCanvas" width="300" height="130" style="width: 100%; height: 130px; display: block;"></canvas>
            <div style="position: absolute; left: 10px; bottom: 6px; font-family: var(--font-mono); font-size: 9.5px; color: #fbbf24; font-weight: 700;">
              FLIR LEPTON 3.5 THERMAL IR STREAM [34.2°C PEAK]
            </div>
          </div>

          <!-- Metrics -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; font-family: var(--font-mono); font-size: 10.5px;">
            <div style="background: var(--bg-secondary); padding: 5px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">BATTERY</div>
              <div style="font-weight: 800; color: var(--text-highlight);">${r02.battery}%</div>
            </div>
            <div style="background: var(--bg-secondary); padding: 5px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">SPEED</div>
              <div style="font-weight: 800; color: var(--blue-primary);">${r02.speedMps} m/s</div>
            </div>
            <div style="background: var(--bg-secondary); padding: 5px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">SLAM SYNC</div>
              <div style="font-weight: 800; color: var(--green-safe);">${r02.mappedCoverage}%</div>
            </div>
          </div>

          <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">
            <strong>Payload:</strong> ${r02.payload}
          </div>
          ${r02.activeTransfer ? `<div style="background: var(--amber-tint); border-left: 3px solid var(--amber-warn); padding: 6px 10px; font-size: 11px; color: var(--amber-warn); font-weight: 700; margin-top: 6px;">AUTONOMOUS HANDOVER: Active rescue trajectory in progress.</div>` : ''}
        </div>
      </div>
    `;

    this.bindEvents();
    this.drawLidarScan();
    this.drawThermalView();
  }

  drawLidarScan() {
    const cvs = this.container.querySelector('#r01LidarCanvas');
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const w = cvs.width;
    const h = cvs.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(192, 132, 252, 0.3)';
    ctx.lineWidth = 1;
    [25, 45, 60].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.fillStyle = '#c084fc';
    for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
      const dist = 32 + Math.sin(angle * 4 + Date.now() * 0.002) * 14 + (Math.random() - 0.5) * 3;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;

      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawThermalView() {
    const cvs = this.container.querySelector('#r02ThermalCanvas');
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const w = cvs.width;
    const h = cvs.height;

    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0c0728');
    grad.addColorStop(0.5, '#1e083a');
    grad.addColorStop(1, '#050212');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const heatGrad = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, 38);
    heatGrad.addColorStop(0, '#ef4444');
    heatGrad.addColorStop(0.4, '#f59e0b');
    heatGrad.addColorStop(0.8, '#7c3aed');
    heatGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = heatGrad;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 15, h / 2);
    ctx.lineTo(w / 2 + 15, h / 2);
    ctx.moveTo(w / 2, h / 2 - 15);
    ctx.lineTo(w / 2, h / 2 + 15);
    ctx.stroke();
  }

  bindEvents() {
    const btn = this.container.querySelector('#btnTriggerRobotFailover');
    if (btn) {
      btn.onclick = () => {
        simEngine.triggerRobotFailure();
        this.render();
      };
    }
  }
}

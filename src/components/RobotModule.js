/**
 * NEXUS Autonomous Robotics Fleet & Spidy SLAM Reconnaissance Module (Light Theme)
 * Features:
 * - Dual Hexapod Spider Robots: R-01 Spidy Scout & R-02 Spidy Standby
 * - Live 360° RPLiDAR A3 Point-Cloud Canvas
 * - Real-Time Autonomous SLAM Reconnaissance & Environmental Assessment HUD
 * - Seamless Failover Handover Controls
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
    const recon = state.reconReport;

    this.container.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <i data-lucide="bot" style="color: var(--purple-bright);"></i>
          <span class="card-title">DUAL SPIDY ROBOTICS & SLAM RECONNAISSANCE</span>
        </div>
        <div class="card-actions">
          <button class="btn-scenario btn-robot-action" id="btnTriggerRobotFailover">
            <i data-lucide="bot-off"></i>
            <span>Simulate Spidy 1 Jam & Failover</span>
          </button>
        </div>
      </div>

      <!-- Real-Time Spidy Reconnaissance Intelligence Assessment Panel -->
      ${recon.active ? `
        <div style="background: var(--bg-secondary); border: 1.5px solid var(--purple-bright); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.12);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px; font-family: var(--font-display); font-size: 12.5px; font-weight: 800; color: var(--purple-ai);">
              <i data-lucide="scan" style="width: 16px; height: 16px;"></i>
              LIVE SPIDY SLAM RECONNAISSANCE INTELLIGENCE
            </div>
            <span class="nav-badge" style="background: var(--purple-tint); color: var(--purple-bright); font-weight: 800; font-size: 9px;">
              ${recon.assignedRobotId.toUpperCase()} ACTIVE
            </span>
          </div>

          <div style="font-size: 11px; color: var(--text-highlight); font-weight: 700; margin-bottom: 6px;">
            Target Sector: <span style="color: var(--blue-primary);">${recon.incidentName}</span> [${recon.incidentType}]
          </div>

          <!-- Environmental Sweep Metrics -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; font-family: var(--font-mono); font-size: 9.5px; margin-bottom: 8px;">
            <div style="background: #ffffff; padding: 4px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">CH4 (METHANE)</div>
              <div style="font-weight: 800; color: ${recon.ch4 > 1.25 ? 'var(--red-crit)' : 'var(--green-safe)'};">${recon.ch4}% LEL</div>
            </div>
            <div style="background: #ffffff; padding: 4px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">TEMPERATURE</div>
              <div style="font-weight: 800; color: var(--text-highlight);">${recon.temp}°C</div>
            </div>
            <div style="background: #ffffff; padding: 4px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">HUMIDITY</div>
              <div style="font-weight: 800; color: var(--text-highlight);">${recon.humidity}%</div>
            </div>
            <div style="background: #ffffff; padding: 4px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">CO / O2</div>
              <div style="font-weight: 800; color: var(--text-highlight);">${recon.co}ppm / ${recon.o2}%</div>
            </div>
          </div>

          <!-- Human Detection & Rescue Assessment -->
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; line-height: 1.4;">
            <div style="background: #ffffff; border: 1px solid var(--border-subtle); padding: 6px 8px; border-radius: var(--radius-xs);">
              <strong>Thermal Human Detection:</strong> 
              <span style="color: ${recon.humanDetected ? 'var(--green-safe)' : 'var(--text-muted)'}; font-weight: 800;">
                ${recon.humanDetected ? `✓ ${recon.humanName} (${recon.humanStatus})` : 'No Personnel Trapped in Sector'}
              </span>
            </div>

            <div style="background: ${recon.rescueTeamAllowed ? 'var(--green-tint)' : 'var(--red-tint)'}; border: 1px solid ${recon.rescueTeamAllowed ? 'var(--green-safe)' : 'var(--red-crit)'}; padding: 6px 8px; border-radius: var(--radius-xs); color: ${recon.rescueTeamAllowed ? '#065f46' : '#991b1b'};">
              <strong>Human Rescue Team Entry Assessment:</strong> ${recon.rescueTeamRationale}
            </div>

            <div style="background: var(--blue-tint); border: 1px solid var(--blue-primary); padding: 6px 8px; border-radius: var(--radius-xs); color: var(--blue-primary); font-weight: 700;">
              <strong>Alternate Evacuation Route Transmitted:</strong> ${recon.alternatePathName}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Dual Spidy Fleet Cards -->
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- R01 Spidy Scout -->
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
            <canvas id="r01LidarCanvas" width="300" height="110" style="width: 100%; height: 110px; display: block;"></canvas>
            <div style="position: absolute; left: 10px; bottom: 6px; font-family: var(--font-mono); font-size: 9.5px; color: #c084fc; font-weight: 700;">
              360° RPLiDAR A3 POINT-CLOUD [${r01.lidarPoints} PTS]
            </div>
          </div>

          <!-- Metrics -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; font-family: var(--font-mono); font-size: 10.5px;">
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

          ${r01.isFailed ? `<div style="background: var(--red-tint); border-left: 3px solid var(--red-crit); padding: 6px 10px; font-size: 11px; color: var(--red-crit); font-weight: 700; margin-top: 6px;">FAILURE: ${r01.failureReason}</div>` : ''}
        </div>

        <!-- R02 Spidy Standby -->
        <div class="nexus-card" style="border-color: ${r02.status === 'SPRINTING_TO_INCIDENT' || r02.activeTransfer ? 'var(--amber-warn)' : 'var(--border-subtle)'};">
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

          <!-- Metrics -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; font-family: var(--font-mono); font-size: 10.5px;">
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

          ${r02.activeTransfer ? `<div style="background: var(--amber-tint); border-left: 3px solid var(--amber-warn); padding: 6px 10px; font-size: 11px; color: var(--amber-warn); font-weight: 700; margin-top: 6px;">AUTONOMOUS HANDOVER: Spidy Standby executing SLAM sweep and rescue route broadcasting.</div>` : ''}
        </div>
      </div>
    `;

    this.bindEvents();
    this.drawLidarScan();
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
    [20, 38, 50].forEach(r => {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    });

    ctx.fillStyle = '#c084fc';
    for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
      const dist = 28 + Math.sin(angle * 4 + Date.now() * 0.002) * 12 + (Math.random() - 0.5) * 3;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;

      ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
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

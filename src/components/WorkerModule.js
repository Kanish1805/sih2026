/**
 * NEXUS Worker Bio-Telemetry & Wearable Tag HUD Module (Light Theme)
 * Features:
 * - 6 Personnel Bio-Telemetry cards with live ECG waveforms
 * - Wearable Tag Hazard Alert Banners & Redirected Path Tracing
 * - Dynamic single-click SOS trigger & map route inspection
 */

import { state } from '../engine/state.js';
import { simEngine } from '../engine/simulation.js';
import { pathfinder } from '../engine/pathfinder.js';
import { soundEngine } from '../engine/sound_engine.js';

export class WorkerModule {
  constructor(containerId, onSelectWorker) {
    this.container = document.getElementById(containerId);
    this.onSelectWorker = onSelectWorker;
    this.ecgPhase = 0;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
  }

  render() {
    if (!this.container) return;
    const workers = state.workers || [];

    this.container.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <i data-lucide="users" style="color: var(--green-safe);"></i>
          <span class="card-title">SUBTERRANEAN PERSONNEL & WEARABLE TAGS</span>
        </div>
        <div class="card-actions">
          <span class="nav-badge" style="background: var(--green-tint); color: var(--green-safe); font-weight: 800;">
            6 ACTIVE BIO-TAGS LOCKED
          </span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        ${workers.map(w => {
          const isSos = w.status === 'SOS' || w.sosActive;
          const isWarn = w.tagWarning !== null || w.status === 'WARNING';
          const isSelected = w.id === state.selectedWorkerId;
          const cardBorder = isSos ? 'var(--red-crit)' : (isWarn ? 'var(--amber-warn)' : (isSelected ? 'var(--blue-primary)' : 'var(--border-subtle)'));
          const badgeBg = isSos ? 'var(--red-tint)' : (isWarn ? 'var(--amber-warn)' : 'var(--green-tint)');
          const badgeColor = isSos ? 'var(--red-crit)' : (isWarn ? '#ffffff' : 'var(--green-safe)');

          return `
            <div class="nexus-card worker-card" data-worker-id="${w.id}" style="border-color: ${cardBorder}; cursor: pointer; padding: 10px 12px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="font-mono" style="font-weight: 800; font-size: 13px; color: var(--blue-primary);">${w.id}</span>
                    <span style="font-weight: 700; font-size: 12.5px; color: var(--text-highlight);">${w.name}</span>
                  </div>
                  <div style="font-size: 10.5px; color: var(--text-muted); font-weight: 600;">${w.role} (${w.level.toUpperCase()})</div>
                </div>
                <span class="nav-badge" style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 800; font-size: 9.5px;">
                  ${isSos ? '🚨 SOS' : (isWarn ? '⚠️ WARNING' : 'NORMAL')}
                </span>
              </div>

              <!-- Wearable Tag Alert Banner -->
              ${w.tagWarning ? `
                <div style="background: var(--amber-tint); border: 1px solid var(--amber-warn); padding: 5px 8px; border-radius: var(--radius-xs); font-size: 10px; color: #92400e; font-weight: 700; margin-bottom: 6px; line-height: 1.35;">
                  ${w.tagWarning}
                </div>
              ` : ''}

              <!-- Live Animated ECG Waveform -->
              <div style="background: #0f172a; border-radius: var(--radius-xs); padding: 4px; margin-bottom: 8px; position: relative;">
                <canvas id="ecg_${w.id}" width="180" height="38" style="width: 100%; height: 38px; display: block;"></canvas>
                <div style="position: absolute; right: 8px; top: 4px; font-family: var(--font-mono); font-size: 10px; font-weight: 800; color: ${isSos ? '#ef4444' : '#10b981'};">
                  ${w.hr} BPM
                </div>
              </div>

              <!-- Metrics -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; font-family: var(--font-mono); font-size: 9.5px; margin-bottom: 8px;">
                <div style="background: var(--bg-secondary); padding: 3px 5px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                  <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">SpO2</div>
                  <div style="font-weight: 800; color: ${w.spO2 < 94 ? 'var(--red-crit)' : 'var(--text-highlight)'};">${w.spO2}%</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 3px 5px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                  <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">MOTION</div>
                  <div style="font-weight: 800; color: var(--blue-primary);">${w.motion}</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 3px 5px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                  <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">BATTERY</div>
                  <div style="font-weight: 800; color: var(--text-highlight);">${w.battery}%</div>
                </div>
              </div>

              <!-- Tag Path Tracing & SOS Action -->
              <div style="display: flex; gap: 6px;">
                <button class="btn-scenario btn-restore btn-trace-path" data-worker-id="${w.id}" style="flex: 1; font-size: 10px; padding: 4px; justify-content: center;">
                  <i data-lucide="navigation" style="width: 12px; height: 12px;"></i>
                  <span>Trace Safe Evac Route</span>
                </button>
                <button class="btn-scenario ${isSos ? 'btn-danger-action' : 'btn-warning-action'} btn-toggle-worker-sos" data-worker-id="${w.id}" style="font-size: 10px; padding: 4px 8px;">
                  ${isSos ? 'SOS Active' : 'Trigger SOS'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindEvents();
    this.drawECGWaveforms();
  }

  drawECGWaveforms() {
    this.ecgPhase += 0.05;
    state.workers.forEach(w => {
      const cvs = this.container.querySelector(`#ecg_${w.id}`);
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      const width = cvs.width;
      const height = cvs.height;

      ctx.clearRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 15) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }

      // ECG Line
      const isSos = w.status === 'SOS' || w.sosActive;
      ctx.strokeStyle = isSos ? '#ef4444' : '#10b981';
      ctx.lineWidth = 1.6;
      ctx.beginPath();

      const freq = isSos ? 0.09 : 0.05;
      const midY = height / 2;

      for (let x = 0; x < width; x++) {
        const cycle = ((x * freq) - this.ecgPhase) % (Math.PI * 2);
        let y = midY;

        if (cycle > 2.0 && cycle < 2.3) y -= 5;
        else if (cycle >= 2.3 && cycle < 2.5) y += 14;
        else if (cycle >= 2.5 && cycle < 2.7) y -= 16;
        else if (cycle >= 2.7 && cycle < 3.0) y += 4;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }

  bindEvents() {
    // Trace Route button
    this.container.querySelectorAll('.btn-trace-path').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-worker-id');
        state.selectedWorkerId = id;
        const evac = pathfinder.calculateWorkerEvacuationRoute(id);
        const w = state.workers.find(wk => wk.id === id);
        if (w) w.tagRedirectRoute = evac;

        soundEngine.playSonarPing();
        this.render();
        if (this.onSelectWorker) this.onSelectWorker(id);
      };
    });

    // Toggle SOS button
    this.container.querySelectorAll('.btn-toggle-worker-sos').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-worker-id');
        const w = state.workers.find(wk => wk.id === id);
        if (w) {
          if (w.status === 'SOS' || w.sosActive) {
            w.status = 'NORMAL';
            w.sosActive = false;
            w.tagWarning = null;
          } else {
            w.status = 'SOS';
            w.sosActive = true;
            w.tagWarning = `🚨 EMERGENCY SOS BEACON ACTIVE`;
            state.selectedWorkerId = w.id;
            pathfinder.calculateRescueTeamIngressRoute(w.nodeId || 'face_4b');
            soundEngine.playEmergencySiren();
          }
          this.render();
        }
      };
    });
  }
}

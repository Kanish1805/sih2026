/**
 * NEXUS Worker Bio-Tags & Wearable Telemetry Module (Light Theme)
 */

import { state } from '../engine/state.js';
import { simEngine } from '../engine/simulation.js';
import { soundEngine } from '../engine/sound_engine.js';

export class WorkerModule {
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

    this.container.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <i data-lucide="users" style="color: var(--green-safe);"></i>
          <span class="card-title">SUBTERRANEAN WORKER BIO-TELEMETRY & UWB TAGS</span>
        </div>
        <div class="card-actions">
          <button class="btn-scenario btn-danger-action" id="btnTriggerW03SOS">
            <i data-lucide="alert-octagon"></i>
            <span>Simulate W-03 SOS</span>
          </button>
        </div>
      </div>

      <div class="worker-grid" style="display: grid; grid-template-columns: 1fr; gap: 12px;">
        ${state.workers.map(w => this.renderWorkerCard(w)).join('')}
      </div>
    `;

    this.bindEvents();
    this.drawECGWaveforms();
  }

  renderWorkerCard(w) {
    const isSos = w.status === 'SOS' || w.sosActive;
    const isFlagged = w.status === 'FLAGGED';
    const statusBg = isSos ? 'var(--red-tint)' : (isFlagged ? 'var(--amber-tint)' : 'var(--green-tint)');
    const statusCol = isSos ? 'var(--red-crit)' : (isFlagged ? 'var(--amber-warn)' : 'var(--green-safe)');

    return `
      <div class="nexus-card worker-card" data-worker-id="${w.id}" style="border-color: ${isSos ? 'var(--red-crit)' : 'var(--border-subtle)'};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="font-mono" style="font-weight: 800; font-size: 13px; color: ${isSos ? 'var(--red-crit)' : 'var(--blue-primary)'};">${w.id}</span>
              <span style="font-weight: 700; font-size: 13.5px; color: var(--text-highlight);">${w.name}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${w.role}</div>
          </div>
          <span class="nav-badge" style="background: ${statusBg}; color: ${statusCol}; font-weight: 800; font-size: 10px;">${w.status}</span>
        </div>

        <!-- ECG Waveform Canvas -->
        <div style="background: #0f172a; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 4px; margin-bottom: 8px; position: relative;">
          <canvas class="worker-ecg-canvas" data-id="${w.id}" width="320" height="42" style="width: 100%; height: 42px; display: block;"></canvas>
          <div style="position: absolute; right: 8px; top: 4px; font-family: var(--font-mono); font-size: 11.5px; font-weight: 800; color: ${isSos ? '#ef4444' : '#10b981'};">
            ${w.hr} <span style="font-size: 8.5px; color: #94a3b8;">BPM</span>
          </div>
        </div>

        <!-- Vital Telemetry Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px; font-family: var(--font-mono); font-size: 10.5px;">
          <div style="background: var(--bg-secondary); padding: 4px 6px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
            <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">SPO2</div>
            <div style="font-weight: 800; color: ${w.spO2 < 95 ? 'var(--amber-warn)' : 'var(--blue-primary)'};">${w.spO2}%</div>
          </div>
          <div style="background: var(--bg-secondary); padding: 4px 6px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
            <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">TEMP</div>
            <div style="font-weight: 800; color: var(--text-highlight);">${w.temp}°C</div>
          </div>
          <div style="background: var(--bg-secondary); padding: 4px 6px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
            <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">DEPTH</div>
            <div style="font-weight: 800; color: var(--text-highlight);">${w.z}m</div>
          </div>
          <div style="background: var(--bg-secondary); padding: 4px 6px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
            <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">MOTION</div>
            <div style="font-weight: 800; color: ${w.motion === 'MAN_DOWN' ? 'var(--red-crit)' : 'var(--green-safe)'};">${w.motion}</div>
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid var(--border-subtle);">
          <div class="font-mono" style="font-size: 9.5px; color: var(--text-muted); font-weight: 600;">
            BAT: <span style="color: var(--text-highlight); font-weight: 800;">${w.battery}%</span> | RSSI: <span style="color: var(--blue-primary); font-weight: 800;">${w.rssi} dBm</span>
          </div>
          <button class="btn-scenario ${isSos ? 'btn-danger-action' : 'btn-warning-action'} btn-worker-action" data-id="${w.id}" style="font-size: 10.5px; padding: 3px 8px;">
            ${isSos ? 'Auto-Dispatch Rescue' : 'Trigger SOS'}
          </button>
        </div>
      </div>
    `;
  }

  drawECGWaveforms() {
    const canvases = this.container.querySelectorAll('.worker-ecg-canvas');
    canvases.forEach(cvs => {
      const id = cvs.getAttribute('data-id');
      const worker = state.workers.find(w => w.id === id);
      if (!worker) return;

      const ctx = cvs.getContext('2d');
      const w = cvs.width;
      const h = cvs.height;
      const isSos = worker.status === 'SOS' || worker.sosActive;
      const strokeCol = isSos ? '#ef4444' : '#10b981';

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      const points = 32;
      const step = w / points;

      for (let i = 0; i <= points; i++) {
        const x = i * step;
        let y = h / 2;

        const phase = (i + Math.floor(Date.now() * 0.01)) % 10;
        if (phase === 4) y = h / 2 - 3;
        else if (phase === 5) y = h / 2 + 5;
        else if (phase === 6) y = isSos ? 4 : 8;
        else if (phase === 7) y = h / 2 + 10;
        else if (phase === 8) y = h / 2 - 5;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }

  bindEvents() {
    const btnW3 = this.container.querySelector('#btnTriggerW03SOS');
    if (btnW3) {
      btnW3.onclick = () => {
        simEngine.triggerWorkerSOS();
        this.render();
      };
    }

    const actionBtns = this.container.querySelectorAll('.btn-worker-action');
    actionBtns.forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const worker = state.workers.find(w => w.id === id);
        if (worker) {
          if (worker.status === 'SOS' || worker.sosActive) {
            simEngine.emitAlert('AI_DISPATCH', `Auto-Rescue Dispatched for ${worker.name}`, 'Rescue crawler navigation trajectory plotted via Route Alpha.', 'warning');
          } else {
            worker.status = 'SOS';
            worker.sosActive = true;
            worker.motion = 'MAN_DOWN';
            worker.hr = 138;
            simEngine.triggerWorkerSOS();
          }
          this.render();
        }
      };
    });
  }
}

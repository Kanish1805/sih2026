/**
 * NEXUS Sentinel Sensor Network Module (Light Theme)
 */

import { state } from '../engine/state.js';
import { simEngine } from '../engine/simulation.js';
import { soundEngine } from '../engine/sound_engine.js';

export class SensorModule {
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
          <i data-lucide="activity" style="color: var(--blue-primary);"></i>
          <span class="card-title">SENTINEL MULTI-GAS & ENVIRONMENTAL MESH NODES</span>
        </div>
        <div class="card-actions">
          <button class="btn-scenario btn-warning-action" id="btnGasSpikeAll">
            <i data-lucide="flame"></i>
            <span>Inject Gas Spike (SN-08)</span>
          </button>
        </div>
      </div>

      <div class="sensor-grid" style="display: grid; grid-template-columns: 1fr; gap: 12px;">
        ${state.sensors.map(s => this.renderSensorCard(s)).join('')}
      </div>
    `;

    this.bindEvents();
  }

  renderSensorCard(s) {
    const isCritical = s.status === 'CRITICAL';
    const isWarning = s.status === 'WARNING';
    const isOffline = s.status === 'OFFLINE';

    const statusBadge = isOffline ? 'OFFLINE' : (isCritical ? 'CRITICAL' : (isWarning ? 'WARNING' : 'NORMAL'));
    const statusBg = isOffline ? '#f1f5f9' : (isCritical ? 'var(--red-tint)' : (isWarning ? 'var(--amber-tint)' : 'var(--blue-tint)'));
    const statusColor = isOffline ? '#64748b' : (isCritical ? 'var(--red-crit)' : (isWarning ? 'var(--amber-warn)' : 'var(--blue-primary)'));

    const history = s.history && s.history.ch4 ? s.history.ch4 : [s.ch4];
    const sparklinePoints = this.generateSparkline(history, 300, 32);

    return `
      <div class="nexus-card sensor-card" data-sensor-id="${s.id}" style="border-color: ${isCritical ? 'var(--red-crit)' : (isWarning ? 'var(--amber-warn)' : 'var(--border-subtle)')};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="font-mono" style="font-weight: 800; font-size: 13px; color: ${statusColor};">${s.id}</span>
              <span style="font-weight: 700; font-size: 13.5px; color: var(--text-highlight);">${s.name}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${s.location}</div>
          </div>
          <span class="nav-badge" style="background: ${statusBg}; color: ${statusColor}; font-weight: 800; font-size: 10px;">
            ${statusBadge}
          </span>
        </div>

        <!-- Real-time Sparkline SVG -->
        <div style="background: #0f172a; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 4px; margin-bottom: 8px; position: relative;">
          <svg width="100%" height="32" viewBox="0 0 300 32" preserveAspectRatio="none" style="display: block;">
            <polyline fill="none" stroke="${isCritical ? '#ef4444' : (isWarning ? '#f59e0b' : '#38bdf8')}" stroke-width="2" points="${sparklinePoints}" />
          </svg>
          <div style="position: absolute; right: 8px; bottom: 2px; font-family: var(--font-mono); font-size: 9px; color: #94a3b8; font-weight: 700;">
            CH4 TREND
          </div>
        </div>

        <!-- 6-Channel Telemetry Matrix -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; font-family: var(--font-mono); font-size: 10.5px;">
          <div style="background: var(--bg-secondary); padding: 4px 6px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
            <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">METHANE (CH4)</div>
            <div style="font-weight: 800; color: ${s.ch4 > 1.25 ? 'var(--red-crit)' : (s.ch4 > 0.5 ? 'var(--amber-warn)' : 'var(--green-safe)')};">${s.ch4.toFixed(2)}% LEL</div>
          </div>

          <div style="background: var(--bg-secondary); padding: 4px 6px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
            <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">CO PPM</div>
            <div style="font-weight: 800; color: ${s.co > 35 ? 'var(--red-crit)' : (s.co > 15 ? 'var(--amber-warn)' : 'var(--text-highlight)')};">${s.co} ppm</div>
          </div>

          <div style="background: var(--bg-secondary); padding: 4px 6px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
            <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">OXYGEN</div>
            <div style="font-weight: 800; color: ${s.o2 < 19.5 ? 'var(--red-crit)' : 'var(--blue-primary)'};">${s.o2}%</div>
          </div>

          <div style="background: var(--bg-secondary); padding: 4px 6px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
            <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">TEMP / HUM</div>
            <div style="font-weight: 800; color: var(--text-highlight);">${s.temp}°C / ${s.humidity}%</div>
          </div>

          <div style="background: var(--bg-secondary); padding: 4px 6px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
            <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">WATER</div>
            <div style="font-weight: 800; color: ${s.waterLevel > 20 ? 'var(--blue-water)' : 'var(--text-highlight)'};">${s.waterLevel} cm</div>
          </div>

          <div style="background: var(--bg-secondary); padding: 4px 6px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
            <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">SEISMIC</div>
            <div style="font-weight: 800; color: ${s.vibration > 1.0 ? 'var(--red-crit)' : 'var(--text-highlight)'};">${s.vibration.toFixed(2)} mm/s</div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid var(--border-subtle);">
          <div class="font-mono" style="font-size: 9.5px; color: var(--text-muted); font-weight: 600;">
            HOPS: <span style="color: var(--blue-primary); font-weight: 800;">${s.meshHops}</span> | BAT: <span style="color: var(--text-highlight); font-weight: 800;">${s.battery}%</span>
          </div>
          <button class="btn-scenario ${isOffline ? 'btn-restore' : 'btn-mesh-action'} btn-toggle-node" data-id="${s.id}" style="font-size: 10px; padding: 2px 8px;">
            ${isOffline ? 'Restore Node' : 'Simulate Fault'}
          </button>
        </div>
      </div>
    `;
  }

  generateSparkline(values, width, height) {
    if (!values || values.length === 0) return '0,16 300,16';
    const min = 0;
    const max = 3.0;
    const step = width / Math.max(1, values.length - 1);

    return values.map((val, i) => {
      const x = i * step;
      const norm = Math.max(0, Math.min(1, (val - min) / (max - min)));
      const y = height - (norm * (height - 6) + 3);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  bindEvents() {
    const btnGas = this.container.querySelector('#btnGasSpikeAll');
    if (btnGas) {
      btnGas.onclick = () => {
        simEngine.triggerGasLeak();
        this.render();
      };
    }

    const toggleBtns = this.container.querySelectorAll('.btn-toggle-node');
    toggleBtns.forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const sensor = state.sensors.find(s => s.id === id);
        if (sensor) {
          sensor.status = sensor.status === 'OFFLINE' ? 'NORMAL' : 'OFFLINE';
          if (sensor.status === 'OFFLINE') {
            simEngine.emitAlert('NODE_FAULT', `Sentinel ${sensor.id} Dropped Offline`, 'Mesh link degraded. Rerouting active.', 'warning');
          } else {
            simEngine.emitAlert('NODE_RECOVER', `Sentinel ${sensor.id} Reconnected`, 'Mesh topology optimized.', 'normal');
          }
          this.render();
        }
      };
    });
  }
}

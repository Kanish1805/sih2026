/**
 * NEXUS LoRa/UWB Mesh Network & Topology Module (Light Theme)
 */

import { state } from '../engine/state.js';
import { simEngine } from '../engine/simulation.js';
import { soundEngine } from '../engine/sound_engine.js';

export class CommNetworkModule {
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
    const activeNodes = state.sensors.filter(s => s.status !== 'OFFLINE').length;
    const totalNodes = state.sensors.length;
    const pdr = activeNodes === totalNodes ? '99.4%' : '91.2%';

    this.container.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <i data-lucide="network" style="color: var(--blue-primary);"></i>
          <span class="card-title">DECENTRALIZED LORA MESH TOPOLOGY</span>
        </div>
        <div class="card-actions">
          <button class="btn-scenario btn-mesh-action" id="btnToggleMeshFault">
            <i data-lucide="wifi-off"></i>
            <span>Simulate Node Drop (SN-05)</span>
          </button>
        </div>
      </div>

      <!-- Live Network KPI Cards -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; font-family: var(--font-mono);">
        <div class="nexus-card" style="padding: 10px;">
          <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">ACTIVE SENTINELS</div>
          <div style="font-size: 16px; font-weight: 900; color: ${activeNodes < totalNodes ? 'var(--amber-warn)' : 'var(--green-safe)'};">
            ${activeNodes} / ${totalNodes} ONLINE
          </div>
        </div>
        <div class="nexus-card" style="padding: 10px;">
          <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">PACKET DELIVERY RATIO</div>
          <div style="font-size: 16px; font-weight: 900; color: var(--blue-primary);">${pdr}</div>
        </div>
      </div>

      <!-- Architecture Pipeline -->
      <div class="nexus-card" style="margin-bottom: 12px;">
        <div style="font-family: var(--font-display); font-size: 12px; font-weight: 800; color: var(--blue-primary); margin-bottom: 8px;">
          SUBTERRANEAN DATA TRANSPORT FLOW
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; font-family: var(--font-mono); font-size: 10px;">
          <div style="background: var(--green-tint); border: 1px solid var(--green-safe); padding: 8px 4px; border-radius: var(--radius-xs); text-align: center; flex: 1;">
            <div style="font-weight: 800; color: var(--green-safe);">1. ESP32</div>
            <div style="font-size: 7.5px; color: var(--text-muted);">Bio-Tags</div>
          </div>
          <span style="color: var(--text-muted);">➔</span>

          <div style="background: var(--blue-tint); border: 1px solid var(--blue-primary); padding: 8px 4px; border-radius: var(--radius-xs); text-align: center; flex: 1;">
            <div style="font-weight: 800; color: var(--blue-primary);">2. MESH</div>
            <div style="font-size: 7.5px; color: var(--text-muted);">LoRa 868M</div>
          </div>
          <span style="color: var(--text-muted);">➔</span>

          <div style="background: var(--purple-tint); border: 1px solid var(--purple-ai); padding: 8px 4px; border-radius: var(--radius-xs); text-align: center; flex: 1;">
            <div style="font-weight: 800; color: var(--purple-ai);">3. GATEWAY</div>
            <div style="font-size: 7.5px; color: var(--text-muted);">Edge RF</div>
          </div>
          <span style="color: var(--text-muted);">➔</span>

          <div style="background: var(--amber-tint); border: 1px solid var(--amber-warn); padding: 8px 4px; border-radius: var(--radius-xs); text-align: center; flex: 1;">
            <div style="font-weight: 800; color: var(--amber-warn);">4. AI ENGINE</div>
            <div style="font-size: 7.5px; color: var(--text-muted);">XAI & A*</div>
          </div>
        </div>
      </div>

      <!-- Active Mesh Links Matrix -->
      <div class="nexus-card">
        <div style="font-family: var(--font-display); font-size: 12px; font-weight: 800; color: var(--text-highlight); margin-bottom: 8px;">
          LORA LINK ADJACENCY STATUS
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          ${state.meshLinks.map(link => `
            <div style="background: var(--bg-secondary); border: 1px solid ${link.active ? 'var(--border-subtle)' : 'var(--red-crit)'}; padding: 6px; border-radius: var(--radius-xs); display: flex; align-items: center; justify-content: space-between; font-family: var(--font-mono); font-size: 9.5px;">
              <span style="font-weight: 700; color: var(--text-highlight);">${link.from} ➔ ${link.to}</span>
              <span style="font-weight: 800; color: ${link.active ? 'var(--blue-primary)' : 'var(--red-crit)'};">
                ${link.active ? `${link.quality}%` : 'OFF'}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const btnFault = this.container.querySelector('#btnToggleMeshFault');
    if (btnFault) {
      btnFault.onclick = () => {
        simEngine.triggerNodeFailure();
        this.render();
      };
    }
  }
}

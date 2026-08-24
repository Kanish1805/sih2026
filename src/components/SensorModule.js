/**
 * NEXUS Sentinel Multi-Gas Sensor Grid Module (Light Theme)
 * Features:
 * - 8 Distributed Multi-Gas Nodes with 6-channel environmental matrix
 * - Statutory Safe Threshold Limit Benchmarks
 * - Real-time SVG Trend Sparklines
 */

import { STATUTORY_LIMITS, state } from '../engine/state.js';
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
          <span class="card-title">DISTRIBUTED MULTI-GAS SENTINEL NODES</span>
        </div>
        <div class="card-actions">
          <span class="nav-badge" style="background: var(--blue-tint); color: var(--blue-primary); font-weight: 800;">
            ${state.sensors.filter(s => s.status !== 'OFFLINE').length} / ${state.sensors.length} ONLINE
          </span>
        </div>
      </div>

      <!-- Statutory Safe Limits Benchmark Banner -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-left: 3.5px solid var(--blue-primary); padding: 8px 12px; border-radius: var(--radius-xs); margin-bottom: 12px; font-family: var(--font-mono); font-size: 10px; line-height: 1.5;">
        <div style="font-weight: 800; color: var(--blue-primary); font-size: 11px; margin-bottom: 2px;">
          STATUTORY ENVIRONMENTAL SAFE THRESHOLD BENCHMARKS:
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; color: var(--text-secondary);">
          <div>• Methane (CH4): <strong style="color: var(--green-safe);">&lt; 0.75% LEL</strong></div>
          <div>• Oxygen (O2): <strong style="color: var(--green-safe);">19.5% - 23.5%</strong></div>
          <div>• Carbon Monoxide: <strong style="color: var(--green-safe);">&lt; 25 ppm</strong></div>
          <div>• Temperature: <strong style="color: var(--green-safe);">&lt; 32.0°C</strong></div>
          <div>• Humidity: <strong style="color: var(--green-safe);">40% - 70%</strong></div>
          <div>• Water Inundation: <strong style="color: var(--green-safe);">&lt; 15 cm</strong></div>
        </div>
      </div>

      <!-- Sentinel Nodes Cards Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        ${state.sensors.map(s => {
          const isCritical = s.status === 'CRITICAL';
          const isWarn = s.status === 'WARNING';
          const isOffline = s.status === 'OFFLINE';
          const cardBorder = isOffline ? 'var(--border-subtle)' : (isCritical ? 'var(--red-crit)' : (isWarn ? 'var(--amber-warn)' : 'var(--border-subtle)'));
          const badgeBg = isOffline ? '#64748b' : (isCritical ? 'var(--red-tint)' : (isWarn ? 'var(--amber-warn)' : 'var(--green-tint)'));
          const badgeColor = isOffline ? '#ffffff' : (isCritical ? 'var(--red-crit)' : (isWarn ? '#ffffff' : 'var(--green-safe)'));

          // Sparklines
          const ch4Points = (s.history?.ch4 || [s.ch4]).map((v, i) => `${i * 7},${30 - Math.min(28, v * 12)}`).join(' ');
          const coPoints = (s.history?.co || [s.co]).map((v, i) => `${i * 7},${30 - Math.min(28, (v / 60) * 28)}`).join(' ');

          return `
            <div class="nexus-card" style="border-color: ${cardBorder}; padding: 10px 12px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="font-mono" style="font-weight: 800; font-size: 13px; color: var(--blue-primary);">${s.id}</span>
                    <span style="font-weight: 700; font-size: 12px; color: var(--text-highlight);">${s.name}</span>
                  </div>
                  <div style="font-size: 10px; color: var(--text-muted); font-weight: 600;">${s.location}</div>
                </div>
                <span class="nav-badge" style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 800; font-size: 9.5px;">
                  ${s.status}
                </span>
              </div>

              <!-- Multi-Gas Metrics Matrix -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; font-family: var(--font-mono); font-size: 9.5px; margin-bottom: 8px;">
                <div style="background: var(--bg-secondary); padding: 4px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                  <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">CH4 (METHANE)</div>
                  <div style="font-weight: 800; color: ${s.ch4 > 1.25 ? 'var(--red-crit)' : (s.ch4 > 0.75 ? 'var(--amber-warn)' : 'var(--green-safe)')};">${s.ch4}% LEL</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 4px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                  <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">CO (CARBON)</div>
                  <div style="font-weight: 800; color: ${s.co > 50 ? 'var(--red-crit)' : (s.co > 25 ? 'var(--amber-warn)' : 'var(--text-highlight)')};">${s.co} ppm</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 4px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                  <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">O2 (OXYGEN)</div>
                  <div style="font-weight: 800; color: ${s.o2 < 19.5 ? 'var(--red-crit)' : 'var(--green-safe)'};">${s.o2}%</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 4px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                  <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">TEMP / HUM</div>
                  <div style="font-weight: 800; color: var(--text-highlight);">${s.temp}°C | ${s.humidity}%</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 4px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                  <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">WATER LEVEL</div>
                  <div style="font-weight: 800; color: ${s.waterLevel > 15 ? 'var(--blue-water)' : 'var(--text-highlight)'};">${s.waterLevel} cm</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 4px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                  <div style="font-size: 7.5px; color: var(--text-muted); font-weight: 700;">SEISMIC STRAIN</div>
                  <div style="font-weight: 800; color: var(--text-highlight);">${s.vibration} mm/s</div>
                </div>
              </div>

              <!-- Live SVG Trend Sparkline -->
              <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 4px 6px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-family: var(--font-mono); font-size: 8px; font-weight: 700; color: var(--text-muted);">LIVE CH4 & CO TREND:</span>
                <svg width="120" height="26" style="overflow: visible;">
                  <polyline fill="none" stroke="${s.ch4 > 0.75 ? '#dc2626' : '#2563eb'}" stroke-width="1.8" points="${ch4Points}" />
                  <polyline fill="none" stroke="#d97706" stroke-width="1.2" stroke-dasharray="2,2" points="${coPoints}" />
                </svg>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

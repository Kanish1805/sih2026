/**
 * NEXUS Alerts Stream & Mission Debrief Report Module (Light Theme)
 */

import { state } from '../engine/state.js';
import { soundEngine } from '../engine/sound_engine.js';

export class AlertsMissionModule {
  constructor(containerId, onOpenDebrief) {
    this.container = document.getElementById(containerId);
    this.onOpenDebrief = onOpenDebrief;
    this.activeFilter = 'ALL';
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
  }

  render() {
    if (!this.container) return;
    const alerts = state.alerts || [];
    const filtered = this.activeFilter === 'ALL' 
      ? alerts 
      : alerts.filter(a => a.severity === this.activeFilter.toLowerCase() || a.type.includes(this.activeFilter));

    this.container.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <i data-lucide="bell" style="color: var(--red-crit);"></i>
          <span class="card-title">TACTICAL INCIDENT ALERTS & MISSION LOGS</span>
        </div>
        <div class="card-actions">
          <button class="btn-scenario btn-restore" id="btnOpenDebriefModal" style="font-size: 11px;">
            <i data-lucide="file-text"></i>
            <span>Debrief Report</span>
          </button>
        </div>
      </div>

      <!-- Filter Pills -->
      <div style="display: flex; gap: 6px; margin-bottom: 10px;">
        <button class="btn-scenario ${this.activeFilter === 'ALL' ? 'btn-restore' : ''} btn-filter-alert" data-filter="ALL" style="padding: 3px 8px; font-size: 11px;">ALL (${alerts.length})</button>
        <button class="btn-scenario ${this.activeFilter === 'CRITICAL' ? 'btn-danger-action' : ''} btn-filter-alert" data-filter="CRITICAL" style="padding: 3px 8px; font-size: 11px;">CRITICAL (${alerts.filter(a => a.severity === 'critical').length})</button>
        <button class="btn-scenario ${this.activeFilter === 'WARNING' ? 'btn-warning-action' : ''} btn-filter-alert" data-filter="WARNING" style="padding: 3px 8px; font-size: 11px;">WARNING (${alerts.filter(a => a.severity === 'warning').length})</button>
      </div>

      <!-- Alerts List -->
      <div class="nexus-card" style="flex: 1; overflow-y: auto; max-height: 440px; padding: 6px; display: flex; flex-direction: column; gap: 6px;">
        ${filtered.length === 0 ? `
          <div style="text-align: center; color: var(--text-muted); padding: 20px; font-family: var(--font-mono); font-size: 11px;">
            No incident events recorded for this category.
          </div>
        ` : filtered.map(a => {
          const isCrit = a.severity === 'critical';
          const isWarn = a.severity === 'warning';
          const borderCol = isCrit ? 'var(--red-crit)' : (isWarn ? 'var(--amber-warn)' : 'var(--blue-primary)');

          return `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-left: 3.5px solid ${borderCol}; padding: 8px 10px; border-radius: 0 var(--radius-xs) var(--radius-xs) 0; display: flex; flex-direction: column; gap: 2px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-family: var(--font-mono); font-size: 10px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-weight: 800; color: ${isCrit ? 'var(--red-crit)' : (isWarn ? 'var(--amber-warn)' : 'var(--blue-primary)')};">[${a.type}]</span>
                  <span style="font-weight: 700; color: var(--text-highlight);">${a.title}</span>
                </div>
                <span style="color: var(--text-muted); font-size: 9px;">${a.timestamp}</span>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.35;">
                ${a.message}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const btnDebrief = this.container.querySelector('#btnOpenDebriefModal');
    if (btnDebrief) {
      btnDebrief.onclick = () => {
        soundEngine.playSonarPing();
        if (this.onOpenDebrief) this.onOpenDebrief();
      };
    }

    const filters = this.container.querySelectorAll('.btn-filter-alert');
    filters.forEach(f => {
      f.onclick = (e) => {
        this.activeFilter = e.currentTarget.getAttribute('data-filter');
        this.render();
      };
    });
  }
}

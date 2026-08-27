/**
 * NEXUS Dynamic Rescue Route Planner Module
 * Features:
 * - Worker Safe Evacuation Path (GREEN ROUTE) to nearest Refuge Chamber / Portal
 * - First-Responder Surface Rescue Team Path (RED ROUTE) to Trapped Worker
 * - Turn-by-Turn Guidance & Mandatory PPE Directives
 */

import { state } from '../engine/state.js';
import { pathfinder } from '../engine/pathfinder.js';
import { soundEngine } from '../engine/sound_engine.js';

export class RoutePlannerModule {
  constructor(containerId, onSelectRoute) {
    this.container = document.getElementById(containerId);
    this.onSelectRoute = onSelectRoute;
    this.activeView = 'rescue'; // Default to rescue view
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
  }

  render() {
    if (!this.container) return;
    const routes = pathfinder.calculateRoutes();
    const activeRoute = routes.find(r => r.id === state.routes.activeRouteId) || routes[0];
    const rescue = state.rescueTeamRoute || pathfinder.calculateRescueTeamIngressRoute();

    this.container.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <i data-lucide="navigation" style="color: var(--green-safe);"></i>
          <span class="card-title">DYNAMIC MULTI-HAZARD ROUTE PLANNER</span>
        </div>
      </div>

      <!-- Route View Mode Switcher -->
      <div style="display: flex; background: var(--bg-secondary); padding: 3px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 12px; gap: 4px;">
        <button class="btn-scenario ${this.activeView === 'rescue' ? 'btn-danger-action' : ''} btn-toggle-route-view" data-view="rescue" style="flex: 1; justify-content: center; font-size: 11px;">
          <i data-lucide="shield-alert"></i>
          <span>🔴 RED: Rescue Team Ingress Path</span>
        </button>
        <button class="btn-scenario ${this.activeView === 'evac' ? 'btn-restore' : ''} btn-toggle-route-view" data-view="evac" style="flex: 1; justify-content: center; font-size: 11px;">
          <i data-lucide="log-out"></i>
          <span>🟢 GREEN: Worker Safe Evac Route</span>
        </button>
      </div>

      ${this.activeView === 'rescue' ? `
        <!-- Surface Rescue Team Ingress Path View (RED) -->
        <div class="nexus-card" style="border-color: #ef4444; border-left: 4px solid #ef4444; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div>
              <div style="font-family: var(--font-display); font-weight: 800; font-size: 13.5px; color: #dc2626; display: flex; align-items: center; gap: 6px;">
                🔴 FIRST-RESPONDER RAPID INGRESS ROUTE (RED PATH)
              </div>
              <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">
                ${rescue.origin} ➔ ${rescue.destination}
              </div>
            </div>
            <span class="nav-badge" style="background: var(--red-tint); color: var(--red-crit); font-weight: 800;">
              ${rescue.entryStatus}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-family: var(--font-mono); font-size: 10.5px; margin-bottom: 10px;">
            <div style="background: var(--bg-secondary); padding: 6px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">TOTAL INGRESS DISTANCE</div>
              <div style="font-weight: 800; color: var(--text-highlight);">${rescue.distanceM} meters</div>
            </div>
            <div style="background: var(--bg-secondary); padding: 6px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 8px; color: var(--text-muted); font-weight: 700;">EST ARRIVAL TO VICTIM</div>
              <div style="font-weight: 800; color: #dc2626;">${rescue.estArrivalTimeMin} minutes</div>
            </div>
          </div>

          <!-- Step-by-Step Trajectory -->
          <div style="background: #ffffff; border: 1px solid var(--border-subtle); padding: 8px 10px; border-radius: var(--radius-xs); margin-bottom: 10px;">
            <div style="font-weight: 800; font-size: 11px; color: #b91c1c; margin-bottom: 4px;">
              TURN-BY-TURN ENTRY TRAJECTORY (RED PATH):
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${(rescue.pathNodes || []).map((node, i) => `
                <span style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 3px 6px; border-radius: var(--radius-xs); font-weight: 700; font-size: 10px; color: var(--text-highlight);">
                  ${i + 1}. ${node} ${i < rescue.pathNodes.length - 1 ? '➔' : '🎯 (VICTIM REACHED)'}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Mandatory PPE Equipment Required -->
          <div style="background: var(--amber-tint); border: 1px solid var(--amber-warn); padding: 8px 10px; border-radius: var(--radius-xs); margin-bottom: 10px;">
            <div style="font-weight: 800; font-size: 11px; color: #92400e; margin-bottom: 4px;">
              MANDATORY RESCUE TEAM EQUIPMENT:
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px; font-size: 10px; color: #78350f;">
              ${(rescue.requiredPPE || []).map(p => `<div>• ${p}</div>`).join('')}
            </div>
          </div>

          <!-- Tactical Directives -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="font-family: var(--font-display); font-size: 11.5px; font-weight: 800; color: var(--text-highlight);">
              TACTICAL RESCUE DIRECTIVES:
            </div>
            ${(rescue.directives || []).map((d, i) => `
              <div style="background: var(--bg-secondary); padding: 6px 8px; border-radius: var(--radius-xs); font-size: 11px; display: flex; gap: 6px; align-items: center;">
                <span class="font-mono" style="color: #dc2626; font-weight: 800;">[0${i + 1}]</span>
                <span>${d}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <!-- Worker Safe Evacuation Routes Comparison (GREEN) -->
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;">
          ${routes.map(r => `
            <div class="nexus-card route-card" data-route-id="${r.id}" style="border-color: ${r.id === activeRoute.id ? r.color : 'var(--border-subtle)'}; cursor: pointer; padding: 10px 12px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                <span style="font-weight: 800; font-size: 12.5px; color: var(--text-highlight);">${r.name}</span>
                <span class="nav-badge" style="background: var(--bg-secondary); color: ${r.color}; font-weight: 800; font-size: 9px; border: 1px solid var(--border-subtle);">${r.badge}</span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; font-family: var(--font-mono); font-size: 9.5px; margin-bottom: 8px;">
                <div style="background: var(--bg-secondary); padding: 3px 5px; border-radius: var(--radius-xs);">
                  <div style="color: var(--text-muted); font-size: 7.5px; font-weight: 700;">DISTANCE</div>
                  <div style="font-weight: 800; color: var(--text-highlight);">${r.distanceM}m</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 3px 5px; border-radius: var(--radius-xs);">
                  <div style="color: var(--text-muted); font-size: 7.5px; font-weight: 700;">EST TIME</div>
                  <div style="font-weight: 800; color: var(--blue-primary);">${r.estTimeMin}</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 3px 5px; border-radius: var(--radius-xs);">
                  <div style="color: var(--text-muted); font-size: 7.5px; font-weight: 700;">RISK</div>
                  <div style="font-weight: 800; color: ${r.riskScore > 50 ? 'var(--red-crit)' : 'var(--green-safe)'};">${r.riskScore}/100</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 3px 5px; border-radius: var(--radius-xs);">
                  <div style="color: var(--text-muted); font-size: 7.5px; font-weight: 700;">AIR QUALITY</div>
                  <div style="font-weight: 800; color: var(--text-highlight);">${r.airQualityIndex}</div>
                </div>
              </div>

              <button class="btn-scenario ${r.id === activeRoute.id ? 'btn-restore' : 'btn-mesh-action'} btn-select-route" data-route-id="${r.id}" style="width: 100%; justify-content: center; font-size: 11px; padding: 4px;">
                ${r.id === activeRoute.id ? '🟢 Active Green Evac Route Plotted' : 'Select & Trace Route'}
              </button>
            </div>
          `).join('')}
        </div>

        <!-- Turn-by-Turn Guidance Directives -->
        <div class="nexus-card">
          <div style="font-family: var(--font-display); font-size: 12px; font-weight: 800; color: var(--green-safe); margin-bottom: 8px;">
            TACTICAL EVACUATION DIRECTIVES [${activeRoute.name.toUpperCase()}]
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${activeRoute.turnByTurn.map(t => `
              <div style="display: flex; align-items: center; gap: 10px; background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 6px 10px; border-radius: var(--radius-xs);">
                <span class="font-mono" style="background: var(--green-tint); color: var(--green-safe); width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 10px; flex-shrink: 0;">
                  ${t.step}
                </span>
                <span style="font-size: 11.5px; color: var(--text-primary); font-weight: 600;">${t.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `}
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('.btn-toggle-route-view').forEach(btn => {
      btn.onclick = () => {
        this.activeView = btn.getAttribute('data-view');
        soundEngine.playClick();
        this.render();
      };
    });

    const btns = this.container.querySelectorAll('.btn-select-route');
    btns.forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-route-id');
        state.routes.activeRouteId = id;
        state.selectedWorkerId = null;
        soundEngine.playSonarPing();
        this.render();
        if (this.onSelectRoute) this.onSelectRoute(id);
      };
    });
  }
}

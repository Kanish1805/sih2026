/**
 * NEXUS Explainable AI (XAI) Risk Engine Module (Light Theme)
 */

import { state } from '../engine/state.js';
import { calculateAIRisk } from '../engine/ai_risk_engine.js';

export class AIRiskModule {
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
    const aiData = calculateAIRisk();
    const isCritical = aiData.category === 'CRITICAL';
    const isWarning = aiData.category === 'WARNING' || aiData.category === 'HIGH_RISK';
    const dialColor = isCritical ? 'var(--red-crit)' : (isWarning ? 'var(--amber-warn)' : 'var(--green-safe)');

    this.container.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <i data-lucide="brain-circuit" style="color: var(--purple-ai);"></i>
          <span class="card-title">EXPLAINABLE AI (XAI) RISK ENGINE</span>
        </div>
        <div class="card-actions">
          <span class="nav-badge" style="background: var(--blue-tint); color: var(--blue-primary); font-weight: 800;">
            CONFIDENCE: 98.6%
          </span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- Top: Composite Risk Dial Card -->
        <div class="nexus-card" style="display: flex; align-items: center; justify-content: space-around; padding: 16px;">
          <!-- Risk Dial Circle -->
          <div style="position: relative; width: 130px; height: 130px; display: flex; align-items: center; justify-content: center;">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="54" fill="none" stroke="#e2e8f0" stroke-width="10" />
              <circle cx="65" cy="65" r="54" fill="none" stroke="${dialColor}" stroke-width="10"
                      stroke-dasharray="340"
                      stroke-dashoffset="${340 - (340 * aiData.score) / 100}"
                      stroke-linecap="round"
                      style="transition: stroke-dashoffset 0.5s ease;" />
            </svg>
            <div style="position: absolute; display: flex; flex-direction: column; align-items: center;">
              <span class="font-mono" style="font-size: 28px; font-weight: 900; color: var(--text-highlight); line-height: 1;">${aiData.score}</span>
              <span style="font-size: 9.5px; font-weight: 800; color: ${dialColor}; letter-spacing: 0.5px; margin-top: 3px;">${aiData.category}</span>
            </div>
          </div>

          <!-- Factor Breakdown Progress Bars -->
          <div style="flex: 1; max-width: 200px; display: flex; flex-direction: column; gap: 6px; font-family: var(--font-mono); font-size: 10px;">
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="color: var(--text-muted); font-weight: 700;">Atmospheric</span>
                <span style="font-weight: 800; color: var(--amber-warn);">${aiData.breakdown.gas}/35</span>
              </div>
              <div style="height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; width: ${(aiData.breakdown.gas / 35) * 100}%; background: var(--amber-warn);"></div>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="color: var(--text-muted); font-weight: 700;">Flood Ingress</span>
                <span style="font-weight: 800; color: var(--blue-water);">${aiData.breakdown.flood}/25</span>
              </div>
              <div style="height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; width: ${(aiData.breakdown.flood / 25) * 100}%; background: var(--blue-water);"></div>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="color: var(--text-muted); font-weight: 700;">Seismic Strain</span>
                <span style="font-weight: 800; color: var(--purple-ai);">${aiData.breakdown.seismic}/15</span>
              </div>
              <div style="height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; width: ${(aiData.breakdown.seismic / 15) * 100}%; background: var(--purple-ai);"></div>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="color: var(--text-muted); font-weight: 700;">Worker SOS</span>
                <span style="font-weight: 800; color: var(--red-crit);">${aiData.breakdown.worker}/15</span>
              </div>
              <div style="height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; width: ${(aiData.breakdown.worker / 15) * 100}%; background: var(--red-crit);"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Causal Explanations Stream -->
        <div class="nexus-card">
          <div style="font-family: var(--font-display); font-size: 12.5px; font-weight: 800; color: var(--blue-primary); margin-bottom: 8px;">
            EXPLAINABLE AI CAUSAL REASONING
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${aiData.explanations.map(exp => `
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-left: 3px solid var(--blue-primary); padding: 8px 10px; border-radius: 0 var(--radius-xs) var(--radius-xs) 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; font-family: var(--font-mono); font-size: 9.5px;">
                  <span style="font-weight: 800; color: var(--text-highlight);">${exp.factor}</span>
                  <span style="color: var(--blue-primary); font-weight: 700;">${exp.weight} | ${exp.confidence}</span>
                </div>
                <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">
                  ${exp.text}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
}

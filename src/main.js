/**
 * NEXUS Master Application Orchestrator (Light Theme & Persistent Map)
 * Industrial Mission Control Platform
 */

import { createIcons, icons } from 'lucide';
import { state } from './engine/state.js';
import { simEngine } from './engine/simulation.js';
import { soundEngine } from './engine/sound_engine.js';
import { MineMap2D } from './components/MineMap2D.js';
import { DigitalTwin3D } from './components/DigitalTwin3D.js';
import { WorkerModule } from './components/WorkerModule.js';
import { SensorModule } from './components/SensorModule.js';
import { RobotModule } from './components/RobotModule.js';
import { AIRiskModule } from './components/AIRiskModule.js';
import { RoutePlannerModule } from './components/RoutePlannerModule.js';
import { CommNetworkModule } from './components/CommNetworkModule.js';
import { AlertsMissionModule } from './components/AlertsMissionModule.js';
import { PresentationTour } from './components/PresentationTour.js';

class NexusApp {
  constructor() {
    this.activeDeck = 'overview';
    this.activeMapMode = '2d'; // '2d' or '3d'
    this.components = {};
    this.tour = null;
  }

  init() {
    this.initHeaderAndDock();
    this.initMapModeSwitcher();
    this.initDeckTabs();
    this.initPersistentViewport();
    this.initDeckViews();
    this.initModals();
    this.initTour();
    this.initAlertToasts();

    // Start Simulation Engine Loop
    simEngine.start();
    simEngine.subscribe((s) => this.onSimulationTick(s));

    this.refreshIcons();
  }

  refreshIcons() {
    createIcons({ icons });
  }

  initHeaderAndDock() {
    // Audio Toggle
    const audioBtn = document.getElementById('audioToggleBtn');
    const audioIcon = document.getElementById('audioIcon');
    if (audioBtn) {
      audioBtn.onclick = () => {
        const muted = soundEngine.toggleMute();
        audioBtn.style.color = muted ? 'var(--text-muted)' : 'var(--blue-primary)';
        audioIcon.setAttribute('data-lucide', muted ? 'volume-x' : 'volume-2');
        this.refreshIcons();
      };
    }

    // Speed Dropdown
    const speedBtn = document.getElementById('speedBtn');
    const speedOptions = document.querySelectorAll('#speedMenu button');
    speedOptions.forEach(opt => {
      opt.onclick = () => {
        const spd = parseFloat(opt.getAttribute('data-speed'));
        state.speed = spd;
        speedBtn.textContent = `${spd}x`;
        speedOptions.forEach(o => o.classList.toggle('active', o === opt));
        soundEngine.playClick();
      };
    });

    // Scenario Dock Action Buttons
    const bindBtn = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.onclick = () => { 
        fn(); 
        this.refreshDeckContent(); 
        soundEngine.playClick(); 
      };
    };

    bindBtn('btnTriggerSOS', () => simEngine.triggerWorkerSOS());
    bindBtn('btnIncreaseGas', () => simEngine.triggerGasLeak());
    bindBtn('btnTriggerFlood', () => simEngine.triggerFlood());
    bindBtn('btnRobotFail', () => simEngine.triggerRobotFailure());
    bindBtn('btnNodeFail', () => simEngine.triggerNodeFailure());
    bindBtn('btnRestoreSystem', () => simEngine.restoreSystem());

    const btnPause = document.getElementById('btnPauseSim');
    if (btnPause) {
      btnPause.onclick = () => {
        state.isRunning = !state.isRunning;
        const icon = document.getElementById('pauseIcon');
        if (icon) icon.setAttribute('data-lucide', state.isRunning ? 'pause' : 'play');
        this.refreshIcons();
        soundEngine.playClick();
      };
    }

    const btnReset = document.getElementById('btnResetSim');
    if (btnReset) {
      btnReset.onclick = () => {
        simEngine.restoreSystem();
        this.refreshDeckContent();
      };
    }
  }

  initMapModeSwitcher() {
    const btn2D = document.getElementById('btnMode2D');
    const btn3D = document.getElementById('btnMode3D');
    const wrap2D = document.getElementById('viewport2DWrapper');
    const wrap3D = document.getElementById('viewport3DWrapper');

    if (btn2D && btn3D) {
      btn2D.onclick = () => {
        this.activeMapMode = '2d';
        btn2D.classList.add('active');
        btn3D.classList.remove('active');
        wrap2D.classList.add('active');
        wrap3D.classList.remove('active');
        this.components.map2D?.resize();
        soundEngine.playClick();
        this.refreshIcons();
      };

      btn3D.onclick = () => {
        this.activeMapMode = '3d';
        btn3D.classList.add('active');
        btn2D.classList.remove('active');
        wrap3D.classList.add('active');
        wrap2D.classList.remove('active');
        setTimeout(() => {
          this.components.digitalTwin?.onShow();
          this.refreshIcons();
        }, 30);
        soundEngine.playClick();
      };
    }
  }

  initDeckTabs() {
    const tabs = document.querySelectorAll('.deck-tab');
    tabs.forEach(tab => {
      tab.onclick = () => {
        const deckId = tab.getAttribute('data-deck');
        this.switchDeckTab(deckId);
        soundEngine.playClick();
      };
    });
  }

  switchDeckTab(deckId) {
    this.activeDeck = deckId;

    // Update Tab Active States
    document.querySelectorAll('.deck-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-deck') === deckId);
    });

    // Update Deck Viewports
    document.querySelectorAll('.deck-view').forEach(view => {
      const isMatch = view.id === `deck${deckId.charAt(0).toUpperCase() + deckId.slice(1)}`;
      view.classList.toggle('active', isMatch);
    });

    this.refreshDeckContent();
    this.refreshIcons();
  }

  initPersistentViewport() {
    // 2D Tactical Map
    this.components.map2D = new MineMap2D('persistent2DMapContainer', (type, data) => this.openEntityInspector(type, data));

    // 3D Digital Twin
    this.components.digitalTwin = new DigitalTwin3D('persistent3DDigitalTwinContainer');
  }

  initDeckViews() {
    // 1. Overview Deck View
    this.renderOverviewDeck();

    // 2. Workers Deck
    this.components.workers = new WorkerModule('deckWorkers', (workerId) => {
      this.components.map2D?.render();
    });

    // 3. Sensors Deck
    this.components.sensors = new SensorModule('deckSensors');

    // 4. Robots Deck
    this.components.robots = new RobotModule('deckRobots');

    // 5. AI Risk Deck
    this.components.aiRisk = new AIRiskModule('deckAIRisk');

    // 6. Routes Deck
    this.components.routes = new RoutePlannerModule('deckRoutes', () => {
      this.components.map2D?.render();
    });

    // 7. Mesh Deck
    this.components.mesh = new CommNetworkModule('deckMesh');

    // 8. Alerts Deck
    this.components.alerts = new AlertsMissionModule('deckAlerts', () => this.openDebriefModal());
  }

  renderOverviewDeck() {
    const view = document.getElementById('deckOverview');
    if (!view) return;

    const risk = state.aiRiskData || { score: state.overallRisk, category: state.riskCategory };
    const sosMiner = state.workers.find(w => w.status === 'SOS' || w.sosActive);
    const r01 = state.robots.r01;
    const r02 = state.robots.r02;

    view.innerHTML = `
      <!-- Hero KPI & Risk Meter -->
      <div class="nexus-card" style="border-color: ${risk.category === 'CRITICAL' ? 'var(--red-crit)' : (risk.category === 'WARNING' ? 'var(--amber-warn)' : 'var(--border-subtle)')};">
        <div class="card-header">
          <div class="card-title-group">
            <i data-lucide="shield-alert" style="color: var(--blue-primary);"></i>
            <span class="card-title">MISSION CONTROL STATUS & AI RISK</span>
          </div>
          <span class="nav-badge" style="background: ${risk.category === 'CRITICAL' ? 'var(--red-tint)' : (risk.category === 'WARNING' ? 'var(--amber-warn)' : 'var(--green-tint)')}; color: ${risk.category === 'CRITICAL' ? 'var(--red-crit)' : (risk.category === 'WARNING' ? '#ffffff' : 'var(--green-safe)')}; font-weight: 800; font-size: 10px;">
            ${risk.category}
          </span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div style="display: flex; align-items: baseline; gap: 6px;">
            <span class="font-mono" style="font-size: 32px; font-weight: 900; color: var(--text-highlight); line-height: 1;">${risk.score}</span>
            <span style="font-size: 13px; color: var(--text-muted); font-weight: 700;">/ 100 Risk</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn-scenario btn-restore" id="btnDeckInspectXAI" style="font-size: 11px; padding: 4px 10px;">
              <i data-lucide="brain-circuit"></i>
              <span>Causal XAI</span>
            </button>
            <button class="btn-scenario btn-primary-glow" id="btnDeckViewRoutes" style="font-size: 11px; padding: 4px 10px;">
              <i data-lucide="navigation"></i>
              <span>Rescue Routes</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Personnel Vitals Quick Grid -->
      <div class="nexus-card">
        <div class="card-header">
          <div class="card-title-group">
            <i data-lucide="users" style="color: var(--green-safe);"></i>
            <span class="card-title">PERSONNEL BIO-TAG STATUS</span>
          </div>
          <button class="btn-scenario btn-restore" id="btnDeckViewWorkers" style="font-size: 10px; padding: 2px 8px;">View All (6)</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; font-family: var(--font-mono); font-size: 10px;">
          ${state.workers.slice(0, 6).map(w => {
            const isSos = w.status === 'SOS' || w.sosActive;
            return `
              <div style="background: ${isSos ? 'var(--red-tint)' : 'var(--bg-secondary)'}; border: 1px solid ${isSos ? 'var(--red-crit)' : 'var(--border-subtle)'}; padding: 6px; border-radius: var(--radius-xs); display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 800; color: ${isSos ? 'var(--red-crit)' : 'var(--text-highlight)'};">${w.id}</span>
                  <span style="font-size: 8.5px; font-weight: 800; color: ${isSos ? 'var(--red-crit)' : 'var(--green-safe)'};">${w.status}</span>
                </div>
                <div style="font-size: 9px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${w.name.split(' ')[0]}</div>
                <div style="font-weight: 800; color: ${isSos ? 'var(--red-crit)' : 'var(--blue-primary)'}; font-size: 10px;">${w.hr} BPM</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Autonomous Robotics Fleet Status -->
      <div class="nexus-card">
        <div class="card-header">
          <div class="card-title-group">
            <i data-lucide="bot" style="color: var(--purple-bright);"></i>
            <span class="card-title">ROBOTICS FLEET & SLAM</span>
          </div>
          <button class="btn-scenario btn-robot-action" id="btnDeckViewRobots" style="font-size: 10px; padding: 2px 8px;">Command Fleet</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; font-family: var(--font-mono); font-size: 11px;">
          <!-- R01 Spider -->
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 8px 10px; border-radius: var(--radius-xs);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 800; color: var(--purple-ai);">🕷️ R-01 ARACHNE (SPIDER)</span>
              <span class="nav-badge" style="background: ${r01.isFailed ? 'var(--red-tint)' : 'var(--purple-tint)'}; color: ${r01.isFailed ? 'var(--red-crit)' : 'var(--purple-bright)'}; font-size: 9px;">${r01.status}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-bottom: 2px;">
              <span>SLAM Mapped Coverage</span>
              <span style="font-weight: 800; color: var(--green-safe);">${r01.mappedCoverage}%</span>
            </div>
            <div style="height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${r01.mappedCoverage}%; background: var(--purple-ai);"></div>
            </div>
          </div>

          <!-- R02 Spidy Standby -->
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 8px 10px; border-radius: var(--radius-xs); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 800; color: var(--amber-warn);">🕷️ R-02 ARACHNE-2 (SPIDY STANDBY)</div>
              <div style="font-size: 9.5px; color: var(--text-muted);">${r02.payload.split('+')[0]}</div>
            </div>
            <span class="nav-badge" style="background: var(--amber-tint); color: var(--amber-warn); font-size: 9.5px;">${r02.status}</span>
          </div>
        </div>
      </div>

      <!-- Real-Time Recent Incident Alerts -->
      <div class="nexus-card" style="flex: 1; min-height: 160px;">
        <div class="card-header">
          <div class="card-title-group">
            <i data-lucide="bell" style="color: var(--red-crit);"></i>
            <span class="card-title">RECENT TACTICAL INCIDENT ALERTS</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; overflow-y: auto; max-height: 180px;">
          ${(state.alerts || []).slice(0, 4).map(a => `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-left: 3px solid ${a.severity === 'critical' ? 'var(--red-crit)' : (a.severity === 'warning' ? 'var(--amber-warn)' : 'var(--blue-primary)')}; padding: 6px 8px; border-radius: 0 var(--radius-xs) var(--radius-xs) 0; font-size: 11px;">
              <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 9.5px; margin-bottom: 2px;">
                <span style="font-weight: 800; color: var(--text-highlight);">${a.title}</span>
                <span style="color: var(--text-muted);">${a.timestamp}</span>
              </div>
              <div style="color: var(--text-secondary); font-size: 10.5px; line-height: 1.35;">
                ${a.message}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const btnInspect = view.querySelector('#btnDeckInspectXAI');
    if (btnInspect) btnInspect.onclick = () => this.switchDeckTab('airisk');

    const btnRoutes = view.querySelector('#btnDeckViewRoutes');
    if (btnRoutes) btnRoutes.onclick = () => this.switchDeckTab('routes');

    const btnWorkers = view.querySelector('#btnDeckViewWorkers');
    if (btnWorkers) btnWorkers.onclick = () => this.switchDeckTab('workers');

    const btnRobots = view.querySelector('#btnDeckViewRobots');
    if (btnRobots) btnRobots.onclick = () => this.switchDeckTab('robots');
  }

  refreshDeckContent() {
    if (this.activeDeck === 'overview') this.renderOverviewDeck();
    else if (this.activeDeck === 'workers') this.components.workers?.render();
    else if (this.activeDeck === 'sensors') this.components.sensors?.render();
    else if (this.activeDeck === 'robots') this.components.robots?.render();
    else if (this.activeDeck === 'airisk') this.components.aiRisk?.render();
    else if (this.activeDeck === 'routes') this.components.routes?.render();
    else if (this.activeDeck === 'mesh') this.components.mesh?.render();
    else if (this.activeDeck === 'alerts') this.components.alerts?.render();
  }

  initTour() {
    this.tour = new PresentationTour({
      onSwitchModule: (deckId) => this.switchDeckTab(deckId),
      onOpenDebrief: () => this.openDebriefModal()
    });
  }

  initAlertToasts() {
    simEngine.onAlert((alert) => {
      this.showToast(alert);
      this.updateHeaderRisk();
    });
  }

  showToast(alert) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${alert.severity === 'critical' ? 'toast-danger' : (alert.severity === 'warning' ? 'toast-warning' : 'toast-success')}`;
    toast.innerHTML = `
      <i data-lucide="${alert.severity === 'critical' ? 'alert-octagon' : (alert.severity === 'warning' ? 'alert-triangle' : 'info')}" class="icon-sm" style="color: ${alert.severity === 'critical' ? 'var(--red-crit)' : (alert.severity === 'warning' ? 'var(--amber-warn)' : 'var(--green-safe)')};"></i>
      <div style="display: flex; flex-direction: column;">
        <span style="font-weight: 800; font-size: 11.5px; color: var(--text-highlight);">${alert.title}</span>
        <span style="font-size: 11px; color: var(--text-secondary);">${alert.message}</span>
      </div>
    `;
    container.appendChild(toast);
    this.refreshIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  onSimulationTick(s) {
    // 1. Mission Elapsed Clock
    const timeEl = document.getElementById('missionElapsed');
    if (timeEl) timeEl.textContent = simEngine.formatSimTime(s.simTime);

    // 2. Header Risk Pill
    this.updateHeaderRisk();

    // 3. Pipeline indicator highlights
    this.updatePipelineBar();

    // 4. Badges
    const workerBadge = document.getElementById('tabWorkerBadge');
    if (workerBadge) {
      const sosCount = s.workers.filter(w => w.status === 'SOS' || w.sosActive).length;
      workerBadge.textContent = sosCount > 0 ? `${sosCount} SOS!` : '6 OK';
      workerBadge.style.background = sosCount > 0 ? 'var(--red-tint)' : 'var(--blue-tint)';
      workerBadge.style.color = sosCount > 0 ? 'var(--red-crit)' : 'var(--blue-primary)';
    }

    const alertBadge = document.getElementById('tabAlertBadge');
    if (alertBadge) alertBadge.textContent = s.alerts.length;

    // 5. Always Render Persistent Map
    if (this.activeMapMode === '2d' && this.components.map2D) {
      this.components.map2D.render();
    }

    // 6. Render active deck animations if open
    if (this.activeDeck === 'workers' && this.components.workers) {
      this.components.workers.drawECGWaveforms();
    } else if (this.activeDeck === 'robots' && this.components.robots) {
      this.components.robots.drawLidarScan();
    }
  }

  updateHeaderRisk() {
    const riskVal = document.getElementById('headerRiskValue');
    const riskOrb = document.getElementById('headerRiskOrb');
    if (riskVal && riskOrb) {
      riskVal.textContent = `${state.overallRisk} / 100 [${state.riskCategory}]`;
      riskOrb.className = `risk-pulse-orb ${state.riskCategory === 'CRITICAL' ? 'critical' : (state.riskCategory === 'WARNING' || state.riskCategory === 'HIGH_RISK' ? 'warning' : 'safe')}`;
    }
  }

  updatePipelineBar() {
    const steps = document.querySelectorAll('.pipeline-step');
    steps.forEach(step => {
      const stepPhase = step.getAttribute('data-step');
      const isActive = stepPhase === state.pipelinePhase;
      step.classList.toggle('active', isActive);
      if (isActive && (state.overallRisk > 60 || state.pipelinePhase === 'rescue')) {
        step.classList.add('highlight-alert');
      } else {
        step.classList.remove('highlight-alert');
      }
    });
  }

  initModals() {
    const inspectorModal = document.getElementById('inspectorModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn && inspectorModal) {
      closeBtn.onclick = () => inspectorModal.style.display = 'none';
    }

    const debriefModal = document.getElementById('debriefModal');
    const debriefClose = document.getElementById('debriefCloseBtn');
    if (debriefClose && debriefModal) {
      debriefClose.onclick = () => debriefModal.style.display = 'none';
    }

    const btnCopy = document.getElementById('btnCopyDebrief');
    if (btnCopy) {
      btnCopy.onclick = () => {
        navigator.clipboard.writeText(JSON.stringify(state, null, 2));
        alert('Mission Debrief Telemetry JSON copied to clipboard!');
      };
    }

    const btnPrint = document.getElementById('btnPrintDebrief');
    if (btnPrint) {
      btnPrint.onclick = () => window.print();
    }
  }

  openEntityInspector(type, data) {
    const modal = document.getElementById('inspectorModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    if (!modal || !title || !body) return;

    title.textContent = `${type.toUpperCase()} TELEMETRY INSPECTOR: ${data.id || data.name}`;

    if (type === 'worker') {
      body.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div><strong>Name:</strong> ${data.name} (${data.role})</div>
          <div><strong>Subterranean Depth:</strong> ${data.z} meters (${data.level.toUpperCase()})</div>
          <div><strong>Heart Rate:</strong> <span style="color: ${data.hr > 120 ? 'var(--red-crit)' : 'var(--green-safe)'}; font-weight: 800;">${data.hr} BPM</span></div>
          <div><strong>Blood Oxygen (SpO2):</strong> ${data.spO2}%</div>
          <div><strong>Motion / Fall Status:</strong> ${data.motion}</div>
          <div><strong>ESP32 LoRa RSSI:</strong> ${data.rssi} dBm (Battery: ${data.battery}%)</div>
          <div><strong>Status:</strong> ${data.status}</div>
        </div>
      `;
    } else if (type === 'sensor') {
      body.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div><strong>Node Name:</strong> ${data.name} (${data.location})</div>
          <div><strong>Methane (CH4):</strong> <span style="color: ${data.ch4 > 1.25 ? 'var(--red-crit)' : 'var(--green-safe)'}; font-weight: 800;">${data.ch4}% LEL</span></div>
          <div><strong>Carbon Monoxide (CO):</strong> ${data.co} ppm</div>
          <div><strong>Oxygen (O2):</strong> ${data.o2}%</div>
          <div><strong>Temperature / Humidity:</strong> ${data.temp}°C / ${data.humidity}%</div>
          <div><strong>Water Ingress:</strong> ${data.waterLevel} cm</div>
          <div><strong>Seismic Vibration:</strong> ${data.vibration} mm/s</div>
          <div><strong>Mesh Hops:</strong> ${data.meshHops} Hops (Battery: ${data.battery}%)</div>
        </div>
      `;
    } else if (type === 'robot') {
      body.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div><strong>Robot:</strong> ${data.name} (${data.type})</div>
          <div><strong>Role:</strong> ${data.role}</div>
          <div><strong>Status:</strong> <span style="color: ${data.isFailed ? 'var(--red-crit)' : 'var(--purple-bright)'}; font-weight: 800;">${data.status}</span></div>
          <div><strong>SLAM Coverage:</strong> ${data.mappedCoverage}%</div>
          <div><strong>Battery Level:</strong> ${data.battery}%</div>
          <div><strong>Payload Sensor Array:</strong> ${data.payload}</div>
        </div>
      `;
    }

    modal.style.display = 'flex';
    this.refreshIcons();
  }

  openDebriefModal() {
    const modal = document.getElementById('debriefModal');
    const body = document.getElementById('debriefModalBody');
    if (!modal || !body) return;

    body.innerHTML = `
      <div style="font-family: var(--font-mono); font-size: 11.5px; line-height: 1.6; display: flex; flex-direction: column; gap: 10px;">
        <div style="background: var(--blue-tint); border-left: 3px solid var(--blue-primary); padding: 8px 12px; border-radius: 0 var(--radius-xs) var(--radius-xs) 0;">
          <strong>INCIDENT IDENTIFIER:</strong> NEXUS-RESCUE-OPERATION-04B<br>
          <strong>LOCATION:</strong> Bharat Block-IV Subterranean Coal Drift (-380m Depth)<br>
          <strong>MISSION OUTCOME:</strong> <span style="color: var(--green-safe); font-weight: 800;">100% SUCCESSFUL PERSONNEL RECOVERY</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 8px; border-radius: var(--radius-xs);">
            <strong>ENVIRONMENTAL PEAKS:</strong><br>
            • Peak Methane: 2.45% LEL (SN-08 Face 4B)<br>
            • Peak Carbon Monoxide: 65 ppm<br>
            • Drainage Sump Flood: 42 cm depth<br>
            • Geotechnical Strain: 0.85 mm/s
          </div>
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 8px; border-radius: var(--radius-xs);">
            <strong>AUTONOMOUS ROBOTICS DEPLOYMENT:</strong><br>
            • Scout R01 Arachne: 78.4% SLAM Coverage<br>
            • R01 Hardware Jam Detected: Yes<br>
            • Failover to R02 Titan Handover: 1.2s Latency<br>
            • O2 Payload Delivered: 2x 30min Tanks
          </div>
        </div>

        <div style="background: var(--green-tint); border: 1px solid var(--green-safe); padding: 8px 12px; border-radius: var(--radius-xs); color: var(--text-highlight);">
          <strong>REGULATORY & INDUSTRIAL SAFETY COMPLIANCE:</strong><br>
          ✓ Statutory explosion limit alert triggered within 1.0s.<br>
          ✓ Decentralized LoRa Mesh maintained 99.4% packet delivery ratio.<br>
          ✓ Dynamic A* routing guided personnel along Route Alpha safely avoiding toxic gas eddies.
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    this.refreshIcons();
  }
}

// Initialize Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new NexusApp();
  app.init();
});

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
      const isSos = data.status === 'SOS' || data.sosActive;
      const rescue = state.rescueTeamRoute || {
        origin: 'Surface Portal A (0m)',
        destination: `${data.name} (${data.level.toUpperCase()})`,
        distanceM: data.level === 'l3' ? 480 : (data.level === 'l2' ? 320 : 180),
        estArrivalTimeMin: data.level === 'l3' ? 5.8 : (data.level === 'l2' ? 3.9 : 2.2),
        pathNodes: data.level === 'l3' 
          ? ['Surface Portal A (0m)', 'Shaft 1 Collar (0m)', 'Shaft L1 Station (-120m)', 'Shaft L2 Station (-240m)', 'Deep Station L3 (-380m)', 'Refuge Chamber Bypass', `Worker Location (${data.nodeId || 'Face 4B'})`]
          : ['Surface Portal A (0m)', 'Shaft 1 Collar (0m)', `Shaft Station (${data.level.toUpperCase()})`, `Worker Location (${data.nodeId})`]
      };

      body.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 11.5px; display: flex; flex-direction: column; gap: 10px;">
          <!-- Personnel Vitals Card -->
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 10px; border-radius: var(--radius-xs);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 13px; font-weight: 800; color: var(--text-highlight);">${data.name} (${data.role})</span>
              <span class="nav-badge" style="background: ${isSos ? 'var(--red-tint)' : 'var(--green-tint)'}; color: ${isSos ? 'var(--red-crit)' : 'var(--green-safe)'}; font-weight: 800;">
                ${isSos ? '🚨 EMERGENCY SOS' : data.status}
              </span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; font-size: 10px;">
              <div><strong>Depth:</strong> ${data.z}m (${data.level.toUpperCase()})</div>
              <div><strong>Heart Rate:</strong> <span style="color: ${data.hr > 120 ? 'var(--red-crit)' : 'var(--green-safe)'}; font-weight: 800;">${data.hr} BPM</span></div>
              <div><strong>SpO2:</strong> ${data.spO2}%</div>
              <div><strong>Motion:</strong> ${data.motion}</div>
              <div><strong>ESP32 LoRa RSSI:</strong> ${data.rssi} dBm</div>
              <div><strong>Tag Battery:</strong> ${data.battery}%</div>
            </div>
          </div>

          <!-- Environmental Sensed Surroundings & Statutory Safe Limits -->
          <div style="background: #f8fafc; border: 1px solid var(--border-subtle); padding: 10px; border-radius: var(--radius-xs);">
            <div style="font-family: var(--font-display); font-size: 11.5px; font-weight: 800; color: var(--blue-primary); margin-bottom: 6px;">
              LOCAL DRIFT ENVIRONMENT & STATUTORY SAFE BENCHMARKS
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; text-align: left;">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted);">
                  <th style="padding: 3px 0;">PARAMETER</th>
                  <th>STATUTORY SAFE LIMIT</th>
                  <th>CURRENT LEVEL</th>
                  <th>SAFETY STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 4px 0;"><strong>Methane (CH4)</strong></td>
                  <td>&lt; 0.75% LEL</td>
                  <td style="font-weight: 800; color: ${isSos ? 'var(--red-crit)' : 'var(--green-safe)'};">${isSos ? '2.48% LEL' : '0.12% LEL'}</td>
                  <td><span class="nav-badge" style="background: ${isSos ? 'var(--red-tint)' : 'var(--green-tint)'}; color: ${isSos ? 'var(--red-crit)' : 'var(--green-safe)'};">${isSos ? 'EXPLOSION HAZARD' : 'SAFE'}</span></td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 4px 0;"><strong>Oxygen (O2)</strong></td>
                  <td>19.5% - 23.5%</td>
                  <td style="font-weight: 800; color: var(--green-safe);">${isSos ? '19.8%' : '20.8%'}</td>
                  <td><span class="nav-badge" style="background: var(--green-tint); color: var(--green-safe);">SAFE</span></td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 4px 0;"><strong>Carbon Monoxide (CO)</strong></td>
                  <td>&lt; 25 ppm</td>
                  <td style="font-weight: 800; color: ${isSos ? 'var(--amber-warn)' : 'var(--text-highlight)'};">${isSos ? '42 ppm' : '6 ppm'}</td>
                  <td><span class="nav-badge" style="background: ${isSos ? 'var(--amber-tint)' : 'var(--green-tint)'}; color: ${isSos ? 'var(--amber-warn)' : 'var(--green-safe)'};">${isSos ? 'ELEVATED' : 'SAFE'}</span></td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 4px 0;"><strong>Temperature</strong></td>
                  <td>&lt; 32.0°C</td>
                  <td style="font-weight: 800;">28.5°C</td>
                  <td><span class="nav-badge" style="background: var(--green-tint); color: var(--green-safe);">SAFE</span></td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;"><strong>Flood Water Inundation</strong></td>
                  <td>&lt; 15 cm</td>
                  <td style="font-weight: 800;">4 cm</td>
                  <td><span class="nav-badge" style="background: var(--green-tint); color: var(--green-safe);">SAFE</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Dedicated Surface Rescue Team Ingress Path -->
          <div style="background: var(--blue-tint); border: 1.5px solid var(--blue-water); padding: 10px; border-radius: var(--radius-xs);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-family: var(--font-display); font-size: 12px; font-weight: 800; color: var(--blue-water);">
                🚑 SURFACE RESCUE TEAM RAPID INGRESS PATH
              </span>
              <span class="nav-badge" style="background: var(--blue-water); color: #ffffff; font-weight: 800;">
                EST ARRIVAL: ${rescue.estArrivalTimeMin} MIN (${rescue.distanceM}m)
              </span>
            </div>

            <div style="font-size: 10.5px; color: var(--text-primary); margin-bottom: 6px;">
              <strong>Step-by-Step Entry Trajectory:</strong>
              <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                ${(rescue.pathNodes || []).map((node, i) => `
                  <span style="background: #ffffff; border: 1px solid var(--border-subtle); padding: 3px 6px; border-radius: var(--radius-xs); font-weight: 700; color: var(--text-highlight);">
                    ${i + 1}. ${node} ${i < rescue.pathNodes.length - 1 ? '➔' : '🎯'}
                  </span>
                `).join('')}
              </div>
            </div>

            <div style="font-size: 10px; color: #1e3a8a; line-height: 1.35;">
              <strong>Mandatory Rescue PPE:</strong> SCBA 60-min Positive Pressure, FLIR Thermal Imager (Zone 0), Hydraulic Extrication Shears, Multi-Gas Sniffer.
            </div>
          </div>

          <!-- Worker Egress Evacuation Route -->
          <div style="background: var(--green-tint); border: 1px solid var(--green-safe); padding: 8px 10px; border-radius: var(--radius-xs); color: #065f46; font-size: 10.5px;">
            <strong>Worker Evacuation Path (Egress):</strong> ${data.name} ➔ Refuge Chamber (-380m) ➔ Shaft 1 Hoist Express Ascent ➔ Surface Portal A (0m Fresh Air Base).
          </div>
        </div>
      `;
    } else if (type === 'sensor') {
      const isCritical = data.ch4 > 1.25 || data.co > 50 || data.waterLevel > 30;
      const isWarn = data.ch4 > 0.75 || data.co > 25 || data.waterLevel > 15;

      body.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 11.5px; display: flex; flex-direction: column; gap: 10px;">
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 10px; border-radius: var(--radius-xs);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 13px; font-weight: 800; color: var(--text-highlight);">${data.id}: ${data.name}</span>
              <span class="nav-badge" style="background: ${isCritical ? 'var(--red-tint)' : (isWarn ? 'var(--amber-warn)' : 'var(--green-tint)')}; color: ${isCritical ? 'var(--red-crit)' : (isWarn ? '#ffffff' : 'var(--green-safe)')}; font-weight: 800;">
                ${data.status}
              </span>
            </div>
            <div style="font-size: 10.5px; color: var(--text-muted);">Location: ${data.location} | Subterranean Level: ${data.level.toUpperCase()} | LoRa Mesh Hops: ${data.meshHops}</div>
          </div>

          <!-- Sensed Telemetry vs Statutory Safe Benchmarks Table -->
          <div style="background: #ffffff; border: 1px solid var(--border-subtle); padding: 10px; border-radius: var(--radius-xs);">
            <div style="font-family: var(--font-display); font-size: 11.5px; font-weight: 800; color: var(--blue-primary); margin-bottom: 6px;">
              SENSED ENVIRONMENTAL MEASUREMENTS & STATUTORY BENCHMARKS
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left;">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted);">
                  <th style="padding: 3px 0;">MEASURED PARAMETER</th>
                  <th>STATUTORY SAFE BENCHMARK</th>
                  <th>LIVE SENSED VALUE</th>
                  <th>SAFETY RATING</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 5px 0;"><strong>Methane (CH4)</strong></td>
                  <td>&lt; 0.75% LEL (Statutory Limit)</td>
                  <td style="font-weight: 800; color: ${data.ch4 > 1.25 ? 'var(--red-crit)' : (data.ch4 > 0.75 ? 'var(--amber-warn)' : 'var(--green-safe)')};">${data.ch4}% LEL</td>
                  <td><span class="nav-badge" style="background: ${data.ch4 > 1.25 ? 'var(--red-tint)' : (data.ch4 > 0.75 ? 'var(--amber-tint)' : 'var(--green-tint)')}; color: ${data.ch4 > 1.25 ? 'var(--red-crit)' : (data.ch4 > 0.75 ? 'var(--amber-warn)' : 'var(--green-safe)')};">${data.ch4 > 1.25 ? 'EXPLOSIVE' : (data.ch4 > 0.75 ? 'WARNING' : 'SAFE')}</span></td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 5px 0;"><strong>Oxygen (O2)</strong></td>
                  <td>19.5% - 23.5% (Safe Envelope)</td>
                  <td style="font-weight: 800; color: ${data.o2 < 19.5 ? 'var(--red-crit)' : 'var(--green-safe)'};">${data.o2}%</td>
                  <td><span class="nav-badge" style="background: ${data.o2 < 19.5 ? 'var(--red-tint)' : 'var(--green-tint)'}; color: ${data.o2 < 19.5 ? 'var(--red-crit)' : 'var(--green-safe)'};">${data.o2 < 19.5 ? 'DEFICIENT' : 'SAFE'}</span></td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 5px 0;"><strong>Carbon Monoxide (CO)</strong></td>
                  <td>&lt; 25 ppm (Toxic Threshold)</td>
                  <td style="font-weight: 800; color: ${data.co > 50 ? 'var(--red-crit)' : (data.co > 25 ? 'var(--amber-warn)' : 'var(--text-highlight)')};">${data.co} ppm</td>
                  <td><span class="nav-badge" style="background: ${data.co > 50 ? 'var(--red-tint)' : (data.co > 25 ? 'var(--amber-tint)' : 'var(--green-tint)')}; color: ${data.co > 50 ? 'var(--red-crit)' : (data.co > 25 ? 'var(--amber-warn)' : 'var(--green-safe)')};">${data.co > 50 ? 'DANGER' : (data.co > 25 ? 'ELEVATED' : 'SAFE')}</span></td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 5px 0;"><strong>Ambient Temperature</strong></td>
                  <td>&lt; 32.0°C (Thermal Comfort)</td>
                  <td style="font-weight: 800;">${data.temp}°C</td>
                  <td><span class="nav-badge" style="background: var(--green-tint); color: var(--green-safe);">SAFE</span></td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 5px 0;"><strong>Relative Humidity</strong></td>
                  <td>40% - 70%</td>
                  <td style="font-weight: 800;">${data.humidity}%</td>
                  <td><span class="nav-badge" style="background: var(--green-tint); color: var(--green-safe);">SAFE</span></td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 5px 0;"><strong>Water Inundation Level</strong></td>
                  <td>&lt; 15 cm</td>
                  <td style="font-weight: 800; color: ${data.waterLevel > 15 ? 'var(--blue-water)' : 'var(--text-highlight)'};">${data.waterLevel} cm</td>
                  <td><span class="nav-badge" style="background: ${data.waterLevel > 15 ? 'var(--blue-water-tint)' : 'var(--green-tint)'}; color: ${data.waterLevel > 15 ? 'var(--blue-water)' : 'var(--green-safe)'};">${data.waterLevel > 30 ? 'FLOOD DANGER' : (data.waterLevel > 15 ? 'CAUTION' : 'SAFE')}</span></td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Seismic Roof Vibration</strong></td>
                  <td>&lt; 0.30 mm/s</td>
                  <td style="font-weight: 800;">${data.vibration} mm/s</td>
                  <td><span class="nav-badge" style="background: var(--green-tint); color: var(--green-safe);">SAFE</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (type === 'robot') {
      const recon = state.reconReport;
      body.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 11.5px; display: flex; flex-direction: column; gap: 10px;">
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 10px; border-radius: var(--radius-xs);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 13px; font-weight: 800; color: var(--purple-ai);">${data.name} (${data.type})</span>
              <span class="nav-badge" style="background: var(--purple-tint); color: var(--purple-bright); font-weight: 800;">${data.status}</span>
            </div>
            <div style="font-size: 10.5px; color: var(--text-muted);">${data.role} | SLAM Coverage: ${data.mappedCoverage}% | Battery: ${data.battery}%</div>
          </div>

          <!-- Autonomous Reconnaissance Report -->
          <div style="background: #ffffff; border: 1.5px solid var(--purple-bright); padding: 10px; border-radius: var(--radius-xs);">
            <div style="font-family: var(--font-display); font-size: 12px; font-weight: 800; color: var(--purple-ai); margin-bottom: 6px;">
              🕷️ AUTONOMOUS SPIDY SLAM RECONNAISSANCE REPORT
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 10.5px;">
              <div><strong>Target Incident Node:</strong> ${recon.incidentName}</div>
              <div><strong>Environmental Sweep:</strong> CH4: <span style="font-weight: 800; color: ${recon.ch4 > 1.25 ? 'var(--red-crit)' : 'var(--green-safe)'};">${recon.ch4}% LEL (Safe: &lt; 0.75%)</span> | Temp: ${recon.temp}°C | Humidity: ${recon.humidity}%</div>
              <div><strong>Thermal Human Verification:</strong> <span style="font-weight: 800; color: ${recon.humanDetected ? 'var(--green-safe)' : 'var(--text-muted)'};">${recon.humanDetected ? `✓ ${recon.humanName} (${recon.humanStatus})` : 'Clear'}</span></div>
              <div><strong>First-Responder Human Rescue Feasibility:</strong> <span style="font-weight: 800; color: ${recon.rescueTeamAllowed ? 'var(--green-safe)' : 'var(--red-crit)'};">${recon.rescueTeamAllowed ? 'SAFE FOR INGRESS' : 'SCBA 60-MIN MANDATORY'}</span></div>
              <div><strong>Alternate Evacuation Route Transmitted:</strong> <span style="color: var(--blue-primary); font-weight: 800;">${recon.alternatePathName}</span></div>
            </div>
          </div>
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

    const rescue = state.rescueTeamRoute || {
      origin: 'Surface Rescue Staging (Portal A 0m)',
      destination: 'Trapped Worker Rajesh Kumar (Face 4B -380m)',
      distanceM: 480,
      estArrivalTimeMin: 5.8,
      pathNodes: ['Surface Portal A (0m)', 'Shaft 1 Collar (0m)', 'Shaft Station L1 (-120m)', 'Shaft Station L2 (-240m)', 'Deep Station L3 (-380m)', 'Refuge Chamber Bypass', 'Extraction Face 4B (-380m)']
    };

    body.innerHTML = `
      <div style="font-family: var(--font-mono); font-size: 11.5px; line-height: 1.6; display: flex; flex-direction: column; gap: 10px;">
        <!-- Executive Mission Summary -->
        <div style="background: var(--blue-tint); border-left: 3.5px solid var(--blue-primary); padding: 8px 12px; border-radius: 0 var(--radius-xs) var(--radius-xs) 0;">
          <strong>INCIDENT IDENTIFIER:</strong> NEXUS-SUBTERRANEAN-RESCUE-04B<br>
          <strong>LOCATION:</strong> Bharat Block-IV Coal Heading (-380m Depth)<br>
          <strong>MISSION OUTCOME:</strong> <span style="color: var(--green-safe); font-weight: 800;">100% SUCCESSFUL PERSONNEL EXTRICTION</span>
        </div>

        <!-- Dedicated Surface Rescue Team Ingress Path & PPE Table -->
        <div style="background: #ffffff; border: 1.5px solid var(--blue-water); padding: 10px; border-radius: var(--radius-xs);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-family: var(--font-display); font-size: 12.5px; font-weight: 800; color: var(--blue-water);">
              🚑 FIRST-RESPONDER SURFACE RESCUE TEAM INGRESS TRAJECTORY
            </span>
            <span class="nav-badge" style="background: var(--blue-water-tint); color: var(--blue-water); font-weight: 800;">
              ARRIVAL TIME: ${rescue.estArrivalTimeMin} MIN (${rescue.distanceM}m)
            </span>
          </div>

          <div style="font-size: 10.5px; color: var(--text-primary); margin-bottom: 6px;">
            <strong>Turn-by-Turn Entry Path:</strong>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
              ${(rescue.pathNodes || []).map((node, i) => `
                <span style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 3px 6px; border-radius: var(--radius-xs); font-weight: 700; color: var(--text-highlight);">
                  ${i + 1}. ${node} ${i < rescue.pathNodes.length - 1 ? '➔' : '🎯 (VICTIM REACHED)'}
                </span>
              `).join('')}
            </div>
          </div>

          <div style="font-size: 10px; color: #1e3a8a; line-height: 1.4;">
            <strong>Mandatory First-Responder Equipment:</strong> SCBA 60-Minute Positive Pressure Unit, Intrinsically Safe FLIR Thermal Imager (Zone 0 Certified), Hydraulic Extrication Shears, Multi-Gas Atmospheric Sniffer.
          </div>
        </div>

        <!-- Environmental Peak Telemetry vs Statutory Safe Limits Table -->
        <div style="background: #f8fafc; border: 1px solid var(--border-subtle); padding: 10px; border-radius: var(--radius-xs);">
          <div style="font-family: var(--font-display); font-size: 12px; font-weight: 800; color: var(--text-highlight); margin-bottom: 6px;">
            ENVIRONMENTAL PEAK TELEMETRY VS STATUTORY SAFE BENCHMARKS
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted);">
                <th style="padding: 3px 0;">SENSED PARAMETER</th>
                <th>STATUTORY SAFE LIMIT</th>
                <th>PEAK RECORDED IN MINE</th>
                <th>SAFETY COMPLIANCE STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 4px 0;"><strong>Methane (CH4)</strong></td>
                <td>&lt; 0.75% LEL</td>
                <td style="font-weight: 800; color: var(--red-crit);">2.48% LEL (Face 4B)</td>
                <td><span class="nav-badge" style="background: var(--red-tint); color: var(--red-crit);">EXCEEDED (EVAC TRIGGERED)</span></td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 4px 0;"><strong>Carbon Monoxide (CO)</strong></td>
                <td>&lt; 25 ppm</td>
                <td style="font-weight: 800; color: var(--amber-warn);">58 ppm</td>
                <td><span class="nav-badge" style="background: var(--amber-tint); color: var(--amber-warn);">ELEVATED (SCBA ENFORCED)</span></td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 4px 0;"><strong>Oxygen (O2)</strong></td>
                <td>19.5% - 23.5%</td>
                <td style="font-weight: 800; color: var(--green-safe);">19.8%</td>
                <td><span class="nav-badge" style="background: var(--green-tint); color: var(--green-safe);">COMPLIANT</span></td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 4px 0;"><strong>Drainage Sump Flood</strong></td>
                <td>&lt; 15 cm</td>
                <td style="font-weight: 800; color: var(--blue-water);">48 cm (L2 Sump)</td>
                <td><span class="nav-badge" style="background: var(--blue-water-tint); color: var(--blue-water);">INUNDATION BLOCKED</span></td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Seismic Roof Strain</strong></td>
                <td>&lt; 0.30 mm/s</td>
                <td style="font-weight: 800;">0.65 mm/s</td>
                <td><span class="nav-badge" style="background: var(--green-tint); color: var(--green-safe);">MONITORED</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Autonomous Robotics & LoRa Mesh Performance -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 8px; border-radius: var(--radius-xs);">
            <strong>AUTONOMOUS ROBOTICS DEPLOYMENT:</strong><br>
            • Spidy Scout R-01: 78.4% SLAM Coverage<br>
            • R-01 Rockfall Jam Detected: Yes (00:02:14)<br>
            • Spidy Standby R-02 Handover Latency: 1.0s<br>
            • O2 Emergency Delivery: 2x 30-min cylinders
          </div>
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 8px; border-radius: var(--radius-xs);">
            <strong>LORA MESH COMMUNICATIONS:</strong><br>
            • Active Sentinels: 8/8 synchronized<br>
            • Packet Delivery Ratio (PDR): 99.4%<br>
            • Mesh Self-Healing Reroute: Completed in 0.8s<br>
            • Bio-Tag Telemetry Frequency: 1.0 Hz Real-Time
          </div>
        </div>

        <div style="background: var(--green-tint); border: 1px solid var(--green-safe); padding: 8px 12px; border-radius: var(--radius-xs); color: var(--text-highlight);">
          <strong>REGULATORY & INDUSTRIAL SAFETY COMPLIANCE:</strong><br>
          ✓ Statutory explosion limit alert triggered within 1.0s of CH4 spike.<br>
          ✓ Wearable tags broadcast instant alternate evacuation routes to all endangered miners.<br>
          ✓ Dynamic A* routing guided personnel safely to Surface Portal A avoiding toxic gas eddies.
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

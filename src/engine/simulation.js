/**
 * NEXUS Real-Time Simulation Engine & Multi-Agent Orchestrator
 */

import { state, resetState } from './state.js';
import { calculateAIRisk } from './ai_risk_engine.js';
import { pathfinder } from './pathfinder.js';
import { soundEngine } from './sound_engine.js';

class SimulationEngine {
  constructor() {
    this.listeners = new Set();
    this.alertListeners = new Set();
    this.lastTickTime = performance.now();
    this.telemetryAccumulator = 0;
    this.animationFrameId = null;
  }

  start() {
    this.lastTickTime = performance.now();
    const loop = (currentTime) => {
      const deltaMs = currentTime - this.lastTickTime;
      this.lastTickTime = currentTime;

      if (state.isRunning) {
        this.update(deltaMs * state.speed);
      }

      this.notifyListeners();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onAlert(callback) {
    this.alertListeners.add(callback);
    return () => this.alertListeners.delete(callback);
  }

  notifyListeners() {
    for (const callback of this.listeners) {
      try {
        callback(state);
      } catch (err) {
        console.error('Simulation listener error:', err);
      }
    }
  }

  emitAlert(type, title, message, severity = 'normal') {
    const elapsed = this.formatSimTime(state.simTime);
    const alertItem = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      timestamp: elapsed,
      type,
      severity,
      title,
      message
    };
    state.alerts.unshift(alertItem);
    if (state.alerts.length > 50) state.alerts.pop();

    for (const cb of this.alertListeners) {
      try {
        cb(alertItem);
      } catch (e) {
        console.error(e);
      }
    }

    if (severity === 'critical') {
      soundEngine.playEmergencySiren();
    } else if (severity === 'warning') {
      soundEngine.playWarningBeep();
    }
  }

  formatSimTime(seconds) {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }

  update(deltaMs) {
    const deltaSec = deltaMs / 1000;
    state.simTime += deltaSec;
    this.telemetryAccumulator += deltaSec;

    // 1 Hz Telemetry & Environmental Update
    if (this.telemetryAccumulator >= 1.0) {
      this.telemetryAccumulator = 0;
      this.updateTelemetry();
    }

    // 60 FPS Smooth Entity Motions (Robots & Workers)
    this.updateRobotMotion(deltaSec);
    this.updateWorkerPositions(deltaSec);
  }

  updateTelemetry() {
    // 1. Natural subtle jitter on sensors
    state.sensors.forEach(s => {
      if (s.status !== 'OFFLINE') {
        const jitter = (Math.random() - 0.5) * 0.01;
        s.temp = +(s.temp + (Math.random() - 0.5) * 0.05).toFixed(1);
        s.o2 = +(20.9 - s.ch4 * 0.2 - s.co * 0.01).toFixed(1);

        // Append to history buffer for live sparklines
        if (!s.history) s.history = { ch4: [], co: [], water: [], risk: [] };
        s.history.ch4.push(s.ch4);
        if (s.history.ch4.length > 25) s.history.ch4.shift();
        s.history.co.push(s.co);
        if (s.history.co.length > 25) s.history.co.shift();
        s.history.water.push(s.waterLevel);
        if (s.history.water.length > 25) s.history.water.shift();
      }
    });

    // 2. Gas Plume Physics Progression
    if (state.hazards.gasPlume.active) {
      const sn7 = state.sensors.find(s => s.id === 'SN-07');
      const sn8 = state.sensors.find(s => s.id === 'SN-08');
      if (sn8 && sn8.ch4 < 2.45) {
        sn8.ch4 = +(sn8.ch4 + 0.08).toFixed(2);
        sn8.co = Math.min(65, sn8.co + 2);
        sn8.status = sn8.ch4 > 1.25 ? 'CRITICAL' : 'WARNING';
      }
      if (sn7 && sn7.ch4 < 1.85) {
        sn7.ch4 = +(sn7.ch4 + 0.05).toFixed(2);
        sn7.co = Math.min(48, sn7.co + 1);
        sn7.status = sn7.ch4 > 1.25 ? 'CRITICAL' : 'WARNING';
      }
      state.hazards.gasPlume.radius = Math.min(state.hazards.gasPlume.maxRadius, state.hazards.gasPlume.radius + 1.2);
    }

    // 3. Flood Water Progression
    if (state.hazards.floodWater.active) {
      const sn6 = state.sensors.find(s => s.id === 'SN-06');
      if (sn6 && sn6.waterLevel < 65) {
        sn6.waterLevel += 2;
        sn6.status = sn6.waterLevel > 35 ? 'CRITICAL' : 'WARNING';
      }
      state.hazards.floodWater.sumpLevelCm = sn6 ? sn6.waterLevel : 20;
    }

    // 4. Worker Biometrics & Physiological Response
    state.workers.forEach(w => {
      if (w.status === 'SOS' || w.sosActive) {
        w.hr = Math.min(145, Math.max(128, w.hr + Math.floor((Math.random() - 0.45) * 3)));
        w.spO2 = Math.max(91, w.spO2 - (Math.random() > 0.7 ? 1 : 0));
      } else if (w.status === 'FLAGGED') {
        w.hr = Math.min(115, Math.max(98, w.hr + Math.floor((Math.random() - 0.48) * 2)));
      } else {
        w.hr = Math.min(84, Math.max(68, w.hr + Math.floor((Math.random() - 0.5) * 2)));
      }
    });

    // 5. Update Explainable AI Risk Score
    const aiResult = calculateAIRisk();
    state.overallRisk = aiResult.score;
    state.riskCategory = aiResult.category;
    state.aiRiskData = aiResult;

    // 6. Refresh Pathfinding calculations
    pathfinder.calculateRoutes();
  }

  updateRobotMotion(deltaSec) {
    const r01 = state.robots.r01;
    const r02 = state.robots.r02;

    // R01 Scout Motion
    if (r01 && !r01.isFailed && r01.status !== 'OFFLINE') {
      r01.mappedCoverage = Math.min(100, +(r01.mappedCoverage + 0.05 * deltaSec).toFixed(1));
      
      // Move R01 towards target
      const dx = r01.targetX - r01.x;
      const dy = r01.targetY - r01.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 3) {
        const speed = 25 * deltaSec;
        r01.x += (dx / dist) * speed;
        r01.y += (dy / dist) * speed;
      } else {
        // Switch waypoints for realistic patrol
        if (r01.targetX === 580) {
          r01.targetX = 140; r01.targetY = 280;
        } else {
          r01.targetX = 580; r01.targetY = 410;
        }
      }
    }

    // R02 Heavy Rescuer Motion (when deployed)
    if (r02 && r02.status === 'DEPLOYED') {
      const dx = r02.targetX - r02.x;
      const dy = r02.targetY - r02.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        const speed = 40 * deltaSec;
        r02.x += (dx / dist) * speed;
        r02.y += (dy / dist) * speed;
      } else {
        r02.status = 'RESCUING';
        this.emitAlert('AI_ACTION', 'R02 Titan Reached Rescue Target', 'Emergency O2 payload delivered to Worker W-03 (Rajesh Kumar). Initiating assisted egress.', 'warning');
      }
    }
  }

  updateWorkerPositions(deltaSec) {
    // Subtle wandering motion for non-stationary workers
    state.workers.forEach(w => {
      if (w.motion === 'WALKING' && w.status === 'NORMAL') {
        w.x += (Math.random() - 0.5) * 1.5 * deltaSec;
        w.y += (Math.random() - 0.5) * 0.8 * deltaSec;
      }
    });
  }

  // =========================================================================
  // Interactive Scenario Triggers & Tactical Injects
  // =========================================================================

  triggerWorkerSOS() {
    const w3 = state.workers.find(w => w.id === 'W-03');
    if (w3) {
      w3.status = 'SOS';
      w3.sosActive = true;
      w3.motion = 'MAN_DOWN';
      w3.hr = 136;
      w3.spO2 = 93;
      state.pipelinePhase = 'rescue';

      this.emitAlert(
        'CRITICAL_SOS',
        'EMERGENCY SOS: Worker W-03 (Rajesh Kumar)',
        'Man-Down beacon triggered at Sub-level 3 (Face 4B). Heart rate 136 BPM. Automated AI rescue routing engaged.',
        'critical'
      );

      // Auto dispatch R01 or R02
      if (!state.robots.r01.isFailed) {
        state.robots.r01.status = 'DISPATCHED';
        state.robots.r01.targetX = w3.x;
        state.robots.r01.targetY = w3.y;
      }
    }
  }

  triggerGasLeak() {
    state.hazards.gasPlume.active = true;
    state.hazards.gasPlume.density = 2.4;
    state.pipelinePhase = 'predict';

    this.emitAlert(
      'ATMOSPHERIC_ALERT',
      'Methane (CH4) Outbreak at Section 4B',
      'CH4 concentration spiked to 2.45% LEL on Sentinel SN-08. Hazardous explosive envelope detected.',
      'warning'
    );
  }

  triggerFlood() {
    state.hazards.floodWater.active = true;
    state.hazards.floodWater.inundationRateCmMin = 6.5;
    state.hazards.floodWater.isBlockedL2West = true;
    state.pipelinePhase = 'plan';

    this.emitAlert(
      'FLOOD_WARNING',
      'Rapid Inundation in Sub-level 2 Sump',
      'Drainage Sump water level exceeding critical thresholds. Route Beta flagged IMPASSABLE. AI dynamic rerouting active.',
      'warning'
    );
  }

  triggerRobotFailure() {
    const r01 = state.robots.r01;
    const r02 = state.robots.r02;

    r01.isFailed = true;
    r01.status = 'FAILED';
    r01.failureReason = 'Rockfall impact jam / Telemetry Link Interrupted';
    state.pipelinePhase = 'rescue';

    this.emitAlert(
      'ROBOT_FAILURE',
      'CRITICAL: Scout Robot R01 Arachne Offline',
      'Hardware entrapment at Sub-level 2. Telemetry packet loss. Executing Autonomous Failover Protocol...',
      'critical'
    );

    // Autonomous Failover Sequence to R02 Titan
    setTimeout(() => {
      r02.status = 'SPOOLING';
      r02.activeTransfer = true;
      this.emitAlert(
        'AI_FAILOVER',
        'Autonomous Handover: R02 Titan Activated',
        'R02 inherited 100% SLAM point-cloud and victim coordinates from R01. Dispatching heavy extrication unit.',
        'warning'
      );

      setTimeout(() => {
        r02.status = 'DEPLOYED';
        r02.targetX = 575;
        r02.targetY = 410;
      }, 1200);
    }, 1000);
  }

  triggerNodeFailure() {
    const sn5 = state.sensors.find(s => s.id === 'SN-05');
    if (sn5) {
      sn5.status = 'OFFLINE';
      state.pipelinePhase = 'connect';

      // Reroute mesh links
      state.meshLinks.forEach(link => {
        if (link.from === 'SN-05' || link.to === 'SN-05') {
          link.active = false;
        }
      });

      this.emitAlert(
        'COMM_FAILOVER',
        'Sentinel Node SN-05 Packet Drop',
        'LoRa mesh link severed at Sub-level 2. Self-healing protocol rerouting packets via SN-04 -> SN-07.',
        'warning'
      );
    }
  }

  restoreSystem() {
    resetState();
    soundEngine.playSuccessFanfare();
    this.emitAlert(
      'SYSTEM_RESET',
      'NEXUS Subterranean Safe Mode Restored',
      'All atmospheric, water, robot, and mesh telemetry normalized to nominal baseline.',
      'normal'
    );
  }
}

export const simEngine = new SimulationEngine();

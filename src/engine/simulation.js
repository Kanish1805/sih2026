/**
 * NEXUS Real-Time Simulation Engine & Multi-Agent Orchestrator
 * Features:
 * - Dynamic multi-location hazard cycling across mine sectors
 * - Autonomous Spidy Robot Rapid Dispatch & SLAM Environmental Reconnaissance
 * - Worker bio-tag hazard alerts & personalized evacuation path redirection
 * - Continuous animated worker patrol movement (Real-Time Digital Twin)
 * - Surface Rescue Team Rapid Ingress Path computation
 * - Autonomous failover from Spidy Scout R01 to Spidy Standby R02
 */

import { state, resetState, MINE_TOPOGRAPHY, HAZARD_LOCATIONS } from './state.js';
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
    this.reconTimer = null;
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

    // 60 FPS Entity Movements (Robots & Workers)
    this.updateRobotMotion(deltaSec);
    this.updateWorkerPositions(deltaSec);
  }

  updateTelemetry() {
    // 1. Natural sensor noise & history tracking
    state.sensors.forEach(s => {
      if (s.status !== 'OFFLINE') {
        s.temp = +(s.temp + (Math.random() - 0.5) * 0.05).toFixed(1);
        s.o2 = +(20.9 - s.ch4 * 0.2 - s.co * 0.01).toFixed(1);

        if (!s.history) s.history = { ch4: [], co: [], water: [], risk: [] };
        s.history.ch4.push(s.ch4);
        if (s.history.ch4.length > 25) s.history.ch4.shift();
        s.history.co.push(s.co);
        if (s.history.co.length > 25) s.history.co.shift();
        s.history.water.push(s.waterLevel);
        if (s.history.water.length > 25) s.history.water.shift();
      }
    });

    // 2. Gas Plume Physics
    if (state.hazards.gasPlume.active) {
      const targetSensor = state.sensors.find(s => s.id === (state.hazards.gasPlume.sensorId || 'SN-08'));
      if (targetSensor && targetSensor.ch4 < 2.85) {
        targetSensor.ch4 = +(targetSensor.ch4 + 0.12).toFixed(2);
        targetSensor.co = Math.min(75, targetSensor.co + 3);
        targetSensor.status = targetSensor.ch4 > 1.25 ? 'CRITICAL' : 'WARNING';
      }
      state.hazards.gasPlume.radius = Math.min(state.hazards.gasPlume.maxRadius, state.hazards.gasPlume.radius + 1.5);
    }

    // 3. Flood Water Progression
    if (state.hazards.floodWater.active) {
      const sumpSensor = state.sensors.find(s => s.id === 'SN-06');
      if (sumpSensor && sumpSensor.waterLevel < 65) {
        sumpSensor.waterLevel += 2;
        sumpSensor.status = sumpSensor.waterLevel > 30 ? 'CRITICAL' : 'WARNING';
      }
      state.hazards.floodWater.sumpLevelCm = sumpSensor ? sumpSensor.waterLevel : 25;
    }

    // 4. Worker Biometrics
    state.workers.forEach(w => {
      if (w.status === 'SOS' || w.sosActive) {
        w.hr = Math.min(148, Math.max(130, w.hr + Math.floor((Math.random() - 0.45) * 3)));
        w.spO2 = Math.max(90, w.spO2 - (Math.random() > 0.7 ? 1 : 0));
      } else if (w.tagWarning) {
        w.hr = Math.min(118, Math.max(95, w.hr + Math.floor((Math.random() - 0.45) * 2)));
      } else {
        w.hr = Math.min(84, Math.max(68, w.hr + Math.floor((Math.random() - 0.5) * 2)));
      }
    });

    // 5. Update Explainable AI Risk Score
    const aiResult = calculateAIRisk();
    state.overallRisk = aiResult.score;
    state.riskCategory = aiResult.category;
    state.aiRiskData = aiResult;

    // 6. Refresh Pathfinding
    pathfinder.calculateRoutes();
  }

  updateRobotMotion(deltaSec) {
    const r01 = state.robots.r01;
    const r02 = state.robots.r02;
    const activeRobot = (!r01.isFailed && r01.status !== 'OFFLINE') ? r01 : r02;

    // R01 Spidy Scout Motion
    if (r01 && !r01.isFailed && r01.status !== 'OFFLINE') {
      r01.mappedCoverage = Math.min(100, +(r01.mappedCoverage + 0.05 * deltaSec).toFixed(1));
      
      const dx = r01.targetX - r01.x;
      const dy = r01.targetY - r01.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        const speed = (r01.status === 'SPRINTING_TO_INCIDENT' ? 65 : 25) * deltaSec;
        r01.x += (dx / dist) * speed;
        r01.y += (dy / dist) * speed;
      } else {
        if (r01.status === 'SPRINTING_TO_INCIDENT') {
          this.completeSpidyRecon(r01);
        } else {
          // Normal patrol waypoint flipping
          if (r01.targetX === 580) { r01.targetX = 140; r01.targetY = 280; }
          else { r01.targetX = 580; r01.targetY = 410; }
        }
      }
    }

    // R02 Spidy Standby Motion
    if (r02 && r02.status === 'SPRINTING_TO_INCIDENT') {
      const dx = r02.targetX - r02.x;
      const dy = r02.targetY - r02.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        const speed = 75 * deltaSec;
        r02.x += (dx / dist) * speed;
        r02.y += (dy / dist) * speed;
      } else {
        this.completeSpidyRecon(r02);
      }
    }
  }

  completeSpidyRecon(robot) {
    robot.status = 'CONDUCTING_SLAM_RECON';
    const report = state.reconReport;
    report.active = true;
    report.inTransit = false;
    report.assignedRobotId = robot.id;
    report.timestamp = this.formatSimTime(state.simTime);

    // Fetch live environmental telemetry at this node
    const nodeObj = MINE_TOPOGRAPHY.nodes[report.incidentNodeId] || MINE_TOPOGRAPHY.nodes['face_4b'];
    const matchingSensor = state.sensors.find(s => s.x === nodeObj.x && s.y === nodeObj.y) || state.sensors[state.sensors.length - 1];

    report.ch4 = matchingSensor ? matchingSensor.ch4 : 2.45;
    report.temp = matchingSensor ? matchingSensor.temp : 29.8;
    report.humidity = matchingSensor ? matchingSensor.humidity : 82;
    report.co = matchingSensor ? matchingSensor.co : 35;
    report.o2 = matchingSensor ? matchingSensor.o2 : 19.8;

    // Check if human trapped near here
    const nearbyWorker = state.workers.find(w => Math.hypot(w.x - nodeObj.x, w.y - nodeObj.y) < 80);
    if (nearbyWorker) {
      report.humanDetected = true;
      report.humanName = `${nearbyWorker.name} (${nearbyWorker.id})`;
      report.humanStatus = nearbyWorker.status === 'SOS' ? 'TRAPPED_INJURED' : 'CONSCIOUS_AWAITING_EXTRACTION';
    } else {
      report.humanDetected = false;
      report.humanName = 'No Personnel in Blast Radius';
      report.humanStatus = 'CLEAR';
    }

    // Check if Human Rescue Team is allowed to enter without SCBA
    const isGasCrit = report.ch4 > 1.25 || report.co > 50 || report.o2 < 19.5;
    report.rescueTeamAllowed = !isGasCrit;
    report.rescueTeamRationale = isGasCrit 
      ? `Explosive/Toxic gas envelope (CH4: ${report.ch4}% LEL, CO: ${report.co}ppm) exceeds human safety limits. SCBA 60-min mandatory.`
      : `Atmospheric envelope safe for First-Responder Human Rescue Team ingress.`;

    // Compute alternate safe path for trapped worker
    if (nearbyWorker) {
      const evacRoute = pathfinder.calculateWorkerEvacuationRoute(nearbyWorker.id);
      report.alternatePathNodes = evacRoute.pathNodes;
      report.alternatePathName = `Alternate Evacuation Route (via ${evacRoute.pathNodes[2] || 'Shaft 1'})`;
      nearbyWorker.tagRedirectRoute = evacRoute;
    }

    // Calculate Rescue Team Ingress Path
    pathfinder.calculateRescueTeamIngressRoute(report.incidentNodeId);

    soundEngine.playSonarPing();
    this.emitAlert(
      'SPIDY_RECON',
      `🕷️ ${robot.name} Completed SLAM Reconnaissance at ${report.incidentName}`,
      `SLAM Sweep: CH4: ${report.ch4}% LEL | Temp: ${report.temp}°C | Human Found: ${report.humanDetected ? report.humanName : 'None'} | Rescue Ingress: ${report.rescueTeamAllowed ? 'SAFE' : 'SCBA MANDATORY'} | Alternate escape path broadcast to tags.`,
      'warning'
    );
  }

  updateWorkerPositions(deltaSec) {
    state.workers.forEach(w => {
      // If worker has an active evacuation route, step towards the safe exit!
      if (w.tagRedirectRoute && w.tagRedirectRoute.pathNodes && w.tagRedirectRoute.pathNodes.length > 0) {
        w.motion = 'EVACUATING';
        const targetNodeId = w.tagRedirectRoute.pathNodes[1] || 'shaft_top';
        const targetNode = MINE_TOPOGRAPHY.nodes[targetNodeId];
        if (targetNode) {
          const dx = targetNode.x - w.x;
          const dy = targetNode.y - w.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 5) {
            const speed = 18 * deltaSec;
            w.x += (dx / dist) * speed;
            w.y += (dy / dist) * speed;
          }
        }
      } else if (w.status !== 'SOS' && w.motion !== 'MAN_DOWN') {
        // Continuous smooth patrol movement along assigned drift
        w.motion = 'WALKING';
        w.patrolProgress += 0.08 * deltaSec * (w.patrolDir || 1);

        if (w.patrolProgress >= 1.0) {
          w.patrolProgress = 1.0;
          w.patrolDir = -1;
        } else if (w.patrolProgress <= 0.0) {
          w.patrolProgress = 0.0;
          w.patrolDir = 1;
        }

        w.x = w.baseX + (w.patrolTargetX - w.baseX) * w.patrolProgress;
        w.y = w.baseY + (w.patrolTargetY - w.baseY) * w.patrolProgress;
      }
    });
  }

  // =========================================================================
  // Multi-Location Dynamic Scenario Triggers
  // =========================================================================

  triggerGasLeak() {
    state.hazardCycleIdx = (state.hazardCycleIdx + 1) % HAZARD_LOCATIONS.length;
    const loc = HAZARD_LOCATIONS[state.hazardCycleIdx];

    state.hazards.gasPlume.active = true;
    state.hazards.gasPlume.epicenterNodeId = loc.nodeId;
    state.hazards.gasPlume.epicenterX = loc.x;
    state.hazards.gasPlume.epicenterY = loc.y;
    state.hazards.gasPlume.epicenterZ = loc.z;
    state.hazards.gasPlume.level = loc.level;
    state.hazards.gasPlume.sensorId = loc.sensorId;
    state.hazards.gasPlume.radius = 45;
    state.pipelinePhase = 'predict';

    // Spike the specific sensor at this location
    const targetSensor = state.sensors.find(s => s.id === loc.sensorId);
    if (targetSensor) {
      targetSensor.ch4 = 2.48;
      targetSensor.co = 58;
      targetSensor.status = 'CRITICAL';
    }

    // Alert all workers on this level with wearable tag warnings and redirect paths
    state.workers.forEach(w => {
      if (w.level === loc.level || Math.hypot(w.x - loc.x, w.y - loc.y) < 140) {
        w.tagWarning = `⚠️ HAZARD ALERT: Methane Spike (2.48% LEL) at ${loc.name}. Evacuate along redirected green path immediately!`;
        w.tagRedirectRoute = pathfinder.calculateWorkerEvacuationRoute(w.id);
        w.status = 'WARNING';
      }
    });

    // Rapidly dispatch Spidy Scout (or Spidy Standby)
    const spidy = (!state.robots.r01.isFailed && state.robots.r01.status !== 'OFFLINE') ? state.robots.r01 : state.robots.r02;
    spidy.status = 'SPRINTING_TO_INCIDENT';
    spidy.targetX = loc.x;
    spidy.targetY = loc.y;
    spidy.targetZ = loc.z;

    state.reconReport.inTransit = true;
    state.reconReport.incidentNodeId = loc.nodeId;
    state.reconReport.incidentName = loc.name;
    state.reconReport.incidentType = 'METHANE_GAS_OUTBREAK';

    this.emitAlert(
      'ATMOSPHERIC_ALERT',
      `Methane (CH4) Outbreak at ${loc.name}`,
      `CH4 spiked to 2.48% LEL on Sentinel ${loc.sensorId}. Wearable tag warning broadcast to workers. 🕷️ ${spidy.name} dispatched at 2.8 m/s for instant SLAM reconnaissance.`,
      'warning'
    );
  }

  triggerFlood() {
    state.hazards.floodWater.active = true;
    state.hazards.floodWater.inundationRateCmMin = 8.5;
    state.hazards.floodWater.isBlockedL2West = true;
    state.pipelinePhase = 'plan';

    const sumpSensor = state.sensors.find(s => s.id === 'SN-06');
    if (sumpSensor) {
      sumpSensor.waterLevel = 48;
      sumpSensor.status = 'CRITICAL';
    }

    // Alert L2 workers
    state.workers.forEach(w => {
      if (w.level === 'l2') {
        w.tagWarning = `🌊 INUNDATION WARNING: Sump water 48cm deep. Haulage Incline blocked. Rerouting via Shaft 1 Hoist.`;
        w.tagRedirectRoute = pathfinder.calculateWorkerEvacuationRoute(w.id);
        w.status = 'WARNING';
      }
    });

    const spidy = (!state.robots.r01.isFailed && state.robots.r01.status !== 'OFFLINE') ? state.robots.r01 : state.robots.r02;
    spidy.status = 'SPRINTING_TO_INCIDENT';
    spidy.targetX = 150;
    spidy.targetY = 340;

    state.reconReport.inTransit = true;
    state.reconReport.incidentNodeId = 'sump_l2';
    state.reconReport.incidentName = 'Drainage Sump Pump Station (-260m)';
    state.reconReport.incidentType = 'FLASH_FLOOD_INUNDATION';

    this.emitAlert(
      'FLOOD_WARNING',
      'Rapid Inundation in Sub-level 2 Sump',
      `Drainage Sump water level reached 48 cm. Route Beta flagged IMPASSABLE. Redirected safe evacuation path sent to worker tags. 🕷️ ${spidy.name} sprinting to inspect drainage barrier.`,
      'warning'
    );
  }

  triggerWorkerSOS() {
    // Cycle through miners for SOS
    const availableWorkers = state.workers.filter(w => !w.sosActive);
    const targetWorker = availableWorkers.length > 0 ? availableWorkers[Math.floor(Math.random() * availableWorkers.length)] : state.workers[2];

    targetWorker.status = 'SOS';
    targetWorker.sosActive = true;
    targetWorker.motion = 'MAN_DOWN';
    targetWorker.hr = 142;
    targetWorker.spO2 = 91;
    targetWorker.tagWarning = `🚨 EMERGENCY SOS BEACON ACTIVE: Standby for autonomous Spidy recon & surface rescue team ingress.`;
    state.pipelinePhase = 'rescue';
    state.selectedWorkerId = targetWorker.id;

    // Calculate Rescue Team Ingress Path directly to this worker
    pathfinder.calculateRescueTeamIngressRoute(targetWorker.nodeId || 'face_4b');

    // Rapid dispatch Spidy
    const spidy = (!state.robots.r01.isFailed && state.robots.r01.status !== 'OFFLINE') ? state.robots.r01 : state.robots.r02;
    spidy.status = 'SPRINTING_TO_INCIDENT';
    spidy.targetX = targetWorker.x;
    spidy.targetY = targetWorker.y;

    state.reconReport.inTransit = true;
    state.reconReport.incidentNodeId = targetWorker.nodeId || 'face_4b';
    state.reconReport.incidentName = `${targetWorker.name}'s Work Sector (${targetWorker.level.toUpperCase()})`;
    state.reconReport.incidentType = 'PERSONNEL_SOS_INJURY';

    this.emitAlert(
      'CRITICAL_SOS',
      `EMERGENCY SOS: ${targetWorker.name} (${targetWorker.id})`,
      `Man-Down beacon triggered at ${targetWorker.level.toUpperCase()} (${targetWorker.role}). Heart rate 142 BPM. 🕷️ ${spidy.name} sprinting to conduct thermal scan & deliver alternate evacuation path. Surface rescue team ingress route established!`,
      'critical'
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
      'CRITICAL: Spidy Scout R-01 Immobilized by Rockfall',
      'Hardware entrapment in drift. Telemetry lost. Executing Autonomous Failover Protocol to Spidy Standby R-02...',
      'critical'
    );

    // Autonomous Failover Sequence to Spidy Standby R02
    setTimeout(() => {
      r02.status = 'SPRINTING_TO_INCIDENT';
      r02.activeTransfer = true;
      r02.targetX = r01.targetX || 580;
      r02.targetY = r01.targetY || 410;

      this.emitAlert(
        'AI_FAILOVER',
        'Autonomous Handover: Spidy Standby R-02 Deployed',
        'R-02 assumed 100% SLAM recon coordinates from R-01. Sprinting at 3.2 m/s to complete atmospheric analysis & alternate path broadcasting!',
        'warning'
      );
    }, 1000);
  }

  triggerNodeFailure() {
    const candidateSensors = state.sensors.filter(s => s.id !== 'SN-01' && s.status !== 'OFFLINE');
    const targetSensor = candidateSensors.length > 0 ? candidateSensors[Math.floor(Math.random() * candidateSensors.length)] : state.sensors[4];

    targetSensor.status = 'OFFLINE';
    state.pipelinePhase = 'connect';

    state.meshLinks.forEach(link => {
      if (link.from === targetSensor.id || link.to === targetSensor.id) {
        link.active = false;
      }
    });

    this.emitAlert(
      'COMM_FAILOVER',
      `Sentinel Node ${targetSensor.id} (${targetSensor.name}) Link Severed`,
      `LoRa mesh packet drop at ${targetSensor.location}. Decentralized dynamic routing self-healed, bypassing severed link.`,
      'warning'
    );
  }

  restoreSystem() {
    resetState();
    soundEngine.playSuccessFanfare();
    this.emitAlert(
      'SYSTEM_RESET',
      'NEXUS Subterranean Safe Mode Restored',
      'All atmospheric, water, robot, worker wearable tags, and mesh telemetry normalized to nominal baseline.',
      'normal'
    );
  }
}

export const simEngine = new SimulationEngine();

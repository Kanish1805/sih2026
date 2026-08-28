/**
 * NEXUS Real-Time Simulation Engine & Multi-Agent Orchestrator
 * Features:
 * - Dynamic multi-node accident cycling across all 5 subterranean tunnels
 * - Trapped worker stand-in-place behavior during accidents
 * - Strict State Priority for Routes:
 *     * DANGER: RED (Rescue) + GREEN (Evac) routes ONLY (BLACK hidden)
 *     * SOS_ACTIVE: BLACK (Robot -> SOS Worker) route ONLY (RED + GREEN hidden)
 *     * NORMAL: All routes hidden
 * - Autonomous Robot Waypoint Traversal along BLACK route to SOS worker
 * - "WORKER REACHED / ASSISTING WORKER" arrival event & dynamic health panel display
 */

import { state, resetState, MINE_TOPOGRAPHY, HAZARD_LOCATIONS, getRouteVisibilityState } from './state.js';
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

    // 1 Hz Telemetry & Neural Network Risk Inference
    if (this.telemetryAccumulator >= 1.0) {
      this.telemetryAccumulator = 0;
      this.updateTelemetry();
    }

    // 60 FPS Entity Movements (Robots, Moving Un-trapped Workers, Rescue Operations)
    this.updateRobotMotion(deltaSec);
    this.updateWorkerPositions(deltaSec);
    this.updateRescueProgress(deltaSec);
  }

  updateTelemetry() {
    // 1. Natural sensor noise & history tracking across all 13 Sentinel nodes
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

    // 2. Gas Plume Propagation at active accident node
    if (state.hazards.gasPlume.active) {
      const targetSensor = state.sensors.find(s => s.id === state.hazards.gasPlume.sensorId) || state.sensors[state.sensors.length - 1];
      if (targetSensor && targetSensor.ch4 < 2.95) {
        targetSensor.ch4 = +(targetSensor.ch4 + 0.12).toFixed(2);
        targetSensor.co = Math.min(85, targetSensor.co + 3);
        targetSensor.status = targetSensor.ch4 > 1.25 ? 'CRITICAL' : 'WARNING';
      }
      state.hazards.gasPlume.radius = Math.min(state.hazards.gasPlume.maxRadius, state.hazards.gasPlume.radius + 1.5);
    }

    // 3. Flood Water Progression at active sump node
    if (state.hazards.floodWater.active) {
      const sumpSensor = state.sensors.find(s => s.id === (state.hazards.floodWater.sensorId || 'SN-06'));
      if (sumpSensor && sumpSensor.waterLevel < 70) {
        sumpSensor.waterLevel += 2;
        sumpSensor.status = sumpSensor.waterLevel > 30 ? 'CRITICAL' : 'WARNING';
      }
      state.hazards.floodWater.sumpLevelCm = sumpSensor ? sumpSensor.waterLevel : 25;
    }

    // 4. Worker Biometrics Dynamic Updates
    state.workers.forEach(w => {
      if (w.status === 'SOS' || w.sosActive) {
        w.hr = Math.min(154, Math.max(130, w.hr + Math.floor((Math.random() - 0.45) * 3)));
        w.spO2 = Math.max(88, w.spO2 - (Math.random() > 0.7 ? 1 : 0));
        w.temp = +(37.2 + (Math.random() - 0.5) * 0.2).toFixed(1);
      } else if (w.status === 'BEING_ASSISTED') {
        // Stabilizing
        w.hr = Math.max(76, w.hr - 2);
        w.spO2 = Math.min(98, w.spO2 + 1);
        w.temp = +(36.6 + (Math.random() - 0.5) * 0.1).toFixed(1);
      } else if (w.status === 'TRAPPED' || w.status === 'DANGER') {
        w.hr = Math.min(128, Math.max(110, w.hr + Math.floor((Math.random() - 0.45) * 2)));
        w.spO2 = Math.max(93, w.spO2 - (Math.random() > 0.8 ? 1 : 0));
        w.temp = +(36.9 + (Math.random() - 0.5) * 0.1).toFixed(1);
      } else if (w.tagWarning) {
        w.hr = Math.min(112, Math.max(90, w.hr + Math.floor((Math.random() - 0.45) * 2)));
        w.spO2 = Math.min(99, Math.max(95, w.spO2));
        w.temp = +(36.6 + (Math.random() - 0.5) * 0.1).toFixed(1);
      } else {
        w.hr = Math.min(82, Math.max(68, w.hr + Math.floor((Math.random() - 0.5) * 2)));
        w.spO2 = Math.min(99, Math.max(97, w.spO2));
        w.temp = +(36.5 + (Math.random() - 0.5) * 0.1).toFixed(1);
      }
    });

    // 5. Update Backend Neural Network Risk Score
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

    // --- SOS BLACK PATH WAYPOINT TRAVERSAL ---
    if (state.sosBlackPath && state.sosBlackPath.active && !state.sosBlackPath.arrived) {
      const assignedRobot = state.robots[state.sosBlackPath.assignedRobotId] || r01;
      const waypoints = state.sosBlackPath.nodeWaypoints || [];
      const currentIdx = state.sosBlackPath.currentWaypointIdx;

      if (waypoints.length > 0 && currentIdx < waypoints.length) {
        const targetWp = waypoints[currentIdx];
        const dx = targetWp.x - assignedRobot.x;
        const dy = targetWp.y - assignedRobot.y;
        const dist = Math.hypot(dx, dy);

        assignedRobot.status = 'SPRINTING_TO_INCIDENT';
        assignedRobot.mappedCoverage = Math.min(100, +(assignedRobot.mappedCoverage + 0.1 * deltaSec).toFixed(1));

        if (dist > 5) {
          const speed = 85 * deltaSec;
          assignedRobot.x += (dx / dist) * speed;
          assignedRobot.y += (dy / dist) * speed;
          assignedRobot.targetX = targetWp.x;
          assignedRobot.targetY = targetWp.y;
        } else {
          // Advance to next waypoint
          state.sosBlackPath.currentWaypointIdx++;
          if (state.sosBlackPath.currentWaypointIdx >= waypoints.length) {
            // Robot reached the SOS worker!
            this.handleRobotArrivalAtSOSWorker(assignedRobot, state.sosBlackPath.targetWorkerId);
          }
        }
      }
      return;
    }

    // --- NORMAL / DANGER PATROL & SPRINT MOTIONS ---
    // R01 Spidy Scout Motion
    if (r01 && !r01.isFailed && r01.status !== 'OFFLINE') {
      r01.mappedCoverage = Math.min(100, +(r01.mappedCoverage + 0.05 * deltaSec).toFixed(1));

      const dx = r01.targetX - r01.x;
      const dy = r01.targetY - r01.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        const speed = (r01.status === 'SPRINTING_TO_INCIDENT' ? 70 : 25) * deltaSec;
        r01.x += (dx / dist) * speed;
        r01.y += (dy / dist) * speed;
      } else {
        if (r01.status === 'SPRINTING_TO_INCIDENT') {
          this.completeSpidyRecon(r01);
        } else if (r01.status === 'PATROLLING') {
          // Continuous patrolling waypoint flipping across levels
          if (r01.targetX >= 500) { r01.targetX = 160; r01.targetY = 230; }
          else { r01.targetX = 560; r01.targetY = 420; }
        }
      }
    }

    // R02 Spidy Standby Motion
    if (r02 && r02.status === 'SPRINTING_TO_INCIDENT') {
      const dx = r02.targetX - r02.x;
      const dy = r02.targetY - r02.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        const speed = 80 * deltaSec;
        r02.x += (dx / dist) * speed;
        r02.y += (dy / dist) * speed;
      } else {
        this.completeSpidyRecon(r02);
      }
    }
  }

  handleRobotArrivalAtSOSWorker(robot, workerId) {
    state.sosBlackPath.arrived = true;
    robot.status = 'ASSISTING_WORKER';

    const targetWorker = state.workers.find(w => w.id === workerId) || state.workers.find(w => w.sosActive);
    if (targetWorker) {
      targetWorker.status = 'BEING_ASSISTED';
      targetWorker.hr = 88;
      targetWorker.spO2 = 97;
      targetWorker.temp = 36.8;
      targetWorker.motion = 'STAND_STILL';
      targetWorker.tagWarning = `🤖 ROBOT REACHED / ASSISTING WORKER: Automated triage initiated. Telemetry link verified.`;

      // Prominently select worker for Health Panel display
      state.selectedWorkerId = targetWorker.id;

      state.workerReachedAlert = {
        active: true,
        workerId: targetWorker.id,
        workerName: targetWorker.name,
        robotId: robot.id,
        robotName: robot.name,
        timestamp: this.formatSimTime(state.simTime)
      };

      soundEngine.playSuccessFanfare();
      this.emitAlert(
        'WORKER_REACHED',
        `WORKER REACHED / ASSISTING WORKER`,
        `Autonomous Robot ${robot.name} has arrived at ${targetWorker.name}'s position (${targetWorker.id}). Emergency oxygen and vital stabilization deployed!`,
        'normal'
      );
    }
  }

  completeSpidyRecon(robot) {
    robot.status = 'CONDUCTING_SLAM_RECON';
    const report = state.reconReport;
    report.active = true;
    report.inTransit = false;
    report.assignedRobotId = robot.id;
    report.timestamp = this.formatSimTime(state.simTime);

    const nodeObj = MINE_TOPOGRAPHY.nodes[report.incidentNodeId] || MINE_TOPOGRAPHY.nodes['face_4b'];
    const matchingSensor = state.sensors.find(s => s.x === nodeObj.x && s.y === nodeObj.y) || state.sensors[state.sensors.length - 1];

    report.ch4 = matchingSensor ? matchingSensor.ch4 : 2.48;
    report.temp = matchingSensor ? matchingSensor.temp : 29.8;
    report.humidity = matchingSensor ? matchingSensor.humidity : 82;
    report.co = matchingSensor ? matchingSensor.co : 35;
    report.o2 = matchingSensor ? matchingSensor.o2 : 19.8;

    // Check if worker is trapped near this node
    const nearbyWorker = state.workers.find(w => Math.hypot(w.x - nodeObj.x, w.y - nodeObj.y) < 90 || w.nodeId === report.incidentNodeId);
    if (nearbyWorker) {
      nearbyWorker.status = 'TRAPPED';
      nearbyWorker.motion = 'STAND_STILL'; // Trapped worker stands still in place!
      report.humanDetected = true;
      report.humanName = `${nearbyWorker.name} (${nearbyWorker.id})`;
      report.humanStatus = 'TRAPPED_STANDING_STILL_AWAITING_RESCUE';
    } else {
      report.humanDetected = false;
      report.humanName = 'No Personnel in Blast Radius';
      report.humanStatus = 'CLEAR';
    }

    const isGasCrit = report.ch4 > 1.25 || report.co > 50 || report.o2 < 19.5;
    report.rescueTeamAllowed = !isGasCrit;
    report.rescueTeamRationale = isGasCrit
      ? `Explosive/Toxic gas envelope (CH4: ${report.ch4}% LEL, CO: ${report.co}ppm) exceeds human safety limits. SCBA 60-min mandatory for rescue team ingress.`
      : `Atmospheric envelope safe for First-Responder Human Rescue Team ingress.`;

    // Compute RED path (Rescue Team Ingress) and GREEN path (Worker Safe Evacuation)
    if (nearbyWorker) {
      const evacRoute = pathfinder.calculateWorkerEvacuationRoute(nearbyWorker.id);
      report.alternatePathNodes = evacRoute.pathNodes;
      report.alternatePathName = `Safe Evacuation Route (via ${evacRoute.safeExitNode})`;
      nearbyWorker.tagRedirectRoute = evacRoute;
    }

    pathfinder.calculateRescueTeamIngressRoute(report.incidentNodeId, nearbyWorker ? nearbyWorker.id : null);

    soundEngine.playSonarPing();
    this.emitAlert(
      'SPIDY_RECON',
      `🕷️ ${robot.name} Completed SLAM Reconnaissance at ${report.incidentName}`,
      `SLAM Sweep: CH4: ${report.ch4}% LEL | Temp: ${report.temp}°C | Human Found: ${report.humanDetected ? report.humanName : 'None'} | Rescue Ingress RED path established & GREEN escape path broadcast.`,
      'warning'
    );
  }

  updateWorkerPositions(deltaSec) {
    state.workers.forEach(w => {
      // 1. If worker is TRAPPED, SOS, or BEING_ASSISTED, they STAND STILL in place (DO NOT MOVE)
      if (w.status === 'TRAPPED' || w.status === 'SOS' || w.status === 'BEING_ASSISTED' || w.motion === 'STAND_STILL' || w.motion === 'MAN_DOWN') {
        w.motion = 'STAND_STILL'; // Strictly stand in same position
        return;
      }

      // 2. If worker is actively being evacuated
      if (w.status === 'BEING_RESCUED' && w.tagRedirectRoute && w.tagRedirectRoute.pathNodes?.length > 0) {
        w.motion = 'EVACUATING';
        const targetNodeId = w.tagRedirectRoute.safeExitNode || 'portal_a';
        const targetNode = MINE_TOPOGRAPHY.nodes[targetNodeId];
        if (targetNode) {
          const dx = targetNode.x - w.x;
          const dy = targetNode.y - w.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 6) {
            const speed = 24 * deltaSec;
            w.x += (dx / dist) * speed;
            w.y += (dy / dist) * speed;
          } else {
            w.status = 'SAFE';
            w.tagWarning = null;
            w.motion = 'SAFE_AT_NODAL_POINT';
          }
        }
        return;
      }

      // 3. Normal nominal patrol along assigned drift
      if (w.status === 'NORMAL') {
        w.motion = 'WALKING';
        w.patrolProgress += 0.06 * deltaSec * (w.patrolDir || 1);

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

  updateRescueProgress(deltaSec) {
    const rescue = state.rescueTeamRoute;
    if (!rescue || !rescue.active || !rescue.inProgress) return;

    // Advance rescue team along RED route towards trapped worker
    rescue.progressStep += 0.35 * deltaSec;
    const pathNodes = rescue.pathNodes || [];
    const totalSteps = pathNodes.length - 1;

    if (rescue.progressStep >= totalSteps) {
      // Rescue team has reached the trapped worker!
      rescue.inProgress = false;
      const victim = state.workers.find(w => w.id === rescue.targetWorkerId || w.status === 'TRAPPED' || w.status === 'SOS');
      if (victim) {
        victim.status = 'BEING_RESCUED';
        victim.tagWarning = `🚑 RESCUE TEAM CONTACT ESTABLISHED: Proceeding along GREEN route to safe refuge nodal point!`;
        soundEngine.playSuccessFanfare();
        this.emitAlert(
          'RESCUE_CONTACT',
          `Rescue Team Contact Established with ${victim.name}`,
          `First-responders reached victim at ${rescue.destination} via RED route. Extrication initiated; escorting along GREEN route to safe refuge chamber.`,
          'normal'
        );
      }
    }
  }

  // =========================================================================
  // Multi-Node Dynamic Scenario Triggers (Rotates to Different Node Each Time)
  // =========================================================================

  triggerGasLeak() {
    const gasLocations = HAZARD_LOCATIONS.filter(h => h.hazardType === 'GAS');
    state.hazardCycleIdx = (state.hazardCycleIdx + 1) % gasLocations.length;
    const loc = gasLocations[state.hazardCycleIdx];

    // Clear any SOS mode
    state.routeMode = 'DANGER';
    state.activeScenario = 'DANGER';
    state.sosBlackPath.active = false;
    state.workerReachedAlert.active = false;

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

    // Identify worker closest to this incident node -> worker is TRAPPED & STANDS STILL
    let trappedWorker = state.workers.find(w => w.nodeId === loc.nodeId || w.level === loc.level);
    if (!trappedWorker) {
      trappedWorker = state.workers[state.hazardCycleIdx % state.workers.length];
    }

    trappedWorker.status = 'TRAPPED';
    trappedWorker.sosActive = false; // Regular trapped hazard danger
    trappedWorker.motion = 'STAND_STILL'; // Trapped worker stands still in same position!
    trappedWorker.tagWarning = `⚠️ DANGER: Methane Spike (2.48% LEL) at ${loc.name}. Stand still; RED rescue team dispatched & GREEN safe route illuminated!`;
    state.selectedWorkerId = trappedWorker.id;

    // Calculate RED path (Rescue Team Ingress) & GREEN path (Worker Safe Evacuation)
    const evacRoute = pathfinder.calculateWorkerEvacuationRoute(trappedWorker.id);
    trappedWorker.tagRedirectRoute = evacRoute;
    pathfinder.calculateRescueTeamIngressRoute(loc.nodeId, trappedWorker.id);
    state.rescueTeamRoute.active = true;
    state.rescueTeamRoute.inProgress = true;
    state.rescueTeamRoute.progressStep = 0;

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
      `Methane Outbreak at ${loc.name}`,
      `CH4 spiked to 2.48% LEL on Sentinel ${loc.sensorId}. Miner ${trappedWorker.name} trapped in drift (standing in place). RED rescue path & GREEN evacuation route plotted!`,
      'warning'
    );
  }

  triggerFlood() {
    const floodLocations = HAZARD_LOCATIONS.filter(h => h.hazardType === 'FLOOD');
    state.floodCycleIdx = (state.floodCycleIdx + 1) % floodLocations.length;
    const loc = floodLocations[state.floodCycleIdx];

    // Clear any SOS mode
    state.routeMode = 'DANGER';
    state.activeScenario = 'DANGER';
    state.sosBlackPath.active = false;
    state.workerReachedAlert.active = false;

    state.hazards.floodWater.active = true;
    state.hazards.floodWater.epicenterNodeId = loc.nodeId;
    state.hazards.floodWater.epicenterX = loc.x;
    state.hazards.floodWater.epicenterY = loc.y;
    state.hazards.floodWater.epicenterZ = loc.z;
    state.hazards.floodWater.sensorId = loc.sensorId;
    state.hazards.floodWater.inundationRateCmMin = 9.2;
    state.hazards.floodWater.isBlockedL2West = true;
    state.pipelinePhase = 'plan';

    const sumpSensor = state.sensors.find(s => s.id === loc.sensorId);
    if (sumpSensor) {
      sumpSensor.waterLevel = 48;
      sumpSensor.status = 'CRITICAL';
    }

    // Trapped worker on this flooded level stands still
    const affectedWorker = state.workers.find(w => w.level === loc.level) || state.workers[3];
    affectedWorker.status = 'TRAPPED';
    affectedWorker.sosActive = false;
    affectedWorker.motion = 'STAND_STILL'; // Stands still in place!
    affectedWorker.tagWarning = `🌊 INUNDATION WARNING: Water depth 48cm at ${loc.name}. Stand still; Surface rescue team en route!`;

    const evacRoute = pathfinder.calculateWorkerEvacuationRoute(affectedWorker.id);
    affectedWorker.tagRedirectRoute = evacRoute;
    pathfinder.calculateRescueTeamIngressRoute(loc.nodeId, affectedWorker.id);
    state.rescueTeamRoute.active = true;
    state.rescueTeamRoute.inProgress = true;
    state.rescueTeamRoute.progressStep = 0;

    const spidy = (!state.robots.r01.isFailed && state.robots.r01.status !== 'OFFLINE') ? state.robots.r01 : state.robots.r02;
    spidy.status = 'SPRINTING_TO_INCIDENT';
    spidy.targetX = loc.x;
    spidy.targetY = loc.y;

    state.reconReport.inTransit = true;
    state.reconReport.incidentNodeId = loc.nodeId;
    state.reconReport.incidentName = loc.name;
    state.reconReport.incidentType = 'FLASH_FLOOD_INUNDATION';

    this.emitAlert(
      'FLOOD_WARNING',
      `Rapid Inundation at ${loc.name}`,
      `Water level reached 48 cm on Sentinel ${loc.sensorId}. Worker ${affectedWorker.name} trapped. RED rescue ingress path & GREEN safe route established!`,
      'warning'
    );
  }

  triggerWorkerSOS(specificWorkerId = null) {
    let targetWorker = null;
    if (specificWorkerId) {
      targetWorker = state.workers.find(w => w.id === specificWorkerId);
    }
    if (!targetWorker) {
      const availableWorkers = state.workers.filter(w => !w.sosActive);
      targetWorker = availableWorkers.length > 0 ? availableWorkers[Math.floor(Math.random() * availableWorkers.length)] : state.workers[6];
    }

    // Immediately switch application state to SOS_ACTIVE
    state.routeMode = 'SOS_ACTIVE';
    state.activeScenario = 'SOS_ACTIVE';
    state.pipelinePhase = 'rescue';
    state.workerReachedAlert.active = false;

    // Immediately hide RED and GREEN routes
    state.rescueTeamRoute.active = false;
    state.rescueTeamRoute.inProgress = false;

    targetWorker.status = 'SOS';
    targetWorker.sosActive = true;
    targetWorker.motion = 'STAND_STILL'; // Trapped worker stands still in place!
    targetWorker.hr = 144;
    targetWorker.spO2 = 91;
    targetWorker.temp = 37.4;
    targetWorker.tagWarning = `🚨 EMERGENCY SOS BEACON ACTIVE: Stand still; robot dispatched along BLACK route!`;
    state.selectedWorkerId = targetWorker.id;

    // Choose nearest active available robot
    const robotKey = (!state.robots.r01.isFailed && state.robots.r01.status !== 'OFFLINE') ? 'r01' : 'r02';
    const chosenRobot = state.robots[robotKey];

    // Calculate BLACK Route: Robot -> SOS Worker
    const blackRoute = pathfinder.calculateRobotToWorkerRoute(robotKey, targetWorker.id);
    state.sosBlackPath = blackRoute;

    // Dispatch chosen robot along BLACK route
    chosenRobot.status = 'SPRINTING_TO_INCIDENT';
    chosenRobot.targetX = targetWorker.x;
    chosenRobot.targetY = targetWorker.y;
    chosenRobot.targetZ = targetWorker.z;

    state.reconReport.inTransit = true;
    state.reconReport.incidentNodeId = targetWorker.nodeId || 'face_4b';
    state.reconReport.incidentName = `${targetWorker.name}'s Sector (${targetWorker.level.toUpperCase()})`;
    state.reconReport.incidentType = 'PERSONNEL_SOS_INJURY';

    this.emitAlert(
      'CRITICAL_SOS',
      `EMERGENCY SOS: ${targetWorker.name} (${targetWorker.id})`,
      `Man-Down beacon triggered at ${targetWorker.level.toUpperCase()} (${targetWorker.role}). BLACK rescue route established; ${chosenRobot.name} navigating to victim.`,
      'critical'
    );
  }

  triggerRobotFailure() {
    const r01 = state.robots.r01;
    const r02 = state.robots.r02;

    r01.isFailed = true;
    r01.status = 'FAILED';
    r01.failureReason = 'Rockfall impact jam / Telemetry Link Interrupted';

    this.emitAlert(
      'ROBOT_FAILURE',
      'CRITICAL: Spidy Scout R-01 Immobilized by Rockfall',
      'Hardware entrapment in drift. Telemetry lost. Executing Autonomous Failover Protocol to Spidy Standby R-02...',
      'critical'
    );

    setTimeout(() => {
      r02.status = 'SPRINTING_TO_INCIDENT';
      r02.activeTransfer = true;
      r02.targetX = r01.targetX || 560;
      r02.targetY = r01.targetY || 420;

      // If in SOS mode, redirect black route with R-02
      if (state.routeMode === 'SOS_ACTIVE' && state.sosBlackPath.active) {
        const targetWorkerId = state.sosBlackPath.targetWorkerId || state.selectedWorkerId;
        pathfinder.calculateRobotToWorkerRoute('r02', targetWorkerId);
      }

      this.emitAlert(
        'AI_FAILOVER',
        'Autonomous Handover: Spidy Standby R-02 Deployed',
        'R-02 assumed 100% SLAM recon coordinates. Sprinting at 3.2 m/s to complete atmospheric sweep & route broadcasting!',
        'warning'
      );
    }, 1000);
  }

  restoreSystem() {
    resetState();
    soundEngine.playSuccessFanfare();
    this.emitAlert(
      'SYSTEM_RESET',
      'NEXUS Subterranean Safe Mode Restored',
      'All 5 subterranean tunnels, atmospheric, water, robot, 16 worker bio-tags, and 13 mesh nodes normalized to baseline.',
      'normal'
    );
  }
}

export const simEngine = new SimulationEngine();


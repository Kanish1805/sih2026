/**
 * NEXUS Tactical Scenario Demonstration Tour Mode (Light Theme)
 * 6-Stage Interactive Narrative Storyline
 */

import confetti from 'canvas-confetti';
import { state } from '../engine/state.js';
import { simEngine } from '../engine/simulation.js';
import { soundEngine } from '../engine/sound_engine.js';

export class PresentationTour {
  constructor(options = {}) {
    this.tourBar = document.getElementById('presentationTourBar');
    this.stageNameEl = document.getElementById('tourStageName');
    this.narrativeEl = document.getElementById('tourNarrativeText');
    this.keyPointEl = document.getElementById('tourKeyPoint');
    this.dotsEl = document.getElementById('tourDots');
    this.onSwitchModule = options.onSwitchModule || (() => {});
    this.onOpenDebrief = options.onOpenDebrief || (() => {});

    this.currentStage = 0;
    this.autoPlayTimer = null;
    this.isAutoPlaying = false;

    this.stages = [
      {
        id: 1,
        phase: 'sense',
        title: 'Stage 1: SENSE & CONNECT – Decentralized Subterranean Mesh',
        module: 'overview',
        narrative: 'NEXUS maintains continuous synchronized telemetry across 6 miners, 8 multi-gas sentinels, and Scout Robot R01 in deep Sub-level 3 (-380m).',
        keyPoint: 'Zero single point of failure: decentralized LoRa mesh self-organizes without surface internet.',
        action: () => {
          simEngine.restoreSystem();
          state.pipelinePhase = 'sense';
        }
      },
      {
        id: 2,
        phase: 'understand',
        title: 'Stage 2: UNDERSTAND – Methane Hazard & Explainable AI',
        module: 'airisk',
        narrative: 'Methane (CH4) spikes to 2.45% LEL at Extraction Face 4B. The Explainable AI (XAI) engine decomposes atmospheric, hydrological, and geotechnical risks in real time.',
        keyPoint: 'XAI outputs plain-English causal rationales with confidence scores, eliminating black-box false alarms.',
        action: () => {
          simEngine.triggerGasLeak();
          state.pipelinePhase = 'understand';
        }
      },
      {
        id: 3,
        phase: 'predict',
        title: 'Stage 3: PREDICT & PLAN – Worker SOS & Dynamic A* Routing',
        module: 'routes',
        narrative: 'Worker W-03 (Rajesh Kumar) triggers an emergency SOS with heart rate 138 BPM. The pathfinder calculates 3 routes, selecting Route Alpha as the safest evacuation path.',
        keyPoint: 'Multi-criteria optimization routes miners away from toxic gas eddys and rising drainage floods.',
        action: () => {
          simEngine.triggerWorkerSOS();
          state.pipelinePhase = 'plan';
        }
      },
      {
        id: 4,
        phase: 'rescue',
        title: 'Stage 4: RESCUE – Scout Robot R01 Autonomous Reconnaissance',
        module: 'robots',
        narrative: 'Agile Hexapod Scout R01 (Arachne-1) navigates ahead with 360° RPLiDAR and FLIR thermal camera to establish victim contact and verify drift stability.',
        keyPoint: 'Autonomous robotic SLAM mapping operates in zero-visibility and high-dust atmospheres.',
        action: () => {
          state.robots.r01.status = 'DISPATCHED';
          state.pipelinePhase = 'rescue';
        }
      },
      {
        id: 5,
        phase: 'rescue',
        title: 'Stage 5: FAILOVER RESILIENCE – Robot Jam & Autonomous Handover',
        module: 'overview',
        narrative: 'Simulated rockfall immobilizes Scout R01. Instantly, NEXUS detects telemetry loss, triggers failover, and commands Heavy Rescuer R02 Titan to inherit the mission!',
        keyPoint: 'True autonomous resilience: no single robot failure halts the subterranean rescue operation.',
        action: () => {
          simEngine.triggerRobotFailure();
          state.pipelinePhase = 'rescue';
        }
      },
      {
        id: 6,
        phase: 'recover',
        title: 'Stage 6: RECOVER – Safe Extraction & Post-Incident Debrief',
        module: 'alerts',
        narrative: 'R02 Titan delivers emergency O2 and safely extricates Worker W-03 to Surface Portal A. Full mission data is compiled into an audit-ready post-incident debrief report.',
        keyPoint: 'Complete lifecycle demonstration: SENSE → CONNECT → UNDERSTAND → PREDICT → PLAN → RESCUE → RECOVER.',
        action: () => {
          state.pipelinePhase = 'recover';
          soundEngine.playSuccessFanfare();
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }
      }
    ];

    this.bindEvents();
  }

  start() {
    this.currentStage = 0;
    if (this.tourBar) this.tourBar.style.display = 'flex';
    this.goToStage(0);
  }

  stop() {
    if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);
    this.isAutoPlaying = false;
    if (this.tourBar) this.tourBar.style.display = 'none';
  }

  goToStage(index) {
    if (index < 0 || index >= this.stages.length) return;
    this.currentStage = index;
    const stage = this.stages[index];

    if (this.stageNameEl) this.stageNameEl.textContent = stage.title;
    if (this.narrativeEl) this.narrativeEl.textContent = stage.narrative;
    if (this.keyPointEl) {
      this.keyPointEl.innerHTML = `<strong>Architectural Takeaway:</strong> ${stage.keyPoint}`;
    }

    if (this.dotsEl) {
      const dots = this.dotsEl.querySelectorAll('.tour-dot');
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    stage.action();
    this.onSwitchModule(stage.module);
    soundEngine.playSonarPing();
  }

  next() {
    if (this.currentStage < this.stages.length - 1) {
      this.goToStage(this.currentStage + 1);
    } else {
      this.stop();
    }
  }

  prev() {
    if (this.currentStage > 0) {
      this.goToStage(this.currentStage - 1);
    }
  }

  toggleAutoPlay() {
    this.isAutoPlaying = !this.isAutoPlaying;
    const autoBtn = document.getElementById('btnTourAutoPlay');
    if (this.isAutoPlaying) {
      if (autoBtn) autoBtn.innerHTML = '<i data-lucide="pause"></i> Pause Tour';
      this.autoPlayTimer = setInterval(() => {
        if (this.currentStage < this.stages.length - 1) {
          this.next();
        } else {
          this.stop();
        }
      }, 7000);
    } else {
      if (autoBtn) autoBtn.innerHTML = '<i data-lucide="play"></i> Auto Play';
      if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);
    }
  }

  bindEvents() {
    const btnNext = document.getElementById('btnTourNext');
    const btnPrev = document.getElementById('btnTourPrev');
    const btnAuto = document.getElementById('btnTourAutoPlay');
    const btnExit = document.getElementById('btnTourExit');
    const btnLaunch = document.getElementById('btnTourLaunch');

    if (btnNext) btnNext.onclick = () => this.next();
    if (btnPrev) btnPrev.onclick = () => this.prev();
    if (btnAuto) btnAuto.onclick = () => this.toggleAutoPlay();
    if (btnExit) btnExit.onclick = () => this.stop();
    if (btnLaunch) btnLaunch.onclick = () => this.start();

    if (this.dotsEl) {
      const dots = this.dotsEl.querySelectorAll('.tour-dot');
      dots.forEach((d, i) => {
        d.onclick = () => this.goToStage(i);
      });
    }
  }
}

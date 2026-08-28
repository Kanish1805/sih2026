/**
 * NEXUS Tactical Scenario Demonstration Tour Mode
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
    this.onSwitchModule = options.onSwitchModule || (() => { });
    this.onOpenDebrief = options.onOpenDebrief || (() => { });

    this.currentStage = 0;
    this.autoPlayTimer = null;
    this.isAutoPlaying = false;

    this.stages = [
      {
        id: 1,
        phase: 'sense',
        title: 'Stage 1: SENSE & CONNECT – 5 Subterranean Tunnels & 16 Miners',
        module: 'overview',
        narrative: 'NEXUS maintains continuous telemetry across 16 moving Indian miners, 13 multi-gas sentinels, and Spidy Scout Robot R01 traversing across 5 subterranean tunnels down to -580m.',
        keyPoint: 'Zero single point of failure: decentralized LoRa mesh self-organizes without surface internet.',
        action: () => {
          simEngine.restoreSystem();
          state.pipelinePhase = 'sense';
        }
      },
      {
        id: 2,
        phase: 'understand',
        title: 'Stage 2: UNDERSTAND – Danger Mode: RED & GREEN Routes Only',
        module: 'sensors',
        narrative: 'Methane (CH4) spikes at a rotating extraction heading. In Danger Mode, only RED (Rescue Route) and GREEN (Safe Evacuation Route) are displayed, while BLACK is strictly hidden.',
        keyPoint: 'Neural network risk model evaluates real-time atmospheric toxicity and geotechnical stability.',
        action: () => {
          simEngine.triggerGasLeak();
          state.pipelinePhase = 'understand';
        }
      },
      {
        id: 3,
        phase: 'predict',
        title: 'Stage 3: PREDICT & PLAN – SOS Mode: BLACK Route & Autonomous Robot Dispatch',
        module: 'routes',
        narrative: 'Miner triggers emergency SOS. NEXUS immediately activates SOS Mode: RED and GREEN routes are hidden, and ONLY the BLACK route is displayed as the robot navigates to the worker.',
        keyPoint: 'Strict State Priority ensures no mixed routes are displayed. Autonomous robot reaches victim and displays WORKER REACHED / ASSISTING WORKER.',
        action: () => {
          simEngine.triggerWorkerSOS();
          state.pipelinePhase = 'plan';
        }
      },
      {
        id: 4,
        phase: 'rescue',
        title: 'Stage 4: RESCUE – Realistic Spidy Scout Rapid Reconnaissance & SLAM',
        module: 'robots',
        narrative: 'Hexapod Spidy Scout R01 sprints at 2.8 m/s with realistic articulated 3-DOF leg kinematics, executes 360° RPLiDAR SLAM sweep, verifies victim presence via thermal IR, and clears human rescue entry.',
        keyPoint: 'Rapid robotic recon prevents sending human rescuers into toxic or explosive atmospheres blindly.',
        action: () => {
          state.pipelinePhase = 'rescue';
        }
      },
      {
        id: 5,
        phase: 'rescue',
        title: 'Stage 5: FAILOVER RESILIENCE – Spidy 1 Jam & Spidy Standby Handover',
        module: 'overview',
        narrative: 'Simulated rockfall immobilizes Spidy 1. Instantly, Spidy Standby R-02 activates, assumes 100% SLAM coordinates, and deploys to deliver alternate escape paths!',
        keyPoint: 'True autonomous robotics redundancy: identical hexapod kinematics ensure zero mission downtime.',
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
        narrative: 'Trapped personnel safely reach the safe refuge chamber / portal. Full mission data is compiled into an audit-ready post-incident debrief report.',
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

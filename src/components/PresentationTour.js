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
        narrative: 'NEXUS maintains continuous telemetry across 6 moving miners, 8 multi-gas sentinels, and Spidy Scout Robot R01 traversing Sub-level 3 (-380m).',
        keyPoint: 'Zero single point of failure: decentralized LoRa mesh self-organizes without surface internet.',
        action: () => {
          simEngine.restoreSystem();
          state.pipelinePhase = 'sense';
        }
      },
      {
        id: 2,
        phase: 'understand',
        title: 'Stage 2: UNDERSTAND – Multi-Location Hazard & Wearable Tag Alerts',
        module: 'airisk',
        narrative: 'Methane (CH4) spikes at the active extraction drift. Wearable bio-tags instantly alert nearby miners and broadcast redirected safe escape routes.',
        keyPoint: 'Statutory threshold limits (CH4 < 0.75% LEL) enforce automated instantaneous warnings.',
        action: () => {
          simEngine.triggerGasLeak();
          state.pipelinePhase = 'understand';
        }
      },
      {
        id: 3,
        phase: 'predict',
        title: 'Stage 3: PREDICT & PLAN – Worker SOS & Dual Route Planning',
        module: 'routes',
        narrative: 'Miner triggers emergency SOS. NEXUS pathfinder simultaneously computes the Miner Evacuation Egress Path and the First-Responder Surface Rescue Team Ingress Path.',
        keyPoint: 'Dual-path trajectory ensures victims evacuate safely while rescue teams ingress with mandatory PPE guidance.',
        action: () => {
          simEngine.triggerWorkerSOS();
          state.pipelinePhase = 'plan';
        }
      },
      {
        id: 4,
        phase: 'rescue',
        title: 'Stage 4: RESCUE – Spidy Scout R-01 Rapid Reconnaissance & SLAM',
        module: 'robots',
        narrative: 'Hexapod Spidy Scout R01 sprints at 2.8 m/s to the incident sector, executes 360° RPLiDAR SLAM sweep, verifies victim presence via thermal IR, and assesses human rescue team feasibility.',
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
        narrative: 'Trapped personnel safely evacuate along Route Alpha to Surface Portal A. Full mission data is compiled into an audit-ready post-incident debrief report.',
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

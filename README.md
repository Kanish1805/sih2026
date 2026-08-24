# NEXUS – AI-Powered Underground Rescue Network
### Industrial Mine Safety & Autonomous Decentralized Command Platform

NEXUS is an AI-powered, decentralized underground mine safety and emergency rescue simulation platform. It integrates IoT bio-telemetry, multi-gas sentinel nodes, autonomous robotics reconnaissance, explainable AI hazard prediction, dynamic multi-hazard pathfinding, and a persistent 2D/3D subterranean digital twin command center.

---

## 🌟 Key Features

- **Persistent Subterranean Command Viewport**:
  - **2D Tactical Vector Map**: Real-time canvas SLAM map with live on-map anomaly callout badges (`[🚨 SOS]`, `[⚠️ METHANE LEAK]`, `[🌊 FLOOD]`, `[R01 JAMMED]`).
  - **3D Holographic Digital Twin**: Three.js subterranean digital twin with semi-transparent illuminated drifts, floating 3D text billboards, and vertical elevator hoist.
- **3D Hexapod Spider Robot (`R-01 Arachne`)**:
  - Articulated 6-leg spider robot with realistic alternating tripod crawling gait, natural body bobbing, and top rotating 360° RPLiDAR scanner.
  - Autonomous failover handover to Heavy Rescuer `R-02 Titan`.
- **Decentralized LoRa/UWB Mesh Topology**:
  - Dynamic multi-hop relay simulation operating without surface internet dependencies.
- **Explainable AI (XAI) Risk Engine**:
  - Multi-factor hazard risk quantification with plain-English causal rationales and confidence scoring.
- **Dynamic Multi-Hazard A* Route Planner**:
  - Instant calculation and comparison of 3 evacuation routes (Safest, Direct, Backup) avoiding gas plumes and water inundation.
- **Worker Bio-Telemetry Grid**:
  - Real-time simulated heart rate (BPM), blood oxygen (SpO2), fall detection, and live animated ECG waveforms.
- **Tactile Web Audio Feedback**:
  - Procedural Web Audio synthesizer delivering tactile clicks, sonar pings, hazard alarms, and radio squelch tones.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`

### Installation & Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/Kanish1805/sih2026.git
cd sih2026

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## 📦 Build for Production

```bash
npm run build
npm run preview
```

---

## 🛠️ Technology Stack

- **Core**: HTML5, Vanilla JavaScript (ES6+ Modules)
- **Styling**: Vanilla CSS (Light Industrial Command Center Theme)
- **3D Engine**: [Three.js](https://threejs.org/)
- **Icons**: [Lucide](https://lucide.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Visual Effects**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)

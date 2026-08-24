/**
 * NEXUS Global State & Subterranean Topography Definition
 * Real-Time Digital Twin, Multi-Location Hazards, Spidy Recon, and Statutory Thresholds
 */

export const STATUTORY_LIMITS = {
  ch4: { label: 'Methane (CH4)', unit: '% LEL', safe: '< 0.75%', warn: '0.75 - 1.25%', crit: '> 1.25%', maxSafe: 0.75, critThreshold: 1.25 },
  o2: { label: 'Oxygen (O2)', unit: '%', safe: '19.5 - 23.5%', warn: '18.0 - 19.5%', crit: '< 18.0%', minSafe: 19.5, minCrit: 18.0 },
  co: { label: 'Carbon Monoxide (CO)', unit: 'ppm', safe: '< 25 ppm', warn: '25 - 50 ppm', crit: '> 50 ppm', maxSafe: 25, critThreshold: 50 },
  temp: { label: 'Temperature', unit: '°C', safe: '< 32°C', warn: '32 - 38°C', crit: '> 38°C', maxSafe: 32, critThreshold: 38 },
  humidity: { label: 'Relative Humidity', unit: '%', safe: '40 - 70%', warn: '70 - 85%', crit: '> 85%', maxSafe: 70, critThreshold: 85 },
  waterLevel: { label: 'Water Ingress', unit: 'cm', safe: '< 15 cm', warn: '15 - 30 cm', crit: '> 30 cm', maxSafe: 15, critThreshold: 30 },
  vibration: { label: 'Seismic Strain', unit: 'mm/s', safe: '< 0.30 mm/s', warn: '0.30 - 0.70 mm/s', crit: '> 0.70 mm/s', maxSafe: 0.30, critThreshold: 0.70 }
};

export const MINE_TOPOGRAPHY = {
  levels: [
    { id: 'l0', name: 'Surface Access', depth: 0, color: '#94a3b8' },
    { id: 'l1', name: 'Sub-level 1 (Ventilation Drift)', depth: -120, color: '#38bdf8' },
    { id: 'l2', name: 'Sub-level 2 (Haulage & Sump)', depth: -240, color: '#fbbf24' },
    { id: 'l3', name: 'Sub-level 3 (Face 4B & Refuge)', depth: -380, color: '#f87171' }
  ],
  nodes: {
    'portal_a': { id: 'portal_a', name: 'Surface Portal Entry', x: 120, y: 70, z: 0, level: 'l0', type: 'portal' },
    'shaft_top': { id: 'shaft_top', name: 'Shaft 1 Collar', x: 320, y: 70, z: 0, level: 'l0', type: 'shaft' },
    'shaft_l1': { id: 'shaft_l1', name: 'Shaft 1 (L1 Station)', x: 320, y: 170, z: -120, level: 'l1', type: 'shaft' },
    'junc_l1_w': { id: 'junc_l1_w', name: 'L1 Substation West', x: 140, y: 170, z: -120, level: 'l1', type: 'junction' },
    'junc_l1_e': { id: 'junc_l1_e', name: 'L1 Ventilation Crosscut', x: 500, y: 170, z: -120, level: 'l1', type: 'junction' },
    'shaft_l2': { id: 'shaft_l2', name: 'Shaft 1 (L2 Station)', x: 320, y: 280, z: -240, level: 'l2', type: 'shaft' },
    'junc_l2_w': { id: 'junc_l2_w', name: 'L2 Haulage Junction West', x: 150, y: 280, z: -240, level: 'l2', type: 'junction' },
    'sump_l2': { id: 'sump_l2', name: 'Drainage Sump Pump Station', x: 150, y: 340, z: -260, level: 'l2', type: 'hazard_zone' },
    'junc_l2_e': { id: 'junc_l2_e', name: 'L2 Ore Chute East', x: 520, y: 280, z: -240, level: 'l2', type: 'junction' },
    'shaft_l3': { id: 'shaft_l3', name: 'Shaft 1 (L3 Deep Station)', x: 320, y: 410, z: -380, level: 'l3', type: 'shaft' },
    'junc_l3_w': { id: 'junc_l3_w', name: 'L3 Survey Crosscut', x: 130, y: 410, z: -380, level: 'l3', type: 'junction' },
    'refuge_chamber': { id: 'refuge_chamber', name: 'Reinforced Refuge Chamber', x: 420, y: 410, z: -380, level: 'l3', type: 'refuge' },
    'face_4b': { id: 'face_4b', name: 'Extraction Face 4B (Active Heading)', x: 580, y: 410, z: -380, level: 'l3', type: 'face' }
  },
  edges: [
    { from: 'portal_a', to: 'shaft_top', length: 200, slope: 'horizontal' },
    { from: 'shaft_top', to: 'shaft_l1', length: 120, slope: 'vertical_shaft' },
    { from: 'shaft_l1', to: 'junc_l1_w', length: 180, slope: 'drift' },
    { from: 'shaft_l1', to: 'junc_l1_e', length: 180, slope: 'drift' },
    { from: 'junc_l1_e', to: 'junc_l2_e', length: 160, slope: 'vent_incline' },
    { from: 'shaft_l1', to: 'shaft_l2', length: 120, slope: 'vertical_shaft' },
    { from: 'shaft_l2', to: 'junc_l2_w', length: 170, slope: 'drift' },
    { from: 'junc_l2_w', to: 'sump_l2', length: 70, slope: 'decline' },
    { from: 'shaft_l2', to: 'junc_l2_e', length: 200, slope: 'drift' },
    { from: 'shaft_l2', to: 'shaft_l3', length: 140, slope: 'vertical_shaft' },
    { from: 'shaft_l3', to: 'junc_l3_w', length: 190, slope: 'drift' },
    { from: 'shaft_l3', to: 'refuge_chamber', length: 100, slope: 'drift' },
    { from: 'refuge_chamber', to: 'face_4b', length: 160, slope: 'heading' }
  ]
};

export const HAZARD_LOCATIONS = [
  { nodeId: 'face_4b', name: 'Extraction Face 4B (Sub-level 3 -380m)', x: 580, y: 410, z: -380, level: 'l3', sensorId: 'SN-08' },
  { nodeId: 'junc_l1_e', name: 'L1 Ventilation East Drift (-120m)', x: 500, y: 170, z: -120, level: 'l1', sensorId: 'SN-04' },
  { nodeId: 'junc_l2_w', name: 'L2 Haulage Junction West (-240m)', x: 150, y: 280, z: -240, level: 'l2', sensorId: 'SN-05' },
  { nodeId: 'junc_l3_w', name: 'L3 Survey Crosscut (-380m)', x: 130, y: 410, z: -380, level: 'l3', sensorId: 'SN-07' },
  { nodeId: 'sump_l2', name: 'Drainage Sump Basin (-260m)', x: 150, y: 340, z: -260, level: 'l2', sensorId: 'SN-06' },
  { nodeId: 'junc_l1_w', name: 'L1 Substation West (-120m)', x: 140, y: 170, z: -120, level: 'l1', sensorId: 'SN-03' }
];

export const INITIAL_STATE = {
  simTime: 0,
  speed: 1,
  isRunning: true,
  overallRisk: 12, // 0 - 100
  riskCategory: 'SAFE', // SAFE, WARNING, HIGH_RISK, CRITICAL
  hazardCycleIdx: 0,
  selectedWorkerId: null,

  workers: [
    {
      id: 'W-01',
      name: 'Marcus Chen',
      role: 'Shift Lead Supervisor',
      level: 'l1',
      nodeId: 'shaft_l1',
      x: 320, y: 170, z: -120,
      baseX: 320, baseY: 170, baseZ: -120,
      patrolTargetX: 200, patrolTargetY: 170,
      patrolProgress: 0.1,
      patrolDir: 1,
      hr: 74,
      spO2: 98,
      temp: 36.6,
      motion: 'WALKING',
      battery: 92,
      rssi: -72,
      status: 'NORMAL', // NORMAL, WARNING, TRAPPED, SOS, SAFE
      sosActive: false,
      tagWarning: null, // Active message received on wearable tag
      tagRedirectRoute: null,
      tagUptime: '04h 12m'
    },
    {
      id: 'W-02',
      name: 'Sarah Jenkins',
      role: 'Hydraulic Drill Operator',
      level: 'l2',
      nodeId: 'junc_l2_w',
      x: 180, y: 280, z: -240,
      baseX: 150, baseY: 280, baseZ: -240,
      patrolTargetX: 280, patrolTargetY: 280,
      patrolProgress: 0.3,
      patrolDir: 1,
      hr: 82,
      spO2: 97,
      temp: 36.8,
      motion: 'WALKING',
      battery: 88,
      rssi: -78,
      status: 'NORMAL',
      sosActive: false,
      tagWarning: null,
      tagRedirectRoute: null,
      tagUptime: '04h 12m'
    },
    {
      id: 'W-03',
      name: 'Rajesh Kumar',
      role: 'Senior Blaster & Face Tech',
      level: 'l3',
      nodeId: 'face_4b',
      x: 560, y: 410, z: -380,
      baseX: 440, baseY: 410, baseZ: -380,
      patrolTargetX: 580, patrolTargetY: 410,
      patrolProgress: 0.8,
      patrolDir: -1,
      hr: 86,
      spO2: 96,
      temp: 37.1,
      motion: 'WALKING',
      battery: 84,
      rssi: -84,
      status: 'NORMAL',
      sosActive: false,
      tagWarning: null,
      tagRedirectRoute: null,
      tagUptime: '04h 12m'
    },
    {
      id: 'W-04',
      name: 'Alexei Volkov',
      role: 'Haulage Loader Operator',
      level: 'l2',
      nodeId: 'junc_l2_e',
      x: 480, y: 280, z: -240,
      baseX: 350, baseY: 280, baseZ: -240,
      patrolTargetX: 520, patrolTargetY: 280,
      patrolProgress: 0.5,
      patrolDir: 1,
      hr: 78,
      spO2: 98,
      temp: 36.5,
      motion: 'WALKING',
      battery: 94,
      rssi: -69,
      status: 'NORMAL',
      sosActive: false,
      tagWarning: null,
      tagRedirectRoute: null,
      tagUptime: '04h 12m'
    },
    {
      id: 'W-05',
      name: "David O'Connor",
      role: 'Substation Electrical Tech',
      level: 'l1',
      nodeId: 'junc_l1_w',
      x: 180, y: 170, z: -120,
      baseX: 140, baseY: 170, baseZ: -120,
      patrolTargetX: 300, patrolTargetY: 170,
      patrolProgress: 0.4,
      patrolDir: -1,
      hr: 71,
      spO2: 99,
      temp: 36.4,
      motion: 'WALKING',
      battery: 96,
      rssi: -65,
      status: 'NORMAL',
      sosActive: false,
      tagWarning: null,
      tagRedirectRoute: null,
      tagUptime: '04h 12m'
    },
    {
      id: 'W-06',
      name: 'Priya Sharma',
      role: 'Mine Geotechnical Surveyor',
      level: 'l3',
      nodeId: 'junc_l3_w',
      x: 170, y: 410, z: -380,
      baseX: 130, baseY: 410, baseZ: -380,
      patrolTargetX: 300, patrolTargetY: 410,
      patrolProgress: 0.2,
      patrolDir: 1,
      hr: 75,
      spO2: 98,
      temp: 36.7,
      motion: 'WALKING',
      battery: 90,
      rssi: -81,
      status: 'NORMAL',
      sosActive: false,
      tagWarning: null,
      tagRedirectRoute: null,
      tagUptime: '04h 12m'
    }
  ],

  sensors: [
    {
      id: 'SN-01',
      name: 'Surface Portal Base Node',
      location: 'Portal Entry (0m)',
      level: 'l0',
      x: 120, y: 70, z: 0,
      ch4: 0.02,
      co: 2,
      h2s: 0.1,
      o2: 20.9,
      temp: 22.4,
      humidity: 58,
      waterLevel: 0,
      vibration: 0.12,
      battery: 100,
      status: 'NORMAL',
      meshHops: 0,
      history: { ch4: [0.02], co: [2], water: [0], risk: [5] }
    },
    {
      id: 'SN-02',
      name: 'Shaft Collar Node',
      location: 'Shaft 1 Collar (0m)',
      level: 'l0',
      x: 320, y: 70, z: 0,
      ch4: 0.05,
      co: 4,
      h2s: 0.2,
      o2: 20.8,
      temp: 23.1,
      humidity: 62,
      waterLevel: 0,
      vibration: 0.24,
      battery: 98,
      status: 'NORMAL',
      meshHops: 1,
      history: { ch4: [0.05], co: [4], water: [0], risk: [7] }
    },
    {
      id: 'SN-03',
      name: 'L1 Substation Sentinel',
      location: 'Sub-level 1 West (-120m)',
      level: 'l1',
      x: 140, y: 170, z: -120,
      ch4: 0.08,
      co: 6,
      h2s: 0.3,
      o2: 20.7,
      temp: 24.5,
      humidity: 68,
      waterLevel: 2,
      vibration: 0.31,
      battery: 95,
      status: 'NORMAL',
      meshHops: 2,
      history: { ch4: [0.08], co: [6], water: [2], risk: [10] }
    },
    {
      id: 'SN-04',
      name: 'L1 Ventilation Node',
      location: 'Sub-level 1 East (-120m)',
      level: 'l1',
      x: 500, y: 170, z: -120,
      ch4: 0.12,
      co: 8,
      h2s: 0.4,
      o2: 20.6,
      temp: 25.2,
      humidity: 71,
      waterLevel: 0,
      vibration: 0.28,
      battery: 93,
      status: 'NORMAL',
      meshHops: 2,
      history: { ch4: [0.12], co: [8], water: [0], risk: [12] }
    },
    {
      id: 'SN-05',
      name: 'L2 Haulage Junction Node',
      location: 'Sub-level 2 Station (-240m)',
      level: 'l2',
      x: 320, y: 280, z: -240,
      ch4: 0.18,
      co: 11,
      h2s: 0.6,
      o2: 20.5,
      temp: 26.8,
      humidity: 76,
      waterLevel: 5,
      vibration: 0.45,
      battery: 91,
      status: 'NORMAL',
      meshHops: 3,
      history: { ch4: [0.18], co: [11], water: [5], risk: [15] }
    },
    {
      id: 'SN-06',
      name: 'L2 Drainage Sump Sentinel',
      location: 'Drainage Pump Station (-260m)',
      level: 'l2',
      x: 150, y: 340, z: -260,
      ch4: 0.22,
      co: 14,
      h2s: 0.9,
      o2: 20.4,
      temp: 27.4,
      humidity: 88,
      waterLevel: 12,
      vibration: 0.52,
      battery: 89,
      status: 'NORMAL',
      meshHops: 4,
      history: { ch4: [0.22], co: [14], water: [12], risk: [18] }
    },
    {
      id: 'SN-07',
      name: 'Refuge Chamber Sentinel',
      location: 'Refuge Station (-380m)',
      level: 'l3',
      x: 420, y: 410, z: -380,
      ch4: 0.15,
      co: 9,
      h2s: 0.5,
      o2: 20.7,
      temp: 27.9,
      humidity: 74,
      waterLevel: 1,
      vibration: 0.38,
      battery: 94,
      status: 'NORMAL',
      meshHops: 4,
      history: { ch4: [0.15], co: [9], water: [1], risk: [14] }
    },
    {
      id: 'SN-08',
      name: 'Face 4B Blast Zone Sentinel',
      location: 'Extraction Face 4B (-380m)',
      level: 'l3',
      x: 580, y: 410, z: -380,
      ch4: 0.28,
      co: 18,
      h2s: 1.1,
      o2: 20.3,
      temp: 29.2,
      humidity: 82,
      waterLevel: 3,
      vibration: 0.65,
      battery: 87,
      status: 'NORMAL',
      meshHops: 5,
      history: { ch4: [0.28], co: [18], water: [3], risk: [22] }
    }
  ],

  robots: {
    r01: {
      id: 'R-01',
      name: 'Arachne-1 (Spidy Scout Robot)',
      type: 'HEXAPOD_SPIDER',
      role: 'Rapid Autonomous Reconnaissance & SLAM Assessment',
      level: 'l2',
      x: 340, y: 280, z: -240,
      targetX: 340, targetY: 280, targetZ: -240,
      status: 'PATROLLING', // PATROLLING, SPRINTING_TO_INCIDENT, CONDUCTING_SLAM_RECON, FAILED, OFFLINE
      battery: 89,
      speedMps: 2.8,
      mappedCoverage: 78.4,
      lidarRangeM: 15.0,
      lidarPoints: 360,
      thermalMaxC: 34.2,
      coConcentration: 12,
      payload: '360° RPLiDAR A3 + FLIR Thermal IR + Multi-Gas Sniffer + UWB Directional',
      missionGoal: 'Autonomous SLAM perimeter reconnaissance and instant hazard verification',
      isFailed: false,
      failureReason: ''
    },
    r02: {
      id: 'R-02',
      name: 'Arachne-2 (Spidy Standby Robot)',
      type: 'HEXAPOD_SPIDER',
      role: 'Hot Standby Recon, Failover SLAM & Rescue Path Guide',
      level: 'l1',
      x: 330, y: 170, z: -120,
      targetX: 330, targetY: 170, targetZ: -120,
      status: 'STANDBY_HOT', // STANDBY_HOT, SPRINTING_TO_INCIDENT, CONDUCTING_SLAM_RECON, RETURNING
      battery: 98,
      speedMps: 3.2,
      mappedCoverage: 100,
      payload: '360° RPLiDAR A3 + FLIR Thermal + 2x Emergency O2 Tanks + 10W LoRa Booster',
      missionGoal: 'Hot standby at L1 shaft collar ready to assume full recon & pathfinding on failover',
      isFailed: false,
      activeTransfer: false
    }
  },

  // Active Rapid Reconnaissance Intelligence Report
  reconReport: {
    active: false,
    inTransit: false,
    assignedRobotId: 'r01',
    incidentNodeId: 'face_4b',
    incidentName: 'Extraction Face 4B (-380m)',
    incidentType: 'METHANE_LEAK',
    ch4: 0.28,
    temp: 29.2,
    humidity: 82,
    co: 18,
    o2: 20.3,
    humanDetected: true,
    humanName: 'Rajesh Kumar (W-03)',
    humanStatus: 'TRAPPED_CONSCIOUS',
    rescueTeamAllowed: false,
    rescueTeamRationale: 'Elevated CH4 (2.45% LEL) exceeds safe entry limits. SCBA 60min mandatory for human entry.',
    alternatePathNodes: ['face_4b', 'refuge_chamber', 'shaft_l3', 'shaft_l2', 'shaft_l1', 'shaft_top', 'portal_a'],
    alternatePathName: 'Route Alpha (Shaft 1 Hoist Bypass)',
    timestamp: ''
  },

  // First-Responder Surface Rescue Team Path
  rescueTeamRoute: {
    active: false,
    origin: 'Surface Rescue Staging (Portal A)',
    destination: 'Worker W-03 (Face 4B)',
    pathNodes: ['portal_a', 'shaft_top', 'shaft_l1', 'shaft_l2', 'shaft_l3', 'refuge_chamber', 'face_4b'],
    distanceM: 480,
    estArrivalTimeMin: 6.2,
    requiredPPE: ['SCBA 60-Min Positive Pressure', 'Intrinsically Safe FLIR Camera', 'Heavy Extrication Shears', 'Portable Gas Sniffer'],
    entryStatus: 'AUTHORIZED_WITH_SCBA'
  },

  hazards: {
    gasPlume: {
      active: false,
      epicenterNodeId: 'face_4b',
      epicenterX: 580,
      epicenterY: 410,
      epicenterZ: -380,
      level: 'l3',
      radius: 40,
      maxRadius: 180,
      density: 0.28,
      gasType: 'METHANE (CH4) + CO'
    },
    floodWater: {
      active: false,
      epicenterNodeId: 'sump_l2',
      sumpLevelCm: 12,
      inundationRateCmMin: 0,
      affectedLevel: 'l2',
      isBlockedL2West: false
    },
    seismicTremor: {
      active: false,
      magnitude: 0.65,
      zone: 'Sub-level 3 Hanging Wall'
    }
  },

  meshLinks: [
    { from: 'SN-01', to: 'SN-02', quality: 98, active: true },
    { from: 'SN-02', to: 'SN-03', quality: 94, active: true },
    { from: 'SN-02', to: 'SN-04', quality: 92, active: true },
    { from: 'SN-03', to: 'SN-05', quality: 88, active: true },
    { from: 'SN-04', to: 'SN-05', quality: 86, active: true },
    { from: 'SN-05', to: 'SN-06', quality: 82, active: true },
    { from: 'SN-05', to: 'SN-07', quality: 84, active: true },
    { from: 'SN-07', to: 'SN-08', quality: 91, active: true }
  ],

  routes: {
    activeRouteId: 'alpha',
    list: [
      {
        id: 'alpha',
        name: 'Route Alpha (AI Recommended Safest)',
        pathNodes: ['face_4b', 'refuge_chamber', 'shaft_l3', 'shaft_l2', 'shaft_l1', 'shaft_top', 'portal_a'],
        distanceM: 480,
        riskScore: 14,
        estTimeMin: 4.8,
        status: 'RECOMMENDED',
        desc: 'Bypasses low-lying L2 sump inundation via primary vertical hoist shaft.'
      },
      {
        id: 'beta',
        name: 'Route Beta (Direct Incline - High Risk)',
        pathNodes: ['face_4b', 'refuge_chamber', 'shaft_l3', 'junc_l2_w', 'sump_l2', 'shaft_l1', 'portal_a'],
        distanceM: 390,
        riskScore: 82,
        estTimeMin: 3.9,
        status: 'HAZARDOUS',
        desc: 'Direct incline passes through rising flood water and toxic gas eddy currents.'
      },
      {
        id: 'charlie',
        name: 'Route Charlie (Secondary Ventilation Return)',
        pathNodes: ['face_4b', 'refuge_chamber', 'shaft_l3', 'junc_l2_e', 'junc_l1_e', 'shaft_top', 'portal_a'],
        distanceM: 540,
        riskScore: 28,
        estTimeMin: 5.6,
        status: 'BACKUP',
        desc: 'Higher distance but maximum fresh airflow intake corridor.'
      }
    ]
  },

  alerts: [
    {
      id: 'ALT-1001',
      timestamp: '00:00:01',
      type: 'INFO',
      severity: 'normal',
      title: 'NEXUS Subterranean Engine Online',
      message: '8 Sentinel Nodes locked in synchronized LoRa mesh. ESP32 Wearable telemetry active on 6 miners.'
    }
  ],

  activeScenario: 'NORMAL',
  pipelinePhase: 'sense'
};

export let state = JSON.parse(JSON.stringify(INITIAL_STATE));

export function resetState() {
  state = JSON.parse(JSON.stringify(INITIAL_STATE));
}

/**
 * NEXUS Global State & Subterranean Topography Definition
 * Real-Time Digital Twin, 6 Underground Tunnels, Indian Worker Roster, Multi-Node Dynamic Hazards, Dual Spidy Robotics
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
    { id: 'l0', name: 'Surface Access & Headframe Portal', depth: 0, color: '#94a3b8' },
    { id: 'l1', name: 'Sub-level 1 (North Ventilation Drift & Substation)', depth: -120, color: '#38bdf8' },
    { id: 'l2', name: 'Sub-level 2 (Central Haulage & Sump Basin)', depth: -240, color: '#fbbf24' },
    { id: 'l3', name: 'Sub-level 3 (Face 4B Heading & Refuge Chamber 1)', depth: -380, color: '#f87171' },
    { id: 'l4', name: 'Sub-level 4 (Deep Incline Drift & Seam 5A Extraction)', depth: -480, color: '#c084fc' },
    { id: 'l5', name: 'Sub-level 5 (Underground Crusher Station & South Gallery)', depth: -580, color: '#34d399' },
    { id: 'l6', name: 'Sub-level 6 (Deep Horizon Crosscut & Seam 6B & Deep Refuge 2)', depth: -680, color: '#f43f5e' }
  ],
  nodes: {
    // Level 0: Surface
    'portal_a': { id: 'portal_a', name: 'Surface Portal Entry & Staging Bay', x: 120, y: 70, z: 0, level: 'l0', type: 'portal' },
    'shaft_top': { id: 'shaft_top', name: 'Shaft 1 Main Hoist Collar', x: 320, y: 70, z: 0, level: 'l0', type: 'shaft' },

    // Level 1: Sub-level 1 (-120m)
    'shaft_l1': { id: 'shaft_l1', name: 'Shaft 1 (L1 Station -120m)', x: 320, y: 150, z: -120, level: 'l1', type: 'shaft' },
    'junc_l1_w': { id: 'junc_l1_w', name: 'L1 Substation West (-120m)', x: 140, y: 150, z: -120, level: 'l1', type: 'junction' },
    'junc_l1_e': { id: 'junc_l1_e', name: 'L1 Ventilation Crosscut East (-120m)', x: 520, y: 150, z: -120, level: 'l1', type: 'junction' },

    // Level 2: Sub-level 2 (-240m)
    'shaft_l2': { id: 'shaft_l2', name: 'Shaft 1 (L2 Station -240m)', x: 320, y: 230, z: -240, level: 'l2', type: 'shaft' },
    'junc_l2_w': { id: 'junc_l2_w', name: 'L2 Haulage Junction West (-240m)', x: 150, y: 230, z: -240, level: 'l2', type: 'junction' },
    'sump_l2': { id: 'sump_l2', name: 'L2 Drainage Sump Pump Basin (-260m)', x: 150, y: 280, z: -260, level: 'l2', type: 'hazard_zone' },
    'junc_l2_e': { id: 'junc_l2_e', name: 'L2 Ore Chute Feeder East (-240m)', x: 520, y: 230, z: -240, level: 'l2', type: 'junction' },

    // Level 3: Sub-level 3 (-380m)
    'shaft_l3': { id: 'shaft_l3', name: 'Shaft 1 (L3 Deep Station -380m)', x: 320, y: 330, z: -380, level: 'l3', type: 'shaft' },
    'junc_l3_w': { id: 'junc_l3_w', name: 'L3 Survey Crosscut West (-380m)', x: 140, y: 330, z: -380, level: 'l3', type: 'junction' },
    'refuge_chamber': { id: 'refuge_chamber', name: 'Reinforced Refuge Chamber 1 (-380m)', x: 440, y: 330, z: -380, level: 'l3', type: 'refuge' },
    'face_4b': { id: 'face_4b', name: 'Extraction Face 4B Active Heading (-380m)', x: 590, y: 330, z: -380, level: 'l3', type: 'face' },

    // Level 4: Sub-level 4 (-480m) [NEW]
    'shaft_l4': { id: 'shaft_l4', name: 'Shaft 1 (L4 Intermediate Station -480m)', x: 320, y: 420, z: -480, level: 'l4', type: 'shaft' },
    'junc_l4_w': { id: 'junc_l4_w', name: 'L4 West Conveyor Incline (-480m)', x: 150, y: 420, z: -480, level: 'l4', type: 'junction' },
    'sump_l4': { id: 'sump_l4', name: 'L4 Auxiliary Sump Basin (-500m)', x: 150, y: 460, z: -500, level: 'l4', type: 'hazard_zone' },
    'face_5a': { id: 'face_5a', name: 'Extraction Heading Seam 5A (-480m)', x: 560, y: 420, z: -480, level: 'l4', type: 'face' },

    // Level 5: Sub-level 5 (-580m) [NEW]
    'shaft_l5': { id: 'shaft_l5', name: 'Shaft 1 (L5 Deep Hoist Station -580m)', x: 320, y: 520, z: -580, level: 'l5', type: 'shaft' },
    'crusher_l5': { id: 'crusher_l5', name: 'Underground Jaw Crusher Station (-580m)', x: 160, y: 520, z: -580, level: 'l5', type: 'junction' },
    'refuge_l5': { id: 'refuge_l5', name: 'L5 South Deep Refuge Chamber (-580m)', x: 440, y: 520, z: -580, level: 'l5', type: 'refuge' },
    'junc_l5_e': { id: 'junc_l5_e', name: 'South Exploration Gallery Heading (-580m)', x: 570, y: 520, z: -580, level: 'l5', type: 'face' },

    // Level 6: Sub-level 6 (-680m) [NEW]
    'shaft_l6': { id: 'shaft_l6', name: 'Shaft 1 (L6 Deep Horizon Terminal -680m)', x: 320, y: 620, z: -680, level: 'l6', type: 'shaft' },
    'junc_l6_w': { id: 'junc_l6_w', name: 'L6 Diamond Drilling Crosscut (-680m)', x: 150, y: 620, z: -680, level: 'l6', type: 'junction' },
    'face_6b': { id: 'face_6b', name: 'Lower Seam 6B Deep Horizon Heading (-680m)', x: 580, y: 620, z: -680, level: 'l6', type: 'face' }
  },
  edges: [
    // Surface & Shaft 1 Spine
    { from: 'portal_a', to: 'shaft_top', length: 200, slope: 'horizontal' },
    { from: 'shaft_top', to: 'shaft_l1', length: 120, slope: 'vertical_shaft' },
    { from: 'shaft_l1', to: 'shaft_l2', length: 120, slope: 'vertical_shaft' },
    { from: 'shaft_l2', to: 'shaft_l3', length: 140, slope: 'vertical_shaft' },
    { from: 'shaft_l3', to: 'shaft_l4', length: 100, slope: 'vertical_shaft' },
    { from: 'shaft_l4', to: 'shaft_l5', length: 100, slope: 'vertical_shaft' },
    { from: 'shaft_l5', to: 'shaft_l6', length: 100, slope: 'vertical_shaft' },

    // Level 1 Drifts
    { from: 'shaft_l1', to: 'junc_l1_w', length: 180, slope: 'drift' },
    { from: 'shaft_l1', to: 'junc_l1_e', length: 200, slope: 'drift' },
    { from: 'junc_l1_e', to: 'junc_l2_e', length: 160, slope: 'vent_incline' },

    // Level 2 Drifts
    { from: 'shaft_l2', to: 'junc_l2_w', length: 170, slope: 'drift' },
    { from: 'junc_l2_w', to: 'sump_l2', length: 70, slope: 'decline' },
    { from: 'shaft_l2', to: 'junc_l2_e', length: 200, slope: 'drift' },

    // Level 3 Drifts
    { from: 'shaft_l3', to: 'junc_l3_w', length: 180, slope: 'drift' },
    { from: 'shaft_l3', to: 'refuge_chamber', length: 120, slope: 'drift' },
    { from: 'refuge_chamber', to: 'face_4b', length: 150, slope: 'heading' },

    // Level 4 Drifts [NEW]
    { from: 'shaft_l4', to: 'junc_l4_w', length: 170, slope: 'drift' },
    { from: 'junc_l4_w', to: 'sump_l4', length: 60, slope: 'decline' },
    { from: 'shaft_l4', to: 'face_5a', length: 240, slope: 'heading' },

    // Level 5 Drifts [NEW]
    { from: 'shaft_l5', to: 'crusher_l5', length: 160, slope: 'drift' },
    { from: 'shaft_l5', to: 'refuge_l5', length: 120, slope: 'drift' },
    { from: 'refuge_l5', to: 'junc_l5_e', length: 130, slope: 'heading' },

    // Level 6 Drifts [NEW]
    { from: 'shaft_l6', to: 'junc_l6_w', length: 170, slope: 'drift' },
    { from: 'shaft_l6', to: 'face_6b', length: 260, slope: 'heading' }
  ]
};

// Dynamic hazard candidate locations across all levels
export const HAZARD_LOCATIONS = [
  { nodeId: 'face_4b', name: 'Extraction Face 4B (Sub-level 3 -380m)', x: 590, y: 330, z: -380, level: 'l3', sensorId: 'SN-08', hazardType: 'GAS' },
  { nodeId: 'face_5a', name: 'Seam 5A Extraction Heading (Sub-level 4 -480m)', x: 560, y: 420, z: -480, level: 'l4', sensorId: 'SN-10', hazardType: 'GAS' },
  { nodeId: 'face_6b', name: 'Lower Seam 6B Deep Horizon (Sub-level 6 -680m)', x: 580, y: 620, z: -680, level: 'l6', sensorId: 'SN-14', hazardType: 'GAS' },
  { nodeId: 'crusher_l5', name: 'Underground Crusher Station (Sub-level 5 -580m)', x: 160, y: 520, z: -580, level: 'l5', sensorId: 'SN-11', hazardType: 'GAS' },
  { nodeId: 'junc_l1_e', name: 'L1 Ventilation East Drift (-120m)', x: 520, y: 150, z: -120, level: 'l1', sensorId: 'SN-04', hazardType: 'GAS' },
  { nodeId: 'junc_l2_w', name: 'L2 Haulage Junction West (-240m)', x: 150, y: 230, z: -240, level: 'l2', sensorId: 'SN-05', hazardType: 'GAS' },
  { nodeId: 'sump_l2', name: 'L2 Drainage Sump Basin (-260m)', x: 150, y: 280, z: -260, level: 'l2', sensorId: 'SN-06', hazardType: 'FLOOD' },
  { nodeId: 'sump_l4', name: 'L4 Auxiliary Sump Basin (-500m)', x: 150, y: 460, z: -500, level: 'l4', sensorId: 'SN-09', hazardType: 'FLOOD' },
  { nodeId: 'junc_l6_w', name: 'L6 Diamond Drilling Crosscut (-680m)', x: 150, y: 620, z: -680, level: 'l6', sensorId: 'SN-13', hazardType: 'GAS' },
  { nodeId: 'junc_l3_w', name: 'L3 Survey Crosscut West (-380m)', x: 140, y: 330, z: -380, level: 'l3', sensorId: 'SN-07', hazardType: 'GAS' }
];

export const INITIAL_STATE = {
  simTime: 0,
  speed: 1,
  isRunning: true,
  overallRisk: 12, // 0 - 100
  riskCategory: 'SAFE', // SAFE, WARNING, HIGH_RISK, CRITICAL
  hazardCycleIdx: 0,
  floodCycleIdx: 0,
  selectedWorkerId: null,

  // 16 Indian Miners distributed across all 6 subterranean levels (2-3 per level)
  workers: [
    // Sub-level 1
    {
      id: 'W-01',
      name: 'Rajesh Kumar',
      role: 'Shift Lead Supervisor',
      level: 'l1',
      nodeId: 'shaft_l1',
      x: 320, y: 150, z: -120,
      baseX: 320, baseY: 150, baseZ: -120,
      patrolTargetX: 200, patrolTargetY: 150,
      patrolProgress: 0.1, patrolDir: 1,
      hr: 74, spO2: 98, temp: 36.6, motion: 'WALKING',
      battery: 94, rssi: -72, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },
    {
      id: 'W-02',
      name: 'Suresh Verma',
      role: 'Ventilation & Airflow Tech',
      level: 'l1',
      nodeId: 'junc_l1_e',
      x: 480, y: 150, z: -120,
      baseX: 380, baseY: 150, baseZ: -120,
      patrolTargetX: 520, patrolTargetY: 150,
      patrolProgress: 0.4, patrolDir: 1,
      hr: 76, spO2: 99, temp: 36.5, motion: 'WALKING',
      battery: 91, rssi: -68, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },
    {
      id: 'W-03',
      name: 'Priya Sharma',
      role: 'Mine Geotechnical Surveyor',
      level: 'l1',
      nodeId: 'junc_l1_w',
      x: 180, y: 150, z: -120,
      baseX: 140, baseY: 150, baseZ: -120,
      patrolTargetX: 280, patrolTargetY: 150,
      patrolProgress: 0.2, patrolDir: -1,
      hr: 72, spO2: 98, temp: 36.4, motion: 'WALKING',
      battery: 96, rssi: -65, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },

    // Sub-level 2
    {
      id: 'W-04',
      name: 'Amit Patel',
      role: 'Hydraulic Drill Operator',
      level: 'l2',
      nodeId: 'junc_l2_w',
      x: 190, y: 230, z: -240,
      baseX: 150, baseY: 230, baseZ: -240,
      patrolTargetX: 290, patrolTargetY: 230,
      patrolProgress: 0.3, patrolDir: 1,
      hr: 82, spO2: 97, temp: 36.8, motion: 'WALKING',
      battery: 88, rssi: -78, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },
    {
      id: 'W-05',
      name: 'Vikram Singh',
      role: 'Haulage Loader Specialist',
      level: 'l2',
      nodeId: 'junc_l2_e',
      x: 480, y: 230, z: -240,
      baseX: 350, baseY: 230, baseZ: -240,
      patrolTargetX: 520, patrolTargetY: 230,
      patrolProgress: 0.5, patrolDir: 1,
      hr: 78, spO2: 98, temp: 36.5, motion: 'WALKING',
      battery: 92, rssi: -70, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },
    {
      id: 'W-06',
      name: 'Sunita Devi',
      role: 'Subterranean Safety Auditor',
      level: 'l2',
      nodeId: 'shaft_l2',
      x: 320, y: 230, z: -240,
      baseX: 260, baseY: 230, baseZ: -240,
      patrolTargetX: 380, patrolTargetY: 230,
      patrolProgress: 0.6, patrolDir: -1,
      hr: 71, spO2: 99, temp: 36.4, motion: 'WALKING',
      battery: 95, rssi: -66, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },

    // Sub-level 3
    {
      id: 'W-07',
      name: 'Anil Yadav',
      role: 'Senior Blaster & Face Tech',
      level: 'l3',
      nodeId: 'face_4b',
      x: 560, y: 330, z: -380,
      baseX: 460, baseY: 330, baseZ: -380,
      patrolTargetX: 590, patrolTargetY: 330,
      patrolProgress: 0.7, patrolDir: -1,
      hr: 86, spO2: 96, temp: 37.1, motion: 'WALKING',
      battery: 85, rssi: -84, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },
    {
      id: 'W-08',
      name: 'Manoj Gupta',
      role: 'Roof Bolting Specialist',
      level: 'l3',
      nodeId: 'refuge_chamber',
      x: 420, y: 330, z: -380,
      baseX: 340, baseY: 330, baseZ: -380,
      patrolTargetX: 440, patrolTargetY: 330,
      patrolProgress: 0.4, patrolDir: 1,
      hr: 79, spO2: 98, temp: 36.7, motion: 'WALKING',
      battery: 89, rssi: -80, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },
    {
      id: 'W-09',
      name: 'Deepak Chauhan',
      role: 'Strata Monitoring Surveyor',
      level: 'l3',
      nodeId: 'junc_l3_w',
      x: 180, y: 330, z: -380,
      baseX: 140, baseY: 330, baseZ: -380,
      patrolTargetX: 300, patrolTargetY: 330,
      patrolProgress: 0.2, patrolDir: 1,
      hr: 75, spO2: 98, temp: 36.6, motion: 'WALKING',
      battery: 90, rssi: -81, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },

    // Sub-level 4 [NEW]
    {
      id: 'W-10',
      name: 'Ravi Shankar',
      role: 'Conveyor Maintenance Lead',
      level: 'l4',
      nodeId: 'shaft_l4',
      x: 320, y: 420, z: -480,
      baseX: 240, baseY: 420, baseZ: -480,
      patrolTargetX: 360, patrolTargetY: 420,
      patrolProgress: 0.5, patrolDir: 1,
      hr: 77, spO2: 97, temp: 36.9, motion: 'WALKING',
      battery: 93, rssi: -79, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },
    {
      id: 'W-11',
      name: 'Rahul Meena',
      role: 'Continuous Miner Operator',
      level: 'l4',
      nodeId: 'face_5a',
      x: 520, y: 420, z: -480,
      baseX: 380, baseY: 420, baseZ: -480,
      patrolTargetX: 560, patrolTargetY: 420,
      patrolProgress: 0.8, patrolDir: -1,
      hr: 84, spO2: 96, temp: 37.0, motion: 'WALKING',
      battery: 87, rssi: -86, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },
    {
      id: 'W-12',
      name: 'Ananya Roy',
      role: 'Atmospheric Quality Analyst',
      level: 'l4',
      nodeId: 'junc_l4_w',
      x: 180, y: 420, z: -480,
      baseX: 150, baseY: 420, baseZ: -480,
      patrolTargetX: 290, patrolTargetY: 420,
      patrolProgress: 0.3, patrolDir: 1,
      hr: 73, spO2: 99, temp: 36.5, motion: 'WALKING',
      battery: 95, rssi: -75, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },

    // Sub-level 5 [NEW]
    {
      id: 'W-13',
      name: 'Sanjay Nair',
      role: 'Crusher Plant Operator',
      level: 'l5',
      nodeId: 'crusher_l5',
      x: 200, y: 520, z: -580,
      baseX: 160, baseY: 520, baseZ: -580,
      patrolTargetX: 300, patrolTargetY: 520,
      patrolProgress: 0.4, patrolDir: 1,
      hr: 80, spO2: 97, temp: 36.8, motion: 'WALKING',
      battery: 89, rssi: -82, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },
    {
      id: 'W-14',
      name: 'Ramesh Chandra',
      role: 'Heavy Machinery Mechanic',
      level: 'l5',
      nodeId: 'refuge_l5',
      x: 480, y: 520, z: -580,
      baseX: 360, baseY: 520, baseZ: -580,
      patrolTargetX: 540, patrolTargetY: 520,
      patrolProgress: 0.6, patrolDir: -1,
      hr: 78, spO2: 98, temp: 36.7, motion: 'WALKING',
      battery: 91, rssi: -80, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },

    // Sub-level 6 [NEW]
    {
      id: 'W-15',
      name: 'Arjun Rathore',
      role: 'Deep Seam Heading Miner',
      level: 'l6',
      nodeId: 'face_6b',
      x: 540, y: 620, z: -680,
      baseX: 380, baseY: 620, baseZ: -680,
      patrolTargetX: 580, patrolTargetY: 620,
      patrolProgress: 0.7, patrolDir: -1,
      hr: 85, spO2: 96, temp: 37.2, motion: 'WALKING',
      battery: 86, rssi: -88, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    },
    {
      id: 'W-16',
      name: 'Kavita Sen',
      role: 'Diamond Core Drill Specialist',
      level: 'l6',
      nodeId: 'junc_l6_w',
      x: 200, y: 620, z: -680,
      baseX: 150, baseY: 620, baseZ: -680,
      patrolTargetX: 300, patrolTargetY: 620,
      patrolProgress: 0.3, patrolDir: 1,
      hr: 74, spO2: 98, temp: 36.6, motion: 'WALKING',
      battery: 94, rssi: -85, status: 'NORMAL',
      sosActive: false, tagWarning: null, tagRedirectRoute: null, tagUptime: '04h 22m'
    }
  ],

  // 14 Sentinel Nodes across all subterranean levels
  sensors: [
    {
      id: 'SN-01',
      name: 'Surface Portal Base Node',
      location: 'Portal Entry (0m)',
      level: 'l0',
      x: 120, y: 70, z: 0,
      ch4: 0.02, co: 2, h2s: 0.1, o2: 20.9, temp: 22.4, humidity: 58, waterLevel: 0, vibration: 0.12,
      battery: 100, status: 'NORMAL', meshHops: 0,
      history: { ch4: [0.02], co: [2], water: [0], risk: [5] }
    },
    {
      id: 'SN-02',
      name: 'Shaft 1 Main Collar Node',
      location: 'Shaft Collar (0m)',
      level: 'l0',
      x: 320, y: 70, z: 0,
      ch4: 0.05, co: 4, h2s: 0.2, o2: 20.8, temp: 23.1, humidity: 62, waterLevel: 0, vibration: 0.24,
      battery: 98, status: 'NORMAL', meshHops: 1,
      history: { ch4: [0.05], co: [4], water: [0], risk: [7] }
    },
    {
      id: 'SN-03',
      name: 'L1 Substation Sentinel',
      location: 'Sub-level 1 West (-120m)',
      level: 'l1',
      x: 140, y: 150, z: -120,
      ch4: 0.08, co: 6, h2s: 0.3, o2: 20.7, temp: 24.5, humidity: 68, waterLevel: 2, vibration: 0.31,
      battery: 95, status: 'NORMAL', meshHops: 2,
      history: { ch4: [0.08], co: [6], water: [2], risk: [10] }
    },
    {
      id: 'SN-04',
      name: 'L1 Ventilation Node',
      location: 'Sub-level 1 East (-120m)',
      level: 'l1',
      x: 520, y: 150, z: -120,
      ch4: 0.12, co: 8, h2s: 0.4, o2: 20.6, temp: 25.2, humidity: 71, waterLevel: 0, vibration: 0.28,
      battery: 93, status: 'NORMAL', meshHops: 2,
      history: { ch4: [0.12], co: [8], water: [0], risk: [12] }
    },
    {
      id: 'SN-05',
      name: 'L2 Haulage Junction Node',
      location: 'Sub-level 2 Station (-240m)',
      level: 'l2',
      x: 320, y: 230, z: -240,
      ch4: 0.18, co: 11, h2s: 0.6, o2: 20.5, temp: 26.8, humidity: 76, waterLevel: 5, vibration: 0.45,
      battery: 91, status: 'NORMAL', meshHops: 3,
      history: { ch4: [0.18], co: [11], water: [5], risk: [15] }
    },
    {
      id: 'SN-06',
      name: 'L2 Drainage Sump Sentinel',
      location: 'Drainage Pump Station (-260m)',
      level: 'l2',
      x: 150, y: 280, z: -260,
      ch4: 0.22, co: 14, h2s: 0.9, o2: 20.4, temp: 27.4, humidity: 88, waterLevel: 12, vibration: 0.52,
      battery: 89, status: 'NORMAL', meshHops: 4,
      history: { ch4: [0.22], co: [14], water: [12], risk: [18] }
    },
    {
      id: 'SN-07',
      name: 'L3 Refuge Station Sentinel',
      location: 'Refuge Station (-380m)',
      level: 'l3',
      x: 440, y: 330, z: -380,
      ch4: 0.15, co: 9, h2s: 0.5, o2: 20.7, temp: 27.9, humidity: 74, waterLevel: 1, vibration: 0.38,
      battery: 94, status: 'NORMAL', meshHops: 4,
      history: { ch4: [0.15], co: [9], water: [1], risk: [14] }
    },
    {
      id: 'SN-08',
      name: 'Face 4B Blast Zone Sentinel',
      location: 'Extraction Face 4B (-380m)',
      level: 'l3',
      x: 590, y: 330, z: -380,
      ch4: 0.28, co: 18, h2s: 1.1, o2: 20.3, temp: 29.2, humidity: 82, waterLevel: 3, vibration: 0.65,
      battery: 87, status: 'NORMAL', meshHops: 5,
      history: { ch4: [0.28], co: [18], water: [3], risk: [22] }
    },
    {
      id: 'SN-09',
      name: 'L4 Auxiliary Sump Sentinel',
      location: 'Sub-level 4 Sump (-500m)',
      level: 'l4',
      x: 150, y: 460, z: -500,
      ch4: 0.24, co: 15, h2s: 0.8, o2: 20.4, temp: 28.6, humidity: 86, waterLevel: 10, vibration: 0.48,
      battery: 92, status: 'NORMAL', meshHops: 5,
      history: { ch4: [0.24], co: [15], water: [10], risk: [19] }
    },
    {
      id: 'SN-10',
      name: 'Seam 5A Extraction Sentinel',
      location: 'Heading Seam 5A (-480m)',
      level: 'l4',
      x: 560, y: 420, z: -480,
      ch4: 0.30, co: 19, h2s: 1.2, o2: 20.2, temp: 30.1, humidity: 84, waterLevel: 4, vibration: 0.68,
      battery: 88, status: 'NORMAL', meshHops: 5,
      history: { ch4: [0.30], co: [19], water: [4], risk: [24] }
    },
    {
      id: 'SN-11',
      name: 'L5 Underground Crusher Sentinel',
      location: 'Jaw Crusher Station (-580m)',
      level: 'l5',
      x: 160, y: 520, z: -580,
      ch4: 0.26, co: 16, h2s: 0.9, o2: 20.3, temp: 31.0, humidity: 80, waterLevel: 2, vibration: 0.72,
      battery: 90, status: 'NORMAL', meshHops: 6,
      history: { ch4: [0.26], co: [16], water: [2], risk: [23] }
    },
    {
      id: 'SN-12',
      name: 'L5 South Deep Refuge Sentinel',
      location: 'L5 Refuge Station (-580m)',
      level: 'l5',
      x: 440, y: 520, z: -580,
      ch4: 0.16, co: 10, h2s: 0.6, o2: 20.6, temp: 29.5, humidity: 75, waterLevel: 1, vibration: 0.40,
      battery: 93, status: 'NORMAL', meshHops: 6,
      history: { ch4: [0.16], co: [10], water: [1], risk: [16] }
    },
    {
      id: 'SN-13',
      name: 'L6 Deep Horizon Crosscut Sentinel',
      location: 'L6 Crosscut Station (-680m)',
      level: 'l6',
      x: 150, y: 620, z: -680,
      ch4: 0.29, co: 20, h2s: 1.0, o2: 20.2, temp: 32.2, humidity: 83, waterLevel: 3, vibration: 0.58,
      battery: 89, status: 'NORMAL', meshHops: 7,
      history: { ch4: [0.29], co: [20], water: [3], risk: [25] }
    },
    {
      id: 'SN-14',
      name: 'Lower Seam 6B Deep Heading Sentinel',
      location: 'Seam 6B Heading (-680m)',
      level: 'l6',
      x: 580, y: 620, z: -680,
      ch4: 0.32, co: 22, h2s: 1.3, o2: 20.1, temp: 33.4, humidity: 86, waterLevel: 5, vibration: 0.74,
      battery: 86, status: 'NORMAL', meshHops: 7,
      history: { ch4: [0.32], co: [22], water: [5], risk: [28] }
    }
  ],

  robots: {
    r01: {
      id: 'R-01',
      name: 'Arachne-1 (Spidy Scout Robot)',
      type: 'HEXAPOD_SPIDER',
      role: 'Rapid Autonomous Reconnaissance & SLAM Assessment',
      level: 'l2',
      x: 340, y: 230, z: -240,
      targetX: 340, targetY: 230, targetZ: -240,
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
      x: 330, y: 150, z: -120,
      targetX: 330, targetY: 150, targetZ: -120,
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
    humanName: 'Anil Yadav (W-07)',
    humanStatus: 'TRAPPED_CONSCIOUS',
    rescueTeamAllowed: false,
    rescueTeamRationale: 'Elevated CH4 exceeds statutory safe limits. SCBA 60min mandatory for rescue team ingress.',
    alternatePathNodes: ['face_4b', 'refuge_chamber', 'shaft_l3', 'shaft_l2', 'shaft_l1', 'shaft_top', 'portal_a'],
    alternatePathName: 'Route Alpha (Shaft 1 Hoist Bypass)',
    timestamp: ''
  },

  // First-Responder Surface Rescue Team Ingress Path (RED ROUTE) & Worker Evac Path (GREEN ROUTE)
  rescueTeamRoute: {
    active: false,
    inProgress: false,
    progressStep: 0,
    origin: 'Surface Rescue Staging (Portal A 0m)',
    destination: 'Trapped Worker (Face 4B)',
    targetNodeId: 'face_4b',
    targetWorkerId: 'W-07',
    pathNodes: ['portal_a', 'shaft_top', 'shaft_l1', 'shaft_l2', 'shaft_l3', 'refuge_chamber', 'face_4b'],
    workerEgressNodes: ['face_4b', 'refuge_chamber', 'shaft_l3', 'shaft_l2', 'shaft_l1', 'shaft_top', 'portal_a'],
    distanceM: 480,
    estArrivalTimeMin: 5.8,
    requiredPPE: ['SCBA 60-Min Positive Pressure', 'Intrinsically Safe FLIR Camera', 'Heavy Extrication Shears', 'Portable Gas Sniffer'],
    entryStatus: 'AUTHORIZED_WITH_SCBA'
  },

  hazards: {
    gasPlume: {
      active: false,
      epicenterNodeId: 'face_4b',
      epicenterX: 590,
      epicenterY: 330,
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
      epicenterX: 150,
      epicenterY: 280,
      epicenterZ: -260,
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
    { from: 'SN-07', to: 'SN-08', quality: 91, active: true },
    { from: 'SN-07', to: 'SN-09', quality: 89, active: true },
    { from: 'SN-09', to: 'SN-10', quality: 87, active: true },
    { from: 'SN-09', to: 'SN-11', quality: 85, active: true },
    { from: 'SN-11', to: 'SN-12', quality: 90, active: true },
    { from: 'SN-12', to: 'SN-13', quality: 88, active: true },
    { from: 'SN-13', to: 'SN-14', quality: 92, active: true }
  ],

  routes: {
    activeRouteId: 'alpha',
    list: []
  },

  alerts: [
    {
      id: 'ALT-1001',
      timestamp: '00:00:01',
      type: 'INFO',
      severity: 'normal',
      title: 'NEXUS Subterranean Engine Online',
      message: '14 Sentinel Nodes locked in synchronized LoRa mesh across 6 Subterranean Levels. ESP32 Wearable telemetry active on 16 miners.'
    }
  ],

  activeScenario: 'NORMAL',
  pipelinePhase: 'sense'
};

export let state = JSON.parse(JSON.stringify(INITIAL_STATE));

export function resetState() {
  state = JSON.parse(JSON.stringify(INITIAL_STATE));
}

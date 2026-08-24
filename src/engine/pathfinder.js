/**
 * NEXUS Dynamic Subterranean Multi-Hazard Graph & A* Route Planner
 */

import { MINE_TOPOGRAPHY, state } from './state.js';

export class SubterraneanPathfinder {
  constructor() {
    this.topography = MINE_TOPOGRAPHY;
  }

  calculateRoutes(startNodeId = 'face_4b', endNodeId = 'portal_a') {
    const hazards = state.hazards;
    const sensors = state.sensors;

    // Evaluate hazard status for dynamic cost calculations
    const isGasActive = hazards.gasPlume.active || sensors.some(s => s.ch4 > 0.8);
    const isFloodActive = hazards.floodWater.active || sensors.some(s => s.waterLevel > 15);

    const routes = [
      {
        id: 'alpha',
        name: 'Route Alpha (AI Recommended Safest)',
        badge: 'SAFEST (AI)',
        color: '#00ff88',
        isRecommended: true,
        pathNodes: ['face_4b', 'refuge_chamber', 'shaft_l3', 'shaft_l2', 'shaft_l1', 'shaft_top', 'portal_a'],
        distanceM: 480,
        riskScore: isGasActive ? 14 : 6,
        estTimeMin: '3m 45s',
        airQualityIndex: '99.2% Nominal',
        chokePoints: 0,
        elevationProfile: [-380, -380, -380, -240, -120, 0, 0],
        turnByTurn: [
          { step: 1, text: 'Depart Face 4B heading; proceed 160m West along reinforced Drift 3A.', icon: 'arrow-left' },
          { step: 2, text: 'Secure safety check at Refuge Chamber Station (-380m).', icon: 'shield-check' },
          { step: 3, text: 'Board Emergency Hoist Cage at Shaft Station L3.', icon: 'arrow-up' },
          { step: 4, text: 'Ascend Shaft 1 to Collar (0m Level) with uninterrupted fresh air intake.', icon: 'arrow-up-right' },
          { step: 5, text: 'Egress through Main Portal A to Surface Evacuation Staging.', icon: 'check-circle' }
        ]
      },
      {
        id: 'beta',
        name: 'Route Beta (Direct Sump Incline - Hazardous)',
        badge: isFloodActive ? 'IMPASSABLE' : 'HIGH RISK',
        color: '#ff0055',
        isRecommended: false,
        pathNodes: ['face_4b', 'refuge_chamber', 'shaft_l3', 'junc_l2_w', 'sump_l2', 'shaft_l1', 'portal_a'],
        distanceM: 390,
        riskScore: isFloodActive ? 92 : (isGasActive ? 78 : 34),
        estTimeMin: '2m 50s',
        airQualityIndex: '62.4% Toxic Gas Drift',
        chokePoints: 2,
        elevationProfile: [-380, -380, -380, -240, -260, -120, 0],
        turnByTurn: [
          { step: 1, text: 'Depart Face 4B; proceed through Refuge Chamber toward Shaft L3.', icon: 'arrow-left' },
          { step: 2, text: 'Take incline cut into L2 Haulage Drift West.', icon: 'alert-triangle' },
          { step: 3, text: 'CRITICAL HAZARD: Traverses Drainage Sump with rising flood water & toxic pockets.', icon: 'droplets' },
          { step: 4, text: 'Climb auxiliary ladderway to L1 Station.', icon: 'arrow-up' },
          { step: 5, text: 'Egress via Portal A.', icon: 'check-circle' }
        ]
      },
      {
        id: 'charlie',
        name: 'Route Charlie (Secondary Ventilation Return)',
        badge: 'BACKUP AIRWAY',
        color: '#38bdf8',
        isRecommended: false,
        pathNodes: ['face_4b', 'refuge_chamber', 'shaft_l3', 'junc_l2_e', 'junc_l1_e', 'shaft_top', 'portal_a'],
        distanceM: 560,
        riskScore: isGasActive ? 28 : 12,
        estTimeMin: '5m 15s',
        airQualityIndex: '94.8% Fresh Flow',
        chokePoints: 1,
        elevationProfile: [-380, -380, -380, -240, -120, 0, 0],
        turnByTurn: [
          { step: 1, text: 'Depart Face 4B heading West toward Shaft L3.', icon: 'arrow-left' },
          { step: 2, text: 'Enter East Ore Chute bypass toward L2 East Incline.', icon: 'corner-up-right' },
          { step: 3, text: 'Ascend Ventilation Incline to Sub-level 1 East Crosscut.', icon: 'arrow-up-right' },
          { step: 4, text: 'Follow fresh air intake corridor to Shaft Collar.', icon: 'arrow-up' },
          { step: 5, text: 'Egress safely through Surface Portal A.', icon: 'check-circle' }
        ]
      }
    ];

    state.routes.list = routes;
    return routes;
  }
}

export const pathfinder = new SubterraneanPathfinder();

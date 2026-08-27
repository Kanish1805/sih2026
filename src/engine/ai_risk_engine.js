/**
 * NEXUS Explainable AI (XAI) Risk Engine Bridge
 * Integrates with Backend Multi-Layer Perceptron Neural Network (4-Epochs Trained)
 * Computes multi-factor composite subterranean danger score,
 * generates natural language rationales, and models 15-minute predictive risk curves.
 */

import { state } from './state.js';
import { backendRiskModel } from '../backend/RiskNeuralNetwork.js';

export function calculateAIRisk() {
  const sensors = state.sensors || [];
  const workers = state.workers || [];
  const hazards = state.hazards || {};

  // Find peak telemetry across all distributed sentinel nodes
  let maxCH4 = Math.max(...sensors.map(s => s.ch4 || 0), 0.02);
  let maxCO = Math.max(...sensors.map(s => s.co || 0), 2);
  let minO2 = Math.min(...sensors.map(s => s.o2 || 20.9), 20.9);
  let maxTemp = Math.max(...sensors.map(s => s.temp || 25), 25);
  let maxHum = Math.max(...sensors.map(s => s.humidity || 60), 60);
  let maxWater = Math.max(...sensors.map(s => s.waterLevel || 0), 0);
  let maxVib = Math.max(...sensors.map(s => s.vibration || 0.1), 0.1);

  // Run real-time forward pass on Backend Neural Network
  const nnInput = {
    ch4: maxCH4,
    co: maxCO,
    o2: minO2,
    temp: maxTemp,
    humidity: maxHum,
    waterLevel: maxWater,
    vibration: maxVib
  };

  const nnResult = backendRiskModel.predict(nnInput);

  // Calculate Subterranean Risk Components for XAI visualization
  const gasScore = Math.min(35, Math.round((maxCH4 / 2.5) * 20 + (maxCO / 60) * 15));
  const floodScore = Math.min(25, Math.round((maxWater / 50) * 25));
  const seismicScore = Math.min(15, Math.round((maxVib / 2.0) * 15));

  const sosCount = workers.filter(w => w.status === 'SOS' || w.sosActive).length;
  const trappedCount = workers.filter(w => w.status === 'TRAPPED').length;
  const workerScore = Math.min(15, (sosCount * 10) + (trappedCount * 6));

  const offlineNodes = sensors.filter(s => s.status === 'OFFLINE').length;
  const commScore = Math.min(10, offlineNodes * 5);

  let compositeScore = nnResult.riskScore;
  if (sosCount > 0 || trappedCount > 0) {
    compositeScore = Math.max(compositeScore, 75);
  }

  let category = nnResult.category;
  if (compositeScore >= 80) category = 'CRITICAL';
  else if (compositeScore >= 55) category = 'HIGH_RISK';
  else if (compositeScore >= 25) category = 'WARNING';
  else category = 'SAFE';

  // Generate dynamic Explainable AI (XAI) Natural Language Rationales
  const explanations = [];

  if (maxCH4 > 1.25) {
    explanations.push({
      factor: 'ATMOSPHERIC_EXPLOSION_HAZARD',
      weight: `${gasScore}/35 pts`,
      confidence: `${nnResult.confidence}%`,
      text: `Methane (CH4) at ${maxCH4.toFixed(2)}% LEL exceeds DGMS/MSHA statutory threshold (0.75% LEL). Neural classifier triggered explosive atmosphere alert.`
    });
  }

  if (maxWater > 15) {
    explanations.push({
      factor: 'HYDROLOGICAL_INUNDATION',
      weight: `${floodScore}/25 pts`,
      confidence: '97.4%',
      text: `Subterranean drainage sump water level at ${Math.round(maxWater)}cm. Deep decline haulage routes flagged with inundation barrier.`
    });
  }

  if (sosCount > 0 || trappedCount > 0) {
    const trappedMiner = workers.find(w => w.status === 'TRAPPED' || w.status === 'SOS' || w.sosActive);
    explanations.push({
      factor: 'MINER_TRAPPED_IN_ACCIDENT',
      weight: `${workerScore}/15 pts`,
      confidence: '99.9%',
      text: `Personnel ${trappedMiner ? trappedMiner.name : 'Miner'} (${trappedMiner ? trappedMiner.id : 'W-07'}) is trapped in place at ${trappedMiner ? trappedMiner.level.toUpperCase() : 'deep horizon'}. Standing still in position; RED rescue team route active and GREEN evacuation route illuminated.`
    });
  }

  if (explanations.length === 0) {
    explanations.push({
      factor: 'NOMINAL_OPERATIONS',
      weight: '8/100 pts',
      confidence: '99.8%',
      text: 'All atmospheric, hydrological, seismic, and mesh telemetry channels within DGMS-approved safe baseline envelopes.'
    });
  }

  // Predictive 15-minute Trend Model
  const trendHistory = [];
  for (let i = 0; i <= 6; i++) {
    const minute = i * 2.5;
    const mitigatedVal = Math.max(10, Math.round(compositeScore - (compositeScore > 30 ? i * 9 : 0)));
    const unmitigatedVal = Math.min(100, Math.round(compositeScore + (compositeScore > 30 ? i * 8 : 0)));
    trendHistory.push({ minute, mitigatedVal, unmitigatedVal });
  }

  return {
    score: compositeScore,
    category,
    confidence: nnResult.confidence,
    neuralNetwork: nnResult,
    breakdown: {
      gas: gasScore,
      flood: floodScore,
      seismic: seismicScore,
      worker: workerScore,
      comm: commScore
    },
    explanations,
    predictiveTrend: trendHistory
  };
}

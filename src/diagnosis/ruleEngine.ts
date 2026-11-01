/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TelemetryReading, RuleEvaluation, FaultScenario, SeverityLevel } from '../types/telemetry';

export interface RuleDefinition {
  id: string;
  name: string;
  conditionDescription: string;
  scenario: FaultScenario;
  severity: SeverityLevel;
  evaluate: (r: TelemetryReading) => { passed: boolean; metricValue: string; threshold: string; explanation: string };
}

export const KNOWLEDGE_RULES: RuleDefinition[] = [
  {
    id: 'RULE_01_LOCKED_ROTOR_STALL',
    name: 'Locked Rotor & Motor Stall Rule',
    conditionDescription: 'Speed == 0 RPM AND Current > 3.2 A',
    scenario: 'MOTOR_STALL',
    severity: 'CRITICAL',
    evaluate: (r) => {
      const isZeroSpeed = r.speed_rpm <= 10;
      const isHighCurrent = r.current_a > 3.2;
      const triggered = isZeroSpeed && isHighCurrent;
      return {
        passed: triggered,
        metricValue: `Speed: ${r.speed_rpm} RPM, Current: ${r.current_a} A`,
        threshold: 'Speed ≤ 10 RPM AND Current > 3.2 A',
        explanation: triggered
          ? 'Rotor shaft is physically immobilized under excitation; back-EMF collapsed to zero causing excessive armature heating.'
          : 'Speed and current remain within operational safety envelope.',
      };
    },
  },
  {
    id: 'RULE_02_SENSOR_ANOMALY',
    name: 'Transducer & Acquisition Integrity Rule',
    conditionDescription: 'Telemetry exceeds physical transducer bounds (e.g. Temp > 125°C, Vibe > 10g, Current < 0A, RPM > 6000)',
    scenario: 'SENSOR_ANOMALY',
    severity: 'WARNING',
    evaluate: (r) => {
      const anomaly =
        r.temperature_c < -10 ||
        r.temperature_c > 125 ||
        r.vibration_rms_g > 10.0 ||
        r.current_a < 0 ||
        r.speed_rpm > 6000;
      return {
        passed: anomaly,
        metricValue: `T:${r.temperature_c}°C, V:${r.vibration_rms_g}g, I:${r.current_a}A, S:${r.speed_rpm}RPM`,
        threshold: 'Physical bounds [-10..125°C, ≤10g, ≥0A, ≤6000 RPM]',
        explanation: anomaly
          ? 'Sensor telemetry violates physical DC motor operating boundaries. High probability of transducer disconnect, ADC clipping, or signal discontinuity.'
          : 'All telemetry metrics satisfy physical acquisition consistency checks.',
      };
    },
  },
  {
    id: 'RULE_03_THERMAL_OVERHEAT',
    name: 'Winding Thermal Insulation Limit Rule',
    conditionDescription: 'Winding Temperature > 65.0 °C',
    scenario: 'THERMAL_OVERHEATING',
    severity: 'CRITICAL',
    evaluate: (r) => {
      const triggered = r.temperature_c > 65.0 && r.temperature_c <= 125.0;
      return {
        passed: triggered,
        metricValue: `${r.temperature_c.toFixed(1)} °C`,
        threshold: '> 65.0 °C (Critical Limit)',
        explanation: triggered
          ? `Motor casing temperature (${r.temperature_c.toFixed(1)}°C) exceeds Class B insulation safe threshold of 65°C. Accelerated thermal aging active.`
          : `Temperature (${r.temperature_c.toFixed(1)}°C) is below thermal stress threshold.`,
      };
    },
  },
  {
    id: 'RULE_04_DYNAMIC_VIBRATION',
    name: 'ISO 10816 Bearing & Dynamic Unbalance Rule',
    conditionDescription: 'Vibration RMS > 2.50 g',
    scenario: 'EXCESSIVE_VIBRATION',
    severity: 'WARNING',
    evaluate: (r) => {
      const triggered = r.vibration_rms_g > 2.50 && r.vibration_rms_g <= 10.0;
      return {
        passed: triggered,
        metricValue: `${r.vibration_rms_g.toFixed(2)} g RMS`,
        threshold: '> 2.50 g RMS (ISO 10816 Severity Limit)',
        explanation: triggered
          ? `Vibration amplitude (${r.vibration_rms_g.toFixed(2)}g) indicates severe rotor dynamic unbalance, shaft misalignment, or bearing raceway spalling.`
          : `Vibration amplitude (${r.vibration_rms_g.toFixed(2)}g) is within smooth mechanical running limits.`,
      };
    },
  },
  {
    id: 'RULE_05_MECHANICAL_OVERLOAD',
    name: 'Sustained Mechanical Overload Rule',
    conditionDescription: 'Current > 2.20 A AND Speed < 2200 RPM',
    scenario: 'MECHANICAL_OVERLOAD',
    severity: 'WARNING',
    evaluate: (r) => {
      const triggered = r.current_a > 2.20 && r.speed_rpm < 2200 && r.speed_rpm > 10;
      return {
        passed: triggered,
        metricValue: `Current: ${r.current_a.toFixed(2)} A, Speed: ${r.speed_rpm} RPM`,
        threshold: 'Current > 2.20 A AND Speed < 2200 RPM',
        explanation: triggered
          ? 'Counter-torque exceeding rated design capacity. Significant speed droop coupled with elevated armature current draw.'
          : 'Speed-torque operating point is within acceptable torque-speed characteristic curve.',
      };
    },
  },
  {
    id: 'RULE_06_SLOWDOWN_DEGRADATION',
    name: 'Gradual Mechanical Drag & Slowdown Rule',
    conditionDescription: 'Speed < 2300 RPM AND Current <= 2.20 A',
    scenario: 'SLOWDOWN_DEGRADATION',
    severity: 'INFO',
    evaluate: (r) => {
      const triggered = r.speed_rpm < 2300 && r.speed_rpm > 10 && r.current_a <= 2.20;
      return {
        passed: triggered,
        metricValue: `Speed: ${r.speed_rpm} RPM, Current: ${r.current_a.toFixed(2)} A`,
        threshold: 'Speed < 2300 RPM AND Current ≤ 2.20 A',
        explanation: triggered
          ? 'Rotor speed droop observed without corresponding high current surge; indicative of bearing sleeve friction, belt slippage, or dry sleeve.'
          : 'Shaft rotational speed satisfies nominal operating baseline.',
      };
    },
  },
];

export function evaluateRules(reading: TelemetryReading): {
  evaluations: RuleEvaluation[];
  topHypothesis: FaultScenario;
  topSeverity: SeverityLevel;
} {
  const evaluations: RuleEvaluation[] = [];
  let topHypothesis: FaultScenario = 'NORMAL_OPERATION';
  let topSeverity: SeverityLevel = 'NORMAL';

  for (const rule of KNOWLEDGE_RULES) {
    const res = rule.evaluate(reading);
    evaluations.push({
      id: rule.id,
      name: rule.name,
      condition: rule.conditionDescription,
      passed: res.passed,
      severity: rule.severity,
      triggeredScenario: rule.scenario,
      metricValue: res.metricValue,
      threshold: res.threshold,
      explanation: res.explanation,
    });

    if (res.passed && topHypothesis === 'NORMAL_OPERATION') {
      topHypothesis = rule.scenario;
      topSeverity = rule.severity;
    }
  }

  return { evaluations, topHypothesis, topSeverity };
}

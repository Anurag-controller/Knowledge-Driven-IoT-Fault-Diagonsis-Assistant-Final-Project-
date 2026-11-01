/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FaultScenario =
  | 'NORMAL_OPERATION'
  | 'MECHANICAL_OVERLOAD'
  | 'EXCESSIVE_VIBRATION'
  | 'THERMAL_OVERHEATING'
  | 'SLOWDOWN_DEGRADATION'
  | 'MOTOR_STALL'
  | 'SENSOR_ANOMALY';

export interface TelemetryReading {
  event_id: string;
  device_id: string;
  timestamp: string; // ISO string
  temperature_c: number;
  vibration_rms_g: number;
  current_a: number;
  speed_rpm: number;
  voltage_v: number;
  power_w: number;
  torque_mnm: number;
  scenario: FaultScenario;
}

export type SeverityLevel = 'NORMAL' | 'INFO' | 'WARNING' | 'CRITICAL';

export interface RuleEvaluation {
  id: string;
  name: string;
  condition: string;
  passed: boolean;
  severity: SeverityLevel;
  triggeredScenario?: FaultScenario;
  metricValue: string;
  threshold: string;
  explanation: string;
}

export interface MLPrediction {
  predictedClass: FaultScenario;
  confidence: number;
  probabilities: Record<FaultScenario, number>;
  featureValues: {
    current_mean: number;
    current_std: number;
    current_max: number;
    speed_mean: number;
    speed_drop_ratio: number;
    temp_mean: number;
    temp_rate_of_change: number;
    vibe_rms_mean: number;
    vibe_rms_max: number;
    vibe_rms_std: number;
  };
}

export type ConsensusStatus =
  | 'CONCORDANT_AGREEMENT'
  | 'RULE_SAFETY_OVERRIDE'
  | 'EARLY_WARNING_PREDICTIVE'
  | 'DISCORDANT_UNCERTAINTY';

export interface DiagnosisResult {
  finalScenario: FaultScenario;
  finalSeverity: SeverityLevel;
  consensusStatus: ConsensusStatus;
  overallConfidence: number;
  ruleHypothesis: FaultScenario;
  mlHypothesis: FaultScenario;
  recommendation: {
    headline: string;
    immediateAction: string;
    rootCause: string;
    preventiveWorkOrder: string;
    requiredTools: string[];
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE_SHUTDOWN';
  };
  ruleEvaluations: RuleEvaluation[];
  mlPrediction: MLPrediction;
}

export interface IndustrialAlert {
  alert_id: string;
  timestamp: string;
  device_id: string;
  scenario: FaultScenario;
  severity: SeverityLevel;
  message: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  debounceCount: number;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  operatorNotes?: string;
}

export interface MotorPhysicsConfig {
  ratedVoltage: number; // 12.0 V
  armatureResistance: number; // 1.8 Ohms
  backEmfConstant: number; // Ke in V/(rad/s)
  torqueConstant: number; // Kt in N.m/A
  rotorInertia: number; // J
  viscousFriction: number; // b
  ambientTemperature: number; // 24.0 C
  thermalResistance: number; // C/W
  thermalMass: number; // J/C
  appliedVoltage: number; // 0 - 15V
  loadTorque_mnm: number; // 0 - 500 mN.m
}

export interface MQTTMessage {
  topic: string;
  payload: string;
  timestamp: string;
  qos: 0 | 1;
}

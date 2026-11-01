/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ConsensusStatus,
  DiagnosisResult,
  FaultScenario,
  MLPrediction,
  RuleEvaluation,
  SeverityLevel,
  TelemetryReading,
} from '../types/telemetry';

export function reconcileHybridDiagnosis(
  reading: TelemetryReading,
  ruleEvaluations: RuleEvaluation[],
  ruleHypothesis: FaultScenario,
  ruleSeverity: SeverityLevel,
  mlPrediction: MLPrediction
): DiagnosisResult {
  const mlHypothesis = mlPrediction.predictedClass;
  let finalScenario: FaultScenario = 'NORMAL_OPERATION';
  let finalSeverity: SeverityLevel = 'NORMAL';
  let consensusStatus: ConsensusStatus = 'CONCORDANT_AGREEMENT';
  let overallConfidence = mlPrediction.confidence;

  const isRuleCritical = ruleSeverity === 'CRITICAL';
  const isRuleFault = ruleHypothesis !== 'NORMAL_OPERATION';
  const isMlFault = mlHypothesis !== 'NORMAL_OPERATION';

  if (ruleHypothesis === mlHypothesis) {
    // 1. Both agree
    finalScenario = ruleHypothesis;
    finalSeverity = ruleSeverity;
    consensusStatus = 'CONCORDANT_AGREEMENT';
    overallConfidence = Math.min(0.99, mlPrediction.confidence + 0.15);
  } else if (isRuleCritical) {
    // 2. Safety First Override: Rule flags Critical Hazard (Stall or Overheat)
    finalScenario = ruleHypothesis;
    finalSeverity = 'CRITICAL';
    consensusStatus = 'RULE_SAFETY_OVERRIDE';
    overallConfidence = 0.95;
  } else if (!isRuleFault && isMlFault && mlPrediction.confidence >= 0.72) {
    // 3. Early Warning: ML detected subtle temporal pattern drift before hard rule threshold
    finalScenario = mlHypothesis;
    finalSeverity = 'WARNING';
    consensusStatus = 'EARLY_WARNING_PREDICTIVE';
    overallConfidence = mlPrediction.confidence;
  } else if (isRuleFault) {
    // 4. Rule flagged warning/anomaly
    finalScenario = ruleHypothesis;
    finalSeverity = ruleSeverity;
    consensusStatus = 'DISCORDANT_UNCERTAINTY';
    overallConfidence = Math.max(0.65, mlPrediction.confidence);
  } else {
    // Default to Normal
    finalScenario = 'NORMAL_OPERATION';
    finalSeverity = 'NORMAL';
    consensusStatus = 'CONCORDANT_AGREEMENT';
    overallConfidence = 0.94;
  }

  const recommendation = generatePrescriptiveAction(finalScenario, reading);

  return {
    finalScenario,
    finalSeverity,
    consensusStatus,
    overallConfidence: Number(overallConfidence.toFixed(3)),
    ruleHypothesis,
    mlHypothesis,
    recommendation,
    ruleEvaluations,
    mlPrediction,
  };
}

export function generatePrescriptiveAction(scenario: FaultScenario, reading: TelemetryReading) {
  switch (scenario) {
    case 'MOTOR_STALL':
      return {
        headline: 'EMERGENCY ACTION REQUIRED: Armature Locked-Rotor Stall',
        immediateAction:
          'Cut 12V DC power bus immediately via emergency relay or L298N disable pin. Continuous stall inrush (>4.5A) will permanently destroy armature enamel within seconds.',
        rootCause:
          'Mechanical rotor shaft lock, foreign debris in gear reduction teeth, or seized 608ZZ bearings causing complete back-EMF collapse.',
        preventiveWorkOrder:
          'WO-STL-091: Decouple load coupling, manually test shaft free-rotation, inspect commutator brushes for pitting, and verify winding continuity (~2.1 Ω).',
        requiredTools: ['Digital Multimeter', 'Shaft Lock Spanner', 'Infrared Thermometer', 'Safety Disconnect Switch'],
        urgency: 'IMMEDIATE_SHUTDOWN' as const,
      };

    case 'THERMAL_OVERHEATING':
      return {
        headline: 'THERMAL HAZARD: Class B Insulation Threshold Exceeded (>65°C)',
        immediateAction:
          'Reduce motor continuous load duty by 50% or engage auxiliary cooling blower. Halt operation if temperature exceeds 75°C.',
        rootCause:
          'Inadequate convection cooling, blocked casing shroud, or sustained operation in excess of rated mechanical torque limit.',
        preventiveWorkOrder:
          'WO-THM-104: Clear cooling fan air vents, inspect casing thermal paste contact with DS18B20 digital sensor, and verify ventilation airflow.',
        requiredTools: ['Fluke 62 Max IR Thermometer', 'Thermal Interface Grease', 'Compressed Air Cannister'],
        urgency: 'HIGH' as const,
      };

    case 'EXCESSIVE_VIBRATION':
      return {
        headline: 'MECHANICAL ALERT: ISO 10816 Zone D Vibration (>2.5g RMS)',
        immediateAction:
          'Inspect baseplate mounting fasteners torque (spec: 4.5 N·m) and inspect flexible spider shaft coupling for angular backlash.',
        rootCause:
          'Dynamic rotor unbalance, shaft angular misalignment, or inner/outer bearing raceway fatigue spalling.',
        preventiveWorkOrder:
          'WO-VIB-202: Perform 2-plane dynamic balance check, measure shaft radial runout with dial indicator (<0.05 mm), replace radial ball bearings.',
        requiredTools: ['Dial Indicator with Magnetic Base', 'Calibrated Torque Wrench', 'Bearing Puller Set'],
        urgency: 'HIGH' as const,
      };

    case 'MECHANICAL_OVERLOAD':
      return {
        headline: 'OVERLOAD MITIGATION: Excessive Mechanical Counter-Torque',
        immediateAction:
          'Relieve driven mechanical load to prevent thermal trip. Check driven gearbox lubricant viscosity.',
        rootCause:
          'Sustained load torque exceeding continuous rated torque (rated 45 mN·m), causing armature current to draw >2.2A.',
        preventiveWorkOrder:
          'WO-OVR-305: Inspect gear reduction train for gear binding, clean driven mechanism, measure current under decoupled no-load condition.',
        requiredTools: ['In-line DC Ammeter', 'Gearbox Grease Lubricant', 'Strobe Tachometer'],
        urgency: 'MEDIUM' as const,
      };

    case 'SLOWDOWN_DEGRADATION':
      return {
        headline: 'PERFORMANCE NOTICE: Rotational Speed Droop Detected (<2300 RPM)',
        immediateAction:
          'Inspect drive belt tension and verify carbon brush wear length on commutator assembly.',
        rootCause:
          'Increased bearing viscous friction, glazed carbon brushes, or drive belt slip without excessive electrical short.',
        preventiveWorkOrder:
          'WO-SLW-412: Clean commutator copper segments using isopropyl alcohol, check brush spring tension, apply PTFE lubricant to sleeve bushings.',
        requiredTools: ['Contact Tachometer', 'IPA Cleaning Swabs', 'Feeler Gauge'],
        urgency: 'MEDIUM' as const,
      };

    case 'SENSOR_ANOMALY':
      return {
        headline: 'TRANSDUCER FAULT: Non-Physical Out-of-Bounds Telemetry',
        immediateAction:
          'Verify sensor wire harness continuity, check I2C pullup resistors, and inspect 10k/20k voltage divider on ACS712 ADC input.',
        rootCause:
          'Loose Dupont jumper, electromagnetic noise coupling from DC motor brush arcing, or sensor hardware brownout.',
        preventiveWorkOrder:
          'WO-SNS-501: Inspect MPU6050 solder joints, test DS18B20 4.7kΩ pull-up voltage, verify ESP32 3.3V power rail stability.',
        requiredTools: ['Oscilloscope / Logic Analyzer', 'Soldering Station', 'Precision Multimeter'],
        urgency: 'MEDIUM' as const,
      };

    case 'NORMAL_OPERATION':
    default:
      return {
        headline: 'SYSTEM NOMINAL: All Telemetry Within Design Envelope',
        immediateAction:
          'Asset operating normally. Continue scheduled monitoring and automated telemetry ingestion.',
        rootCause:
          'Normal electro-mechanical equilibrium. Voltage ~12.0V, current ~0.95A, speed ~2850 RPM, vibration ~0.8g, temp ~32°C.',
        preventiveWorkOrder:
          'WO-PM-001: Next scheduled 500-hour visual inspection, commutator cleanliness audit, and bearing acoustic baseline.',
        requiredTools: ['Standard Maintenance Logbook', 'Digital Multimeter'],
        urgency: 'LOW' as const,
      };
  }
}

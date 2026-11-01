/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FaultScenario, IndustrialAlert, SeverityLevel, TelemetryReading } from '../types/telemetry';

export interface AutomationState {
  consecutiveFaultCount: number;
  requiredDebounce: number; // 3
  lastFaultScenario: FaultScenario;
  lastAlertTimestamp: number;
  cooldownPeriodMs: number; // 15,000 ms
  cooldownRemainingSeconds: number;
  activeAlerts: IndustrialAlert[];
  alertHistory: IndustrialAlert[];
  hardwareActuation: {
    ledState: 'OFF' | 'BLINKING_AMBER' | 'SOLID_RED';
    buzzerState: 'OFF' | 'PULSED_BEEP' | 'CONTINUOUS_ALARM';
    safetyRelayTrip: boolean;
  };
}

export class IndustrialAutomationEngine {
  private consecutiveFaultCount: number = 0;
  private readonly requiredDebounce: number = 3;
  private lastFaultScenario: FaultScenario = 'NORMAL_OPERATION';
  private lastAlertTime: number = 0;
  private readonly cooldownPeriodMs: number = 15000;
  private activeAlerts: IndustrialAlert[] = [];
  private alertHistory: IndustrialAlert[] = [];
  private emergencyTripped: boolean = false;

  public processReading(
    reading: TelemetryReading,
    scenario: FaultScenario,
    severity: SeverityLevel
  ): AutomationState {
    const now = Date.now();
    const isFault = scenario !== 'NORMAL_OPERATION';

    if (isFault) {
      if (this.lastFaultScenario === scenario) {
        this.consecutiveFaultCount++;
      } else {
        this.consecutiveFaultCount = 1;
        this.lastFaultScenario = scenario;
      }

      // Check if debounce threshold (N=3) is met
      if (this.consecutiveFaultCount >= this.requiredDebounce) {
        const timeSinceLastAlert = now - this.lastAlertTime;

        if (timeSinceLastAlert >= this.cooldownPeriodMs) {
          this.triggerAlert(scenario, severity, reading);
          this.lastAlertTime = now;
        }
      }
    } else {
      // Normal reading resets consecutive fault counter
      if (this.consecutiveFaultCount > 0) {
        this.consecutiveFaultCount = 0;
      }
      this.lastFaultScenario = 'NORMAL_OPERATION';
    }

    const timeSinceLastAlert = now - this.lastAlertTime;
    const cooldownRemaining =
      timeSinceLastAlert < this.cooldownPeriodMs
        ? Math.ceil((this.cooldownPeriodMs - timeSinceLastAlert) / 1000)
        : 0;

    // Determine hardware actuation state for ESP32
    let ledState: 'OFF' | 'BLINKING_AMBER' | 'SOLID_RED' = 'OFF';
    let buzzerState: 'OFF' | 'PULSED_BEEP' | 'CONTINUOUS_ALARM' = 'OFF';

    const hasCriticalActive = this.activeAlerts.some((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE');
    const hasWarningActive = this.activeAlerts.some((a) => a.severity === 'WARNING' && a.status === 'ACTIVE');

    if (hasCriticalActive || scenario === 'MOTOR_STALL') {
      ledState = 'SOLID_RED';
      buzzerState = 'CONTINUOUS_ALARM';
      if (scenario === 'MOTOR_STALL') {
        this.emergencyTripped = true;
      }
    } else if (hasWarningActive || severity === 'WARNING') {
      ledState = 'BLINKING_AMBER';
      buzzerState = 'PULSED_BEEP';
    }

    return {
      consecutiveFaultCount: this.consecutiveFaultCount,
      requiredDebounce: this.requiredDebounce,
      lastFaultScenario: this.lastFaultScenario,
      lastAlertTimestamp: this.lastAlertTime,
      cooldownPeriodMs: this.cooldownPeriodMs,
      cooldownRemainingSeconds: cooldownRemaining,
      activeAlerts: [...this.activeAlerts],
      alertHistory: [...this.alertHistory],
      hardwareActuation: {
        ledState,
        buzzerState,
        safetyRelayTrip: this.emergencyTripped,
      },
    };
  }

  private triggerAlert(scenario: FaultScenario, severity: SeverityLevel, reading: TelemetryReading): void {
    const alertId = `ALT-${Date.now().toString().slice(-6)}`;
    const newAlert: IndustrialAlert = {
      alert_id: alertId,
      timestamp: new Date().toISOString(),
      device_id: reading.device_id,
      scenario,
      severity,
      message: this.formatAlertMessage(scenario, reading),
      status: 'ACTIVE',
      debounceCount: this.consecutiveFaultCount,
    };

    // Prepend to active and history
    this.activeAlerts.unshift(newAlert);
    this.alertHistory.unshift(newAlert);

    if (this.alertHistory.length > 50) {
      this.alertHistory.pop();
    }
  }

  private formatAlertMessage(scenario: FaultScenario, r: TelemetryReading): string {
    switch (scenario) {
      case 'MOTOR_STALL':
        return `CRITICAL FAULT: Motor shaft stalled at 0 RPM with inrush current of ${r.current_a.toFixed(2)}A. Emergency trip commanded.`;
      case 'THERMAL_OVERHEATING':
        return `THERMAL ALARM: Stator winding temperature at ${r.temperature_c.toFixed(1)}°C exceeds 65°C limit. Cooling required.`;
      case 'EXCESSIVE_VIBRATION':
        return `VIBRATION ALARM: MPU6050 3-axis RMS at ${r.vibration_rms_g.toFixed(2)}g exceeds ISO 10816 Zone D safety ceiling.`;
      case 'MECHANICAL_OVERLOAD':
        return `OVERLOAD WARNING: Current load ${r.current_a.toFixed(2)}A causes speed droop to ${r.speed_rpm} RPM.`;
      case 'SLOWDOWN_DEGRADATION':
        return `PERFORMANCE WARNING: Motor speed slowed to ${r.speed_rpm} RPM with normal current draw. Check mechanical drag.`;
      case 'SENSOR_ANOMALY':
        return `DATA ANOMALY: Sensor telemetry violated physical sanity checks (T:${r.temperature_c}°C, V:${r.vibration_rms_g}g).`;
      default:
        return `Nominal state report for ${r.device_id}.`;
    }
  }

  public acknowledgeAlert(alertId: string, operatorName: string = 'Operator'): void {
    const alert = this.activeAlerts.find((a) => a.alert_id === alertId);
    if (alert) {
      alert.status = 'ACKNOWLEDGED';
      alert.acknowledgedBy = operatorName;
      alert.acknowledgedAt = new Date().toISOString();
    }
    const histAlert = this.alertHistory.find((a) => a.alert_id === alertId);
    if (histAlert) {
      histAlert.status = 'ACKNOWLEDGED';
      histAlert.acknowledgedBy = operatorName;
      histAlert.acknowledgedAt = new Date().toISOString();
    }
  }

  public resolveAlert(alertId: string, operatorNotes?: string): void {
    const alertIndex = this.activeAlerts.findIndex((a) => a.alert_id === alertId);
    if (alertIndex !== -1) {
      const alert = this.activeAlerts[alertIndex];
      alert.status = 'RESOLVED';
      alert.resolvedAt = new Date().toISOString();
      if (operatorNotes) alert.operatorNotes = operatorNotes;
      this.activeAlerts.splice(alertIndex, 1);
    }
    const histAlert = this.alertHistory.find((a) => a.alert_id === alertId);
    if (histAlert) {
      histAlert.status = 'RESOLVED';
      histAlert.resolvedAt = new Date().toISOString();
      if (operatorNotes) histAlert.operatorNotes = operatorNotes;
    }
  }

  public resetSafetyTrip(): void {
    this.emergencyTripped = false;
  }

  public clearAllAlerts(): void {
    this.activeAlerts = [];
    this.consecutiveFaultCount = 0;
    this.emergencyTripped = false;
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FaultScenario, TelemetryReading, MotorPhysicsConfig } from '../types/telemetry';

export const DEFAULT_MOTOR_CONFIG: MotorPhysicsConfig = {
  ratedVoltage: 12.0,
  armatureResistance: 2.1,
  backEmfConstant: 0.0375, // V / (rad/s)
  torqueConstant: 0.0375, // N*m / A
  rotorInertia: 0.00018, // kg*m^2
  viscousFriction: 0.00028,
  ambientTemperature: 24.5,
  thermalResistance: 2.8, // C / W
  thermalMass: 45.0, // J / C
  appliedVoltage: 12.0,
  loadTorque_mnm: 45.0, // Nominal ~45 mN*m
};

export class MotorPhysicsSimulator {
  private config: MotorPhysicsConfig;
  private currentScenario: FaultScenario = 'NORMAL_OPERATION';
  private currentTemp: number = 31.8;
  private stepCount: number = 0;
  private sampleCounter: number = 0;

  constructor(initialConfig: Partial<MotorPhysicsConfig> = {}) {
    this.config = { ...DEFAULT_MOTOR_CONFIG, ...initialConfig };
  }

  public setScenario(scenario: FaultScenario): void {
    this.currentScenario = scenario;
  }

  public getScenario(): FaultScenario {
    return this.currentScenario;
  }

  public updateConfig(newConfig: Partial<MotorPhysicsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): MotorPhysicsConfig {
    return { ...this.config };
  }

  public resetThermal(): void {
    this.currentTemp = 28.0;
  }

  public generateReading(): TelemetryReading {
    this.stepCount++;
    this.sampleCounter++;
    const now = new Date();

    const dt = 0.5; // 500ms time step
    const randomNoise = (scale: number = 1.0) => (Math.random() - 0.5) * 2 * scale;
    const gaussianNoise = (scale: number = 1.0) => {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * scale;
    };

    let voltage = this.config.appliedVoltage + gaussianNoise(0.04);
    let current = 0;
    let speedRpm = 0;
    let vibrationRms = 0;
    let loadTorque = this.config.loadTorque_mnm;

    switch (this.currentScenario) {
      case 'NORMAL_OPERATION': {
        // Nominal: 12V, load ~45 mN*m, current ~0.95A, speed ~2850 RPM, vibe ~0.82g
        loadTorque = 45.0 + randomNoise(5.0);
        const targetSpeedRpm = 2860 - (loadTorque - 45.0) * 4.2 + gaussianNoise(12);
        speedRpm = Math.max(0, targetSpeedRpm);
        const backEmf = (speedRpm * 2 * Math.PI / 60) * this.config.backEmfConstant;
        current = Math.max(0.4, (voltage - backEmf) / this.config.armatureResistance) + gaussianNoise(0.03);
        vibrationRms = 0.78 + Math.abs(gaussianNoise(0.07));
        
        // Thermal convergence towards ~32.5 C
        const targetTemp = this.config.ambientTemperature + (current * current * this.config.armatureResistance) * 0.95;
        this.currentTemp += (targetTemp - this.currentTemp) * 0.08;
        break;
      }

      case 'MECHANICAL_OVERLOAD': {
        // Heavy load ~240 mN*m: speed drops to ~1650 RPM, current ~2.9A, vibe ~1.4g, temp climbs
        loadTorque = 240.0 + randomNoise(18.0);
        speedRpm = Math.max(800, 1680 - (this.stepCount % 20) * 5 + gaussianNoise(22));
        const backEmf = (speedRpm * 2 * Math.PI / 60) * this.config.backEmfConstant;
        current = Math.max(2.4, (voltage - backEmf) / this.config.armatureResistance) + gaussianNoise(0.08);
        vibrationRms = 1.42 + Math.abs(gaussianNoise(0.15));
        
        // Target temp reaches ~52 C
        const targetTemp = 54.0 + randomNoise(2.0);
        this.currentTemp += (targetTemp - this.currentTemp) * 0.05 + 0.12;
        break;
      }

      case 'EXCESSIVE_VIBRATION': {
        // Dynamic rotor unbalance / bearing fluting: vibe spikes > 2.8g (up to 4.2g), speed ~2750 RPM, current ~1.15A
        loadTorque = 52.0 + randomNoise(8.0);
        speedRpm = 2760 + gaussianNoise(35);
        const backEmf = (speedRpm * 2 * Math.PI / 60) * this.config.backEmfConstant;
        current = Math.max(0.8, (voltage - backEmf) / this.config.armatureResistance + 0.2) + gaussianNoise(0.05);
        
        // Unbalance harmonic pulse
        const harmonic = Math.sin(this.sampleCounter * 0.8) * 0.9;
        vibrationRms = 3.25 + harmonic + Math.abs(gaussianNoise(0.35));
        
        const targetTemp = 41.0;
        this.currentTemp += (targetTemp - this.currentTemp) * 0.06;
        break;
      }

      case 'THERMAL_OVERHEATING': {
        // Winding insulation stress: temp > 68 C (up to 82 C), current elevated ~1.75A, speed ~2480 RPM
        loadTorque = 90.0 + randomNoise(10.0);
        speedRpm = 2490 + gaussianNoise(25);
        current = 1.78 + gaussianNoise(0.06);
        vibrationRms = 1.25 + Math.abs(gaussianNoise(0.12));
        
        // Steep thermal ramp
        this.currentTemp = Math.min(84.5, this.currentTemp + 0.35 + Math.random() * 0.2);
        break;
      }

      case 'SLOWDOWN_DEGRADATION': {
        // Bearing friction / sleeve wear: RPM slips gradually to ~1950 RPM, current rises slightly ~1.42A
        speedRpm = Math.max(1700, 2020 - (this.stepCount % 30) * 4 + gaussianNoise(18));
        current = 1.45 + gaussianNoise(0.04);
        vibrationRms = 1.15 + Math.abs(gaussianNoise(0.09));
        
        const targetTemp = 42.5;
        this.currentTemp += (targetTemp - this.currentTemp) * 0.06;
        break;
      }

      case 'MOTOR_STALL': {
        // Locked rotor: Speed is exactly 0 RPM, back EMF = 0, stall current surge ~5.1A, rapid thermal surge
        speedRpm = 0.0;
        // Voltage dips slightly under extreme 5A inrush load
        voltage = 11.25 + gaussianNoise(0.08);
        current = (voltage / this.config.armatureResistance) + gaussianNoise(0.12); // ~5.35 A
        vibrationRms = 0.38 + Math.abs(gaussianNoise(0.06)); // Low mechanical rotation vibe, but electrical hum
        
        // Extreme Joule heating: I^2 * R ~ 55W!
        this.currentTemp = Math.min(92.0, this.currentTemp + 0.85 + Math.random() * 0.3);
        break;
      }

      case 'SENSOR_ANOMALY': {
        // Transducer fault: erratic spike, ADC glitch, or sensor disconnect
        const glitchType = this.sampleCounter % 4;
        if (glitchType === 0) {
          // Temperature ADC discontinuity
          this.currentTemp = 188.4;
          speedRpm = 2840;
          current = 0.95;
          vibrationRms = 0.82;
        } else if (glitchType === 1) {
          // Vibration sensor clipping
          vibrationRms = 14.85;
          speedRpm = 2850;
          current = 0.92;
        } else if (glitchType === 2) {
          // Tachometer sensor pulse dropout
          speedRpm = 9850; // Hallucinated impossible RPM
          current = 0.94;
          vibrationRms = 0.81;
        } else {
          // Negative or crazy current reading
          current = -12.4;
          speedRpm = 2840;
          vibrationRms = 0.82;
        }
        break;
      }
    }

    const power = voltage * current;
    const torque = speedRpm > 0 ? (power * 0.85 * 60) / (2 * Math.PI * speedRpm) * 1000 : loadTorque;

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      event_id: eventId,
      device_id: 'motor01',
      timestamp: now.toISOString(),
      temperature_c: Number(this.currentTemp.toFixed(2)),
      vibration_rms_g: Number(Math.max(0, vibrationRms).toFixed(3)),
      current_a: Number(current.toFixed(2)),
      speed_rpm: Number(Math.max(0, Math.round(speedRpm))),
      voltage_v: Number(voltage.toFixed(2)),
      power_w: Number(Math.max(0, power).toFixed(2)),
      torque_mnm: Number(Math.max(0, torque).toFixed(1)),
      scenario: this.currentScenario,
    };
  }
}

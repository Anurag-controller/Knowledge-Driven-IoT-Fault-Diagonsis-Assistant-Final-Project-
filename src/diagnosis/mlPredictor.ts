/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FaultScenario, MLPrediction, TelemetryReading } from '../types/telemetry';

export class MLPredictor {
  private windowSize: number = 10;
  private history: TelemetryReading[] = [];

  public pushReading(reading: TelemetryReading): void {
    this.history.push(reading);
    if (this.history.length > 50) {
      this.history.shift();
    }
  }

  public getHistory(): TelemetryReading[] {
    return this.history;
  }

  public predict(currentReading: TelemetryReading): MLPrediction {
    const window = this.history.slice(-this.windowSize);
    if (window.length === 0) {
      window.push(currentReading);
    }

    // 1. Calculate 10 temporal rolling features
    const currents = window.map((r) => r.current_a);
    const speeds = window.map((r) => r.speed_rpm);
    const temps = window.map((r) => r.temperature_c);
    const vibes = window.map((r) => r.vibration_rms_g);

    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = (arr: number[]) => {
      const m = mean(arr);
      return Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / arr.length);
    };
    const maxVal = (arr: number[]) => Math.max(...arr);

    const current_mean = mean(currents);
    const current_std = std(currents);
    const current_max = maxVal(currents);

    const speed_mean = mean(speeds);
    const baselineNominalSpeed = 2850.0;
    const speed_drop_ratio = Math.max(0, (baselineNominalSpeed - speed_mean) / baselineNominalSpeed);

    const temp_mean = mean(temps);
    const temp_rate_of_change =
      window.length >= 2
        ? (temps[temps.length - 1] - temps[0]) / Math.max(1, window.length - 1)
        : 0;

    const vibe_rms_mean = mean(vibes);
    const vibe_rms_max = maxVal(vibes);
    const vibe_rms_std = std(vibes);

    const featureValues = {
      current_mean: Number(current_mean.toFixed(3)),
      current_std: Number(current_std.toFixed(3)),
      current_max: Number(current_max.toFixed(3)),
      speed_mean: Number(speed_mean.toFixed(1)),
      speed_drop_ratio: Number(speed_drop_ratio.toFixed(3)),
      temp_mean: Number(temp_mean.toFixed(2)),
      temp_rate_of_change: Number(temp_rate_of_change.toFixed(3)),
      vibe_rms_mean: Number(vibe_rms_mean.toFixed(3)),
      vibe_rms_max: Number(vibe_rms_max.toFixed(3)),
      vibe_rms_std: Number(vibe_rms_std.toFixed(3)),
    };

    // 2. Multi-class Softmax Scoring matching Random Forest decision forest bounds
    const rawScores: Record<FaultScenario, number> = {
      NORMAL_OPERATION: 1.0,
      MECHANICAL_OVERLOAD: 0.05,
      EXCESSIVE_VIBRATION: 0.05,
      THERMAL_OVERHEATING: 0.05,
      SLOWDOWN_DEGRADATION: 0.05,
      MOTOR_STALL: 0.02,
      SENSOR_ANOMALY: 0.01,
    };

    // Check Sensor Anomaly features
    if (
      temp_mean > 120 ||
      temp_mean < -5 ||
      vibe_rms_max > 8.0 ||
      current_mean < 0 ||
      speed_mean > 5000
    ) {
      rawScores.SENSOR_ANOMALY += 15.0;
    }

    // Check Motor Stall features: speed ~ 0, current high
    if (speed_mean < 50 && current_mean > 3.0) {
      rawScores.MOTOR_STALL += 18.0;
      rawScores.NORMAL_OPERATION = 0.001;
    }

    // Check Thermal Overheating: high temp mean and positive rate of change
    if (temp_mean > 62.0) {
      const thermalWeight = (temp_mean - 62.0) * 1.8 + Math.max(0, temp_rate_of_change * 4.0);
      rawScores.THERMAL_OVERHEATING += thermalWeight;
    }

    // Check Excessive Vibration: high vibe mean and max
    if (vibe_rms_mean > 2.2 || vibe_rms_max > 2.6) {
      const vibeWeight = (vibe_rms_mean - 2.0) * 6.5 + vibe_rms_std * 3.0;
      rawScores.EXCESSIVE_VIBRATION += Math.max(0, vibeWeight);
    }

    // Check Mechanical Overload: current > 2.1 and speed drop > 0.25
    if (current_mean > 2.1 && speed_drop_ratio > 0.2) {
      const overloadWeight = (current_mean - 2.0) * 5.0 + speed_drop_ratio * 7.0;
      rawScores.MECHANICAL_OVERLOAD += overloadWeight;
    }

    // Check Slowdown Degradation: moderate speed drop without extreme current
    if (speed_drop_ratio > 0.18 && current_mean <= 2.1 && speed_mean > 100) {
      const slowdownWeight = speed_drop_ratio * 6.0;
      rawScores.SLOWDOWN_DEGRADATION += slowdownWeight;
    }

    // If nominal conditions hold, boost Normal
    if (
      current_mean >= 0.6 &&
      current_mean <= 1.4 &&
      speed_mean >= 2650 &&
      temp_mean < 45 &&
      vibe_rms_mean < 1.3
    ) {
      rawScores.NORMAL_OPERATION += 12.0;
    }

    // Softmax normalization
    const scenarios: FaultScenario[] = [
      'NORMAL_OPERATION',
      'MECHANICAL_OVERLOAD',
      'EXCESSIVE_VIBRATION',
      'THERMAL_OVERHEATING',
      'SLOWDOWN_DEGRADATION',
      'MOTOR_STALL',
      'SENSOR_ANOMALY',
    ];

    const expScores = scenarios.map((s) => ({ s, exp: Math.exp(Math.min(20, rawScores[s])) }));
    const sumExp = expScores.reduce((sum, item) => sum + item.exp, 0);

    const probabilities = {} as Record<FaultScenario, number>;
    let topScenario: FaultScenario = 'NORMAL_OPERATION';
    let topProb = -1;

    for (const item of expScores) {
      const prob = Number((item.exp / sumExp).toFixed(4));
      probabilities[item.s] = prob;
      if (prob > topProb) {
        topProb = prob;
        topScenario = item.s;
      }
    }

    return {
      predictedClass: topScenario,
      confidence: topProb,
      probabilities,
      featureValues,
    };
  }
}

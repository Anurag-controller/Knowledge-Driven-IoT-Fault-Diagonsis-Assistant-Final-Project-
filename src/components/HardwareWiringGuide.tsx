/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cpu, ShieldAlert, CheckCircle, Zap, Terminal, AlertTriangle } from 'lucide-react';

interface PinMapping {
  pin: string;
  sensor: string;
  voltage: string;
  protocol: string;
  conditioning: string;
  safetyCheck: string;
}

export const HardwareWiringGuide: React.FC = () => {
  const [selectedSensor, setSelectedSensor] = useState<string>('ACS712');

  const pinMappings: PinMapping[] = [
    {
      pin: 'GPIO 21 (SDA) / GPIO 22 (SCL)',
      sensor: 'MPU6050 Accelerometer & Gyro',
      voltage: '3.3V VCC',
      protocol: 'I2C Bus (400 kHz Fast Mode)',
      conditioning: '4.7 kΩ pull-up resistors to 3.3V rail. Sampling window 100 samples AC-coupled RMS.',
      safetyCheck: 'Verify logic level is 3.3V; powering from 5V without level shifter can damage ESP32 silicon.',
    },
    {
      pin: 'GPIO 4 (DQ)',
      sensor: 'DS18B20 Digital Temp Probe',
      voltage: '3.3V VCC',
      protocol: 'Dallas 1-Wire Protocol (12-bit resolution)',
      conditioning: 'External 4.7 kΩ pull-up resistor required between DQ and 3.3V.',
      safetyCheck: 'Waterproof stainless steel casing must be thermally coupled to stator with heat sink paste.',
    },
    {
      pin: 'GPIO 36 / SENSOR_VP (ADC1_CH0)',
      sensor: 'ACS712-05B Hall Current Sensor',
      voltage: '5V VCC (Divider to 3.3V)',
      protocol: 'Analog ADC (12-bit / 0–4095)',
      conditioning: 'MANDATORY 10 kΩ / 20 kΩ resistive voltage divider to scale 0–5V output to safe 0–3.3V.',
      safetyCheck: 'CRITICAL: Direct 5V connection to GPIO 36 will fry the ESP32 ADC input! Auto-zero calibrated at 2.5V quiescent point.',
    },
    {
      pin: 'GPIO 18',
      sensor: 'Optical Slot Tachometer (IR)',
      voltage: '3.3V VCC',
      protocol: 'Hardware Interrupt (FALLING edge ISR)',
      conditioning: 'Internal pull-up enabled. Optical disc with 20 slotted encoder teeth.',
      safetyCheck: 'Keep optical sensor shielded from ambient stray fluorescent lighting to prevent pulse jitter.',
    },
    {
      pin: 'GPIO 2',
      sensor: 'Status Warning LED',
      voltage: '3.3V Output',
      protocol: 'Digital GPIO Output',
      conditioning: '330 Ω current limiting resistor in series with cathode to GND.',
      safetyCheck: 'Limits pin sink current to < 10 mA, well below ESP32 20 mA pin limit.',
    },
    {
      pin: 'GPIO 15',
      sensor: 'Piezo Alarm Buzzer',
      voltage: '5V / 12V Rail',
      protocol: 'PWM Tone Generator (LEDC Peripheral)',
      conditioning: '2N2222 NPN switching transistor with 1 kΩ base resistor and flyback diode 1N4148.',
      safetyCheck: 'Never drive piezo buzzer coil directly from GPIO pin to prevent inductive kickback.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Hardware Overview Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Layer 6: ESP32 Edge Hardware Blueprint & Wiring Guide</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production electrical schematic, optoisolation boundaries, and PlatformIO C++ firmware pinout
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/80">
            Target MCU: ESP32-WROOM-32D
          </span>
        </div>

        {/* Electrical Safety Checklist */}
        <div className="bg-amber-950/30 border border-amber-900/60 rounded-lg p-3.5 mb-6 text-xs text-amber-200">
          <div className="flex items-center gap-2 font-semibold mb-1 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Essential Electrical Safety & Common-Ground Architecture</span>
          </div>
          <p className="leading-relaxed text-[11px] text-amber-300/90">
            1. <strong>Shared Common Ground:</strong> The external 12V 2A DC motor power supply GND MUST be bonded to the ESP32 GND rail. Without a shared ground reference, the ACS712 ADC voltage reference floats erratically.
            <br />
            2. <strong>Inductive Kickback Protection:</strong> Always connect a 1N4007 flyback diode across the 12V motor terminals (cathode to +12V, anode to GND) or use an L298N driver board with onboard clamping diodes.
          </p>
        </div>

        {/* Pin Mapping Interactive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2.5 font-medium">ESP32 Pin</th>
                <th className="pb-2.5 font-medium">Peripheral / Sensor</th>
                <th className="pb-2.5 font-medium">Bus Protocol</th>
                <th className="pb-2.5 font-medium">Conditioning Circuit</th>
                <th className="pb-2.5 font-medium">Safety Invariant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {pinMappings.map((m) => (
                <tr key={m.pin} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 text-sky-400 font-semibold">{m.pin}</td>
                  <td className="py-3 text-slate-200 font-sans font-medium">{m.sensor}</td>
                  <td className="py-3 text-slate-300">{m.protocol}</td>
                  <td className="py-3 text-slate-400 font-sans text-[11px]">{m.conditioning}</td>
                  <td className="py-3 text-amber-300/90 font-sans text-[11px]">{m.safetyCheck}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. PlatformIO Firmware Code Reference */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              PlatformIO Firmware Entry Point (`firmware/src/main.cpp`)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Non-blocking FreeRTOS Loop</span>
        </div>

        <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`// ==============================================================================
// Knowledge-Driven IoT-Based Fault Diagnosis System — ESP32 Edge Firmware
// ==============================================================================
#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <MPU6050.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"

// Non-blocking telemetry acquisition ISR
void IRAM_ATTR onOpticalPulse() {
    pulseCount++;
}

void publishTelemetry() {
    float rpm = (pulseCount / 20.0) * (60000.0 / SAMPLE_INTERVAL_MS);
    float tempC = readDS18B20();
    float currentA = readACS712Calibrated();
    float vibeRms = readMPU6050RmsG();

    StaticJsonDocument<256> doc;
    doc["device_id"] = DEVICE_ID;
    doc["timestamp"] = getIsoTimestamp();
    doc["temperature_c"] = tempC;
    doc["vibration_rms_g"] = vibeRms;
    doc["current_a"] = currentA;
    doc["speed_rpm"] = (int)rpm;
    doc["voltage_v"] = 12.00;

    char buffer[256];
    serializeJson(doc, buffer);
    mqttClient.publish("iot/factory/motor01/sensors", buffer);
}`}
        </pre>
      </div>
    </div>
  );
};

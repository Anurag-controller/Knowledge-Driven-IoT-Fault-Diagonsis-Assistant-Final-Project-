/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MotorPhysicsConfig } from '../types/telemetry';
import { Sliders, RefreshCw, Cpu, Zap } from 'lucide-react';

interface MotorPhysicsSandboxProps {
  config: MotorPhysicsConfig;
  onUpdateConfig: (newConfig: Partial<MotorPhysicsConfig>) => void;
  onResetDefaults: () => void;
}

export const MotorPhysicsSandbox: React.FC<MotorPhysicsSandboxProps> = ({
  config,
  onUpdateConfig,
  onResetDefaults,
}) => {
  const [voltage, setVoltage] = useState(config.appliedVoltage);
  const [loadTorque, setLoadTorque] = useState(config.loadTorque_mnm);
  const [ambientTemp, setAmbientTemp] = useState(config.ambientTemperature);
  const [armatureR, setArmatureR] = useState(config.armatureResistance);

  const handleVoltageChange = (v: number) => {
    setVoltage(v);
    onUpdateConfig({ appliedVoltage: v });
  };

  const handleLoadChange = (t: number) => {
    setLoadTorque(t);
    onUpdateConfig({ loadTorque_mnm: t });
  };

  const handleTempChange = (t: number) => {
    setAmbientTemp(t);
    onUpdateConfig({ ambientTemperature: t });
  };

  const handleArmatureChange = (r: number) => {
    setArmatureR(r);
    onUpdateConfig({ armatureResistance: r });
  };

  // Electro-mechanical parameters
  const Ke = config.backEmfConstant; // 0.0375 V / (rad/s)
  const Kt = config.torqueConstant; // 0.0375 N*m / A

  // No-load speed in RPM
  const noLoadRadS = voltage / Ke;
  const noLoadRpm = (noLoadRadS * 60) / (2 * Math.PI);

  // Stall current & stall torque (mN*m)
  const stallCurrent = voltage / armatureR;
  const stallTorqueMnm = stallCurrent * Kt * 1000;

  // Operating point
  const currentDraw = Math.min(
    stallCurrent,
    Math.max(0.2, (loadTorque / 1000) / Kt + 0.3)
  );
  const operatingBackEmf = Math.max(0, voltage - currentDraw * armatureR);
  const operatingRpm = Math.max(0, Math.round(((operatingBackEmf / Ke) * 60) / (2 * Math.PI)));
  const electPower = voltage * currentDraw;
  const mechPower = (operatingRpm * 2 * Math.PI / 60) * (loadTorque / 1000);
  const efficiency = electPower > 0 ? Math.min(95, Math.max(0, Math.round((mechPower / electPower) * 100))) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>12V DC Motor Electro-Mechanical Physics Sandbox</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live parameter tuning evaluating steady-state Speed-Torque differential equations: $V_a = I_a R_a + K_e \omega$
            </p>
          </div>
          <button
            onClick={() => {
              onResetDefaults();
              setVoltage(12.0);
              setLoadTorque(45.0);
              setAmbientTemp(24.5);
              setArmatureR(2.1);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Sliders Controls */}
          <div className="lg:col-span-6 space-y-4">
            {/* 1. Applied Voltage */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Applied DC Bus Voltage ($V_a$):</span>
                <span className="font-mono text-sky-400 font-semibold">{voltage.toFixed(1)} V</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={voltage}
                onChange={(e) => handleVoltageChange(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0 V (Off)</span>
                <span>12 V (Rated)</span>
                <span>15 V (Overvoltage)</span>
              </div>
            </div>

            {/* 2. Mechanical Load Torque */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Mechanical Counter-Torque (τ_load):</span>
                <span className="font-mono text-amber-400 font-semibold">{loadTorque.toFixed(0)} mN·m</span>
              </div>
              <input
                type="range"
                min="0"
                max="400"
                step="5"
                value={loadTorque}
                onChange={(e) => handleLoadChange(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0 mN·m (Free Spin)</span>
                <span>45 mN·m (Rated)</span>
                <span>400 mN·m (Stall Range)</span>
              </div>
            </div>

            {/* 3. Armature Resistance */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Armature Winding Resistance (R_a):</span>
                <span className="font-mono text-purple-400 font-semibold">{armatureR.toFixed(1)} Ω</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={armatureR}
                onChange={(e) => handleArmatureChange(parseFloat(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>1.0 Ω (Cool Low R)</span>
                <span>2.1 Ω (Nominal)</span>
                <span>5.0 Ω (High-R Degraded)</span>
              </div>
            </div>

            {/* 4. Ambient Temperature */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Chamber Ambient Temperature (T_amb):</span>
                <span className="font-mono text-rose-400 font-semibold">{ambientTemp.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="1"
                value={ambientTemp}
                onChange={(e) => handleTempChange(parseFloat(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>10 °C</span>
                <span>25 °C (Room)</span>
                <span>60 °C (Industrial Oven)</span>
              </div>
            </div>
          </div>

          {/* Speed-Torque Interactive Characteristic Curve Visualizer */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-slate-950/70 border border-slate-800/80 rounded-lg p-4">
            <div className="border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-semibold text-slate-200">
                Speed-Torque Characteristic Curve
              </span>
              <p className="text-[11px] text-slate-400">
                Slope $d\omega / d\tau = - R_a / (K_e K_t) = -{(armatureR / (Ke * Kt)).toFixed(1)}$ rad/(s·N·m)
              </p>
            </div>

            {/* Characteristic SVG Graph */}
            <div className="h-48 w-full relative flex items-center justify-center">
              <svg viewBox="0 0 320 180" className="w-full h-full">
                {/* Axes */}
                <line x1="35" y1="150" x2="300" y2="150" stroke="#475569" strokeWidth="1.5" />
                <line x1="35" y1="15" x2="35" y2="150" stroke="#475569" strokeWidth="1.5" />

                {/* Grid */}
                <line x1="35" y1="82" x2="300" y2="82" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="167" y1="15" x2="167" y2="150" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

                {/* Characteristic Speed-Torque Line from No-load (left-top) to Stall (right-bottom) */}
                <line
                  x1="35"
                  y1={150 - Math.min(130, (noLoadRpm / 3500) * 130)}
                  x2={Math.min(300, 35 + (stallTorqueMnm / 400) * 265)}
                  y2="150"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />

                {/* Current Operating Point Marker */}
                {noLoadRpm > 0 && stallTorqueMnm > 0 && (
                  <g>
                    <circle
                      cx={Math.min(300, Math.max(35, 35 + (loadTorque / 400) * 265))}
                      cy={Math.max(20, Math.min(150, 150 - (operatingRpm / 3500) * 130))}
                      r="6"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={Math.min(270, Math.max(50, 45 + (loadTorque / 400) * 265))}
                      y={Math.max(35, 140 - (operatingRpm / 3500) * 130)}
                      fill="#f59e0b"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Operating Point ({operatingRpm} RPM)
                    </text>
                  </g>
                )}

                {/* Axis Labels */}
                <text x="35" y="165" fill="#64748b" fontSize="9" fontFamily="monospace">
                  0
                </text>
                <text x="270" y="165" fill="#64748b" fontSize="9" fontFamily="monospace">
                  Torque (mN·m)
                </text>
                <text x="5" y="25" fill="#64748b" fontSize="9" fontFamily="monospace" transform="rotate(-90 20 25)">
                  RPM
                </text>
              </svg>
            </div>

            {/* Calculated Operational Quantities */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 mt-2 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">No-Load Speed (ω₀):</span>
                <span className="font-mono text-slate-200">{Math.round(noLoadRpm)} RPM</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Stall Torque (τ_stall):</span>
                <span className="font-mono text-slate-200">{Math.round(stallTorqueMnm)} mN·m</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Operating Current:</span>
                <span className="font-mono text-slate-200">{currentDraw.toFixed(2)} A</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Electromechanical η:</span>
                <span className="font-mono text-emerald-400">{efficiency}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

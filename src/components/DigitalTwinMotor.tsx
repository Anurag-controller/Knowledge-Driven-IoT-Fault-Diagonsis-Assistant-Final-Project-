/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TelemetryReading, FaultScenario } from '../types/telemetry';
import { Info, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface DigitalTwinMotorProps {
  reading: TelemetryReading;
  isStalled: boolean;
}

type ComponentPart = 'windings' | 'brushes' | 'magnets' | 'bearings' | 'shaft' | null;

export const DigitalTwinMotor: React.FC<DigitalTwinMotorProps> = ({ reading, isStalled }) => {
  const [selectedPart, setSelectedPart] = useState<ComponentPart>('windings');
  const [rotationAngle, setRotationAngle] = useState(0);

  // Compute rotation speed for animation frame
  useEffect(() => {
    if (reading.speed_rpm <= 0 || isStalled) return;

    let animId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      // Degrees per second: (RPM / 60) * 360
      const degPerSec = (reading.speed_rpm / 60) * 360 * 0.15; // Scaled for pleasant visual frame
      setRotationAngle((prev) => (prev + degPerSec * delta) % 360);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [reading.speed_rpm, isStalled]);

  // Thermal glow color based on temperature
  const getThermalGlow = (temp: number) => {
    if (temp < 40) return 'rgba(34, 197, 94, 0.12)';
    if (temp < 60) return 'rgba(234, 179, 8, 0.22)';
    if (temp < 75) return 'rgba(249, 115, 22, 0.35)';
    return 'rgba(239, 68, 68, 0.55)';
  };

  // Thermal border color
  const getThermalBorder = (temp: number) => {
    if (temp < 40) return '#22c55e';
    if (temp < 60) return '#eab308';
    if (temp < 75) return '#f97316';
    return '#ef4444';
  };

  // Vibration shake amplitude (px)
  const vibeOffset = Math.min(6, (reading.vibration_rms_g / 3.0) * 4);

  const getPartDetails = (part: ComponentPart) => {
    switch (part) {
      case 'windings':
        return {
          name: 'Armature Windings (Rotor)',
          specs: 'Copper Magnet Wire, 2.1 Ω DC Resistance, Class B Insulation (130°C max)',
          status:
            reading.temperature_c > 65
              ? 'Thermal Stress: Elevated Joule heating (I²R). Immediate cooling advised.'
              : 'Nominal resistance and thermal dissipation within limits.',
          condition: reading.temperature_c > 65 ? 'WARNING' : 'HEALTHY',
          action: 'Ensure forced-air ventilation vents are clear of debris.',
        };
      case 'brushes':
        return {
          name: 'Commutator & Carbon Brushes',
          specs: 'Dual Spring-Loaded Carbon Blocks, Segmented Copper Commutator Ring',
          status:
            reading.current_a > 3.0
              ? 'High Arcing Risk: Severe brush sparking under excessive current draw.'
              : 'Smooth mechanical commutating contact; minimal brush arcing.',
          condition: reading.current_a > 3.0 ? 'CRITICAL' : 'HEALTHY',
          action: 'Inspect carbon brush spring tension and clean commutator face with solvent.',
        };
      case 'magnets':
        return {
          name: 'Stator Permanent Magnets',
          specs: 'High-Coercivity Strontium Ferrite / NdFeB Poles (North / South)',
          status:
            reading.temperature_c > 80
              ? 'Irreversible Demagnetization Risk: High temperature degrades remanent flux.'
              : 'Magnetic flux density nominal at ~0.38 Tesla in air gap.',
          condition: reading.temperature_c > 80 ? 'CRITICAL' : 'HEALTHY',
          action: 'Avoid operating casing above 80°C to preserve magnetic field strength.',
        };
      case 'bearings':
        return {
          name: '608ZZ Shielded Ball Bearings',
          specs: 'Deep Groove Radial Ball Bearings, High-Speed Synthetic Polyurea Grease',
          status:
            reading.vibration_rms_g > 2.5
              ? 'Fatigue Spalling: Excessive vibration detected on bearing raceway.'
              : 'Low acoustic signature, smooth rotational race alignment.',
          condition: reading.vibration_rms_g > 2.5 ? 'CRITICAL' : 'HEALTHY',
          action: 'Inspect shaft radial runout with dial gauge and repack bearing grease.',
        };
      case 'shaft':
        return {
          name: 'Hardened Steel Output Shaft',
          specs: 'Ø5.0 mm Ground Alloy Shaft with Machined D-Flat Keyway',
          status: isStalled
            ? 'Shaft Locked: Zero rotational velocity under active torque excitation.'
            : `${reading.speed_rpm} RPM, delivering ${(reading.torque_mnm).toFixed(1)} mN·m torque.`,
          condition: isStalled ? 'CRITICAL' : 'HEALTHY',
          action: 'Verify driven load is free of mechanical jam and backlash.',
        };
      default:
        return null;
    }
  };

  const partInfo = getPartDetails(selectedPart);

  return (
    <div className="bg-[#0d130d] border border-[#1a251a] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-[#182318] pb-3">
        <div>
          <h3 className="font-display font-black text-sm tracking-[0.15em] text-[#8e9f8c] uppercase flex items-center gap-2">
            <span>12V DC MOTOR DIGITAL TWIN (ASSET: MOTOR01)</span>
          </h3>
          <p className="text-[11px] text-[#6d806a] mt-0.5 font-mono">
            Real-time electro-mechanical simulation synchronized with live sensor telemetry
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#6d806a] font-mono text-[11px]">SHAFT:</span>
          <span
            className={`font-mono text-xs font-bold ${
              isStalled
                ? 'text-red-400'
                : reading.speed_rpm > 2500
                ? 'text-[#a3e635]'
                : 'text-amber-400'
            }`}
          >
            {isStalled ? 'LOCKED / STALLED' : `${reading.speed_rpm} RPM`}
          </span>
          <span className="text-[#324430]">|</span>
          <span className="text-[#6d806a] font-mono text-[11px]">CASING:</span>
          <span className="font-mono text-xs font-bold text-white">
            {reading.temperature_c.toFixed(1)} °C
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Interactive Motor Cross-Section Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 bg-[#070b07] border border-[#182318] rounded-xl relative overflow-hidden">
          {/* Thermal glow backdrop */}
          <div
            className="absolute inset-0 transition-all duration-700 pointer-events-none rounded-lg"
            style={{
              background: `radial-gradient(circle at center, ${getThermalGlow(
                reading.temperature_c
              )} 0%, transparent 70%)`,
            }}
          />

          {/* Vibration indicator when severe */}
          {reading.vibration_rms_g > 2.5 && (
            <div className="absolute top-3 left-3 text-[11px] text-amber-400 flex items-center gap-1.5 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>High Vibration Amplitude ({reading.vibration_rms_g.toFixed(2)}g)</span>
            </div>
          )}

          {/* Motor SVG Graphic */}
          <div
            className="relative transition-transform duration-75 my-2"
            style={{
              transform:
                reading.vibration_rms_g > 2.0
                  ? `translate(${(Math.random() - 0.5) * vibeOffset}px, ${(Math.random() - 0.5) * vibeOffset}px)`
                  : 'none',
            }}
          >
            <svg
              viewBox="0 0 420 320"
              className="w-full max-w-[400px] h-auto drop-shadow-2xl select-none"
            >
              <defs>
                {/* Copper coil gradient */}
                <linearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>

                {/* Stator magnet gradients */}
                <linearGradient id="northPoleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="southPoleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#991b1b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>

                {/* Shaft gradient */}
                <linearGradient id="shaftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
              </defs>

              {/* 1. Outer Casing (Thermal Halo) */}
              <circle
                cx="210"
                cy="160"
                r="135"
                fill="#0f172a"
                stroke={getThermalBorder(reading.temperature_c)}
                strokeWidth="4"
                strokeDasharray={reading.temperature_c > 65 ? '6 3' : 'none'}
                className="transition-colors duration-500"
              />

              {/* Stator Mount Feet */}
              <rect x="130" y="280" width="160" height="18" rx="4" fill="#334155" />
              <circle cx="150" cy="289" r="4" fill="#1e293b" />
              <circle cx="270" cy="289" r="4" fill="#1e293b" />

              {/* 2. Permanent Magnets (North on Left, South on Right) */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedPart('magnets')}
              >
                {/* North Magnet (Left Arc) */}
                <path
                  d="M 100 110 A 120 120 0 0 1 100 210 L 130 195 A 90 90 0 0 0 130 125 Z"
                  fill="url(#northPoleGrad)"
                  stroke={selectedPart === 'magnets' ? '#60a5fa' : '#1e3a8a'}
                  strokeWidth="2"
                />
                <text x="96" y="165" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  N
                </text>

                {/* South Magnet (Right Arc) */}
                <path
                  d="M 320 110 A 120 120 0 0 0 320 210 L 290 195 A 90 90 0 0 1 290 125 Z"
                  fill="url(#southPoleGrad)"
                  stroke={selectedPart === 'magnets' ? '#f87171' : '#991b1b'}
                  strokeWidth="2"
                />
                <text x="312" y="165" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  S
                </text>
              </g>

              {/* Magnetic Field Flux Lines (dashed arrows across air gap) */}
              <g stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.35">
                <line x1="135" y1="135" x2="285" y2="135" />
                <line x1="135" y1="160" x2="285" y2="160" />
                <line x1="135" y1="185" x2="285" y2="185" />
              </g>

              {/* 3. Bearings (Front/Rear Raceway) */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedPart('bearings')}
              >
                <circle
                  cx="210"
                  cy="160"
                  r="78"
                  fill="none"
                  stroke={selectedPart === 'bearings' ? '#38bdf8' : '#475569'}
                  strokeWidth="5"
                  strokeDasharray="16 8"
                />
              </g>

              {/* 4. Armature Rotor & Windings (Rotates around center) */}
              <g
                transform={`rotate(${rotationAngle} 210 160)`}
                className="cursor-pointer"
                onClick={() => setSelectedPart('windings')}
              >
                {/* Armature Laminated Core (3-Pole Delta Rotor) */}
                <circle cx="210" cy="160" r="58" fill="#1e293b" stroke="#475569" strokeWidth="2" />

                {/* Pole 1 Coils */}
                <g transform="rotate(0 210 160)">
                  <rect x="200" y="105" width="20" height="35" rx="4" fill="url(#copperGrad)" />
                  <line x1="202" y1="112" x2="218" y2="112" stroke="#fbbf24" strokeWidth="1.5" />
                  <line x1="202" y1="120" x2="218" y2="120" stroke="#fbbf24" strokeWidth="1.5" />
                  <line x1="202" y1="128" x2="218" y2="128" stroke="#fbbf24" strokeWidth="1.5" />
                </g>

                {/* Pole 2 Coils (120 deg) */}
                <g transform="rotate(120 210 160)">
                  <rect x="200" y="105" width="20" height="35" rx="4" fill="url(#copperGrad)" />
                  <line x1="202" y1="112" x2="218" y2="112" stroke="#fbbf24" strokeWidth="1.5" />
                  <line x1="202" y1="120" x2="218" y2="120" stroke="#fbbf24" strokeWidth="1.5" />
                  <line x1="202" y1="128" x2="218" y2="128" stroke="#fbbf24" strokeWidth="1.5" />
                </g>

                {/* Pole 3 Coils (240 deg) */}
                <g transform="rotate(240 210 160)">
                  <rect x="200" y="105" width="20" height="35" rx="4" fill="url(#copperGrad)" />
                  <line x1="202" y1="112" x2="218" y2="112" stroke="#fbbf24" strokeWidth="1.5" />
                  <line x1="202" y1="120" x2="218" y2="120" stroke="#fbbf24" strokeWidth="1.5" />
                  <line x1="202" y1="128" x2="218" y2="128" stroke="#fbbf24" strokeWidth="1.5" />
                </g>

                {/* Commutator Segment Cylinder */}
                <circle cx="210" cy="160" r="26" fill="#d97706" stroke="#92400e" strokeWidth="2" />
                <line x1="210" y1="134" x2="210" y2="186" stroke="#451a03" strokeWidth="1.5" />
                <line x1="184" y1="160" x2="236" y2="160" stroke="#451a03" strokeWidth="1.5" />
              </g>

              {/* 5. Carbon Brushes & Springs (Stationary, Top and Bottom) */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedPart('brushes')}
              >
                {/* Top Positive (+) Brush */}
                <rect x="203" y="122" width="14" height="12" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                {/* Top Brush Spring */}
                <line x1="210" y1="122" x2="210" y2="100" stroke="#94a3b8" strokeWidth="2" strokeDasharray="2 2" />
                <text x="220" y="112" fill="#ef4444" fontSize="11" fontWeight="bold">
                  +12V
                </text>

                {/* Bottom Negative (-) Brush */}
                <rect x="203" y="186" width="14" height="12" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                {/* Bottom Brush Spring */}
                <line x1="210" y1="198" x2="210" y2="220" stroke="#94a3b8" strokeWidth="2" strokeDasharray="2 2" />
                <text x="220" y="216" fill="#3b82f6" fontSize="11" fontWeight="bold">
                  GND
                </text>

                {/* Spark Simulation: Intensifies when current > 2.5A */}
                {reading.current_a > 2.2 && !isStalled && (
                  <g>
                    <circle cx="204" cy="133" r="2.5" fill="#fef08a" />
                    <line x1="202" y1="131" x2="197" y2="128" stroke="#f59e0b" strokeWidth="1.5" />
                    <circle cx="216" cy="188" r="2.5" fill="#fef08a" />
                    <line x1="217" y1="189" x2="222" y2="193" stroke="#f59e0b" strokeWidth="1.5" />
                  </g>
                )}
              </g>

              {/* 6. Center Output Shaft */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedPart('shaft')}
              >
                <circle cx="210" cy="160" r="14" fill="url(#shaftGrad)" stroke="#1e293b" strokeWidth="2" />
                {/* D-Flat Keyway notch */}
                <path d="M 218 153 L 218 167 L 222 165 Z" fill="#0f172a" />
              </g>

              {/* Status Indicator Glow in Center of Shaft */}
              <circle
                cx="210"
                cy="160"
                r="4"
                fill={isStalled ? '#ef4444' : reading.speed_rpm > 2500 ? '#22c55e' : '#f59e0b'}
              />
            </svg>
          </div>

          {/* Quick Component Click Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 z-10">
            <button
              onClick={() => setSelectedPart('windings')}
              className={`px-2.5 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                selectedPart === 'windings'
                  ? 'bg-[#182915] text-[#bef264] border border-[#4d7c0f] shadow-[0_0_10px_rgba(163,230,53,0.2)]'
                  : 'bg-[#0a0f0a] border border-[#1b261b] text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              ARMATURE
            </button>
            <button
              onClick={() => setSelectedPart('brushes')}
              className={`px-2.5 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                selectedPart === 'brushes'
                  ? 'bg-[#182915] text-[#bef264] border border-[#4d7c0f] shadow-[0_0_10px_rgba(163,230,53,0.2)]'
                  : 'bg-[#0a0f0a] border border-[#1b261b] text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              BRUSHES
            </button>
            <button
              onClick={() => setSelectedPart('magnets')}
              className={`px-2.5 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                selectedPart === 'magnets'
                  ? 'bg-[#182915] text-[#bef264] border border-[#4d7c0f] shadow-[0_0_10px_rgba(163,230,53,0.2)]'
                  : 'bg-[#0a0f0a] border border-[#1b261b] text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              STATOR MAGNETS
            </button>
            <button
              onClick={() => setSelectedPart('bearings')}
              className={`px-2.5 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                selectedPart === 'bearings'
                  ? 'bg-[#182915] text-[#bef264] border border-[#4d7c0f] shadow-[0_0_10px_rgba(163,230,53,0.2)]'
                  : 'bg-[#0a0f0a] border border-[#1b261b] text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              608ZZ BEARINGS
            </button>
            <button
              onClick={() => setSelectedPart('shaft')}
              className={`px-2.5 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                selectedPart === 'shaft'
                  ? 'bg-[#182915] text-[#bef264] border border-[#4d7c0f] shadow-[0_0_10px_rgba(163,230,53,0.2)]'
                  : 'bg-[#0a0f0a] border border-[#1b261b] text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              SHAFT
            </button>
          </div>
        </div>

        {/* Selected Part Health & Diagnostic Telemetry Breakdown */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full bg-[#070b07] border border-[#182318] rounded-xl p-4">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-[#182318] pb-2.5 mb-3">
              <span className="text-[11px] font-display font-bold uppercase tracking-wider text-[#738571]">
                COMPONENT DIAGNOSTIC INSIGHT
              </span>
              {partInfo && (
                <span
                  className={`text-[11px] font-mono font-bold ${
                    partInfo.condition === 'CRITICAL'
                      ? 'text-red-400'
                      : partInfo.condition === 'WARNING'
                      ? 'text-amber-400'
                      : 'text-[#a3e635]'
                  }`}
                >
                  {partInfo.condition}
                </span>
              )}
            </div>

            {partInfo ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-display font-bold tracking-wider uppercase text-slate-100">{partInfo.name}</h4>
                  <p className="text-[11px] font-mono text-[#6c7f6a] mt-0.5">{partInfo.specs}</p>
                </div>

                <div className="bg-[#0b100b] border border-[#1a251a] rounded-lg p-2.5">
                  <span className="text-[10px] font-display font-bold uppercase tracking-wider text-[#a3e635] block mb-1">Observation:</span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{partInfo.status}</p>
                </div>

                <div className="bg-[#0b100b] border border-[#1a251a] rounded-lg p-2.5">
                  <span className="text-[10px] font-display font-bold uppercase tracking-wider text-[#a3e635] block mb-1">Prescribed Action:</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{partInfo.action}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#556853]">Click any component to inspect telemetry.</p>
            )}
          </div>

          {/* Quick Physical Parameters Snapshot */}
          <div className="pt-4 mt-4 border-t border-[#182318] grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#5f725d] block text-[10px] font-mono">Joule Loss (I²R):</span>
              <span className="font-mono text-white font-bold">
                {(Math.pow(reading.current_a, 2) * 2.1).toFixed(2)} W
              </span>
            </div>
            <div>
              <span className="text-[#5f725d] block text-[10px] font-mono">Mechanical Power:</span>
              <span className="font-mono text-white font-bold">
                {((reading.speed_rpm * 2 * Math.PI / 60) * (reading.torque_mnm / 1000)).toFixed(2)} W
              </span>
            </div>
            <div>
              <span className="text-[#5f725d] block text-[10px] font-mono">Back-EMF (Eb):</span>
              <span className="font-mono text-white font-bold">
                {((reading.speed_rpm * 2 * Math.PI / 60) * 0.0375).toFixed(2)} V
              </span>
            </div>
            <div>
              <span className="text-[#5f725d] block text-[10px] font-mono">Efficiency (η):</span>
              <span className="font-mono text-[#a3e635] font-bold">
                {reading.power_w > 0
                  ? `${Math.min(94, Math.max(0, Math.round((((reading.speed_rpm * 2 * Math.PI / 60) * (reading.torque_mnm / 1000)) / reading.power_w) * 100)))}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FaultScenario } from '../types/telemetry';
import { PlayCircle, ShieldCheck, AlertOctagon, Flame, Waves, TrendingDown, Shuffle, Cpu } from 'lucide-react';

interface ScenarioControllerProps {
  currentScenario: FaultScenario;
  onSelectScenario: (scenario: FaultScenario) => void;
  frequencyHz: number;
  onChangeFrequency: (hz: number) => void;
  onManualStep: () => void;
  onResetThermal: () => void;
  isRandomWalk: boolean;
  onToggleRandomWalk: () => void;
}

export const ScenarioController: React.FC<ScenarioControllerProps> = ({
  currentScenario,
  onSelectScenario,
  frequencyHz,
  onChangeFrequency,
  onManualStep,
  onResetThermal,
  isRandomWalk,
  onToggleRandomWalk,
}) => {
  const scenarios: {
    id: FaultScenario;
    label: string;
    description: string;
    severityTag: 'NORMAL' | 'WARNING' | 'CRITICAL';
    icon: React.ReactNode;
  }[] = [
    {
      id: 'NORMAL_OPERATION',
      label: 'Normal Operation',
      description: 'Nominal 12V DC, ~2850 RPM, ~0.95A, ~32°C, 0.8g vibration.',
      severityTag: 'NORMAL',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'MECHANICAL_OVERLOAD',
      label: 'Mechanical Overload',
      description: 'Counter-torque ~240 mN·m, speed drops to ~1680 RPM, current ~2.9A.',
      severityTag: 'WARNING',
      icon: <TrendingDown className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'EXCESSIVE_VIBRATION',
      label: 'Excessive Vibration',
      description: 'Rotor dynamic unbalance & bearing fluting, RMS > 2.8g (peaks to 4.2g).',
      severityTag: 'WARNING',
      icon: <Waves className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'THERMAL_OVERHEATING',
      label: 'Thermal Overheating',
      description: 'Insulation limit breached (>65°C up to 82°C), fan blockage.',
      severityTag: 'CRITICAL',
      icon: <Flame className="w-4 h-4 text-red-400" />,
    },
    {
      id: 'SLOWDOWN_DEGRADATION',
      label: 'Slowdown / Drag',
      description: 'Bearing sleeve friction & belt slip, RPM degrades to ~1950 RPM.',
      severityTag: 'WARNING',
      icon: <TrendingDown className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'MOTOR_STALL',
      label: 'Locked-Rotor Stall',
      description: 'Immobilized shaft (0 RPM), 5.3A inrush, rapid thermal climb.',
      severityTag: 'CRITICAL',
      icon: <AlertOctagon className="w-4 h-4 text-red-500" />,
    },
    {
      id: 'SENSOR_ANOMALY',
      label: 'Sensor Anomaly',
      description: 'Transducer glitch, ADC discontinuity, non-physical spikes.',
      severityTag: 'WARNING',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
    },
  ];

  return (
    <div className="bg-[#0d130d] border border-[#1a251a] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-[#182318] pb-3">
        <div>
          <h3 className="font-display font-black text-sm tracking-[0.15em] text-[#8e9f8c] uppercase flex items-center gap-2">
            <span>OPERATIONAL SCENARIO & PHYSICS INJECTOR</span>
          </h3>
          <p className="text-[11px] text-[#6d806a] mt-0.5 font-mono">
            Inject electro-mechanical fault regimes to test rule evaluation and ML classification
          </p>
        </div>

        {/* Streaming frequency and controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#070b07] border border-[#182318] p-0.5 rounded-lg">
            <button
              onClick={() => onChangeFrequency(1)}
              className={`px-2 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                frequencyHz === 1
                  ? 'bg-[#182915] text-[#bef264] border border-[#4d7c0f]'
                  : 'text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              1 HZ
            </button>
            <button
              onClick={() => onChangeFrequency(2)}
              className={`px-2 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                frequencyHz === 2
                  ? 'bg-[#182915] text-[#bef264] border border-[#4d7c0f]'
                  : 'text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              2 HZ
            </button>
            <button
              onClick={() => onChangeFrequency(5)}
              className={`px-2 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                frequencyHz === 5
                  ? 'bg-[#182915] text-[#bef264] border border-[#4d7c0f]'
                  : 'text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              5 HZ
            </button>
          </div>

          <button
            onClick={onToggleRandomWalk}
            className={`px-3 py-1.5 text-xs font-display font-bold tracking-wider rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
              isRandomWalk
                ? 'bg-[#182915] border-[#4d7c0f] text-[#bef264]'
                : 'bg-[#0a0f0a] border-[#1b261b] text-slate-300 hover:bg-[#121a12]'
            }`}
            title="Auto-cycle through fault scenarios every 18 seconds"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isRandomWalk ? 'AUTO ACTIVE' : 'AUTO-CYCLE'}</span>
          </button>

          <button
            onClick={onManualStep}
            className="px-3 py-1.5 text-xs font-display font-bold tracking-wider rounded-lg border border-[#1b261b] bg-[#0a0f0a] text-slate-300 hover:bg-[#121a12] hover:text-[#a3e635] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>STEP +1</span>
          </button>

          <button
            onClick={onResetThermal}
            className="px-3 py-1.5 text-xs font-display font-bold tracking-wider rounded-lg border border-[#1b261b] bg-[#0a0f0a] text-[#71856f] hover:text-white transition-colors cursor-pointer"
          >
            RESET HEAT
          </button>
        </div>
      </div>

      {/* Grid of 7 scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {scenarios.map((sc) => {
          const isSelected = currentScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#182915] border-[#4d7c0f] shadow-[0_0_12px_rgba(163,230,53,0.2)]'
                  : 'bg-[#070b07] border-[#182318] hover:border-[#2b3c2b] hover:bg-[#0c120c]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {sc.icon}
                  <span className="font-display font-bold text-xs tracking-wider text-slate-100 uppercase">
                    {sc.label}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    sc.severityTag === 'CRITICAL'
                      ? 'text-red-400 bg-red-950/60 border border-red-900/60'
                      : sc.severityTag === 'WARNING'
                      ? 'text-amber-400 bg-amber-950/60 border border-amber-900/60'
                      : 'text-[#a3e635] bg-[#121c11] border border-[#23351f]'
                  }`}
                >
                  {sc.severityTag}
                </span>
              </div>
              <p className="text-[11px] text-[#6d806a] leading-snug line-clamp-2 font-sans">
                {sc.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

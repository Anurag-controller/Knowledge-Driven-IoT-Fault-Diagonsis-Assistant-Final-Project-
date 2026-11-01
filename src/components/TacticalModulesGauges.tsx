/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TelemetryReading } from '../types/telemetry';
import { Gauge, Zap, Flame, Crown } from 'lucide-react';

interface TacticalModulesGaugesProps {
  reading: TelemetryReading;
}

export const TacticalModulesGauges: React.FC<TacticalModulesGaugesProps> = ({ reading }) => {
  // Speed percentage (nominal 2850 / 3000 -> 95%)
  const speedPct = Math.min(100, Math.round((reading.speed_rpm / 3000) * 100));
  // Current health percentage (inverted load stress)
  const currentPct = Math.max(10, Math.min(100, Math.round((1 - (reading.current_a - 0.5) / 4.5) * 100)));
  // Temp health percentage (inverted thermal stress)
  const tempPct = Math.max(10, Math.min(100, Math.round((1 - (reading.temperature_c - 20) / 70) * 100)));
  // Vibration health percentage
  const vibePct = Math.max(10, Math.min(100, Math.round((1 - reading.vibration_rms_g / 3.5) * 100)));

  const modules = [
    {
      id: 'speed',
      title: 'ROTOR SPEED',
      icon: <Gauge className="w-4 h-4 text-[#a3e635]" />,
      pct: speedPct,
      subtitle: `${reading.speed_rpm} RPM`,
      daysActive: '6/7 DAYS',
      bars: [true, true, true, true, true, true, false],
    },
    {
      id: 'current',
      title: 'ARMATURE CURRENT',
      icon: <Zap className="w-4 h-4 text-[#a3e635]" />,
      pct: currentPct,
      subtitle: `${reading.current_a.toFixed(2)} A`,
      daysActive: '6/7 DAYS',
      bars: [true, true, true, true, true, true, false],
    },
    {
      id: 'temp',
      title: 'CASING TEMP',
      icon: <Flame className="w-4 h-4 text-[#a3e635]" />,
      pct: tempPct,
      subtitle: `${reading.temperature_c.toFixed(1)} °C`,
      daysActive: '5/7 DAYS',
      bars: [true, true, true, true, true, false, false],
    },
    {
      id: 'vibe',
      title: 'VIBRATION RMS',
      icon: <Crown className="w-4 h-4 text-[#a3e635]" />,
      pct: vibePct,
      subtitle: `${reading.vibration_rms_g.toFixed(2)} g`,
      daysActive: '6/7 DAYS',
      bars: [true, true, true, true, true, true, false],
    },
  ];

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-black text-sm tracking-[0.15em] text-[#8e9f8c] uppercase">
          MODULES
        </h3>
        <span className="text-[11px] font-mono text-[#a3e635]">4 CHANNELS ACTIVE</span>
      </div>

      {/* 4 Circular Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modules.map((mod) => {
          const radius = 34;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (mod.pct / 100) * circumference;

          return (
            <div
              key={mod.id}
              className="bg-[#0d130d] border border-[#1a251a] rounded-2xl p-4 flex flex-col items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-[#2a3c2a] transition-all"
            >
              {/* Card Header with Icon */}
              <div className="flex items-center gap-2 mb-3">
                {mod.icon}
                <span className="font-display font-bold text-xs tracking-wider text-slate-200 uppercase">
                  {mod.title}
                </span>
              </div>

              {/* Glowing Circular Progress Ring */}
              <div className="relative w-24 h-24 my-1 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Track circle */}
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke="#162216"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  {/* Glowing Lime Progress Arc */}
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke="#a3e635"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    filter="drop-shadow(0 0 8px rgba(163,230,53,0.7))"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Percentage in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display font-black text-xl text-white tracking-tight">
                    {mod.pct}%
                  </span>
                </div>
              </div>

              {/* Metrics subtitle */}
              <div className="text-[11px] font-mono font-bold text-[#a3e635] mt-1">
                {mod.subtitle}
              </div>
              <div className="text-[10px] font-mono text-[#627460] mt-0.5">
                {mod.daysActive}
              </div>

              {/* Mini vertical bar indicators (M T W T F S S) */}
              <div className="mt-3 pt-2.5 border-t border-[#172217] w-full flex flex-col items-center">
                <div className="flex items-end justify-between w-full max-w-[120px] h-4 gap-1">
                  {mod.bars.map((isActive, bIdx) => (
                    <div
                      key={bIdx}
                      className={`w-2 rounded-sm transition-all ${
                        isActive
                          ? 'bg-[#a3e635] shadow-[0_0_6px_rgba(163,230,53,0.5)] h-full'
                          : 'bg-[#1b261b] h-2'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between w-full max-w-[120px] text-[8px] font-mono text-[#586b56] mt-1">
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                  <span>S</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

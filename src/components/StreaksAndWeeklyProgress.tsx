/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FaultScenario } from '../types/telemetry';
import { Flame, ShieldCheck, TrendingDown, Waves, AlertOctagon, Cpu, ChevronRight } from 'lucide-react';

interface StreaksAndWeeklyProgressProps {
  currentScenario: FaultScenario;
  onSelectScenario: (s: FaultScenario) => void;
}

export const StreaksAndWeeklyProgress: React.FC<StreaksAndWeeklyProgressProps> = ({
  currentScenario,
  onSelectScenario,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('This Week');

  const streakItems: {
    id: FaultScenario;
    label: string;
    icon: React.ReactNode;
    days: number;
  }[] = [
    {
      id: 'NORMAL_OPERATION',
      label: 'NOMINAL OPERATION',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-[#a3e635]" />,
      days: 23,
    },
    {
      id: 'MECHANICAL_OVERLOAD',
      label: 'OVERLOAD TEST REGIME',
      icon: <TrendingDown className="w-3.5 h-3.5 text-[#a3e635]" />,
      days: 18,
    },
    {
      id: 'EXCESSIVE_VIBRATION',
      label: 'DYNAMIC VIBRATION BENCH',
      icon: <Waves className="w-3.5 h-3.5 text-[#a3e635]" />,
      days: 15,
    },
    {
      id: 'THERMAL_OVERHEATING',
      label: 'THERMAL ENDURANCE RUN',
      icon: <Flame className="w-3.5 h-3.5 text-[#a3e635]" />,
      days: 21,
    },
  ];

  const weeklyBars = [
    { day: 'MON', pct: 60 },
    { day: 'TUE', pct: 68 },
    { day: 'WED', pct: 92 },
    { day: 'THU', pct: 72 },
    { day: 'FRI', pct: 85 },
    { day: 'SAT', pct: 88 },
    { day: 'SUN', pct: 65 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Streaks List Card (Col 6) */}
        <div className="md:col-span-6 bg-[#0d130d] border border-[#1a251a] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <h4 className="font-display font-black text-xs tracking-[0.15em] text-[#8e9f8c] uppercase mb-4">
              OPERATIONAL STREAKS
            </h4>

            <div className="space-y-3">
              {streakItems.map((item) => {
                const isSelected = currentScenario === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectScenario(item.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#182715] border-[#4d7c0f] shadow-[0_0_12px_rgba(163,230,53,0.15)]'
                        : 'bg-[#0a0f0a] border-[#162016] hover:border-[#253625]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-display font-bold text-xs tracking-wider text-slate-200 uppercase">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs text-[#a3e635]">
                      <Flame className="w-3.5 h-3.5 text-[#a3e635]" />
                      <span className="font-bold">{item.days} DAYS</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onSelectScenario('NORMAL_OPERATION')}
            className="mt-4 pt-3 border-t border-[#172217] flex items-center justify-center gap-1 text-xs font-display font-bold tracking-wider text-[#a3e635] hover:text-[#bef264] transition-colors cursor-pointer uppercase"
          >
            <span>VIEW ALL REGIMES</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Weekly Progress Columns (Col 6) */}
        <div className="md:col-span-6 bg-[#0d130d] border border-[#1a251a] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display font-black text-xs tracking-[0.15em] text-[#8e9f8c] uppercase">
                WEEKLY TELEMETRY LOAD
              </h4>
              <span className="text-[10px] font-mono text-[#a3e635] bg-[#121c11] border border-[#23351f] px-2 py-0.5 rounded">
                This Week ▾
              </span>
            </div>

            {/* Bar Chart Container */}
            <div className="h-44 w-full flex items-end justify-between gap-3 px-2 pt-6">
              {weeklyBars.map((b) => (
                <div key={b.day} className="flex-1 flex flex-col items-center h-full justify-end">
                  {/* Bar */}
                  <div className="w-full max-w-[28px] bg-[#141d14] rounded-t-sm h-full flex items-end overflow-hidden">
                    <div
                      className="w-full bg-[#a3e635] rounded-t-sm transition-all duration-700 shadow-[0_0_10px_rgba(163,230,53,0.3)] hover:bg-[#bef264]"
                      style={{ height: `${b.pct}%` }}
                    />
                  </div>
                  {/* Day Label */}
                  <span className="text-[10px] font-mono text-[#5f725d] mt-2 font-medium">
                    {b.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#172217] flex items-center justify-between text-[11px] font-mono text-[#6c7f6a]">
            <span>AVG STABILITY: 78.5%</span>
            <span className="text-[#a3e635] font-bold">PEAK: WED (92%)</span>
          </div>
        </div>
      </div>

      {/* Spartan Motto Bottom Banner Bar */}
      <div className="rounded-xl bg-[#090d09] border border-[#182318] p-3 flex items-center justify-center gap-3 text-center">
        <svg
          viewBox="0 0 100 100"
          className="w-5 h-5 text-[#a3e635] shrink-0"
          fill="currentColor"
        >
          <path d="M 50 5 C 38 5 28 15 28 28 L 28 45 C 28 55 35 65 50 95 C 65 65 72 55 72 45 L 72 28 C 72 15 62 5 50 5 Z M 50 15 C 56 15 62 20 62 28 L 62 42 L 53 42 L 53 65 L 47 65 L 47 42 L 38 42 L 38 28 C 38 20 44 15 50 15 Z" />
        </svg>
        <span className="font-display font-black text-[11px] sm:text-xs tracking-[0.2em] text-[#8e9f8c] uppercase">
          DISCIPLINE IS CHOOSING BETWEEN WHAT YOU WANT NOW AND WHAT YOU WANT MOST.
        </span>
      </div>
    </div>
  );
};

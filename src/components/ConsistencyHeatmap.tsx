/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const ConsistencyHeatmap: React.FC = () => {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const cols = 26;

  // Preset intensity pattern matching the screenshot
  const getCellIntensity = (r: number, c: number) => {
    // Semi-deterministic realistic activity matrix
    const seed = (r * 13 + c * 7 + (r ^ c) * 3) % 10;
    if (seed === 0) return 'bg-[#121a12] border-[#182418]'; // Empty/dark
    if (seed === 1 || seed === 2) return 'bg-[#22381e] border-[#2e4d29]'; // Low
    if (seed >= 3 && seed <= 6) return 'bg-[#4d7c0f] border-[#65a30d]'; // Medium
    return 'bg-[#a3e635] border-[#bef264] shadow-[0_0_8px_rgba(163,230,53,0.4)]'; // High vibrant neon
  };

  return (
    <div className="bg-[#0d130d] border border-[#1a251a] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Matrix Section */}
        <div className="flex-1 overflow-x-auto">
          {/* Header with Months */}
          <div className="flex items-center justify-between mb-3 pl-8 max-w-[580px] text-[10px] font-mono text-[#6c7f6a]">
            <span className="font-display font-bold text-xs tracking-wider text-slate-200">
              TELEMETRY INGESTION CONSISTENCY
            </span>
            <div className="flex items-center gap-12">
              <span>APR</span>
              <span>MAY</span>
              <span className="text-[#a3e635] font-bold">JUN</span>
            </div>
          </div>

          {/* Grid Rows */}
          <div className="flex flex-col gap-1 min-w-[500px]">
            {days.map((day, rIdx) => (
              <div key={day} className="flex items-center gap-1">
                <span className="w-8 text-[9px] font-mono text-[#586b56] tracking-tight text-right pr-2">
                  {day}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: cols }).map((_, cIdx) => (
                    <div
                      key={cIdx}
                      className={`w-3.5 h-3.5 rounded-xs border transition-all ${getCellIntensity(
                        rIdx,
                        cIdx
                      )}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Metric Summary Column */}
        <div className="sm:border-l sm:border-[#182318] sm:pl-6 flex flex-row sm:flex-col justify-between sm:justify-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] font-display font-bold tracking-wider text-[#697b67] uppercase block">
              THIS MONTH
            </span>
            <div className="text-3xl font-display font-black tracking-tight text-[#a3e635] text-glow-lime leading-none mt-1">
              87%
            </div>
            <div className="text-[10px] font-display font-bold text-[#a3e635] tracking-wider uppercase mt-0.5">
              CONSISTENCY
            </div>
          </div>

          <div className="sm:pt-3 sm:border-t sm:border-[#182318]">
            <span className="text-[10px] font-display font-bold tracking-wider text-[#697b67] uppercase block">
              BEST REGIME
            </span>
            <div className="text-xl font-display font-black text-slate-200 leading-none mt-1">
              91%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

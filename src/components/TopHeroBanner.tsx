/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TelemetryReading, DiagnosisResult } from '../types/telemetry';
import { Flame, Trophy, TrendingUp } from 'lucide-react';

interface TopHeroBannerProps {
  currentReading: TelemetryReading;
  diagnosis: DiagnosisResult;
}

export const TopHeroBanner: React.FC<TopHeroBannerProps> = ({ currentReading, diagnosis }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Large Hero Headline Banner Card (Col 7) */}
      <div className="lg:col-span-7 relative rounded-2xl border border-[#1b271b] overflow-hidden bg-[#0a0f0a] min-h-[220px] flex flex-col justify-end p-6 select-none shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        {/* Background Image with Dark Vignette Scrim */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
          style={{
            backgroundImage: `url('/src/assets/images/tactical_industrial_hero_1793526679814.jpg')`,
          }}
        />
        {/* Deep gradient fade towards content */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a06] via-[#060a06]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060a06] via-[#060a06]/70 to-transparent" />

        {/* Content */}
        <div className="relative z-10 max-w-xl">
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight leading-none text-white uppercase">
            DISCIPLINE TODAY,
          </h2>
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight leading-none text-[#a3e635] uppercase text-glow-lime mt-1">
            FREEDOM TOMORROW
          </h2>
          <p className="text-xs text-[#829680] mt-3 font-sans leading-relaxed max-w-md">
            Discipline is the bridge between raw sensor telemetry and zero unplanned industrial downtime.
          </p>

          <div className="mt-4 flex items-center gap-3 text-[11px] font-mono text-[#a3e635]">
            <span className="bg-[#121f11] border border-[#2b4425] px-2.5 py-1 rounded">
              ASSET: MOTOR01
            </span>
            <span className="text-[#647762]">·</span>
            <span className="text-[#889b86]">
              REGIME: <strong className="text-white">{diagnosis.finalScenario}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. OVERALL PROGRESS Line Chart Card (Col 3) */}
      <div className="lg:col-span-3 bg-[#0d130d] border border-[#1a251a] rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-display font-bold tracking-wider text-slate-200">
            <TrendingUp className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>OVERALL HEALTH</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[#a3e635] text-glow-lime">+28%</span>
            <span className="text-[10px] text-[#637561] block font-mono">vs nominal baseline</span>
          </div>
        </div>

        {/* SVG Mini Waveform with Glowing Lime Green Dots */}
        <div className="my-2 h-24 w-full relative">
          <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible">
            {/* Horizontal dotted grid lines */}
            <line x1="0" y1="20" x2="200" y2="20" stroke="#162016" strokeDasharray="3 3" />
            <line x1="0" y1="45" x2="200" y2="45" stroke="#162016" strokeDasharray="3 3" />
            <line x1="0" y1="70" x2="200" y2="70" stroke="#162016" strokeDasharray="3 3" />

            {/* Glowing Lime Polyline */}
            <polyline
              fill="none"
              stroke="#a3e635"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 6px rgba(163,230,53,0.7))"
              points="10,65 35,60 65,42 95,50 125,32 155,38 185,15"
            />

            {/* Glowing Lime Dots */}
            {[
              [10, 65],
              [35, 60],
              [65, 42],
              [95, 50],
              [125, 32],
              [155, 38],
              [185, 15],
            ].map(([x, y], idx) => (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3.5"
                fill="#bef264"
                stroke="#070b07"
                strokeWidth="1.5"
                filter="drop-shadow(0 0 4px rgba(163,230,53,0.9))"
              />
            ))}
          </svg>
        </div>

        {/* Weekday Axis */}
        <div className="flex justify-between text-[10px] font-mono text-[#637561] px-1 border-t border-[#172217] pt-1.5">
          <span>MON</span>
          <span>TUE</span>
          <span>WED</span>
          <span>THU</span>
          <span>FRI</span>
          <span>SAT</span>
          <span className="text-[#a3e635] font-bold">SUN</span>
        </div>
      </div>

      {/* 3. CURRENT STREAK / UPTIME Card (Col 2) */}
      <div className="lg:col-span-2 bg-[#0d130d] border border-[#1a251a] rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <span className="text-[11px] font-display font-bold tracking-wider text-[#738571] uppercase block">
            CURRENT STREAK
          </span>

          <div className="flex items-center justify-between mt-2">
            <div>
              <div className="text-4xl font-display font-black tracking-tight text-[#a3e635] text-glow-lime leading-none">
                23
              </div>
              <div className="text-xs font-display font-bold tracking-wider text-[#a3e635] uppercase mt-0.5">
                DAYS
              </div>
            </div>

            {/* Glowing Flame Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#a3e635] rounded-full blur-md opacity-30 animate-pulse" />
              <Flame className="w-10 h-10 text-[#a3e635] drop-shadow-[0_0_12px_rgba(163,230,53,0.7)] relative z-10" />
            </div>
          </div>
        </div>

        {/* Longest streak with trophy */}
        <div className="pt-3 border-t border-[#182318] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#879985]">
            <Trophy className="w-3.5 h-3.5 text-[#a3e635]" />
            <span className="font-display font-bold text-[11px] tracking-wider uppercase">
              LONGEST STREAK
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-[#a3e635]">47 DAYS</span>
        </div>
      </div>
    </div>
  );
};

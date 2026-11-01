/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TelemetryReading } from '../types/telemetry';
import { Activity, Gauge, Flame, Waves, Zap, BatteryCharging } from 'lucide-react';

interface TelemetryKPIsProps {
  reading: TelemetryReading;
}

export const TelemetryKPIs: React.FC<TelemetryKPIsProps> = ({ reading }) => {
  // Speed status
  const getSpeedStatus = (rpm: number) => {
    if (rpm <= 10) return { label: 'STALLED', color: 'text-red-400', border: 'border-red-900/60' };
    if (rpm < 2200) return { label: 'DROOP', color: 'text-amber-400', border: 'border-amber-900/60' };
    return { label: 'NOMINAL', color: 'text-[#a3e635]', border: 'border-[#1a251a]' };
  };

  // Current status
  const getCurrentStatus = (curr: number) => {
    if (curr > 3.5) return { label: 'INRUSH', color: 'text-red-400', border: 'border-red-900/60' };
    if (curr > 2.2) return { label: 'OVERLOAD', color: 'text-amber-400', border: 'border-amber-900/60' };
    if (curr < 0.4) return { label: 'NO-LOAD', color: 'text-sky-400', border: 'border-[#1a251a]' };
    return { label: 'NOMINAL', color: 'text-[#a3e635]', border: 'border-[#1a251a]' };
  };

  // Temp status
  const getTempStatus = (temp: number) => {
    if (temp > 65.0) return { label: 'OVERHEAT', color: 'text-red-400', border: 'border-red-900/60' };
    if (temp > 50.0) return { label: 'ELEVATED', color: 'text-amber-400', border: 'border-amber-900/60' };
    return { label: 'NOMINAL', color: 'text-[#a3e635]', border: 'border-[#1a251a]' };
  };

  // Vibration status
  const getVibeStatus = (vibe: number) => {
    if (vibe > 2.5) return { label: 'ZONE D', color: 'text-red-400', border: 'border-red-900/60' };
    if (vibe > 1.8) return { label: 'ZONE C', color: 'text-amber-400', border: 'border-amber-900/60' };
    return { label: 'ZONE A', color: 'text-[#a3e635]', border: 'border-[#1a251a]' };
  };

  const speedStatus = getSpeedStatus(reading.speed_rpm);
  const currentStatus = getCurrentStatus(reading.current_a);
  const tempStatus = getTempStatus(reading.temperature_c);
  const vibeStatus = getVibeStatus(reading.vibration_rms_g);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* 1. Rotational Speed */}
      <div className={`bg-[#0d130d] border ${speedStatus.border} rounded-2xl p-3.5 flex flex-col justify-between transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.5)]`}>
        <div className="flex items-center justify-between text-xs text-[#71856f] mb-1">
          <span className="flex items-center gap-1.5 font-display font-bold tracking-wider uppercase text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-[#a3e635]" />
            Speed
          </span>
          <span className={`text-[10px] font-mono font-bold ${speedStatus.color}`}>
            {speedStatus.label}
          </span>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-2xl font-bold font-display tracking-tight text-[#a3e635] text-glow-lime">
            {reading.speed_rpm}
          </span>
          <span className="text-[10px] text-[#697d67] font-mono">RPM</span>
        </div>
        <div className="text-[10px] text-[#586b56] font-mono">
          Nominal: 2850
        </div>
      </div>

      {/* 2. Armature Current */}
      <div className={`bg-[#0d130d] border ${currentStatus.border} rounded-2xl p-3.5 flex flex-col justify-between transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.5)]`}>
        <div className="flex items-center justify-between text-xs text-[#71856f] mb-1">
          <span className="flex items-center gap-1.5 font-display font-bold tracking-wider uppercase text-slate-300">
            <Zap className="w-3.5 h-3.5 text-[#a3e635]" />
            Current
          </span>
          <span className={`text-[10px] font-mono font-bold ${currentStatus.color}`}>
            {currentStatus.label}
          </span>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-2xl font-bold font-display tracking-tight text-[#a3e635] text-glow-lime">
            {reading.current_a.toFixed(2)}
          </span>
          <span className="text-[10px] text-[#697d67] font-mono">A</span>
        </div>
        <div className="text-[10px] text-[#586b56] font-mono">
          Rated: 1.20A
        </div>
      </div>

      {/* 3. Winding Temperature */}
      <div className={`bg-[#0d130d] border ${tempStatus.border} rounded-2xl p-3.5 flex flex-col justify-between transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.5)]`}>
        <div className="flex items-center justify-between text-xs text-[#71856f] mb-1">
          <span className="flex items-center gap-1.5 font-display font-bold tracking-wider uppercase text-slate-300">
            <Flame className="w-3.5 h-3.5 text-[#a3e635]" />
            Temp
          </span>
          <span className={`text-[10px] font-mono font-bold ${tempStatus.color}`}>
            {tempStatus.label}
          </span>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-2xl font-bold font-display tracking-tight text-[#a3e635] text-glow-lime">
            {reading.temperature_c.toFixed(1)}
          </span>
          <span className="text-[10px] text-[#697d67] font-mono">°C</span>
        </div>
        <div className="text-[10px] text-[#586b56] font-mono">
          Limit: 65.0°C
        </div>
      </div>

      {/* 4. Vibration RMS */}
      <div className={`bg-[#0d130d] border ${vibeStatus.border} rounded-2xl p-3.5 flex flex-col justify-between transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.5)]`}>
        <div className="flex items-center justify-between text-xs text-[#71856f] mb-1">
          <span className="flex items-center gap-1.5 font-display font-bold tracking-wider uppercase text-slate-300">
            <Waves className="w-3.5 h-3.5 text-[#a3e635]" />
            Vibe RMS
          </span>
          <span className={`text-[10px] font-mono font-bold ${vibeStatus.color}`}>
            {vibeStatus.label}
          </span>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-2xl font-bold font-display tracking-tight text-[#a3e635] text-glow-lime">
            {reading.vibration_rms_g.toFixed(2)}
          </span>
          <span className="text-[10px] text-[#697d67] font-mono">g</span>
        </div>
        <div className="text-[10px] text-[#586b56] font-mono">
          ISO Limit: 2.50g
        </div>
      </div>

      {/* 5. Bus Voltage */}
      <div className="bg-[#0d130d] border border-[#1a251a] rounded-2xl p-3.5 flex flex-col justify-between shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between text-xs text-[#71856f] mb-1">
          <span className="flex items-center gap-1.5 font-display font-bold tracking-wider uppercase text-slate-300">
            <BatteryCharging className="w-3.5 h-3.5 text-[#a3e635]" />
            Voltage
          </span>
          <span className="text-[10px] font-mono font-bold text-[#a3e635]">
            12V DC
          </span>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-2xl font-bold font-display tracking-tight text-white">
            {reading.voltage_v.toFixed(2)}
          </span>
          <span className="text-[10px] text-[#697d67] font-mono">V</span>
        </div>
        <div className="text-[10px] text-[#586b56] font-mono">
          Regulated Bus
        </div>
      </div>

      {/* 6. Electrical Power */}
      <div className="bg-[#0d130d] border border-[#1a251a] rounded-2xl p-3.5 flex flex-col justify-between shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between text-xs text-[#71856f] mb-1">
          <span className="flex items-center gap-1.5 font-display font-bold tracking-wider uppercase text-slate-300">
            <Activity className="w-3.5 h-3.5 text-[#a3e635]" />
            Power
          </span>
          <span className="text-[10px] font-mono text-[#a3e635]">
            {(reading.torque_mnm).toFixed(0)}mN·m
          </span>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-2xl font-bold font-display tracking-tight text-white">
            {reading.power_w.toFixed(1)}
          </span>
          <span className="text-[10px] text-[#697d67] font-mono">W</span>
        </div>
        <div className="text-[10px] text-[#586b56] font-mono">
          P = V · I
        </div>
      </div>
    </div>
  );
};

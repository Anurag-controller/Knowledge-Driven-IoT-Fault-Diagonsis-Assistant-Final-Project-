/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { TelemetryReading } from '../types/telemetry';
import { Maximize2, Pause, Play, RefreshCw } from 'lucide-react';

interface LiveTelemetryChartsProps {
  history: TelemetryReading[];
  isPaused: boolean;
  onTogglePause: () => void;
  onClearHistory: () => void;
}

type ActiveChannel = 'all' | 'speed' | 'current' | 'temperature' | 'vibration';

export const LiveTelemetryCharts: React.FC<LiveTelemetryChartsProps> = ({
  history,
  isPaused,
  onTogglePause,
  onClearHistory,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeChannel, setActiveChannel] = useState<ActiveChannel>('all');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Draw chart onto canvas whenever history updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support High-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Background
    ctx.fillStyle = '#060906';
    ctx.fillRect(0, 0, width, height);

    // Padding
    const padLeft = 52;
    const padRight = 20;
    const padTop = 24;
    const padBottom = 28;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Grid lines (horizontal & vertical)
    ctx.strokeStyle = '#141d14';
    ctx.lineWidth = 1;

    const numHGrid = 5;
    for (let i = 0; i <= numHGrid; i++) {
      const y = padTop + (plotH / numHGrid) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
    }

    const numVGrid = 6;
    for (let i = 0; i <= numVGrid; i++) {
      const x = padLeft + (plotW / numVGrid) * i;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();
    }

    const data = history.slice(-60); // Show last 60 samples
    if (data.length < 2) {
      ctx.fillStyle = '#556853';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Accumulating sensor telemetry stream...', width / 2, height / 2);
      return;
    }

    // Channel configurations with normalizations
    const channels = [
      {
        id: 'speed',
        name: 'Speed',
        unit: 'RPM',
        color: '#a3e635', // Electric Neon Lime
        min: 0,
        max: 3500,
        getter: (r: TelemetryReading) => r.speed_rpm,
        threshold: 2200,
        thresholdLabel: 'Droop Limit (2200)',
      },
      {
        id: 'current',
        name: 'Current',
        unit: 'A',
        color: '#facc15', // Gold / Amber
        min: 0,
        max: 6.0,
        getter: (r: TelemetryReading) => r.current_a,
        threshold: 2.2,
        thresholdLabel: 'Trip Limit (2.2A)',
      },
      {
        id: 'temperature',
        name: 'Temperature',
        unit: '°C',
        color: '#ef4444', // Red
        min: 20,
        max: 100,
        getter: (r: TelemetryReading) => r.temperature_c,
        threshold: 65,
        thresholdLabel: 'Max Limit (65°C)',
      },
      {
        id: 'vibration',
        name: 'Vibration',
        unit: 'g RMS',
        color: '#4ade80', // Mint / Bright Green
        min: 0,
        max: 5.0,
        getter: (r: TelemetryReading) => r.vibration_rms_g,
        threshold: 2.5,
        thresholdLabel: 'ISO 10816 Limit (2.5g)',
      },
    ];

    const visibleChannels =
      activeChannel === 'all' ? channels : channels.filter((c) => c.id === activeChannel);

    // Draw visible channels
    visibleChannels.forEach((chan) => {
      ctx.strokeStyle = chan.color;
      ctx.lineWidth = 1.75;
      ctx.beginPath();

      data.forEach((r, idx) => {
        const val = chan.getter(r);
        const normY = Math.max(0, Math.min(1, (val - chan.min) / (chan.max - chan.min)));
        const x = padLeft + (idx / (data.length - 1)) * plotW;
        const y = padTop + (1 - normY) * plotH;

        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // If single channel view, draw threshold line
      if (activeChannel !== 'all') {
        const threshNorm = (chan.threshold - chan.min) / (chan.max - chan.min);
        const threshY = padTop + (1 - threshNorm) * plotH;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padLeft, threshY);
        ctx.lineTo(width - padRight, threshY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ef4444';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(chan.thresholdLabel, width - padRight - 4, threshY - 4);
      }
    });

    // Y-Axis tick labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    if (activeChannel === 'all') {
      ctx.fillText('100%', padLeft - 6, padTop);
      ctx.fillText('50%', padLeft - 6, padTop + plotH * 0.5);
      ctx.fillText('0%', padLeft - 6, padTop + plotH);
    } else {
      const chan = channels.find((c) => c.id === activeChannel)!;
      ctx.fillText(`${chan.max}${chan.unit}`, padLeft - 6, padTop);
      ctx.fillText(`${((chan.max + chan.min) / 2).toFixed(1)}${chan.unit}`, padLeft - 6, padTop + plotH * 0.5);
      ctx.fillText(`${chan.min}${chan.unit}`, padLeft - 6, padTop + plotH);
    }

    // X-Axis time label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('-30s', padLeft, height - padBottom + 6);
    ctx.fillText('-15s', padLeft + plotW * 0.5, height - padBottom + 6);
    ctx.fillText('Now (Live)', width - padRight, height - padBottom + 6);

    // Hover crosshair if active
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length) {
      const hoverX = padLeft + (hoverIndex / (data.length - 1)) * plotW;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hoverX, padTop);
      ctx.lineTo(hoverX, height - padBottom);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [history, activeChannel, hoverIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padLeft = 52;
    const padRight = 20;
    const plotW = rect.width - padLeft - padRight;
    const dataLen = Math.min(60, history.length);

    if (x >= padLeft && x <= rect.width - padRight && dataLen > 1) {
      const ratio = (x - padLeft) / plotW;
      const index = Math.round(ratio * (dataLen - 1));
      setHoverIndex(index);
    } else {
      setHoverIndex(null);
    }
  };

  const hoveredData =
    hoverIndex !== null && history.length > 0
      ? history.slice(-60)[hoverIndex] || history[history.length - 1]
      : history[history.length - 1];

  return (
    <div className="bg-[#0d130d] border border-[#1a251a] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-[#182318] pb-3">
        <div>
          <h3 className="font-display font-black text-sm tracking-[0.15em] text-[#8e9f8c] uppercase flex items-center gap-2">
            <span>LIVE MULTI-SENSOR WAVEFORM (60S WINDOW)</span>
          </h3>
          <p className="text-[11px] text-[#6d806a] mt-0.5 font-mono">
            Synchronized telemetry curves with ISO 10816 vibration thresholds and thermal trip limits
          </p>
        </div>

        {/* Channel Filter Controls and Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 p-0.5 bg-[#070b07] border border-[#182318] rounded-lg">
            <button
              onClick={() => setActiveChannel('all')}
              className={`px-2.5 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                activeChannel === 'all'
                  ? 'bg-[#182915] text-[#bef264] border border-[#4d7c0f]'
                  : 'text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setActiveChannel('speed')}
              className={`px-2.5 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                activeChannel === 'speed'
                  ? 'bg-[#182915] text-[#a3e635] border border-[#4d7c0f]'
                  : 'text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              SPEED
            </button>
            <button
              onClick={() => setActiveChannel('current')}
              className={`px-2.5 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                activeChannel === 'current'
                  ? 'bg-[#2a2412] text-[#facc15] border border-[#715c1e]'
                  : 'text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              CURRENT
            </button>
            <button
              onClick={() => setActiveChannel('temperature')}
              className={`px-2.5 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                activeChannel === 'temperature'
                  ? 'bg-[#2b1414] text-[#ef4444] border border-[#782929]'
                  : 'text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              TEMP
            </button>
            <button
              onClick={() => setActiveChannel('vibration')}
              className={`px-2.5 py-1 text-xs font-display font-bold tracking-wider rounded-md transition-colors ${
                activeChannel === 'vibration'
                  ? 'bg-[#142918] text-[#4ade80] border border-[#2b6d39]'
                  : 'text-[#6d806a] hover:text-[#d3e2d1]'
              }`}
            >
              VIBRATION
            </button>
          </div>

          <button
            onClick={onTogglePause}
            className={`p-1.5 rounded-lg border text-xs font-display font-bold tracking-wider flex items-center gap-1 transition-colors cursor-pointer ${
              isPaused
                ? 'bg-[#182915] border-[#4d7c0f] text-[#bef264]'
                : 'bg-[#0a0f0a] border-[#1b261b] text-slate-300 hover:bg-[#121a12]'
            }`}
            title={isPaused ? 'Resume live streaming' : 'Freeze waveform display'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>

          <button
            onClick={onClearHistory}
            className="p-1.5 rounded-lg border border-[#1b261b] bg-[#0a0f0a] text-slate-400 hover:text-[#a3e635] text-xs transition-colors cursor-pointer"
            title="Reset history buffer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Chart Area */}
      <div className="relative w-full h-64 bg-[#060906] rounded-xl border border-[#182318] overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          className="w-full h-full cursor-crosshair"
        />
      </div>

      {/* Channel Legends & Cursor Readout */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-2 text-xs border-t border-[#162016]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#a3e635]" />
            <span className="text-[#849682] font-mono text-[11px]">Speed (RPM):</span>
            <span className="font-mono tabular-nums text-white font-bold">
              {hoveredData ? hoveredData.speed_rpm : '--'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#facc15]" />
            <span className="text-[#849682] font-mono text-[11px]">Current (A):</span>
            <span className="font-mono tabular-nums text-white font-bold">
              {hoveredData ? hoveredData.current_a.toFixed(2) : '--'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#ef4444]" />
            <span className="text-[#849682] font-mono text-[11px]">Temp (°C):</span>
            <span className="font-mono tabular-nums text-white font-bold">
              {hoveredData ? hoveredData.temperature_c.toFixed(1) : '--'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#4ade80]" />
            <span className="text-[#849682] font-mono text-[11px]">Vibe (g RMS):</span>
            <span className="font-mono tabular-nums text-white font-bold">
              {hoveredData ? hoveredData.vibration_rms_g.toFixed(2) : '--'}
            </span>
          </div>
        </div>

        <div className="text-[10px] text-[#556853] font-mono">
          SAMPLE: {hoveredData ? hoveredData.event_id : '--'}
        </div>
      </div>
    </div>
  );
};

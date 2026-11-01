/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TelemetryReading } from '../types/telemetry';
import { Database, Download, Search, HardDrive, Filter, CheckCircle2 } from 'lucide-react';

interface HistoricalExplorerProps {
  history: TelemetryReading[];
}

export const HistoricalExplorer: React.FC<HistoricalExplorerProps> = ({ history }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScenario, setFilterScenario] = useState<string>('ALL');
  const [selectedWindow, setSelectedWindow] = useState<'30s' | '1m' | '5m' | 'all'>('1m');

  // Filter history based on search and scenario
  const filteredHistory = history.filter((r) => {
    const matchesSearch =
      r.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.scenario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScenario = filterScenario === 'ALL' || r.scenario === filterScenario;
    return matchesSearch && matchesScenario;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = [
      'event_id',
      'device_id',
      'timestamp',
      'temperature_c',
      'vibration_rms_g',
      'current_a',
      'speed_rpm',
      'voltage_v',
      'power_w',
      'torque_mnm',
      'scenario',
    ];

    const rows = history.map((r) => [
      r.event_id,
      r.device_id,
      r.timestamp,
      r.temperature_c,
      r.vibration_rms_g,
      r.current_a,
      r.speed_rpm,
      r.voltage_v,
      r.power_w,
      r.torque_mnm,
      r.scenario,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sensor_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Database Architecture & WAL Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>SQLite Journal Mode</span>
          </div>
          <div className="text-sm font-semibold font-mono text-emerald-400">WAL (Write-Ahead)</div>
          <div className="text-[11px] text-slate-500 mt-1">Concurrency: Non-blocking readers</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>Total Logged Records</span>
          </div>
          <div className="text-sm font-semibold font-mono text-slate-100 tabular-nums">
            {history.length} telemetry frames
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Deduplication: UNIQUE(event_id)</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authoritative Tables</span>
          </div>
          <div className="text-sm font-semibold font-mono text-slate-200">5 Schema Tables</div>
          <div className="text-[11px] text-slate-500 mt-1">Composite index: (device_id, ts DESC)</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Layer 1 CSV Persistence</span>
            </div>
            <div className="text-xs font-mono text-slate-300">sensor_telemetry.csv</div>
          </div>
          <button
            onClick={handleExportCSV}
            className="mt-2 w-full px-3 py-1.5 text-xs font-medium rounded border border-amber-800/80 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {/* 2. Historical Records Grid with Search & Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span>Historical Telemetry Ingestion Explorer</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Authoritative sensor readings query view with timestamp indices and regime tags
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search event ID / regime..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 pl-8 pr-3 py-1 text-xs rounded text-slate-200 placeholder-slate-500 w-48"
              />
            </div>

            {/* Scenario Filter */}
            <select
              value={filterScenario}
              onChange={(e) => setFilterScenario(e.target.value)}
              className="bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs rounded text-slate-200 cursor-pointer"
            >
              <option value="ALL">All Regimes</option>
              <option value="NORMAL_OPERATION">Normal Operation</option>
              <option value="MECHANICAL_OVERLOAD">Mechanical Overload</option>
              <option value="EXCESSIVE_VIBRATION">Excessive Vibration</option>
              <option value="THERMAL_OVERHEATING">Thermal Overheating</option>
              <option value="SLOWDOWN_DEGRADATION">Slowdown Degradation</option>
              <option value="MOTOR_STALL">Motor Stall</option>
              <option value="SENSOR_ANOMALY">Sensor Anomaly</option>
            </select>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No telemetry records match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-2 px-2 font-medium">Event ID</th>
                  <th className="py-2 px-2 font-medium">Timestamp</th>
                  <th className="py-2 px-2 font-medium text-right">Speed (RPM)</th>
                  <th className="py-2 px-2 font-medium text-right">Current (A)</th>
                  <th className="py-2 px-2 font-medium text-right">Temp (°C)</th>
                  <th className="py-2 px-2 font-medium text-right">Vibe (g RMS)</th>
                  <th className="py-2 px-2 font-medium text-right">Voltage (V)</th>
                  <th className="py-2 px-2 font-medium text-right">Torque (mN·m)</th>
                  <th className="py-2 px-2 font-medium">Scenario Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredHistory
                  .slice(-50)
                  .reverse()
                  .map((r) => (
                    <tr key={r.event_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-2 text-slate-400">{r.event_id}</td>
                      <td className="py-2 px-2 text-slate-400 font-sans">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-200 tabular-nums">
                        {r.speed_rpm}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-200 tabular-nums">
                        {r.current_a.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-200 tabular-nums">
                        {r.temperature_c.toFixed(1)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-200 tabular-nums">
                        {r.vibration_rms_g.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-400 tabular-nums">
                        {r.voltage_v.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-400 tabular-nums">
                        {r.torque_mnm.toFixed(1)}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`text-[10px] font-sans px-2 py-0.5 rounded ${
                            r.scenario === 'MOTOR_STALL' || r.scenario === 'THERMAL_OVERHEATING'
                              ? 'text-red-400 bg-red-950/50'
                              : r.scenario === 'NORMAL_OPERATION'
                              ? 'text-emerald-400 bg-emerald-950/50'
                              : 'text-amber-400 bg-amber-950/50'
                          }`}
                        >
                          {r.scenario}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

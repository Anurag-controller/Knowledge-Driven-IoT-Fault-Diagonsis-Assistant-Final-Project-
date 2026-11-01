/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AutomationState } from '../diagnosis/automationEngine';
import { IndustrialAlert, SeverityLevel } from '../types/telemetry';
import { AlertCircle, CheckCircle, Clock, ShieldCheck, Bell, Radio, Check, Volume2, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AlertCenterProps {
  automationState: AutomationState;
  onAcknowledge: (alertId: string, operatorName: string) => void;
  onResolve: (alertId: string, notes?: string) => void;
  onClearAll: () => void;
  onResetTrip: () => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  automationState,
  onAcknowledge,
  onResolve,
  onClearAll,
  onResetTrip,
}) => {
  const [operatorName, setOperatorName] = useState('Op-01');
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  const {
    consecutiveFaultCount,
    requiredDebounce,
    cooldownRemainingSeconds,
    activeAlerts,
    alertHistory,
    hardwareActuation,
  } = automationState;

  const handleResolveSubmit = (alertId: string) => {
    onResolve(alertId, resolveNote.trim() || 'Verified nominal by operator.');
    setResolvingAlertId(null);
    setResolveNote('');

    // Trigger subtle celebratory confetti when resolving all active alerts
    if (activeAlerts.length <= 1) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#22c55e', '#38bdf8', '#fbbf24'],
        });
      } catch (e) {
        // Ignore in testing
      }
    }
  };

  const formatSeverity = (sev: SeverityLevel) => {
    switch (sev) {
      case 'CRITICAL':
        return 'text-red-400 font-semibold';
      case 'WARNING':
        return 'text-amber-400 font-semibold';
      default:
        return 'text-sky-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Automation Status & Hardware Actuator Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Debounce filter card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-200">Layer 4 Debounce Filter (N=3)</span>
            <span className="font-mono">{consecutiveFaultCount}/{requiredDebounce}</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 ${
                consecutiveFaultCount >= requiredDebounce
                  ? 'bg-red-500'
                  : consecutiveFaultCount > 0
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (consecutiveFaultCount / requiredDebounce) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {consecutiveFaultCount >= requiredDebounce
              ? 'Debounce threshold reached. Inrush transients verified before alert dispatch.'
              : consecutiveFaultCount > 0
              ? 'Monitoring candidate anomaly persistence across consecutive readings.'
              : 'Filter steady; zero consecutive anomalies detected.'}
          </p>
        </div>

        {/* Cooldown Timer */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Alert Cooldown Hysteresis
            </span>
            <span className="font-mono text-slate-300">
              {cooldownRemainingSeconds > 0 ? `${cooldownRemainingSeconds}s lock` : 'READY'}
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-2">
            <div
              className="bg-sky-500 h-full transition-all duration-500"
              style={{ width: `${((15 - cooldownRemainingSeconds) / 15) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {cooldownRemainingSeconds > 0
              ? `Hysteresis window active (15s). Suppressing redundant alert storms.`
              : 'Hysteresis open. New anomalous regimes will generate fresh alerts.'}
          </p>
        </div>

        {/* ESP32 Hardware Alarm Actuation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-200 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              ESP32 Edge Actuator State
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/70 border border-slate-800 rounded p-2 flex items-center gap-2">
              <Lightbulb
                className={`w-4 h-4 ${
                  hardwareActuation.ledState === 'SOLID_RED'
                    ? 'text-red-500 animate-pulse'
                    : hardwareActuation.ledState === 'BLINKING_AMBER'
                    ? 'text-amber-400'
                    : 'text-slate-600'
                }`}
              />
              <div>
                <span className="text-[10px] text-slate-500 block">GPIO 2 (LED)</span>
                <span className="font-mono text-[11px] text-slate-200">
                  {hardwareActuation.ledState}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded p-2 flex items-center gap-2">
              <Volume2
                className={`w-4 h-4 ${
                  hardwareActuation.buzzerState === 'CONTINUOUS_ALARM'
                    ? 'text-red-500'
                    : hardwareActuation.buzzerState === 'PULSED_BEEP'
                    ? 'text-amber-400'
                    : 'text-slate-600'
                }`}
              />
              <div>
                <span className="text-[10px] text-slate-500 block">GPIO 15 (Buzzer)</span>
                <span className="font-mono text-[11px] text-slate-200">
                  {hardwareActuation.buzzerState}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Industrial Alerts Queue */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Active Alert Dispatch Queue ({activeAlerts.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Dispatched via MQTT topic <code className="text-slate-300 font-mono">iot/factory/motor01/alerts</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Operator Initials:</span>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="bg-slate-950 border border-slate-700 px-2.5 py-1 text-xs rounded text-slate-200 font-mono w-20"
            />
            {activeAlerts.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-3 py-1 text-xs font-medium rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Clear Queue
              </button>
            )}
          </div>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <ShieldCheck className="w-10 h-10 text-emerald-400/80 mb-2" />
            <h4 className="text-sm font-semibold text-slate-200">No Active Industrial Alarms</h4>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Motor asset <code className="font-mono text-slate-300">motor01</code> is running inside acceptable tolerance bounds or all prior faults have been acknowledged and resolved.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.alert_id}
                className={`p-4 rounded-lg border transition-all ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-red-950/30 border-red-900/60'
                    : 'bg-amber-950/20 border-amber-900/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className={`font-mono ${formatSeverity(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-slate-300">{alert.alert_id}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">Debounce N={alert.debounceCount}</span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {alert.message}
                    </p>
                    {alert.acknowledgedBy && (
                      <div className="mt-2 text-[11px] text-sky-400">
                        Acknowledged by: <span className="font-mono">{alert.acknowledgedBy}</span> at{' '}
                        {new Date(alert.acknowledgedAt || '').toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => onAcknowledge(alert.alert_id, operatorName)}
                        className="px-3 py-1.5 text-xs font-medium rounded border border-sky-800 bg-sky-950/70 text-sky-300 hover:bg-sky-900/80 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => setResolvingAlertId(alert.alert_id)}
                      className="px-3 py-1.5 text-xs font-medium rounded border border-emerald-800 bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900/80 transition-colors"
                    >
                      Resolve & Clear
                    </button>
                  </div>
                </div>

                {/* Resolve dialog modal inline */}
                {resolvingAlertId === alert.alert_id && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add operator maintenance notes (e.g., cleared jam, checked lubricant)..."
                      value={resolveNote}
                      onChange={(e) => setResolveNote(e.target.value)}
                      className="bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs rounded text-slate-200 flex-1"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResolveSubmit(alert.alert_id)}
                        className="px-3 py-1.5 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      >
                        Confirm Resolve
                      </button>
                      <button
                        onClick={() => setResolvingAlertId(null)}
                        className="px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Historical Alert Audit Trail */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="border-b border-slate-800/80 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>Historical Alert Audit Trail (Layer 3 SQLite alert_history)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of all industrial alert lifecycle transitions, operator acknowledgements, and resolutions
          </p>
        </div>

        {alertHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No alert history recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 font-medium">Alert ID</th>
                  <th className="pb-2 font-medium">Timestamp</th>
                  <th className="pb-2 font-medium">Scenario</th>
                  <th className="pb-2 font-medium">Severity</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Operator Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {alertHistory.slice(0, 10).map((h) => (
                  <tr key={h.alert_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 text-slate-200">{h.alert_id}</td>
                    <td className="py-2.5 text-slate-400">
                      {new Date(h.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 text-slate-300 font-sans">{h.scenario}</td>
                    <td className={`py-2.5 ${formatSeverity(h.severity)}`}>{h.severity}</td>
                    <td className="py-2.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded ${
                          h.status === 'RESOLVED'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/80'
                            : h.status === 'ACKNOWLEDGED'
                            ? 'bg-sky-950/60 text-sky-400 border border-sky-900/80'
                            : 'bg-red-950/60 text-red-400 border border-red-900/80'
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 font-sans text-[11px] truncate max-w-xs">
                      {h.operatorNotes || (h.acknowledgedBy ? `Ack: ${h.acknowledgedBy}` : '--')}
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

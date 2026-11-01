/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TelemetryReading } from '../types/telemetry';
import { Network, Server, ArrowRight, CheckCircle2, ShieldCheck, Cpu, Radio } from 'lucide-react';

interface NodeRedArchitectureProps {
  lastReading: TelemetryReading;
}

export const NodeRedArchitecture: React.FC<NodeRedArchitectureProps> = ({ lastReading }) => {
  const [brokerType, setBrokerType] = useState<'local' | 'cloud'>('local');
  const [selectedNode, setSelectedNode] = useState<string>('debounce');

  const nodes = [
    {
      id: 'mqtt_in',
      name: 'MQTT In (Subscriber)',
      type: 'input',
      topic: 'iot/factory/+/sensors',
      description: 'Subscribes to wild-card sensor telemetry stream with automatic Paho TLS reconnect.',
      metrics: 'QoS 0/1 · Payload: JSON',
    },
    {
      id: 'dedup',
      name: 'Deduplication Cache',
      type: 'function',
      topic: 'Memory LRU',
      description: 'Checks incoming event_id against 1000-entry LRU ring buffer to discard duplicates.',
      metrics: 'UNIQUE(event_id) · Discard count: 0',
    },
    {
      id: 'debounce',
      name: 'Consecutive Fault Debounce',
      type: 'filter',
      topic: 'N=3 Filter',
      description: 'Suppresses momentary motor starting inrush spikes; requires 3 consecutive identical fault regimes before trigger.',
      metrics: 'Debounce window: N=3 · Inrush suppressed',
    },
    {
      id: 'hysteresis',
      name: '15s Cooldown & Hysteresis',
      type: 'timer',
      topic: '15,000 ms',
      description: 'Enforces minimum 15-second cooldown between duplicate alert dispatches to prevent alarm storms.',
      metrics: 'Cooldown: 15s · Alert rate limit',
    },
    {
      id: 'mqtt_out',
      name: 'MQTT Alert Dispatcher',
      type: 'output',
      topic: 'iot/factory/motor01/alerts',
      description: 'Publishes validated industrial alarm payload to operators and ESP32 hardware alarm actuators.',
      metrics: 'Retain: false · QoS 1',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Broker Configuration & Layer 2 Fallback Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Broker Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-slate-100">Layer 2: MQTT Broker Transport</h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded text-xs">
              <button
                onClick={() => setBrokerType('local')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  brokerType === 'local'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Local Mosquitto
              </button>
              <button
                onClick={() => setBrokerType('cloud')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  brokerType === 'cloud'
                    ? 'bg-purple-900/60 text-purple-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                HiveMQ Cloud TLS
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Endpoint Host:</span>
              <span className="font-mono text-slate-200">
                {brokerType === 'local' ? '127.0.0.1 (Mosquitto 2.0)' : 'cluster-s1.eu.hivemq.cloud'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Port & Transport:</span>
              <span className="font-mono text-slate-200">
                {brokerType === 'local' ? '1883 (TCP Plaintext)' : '8883 (TLS v1.3 Encrypted)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Failover Mechanism:</span>
              <span className="font-mono text-emerald-400">
                Auto-Fallback to Local if Cloud unreachable
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Active Ingestion Topic:</span>
              <span className="font-mono text-sky-400">iot/factory/motor01/sensors</span>
            </div>
          </div>
        </div>

        {/* Live Ingestion Payload Inspector */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-100">Live Wire Payload Snapshot</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Format: JSON Schema 1.0</span>
          </div>

          <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
            {JSON.stringify(
              {
                event_id: lastReading.event_id,
                device_id: lastReading.device_id,
                timestamp: lastReading.timestamp,
                telemetry: {
                  speed_rpm: lastReading.speed_rpm,
                  current_a: lastReading.current_a,
                  temperature_c: lastReading.temperature_c,
                  vibration_rms_g: lastReading.vibration_rms_g,
                  voltage_v: lastReading.voltage_v,
                },
                scenario_flag: lastReading.scenario,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>

      {/* 2. Layer 4: Node-RED Automation Flow Pipeline Visualizer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Layer 4: Node-RED Industrial Automation Flow (flows.json)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Event-driven orchestration with stateful deduplication, $N=3$ inrush debouncing, and 15s hysteresis
          </p>
        </div>

        {/* Interactive Node-RED Pipeline Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
          {nodes.map((node, idx) => {
            const isSelected = selectedNode === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-sky-400 ring-1 ring-sky-400/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-500">Step 0{idx + 1}</span>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                      node.type === 'input'
                        ? 'bg-blue-950 text-blue-400'
                        : node.type === 'output'
                        ? 'bg-rose-950 text-rose-400'
                        : 'bg-amber-950 text-amber-400'
                    }`}
                  >
                    {node.type}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate">{node.name}</div>
                <div className="text-[10px] font-mono text-slate-400 truncate mt-1">
                  {node.topic}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Node Details Box */}
        {(() => {
          const active = nodes.find((n) => n.id === selectedNode)!;
          return (
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-100">{active.name}</span>
                <span className="font-mono text-sky-400">{active.topic}</span>
              </div>
              <p className="text-slate-300 leading-relaxed mb-3">{active.description}</p>
              <div className="text-[11px] text-slate-500 font-mono">
                Configuration Invariants: {active.metrics}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

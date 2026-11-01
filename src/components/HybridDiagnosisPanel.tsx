/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DiagnosisResult, FaultScenario } from '../types/telemetry';
import { CheckCircle2, AlertTriangle, ShieldAlert, Cpu, Wrench, Check, X, FileText } from 'lucide-react';

interface HybridDiagnosisPanelProps {
  diagnosis: DiagnosisResult;
}

export const HybridDiagnosisPanel: React.FC<HybridDiagnosisPanelProps> = ({ diagnosis }) => {
  const {
    finalScenario,
    finalSeverity,
    consensusStatus,
    overallConfidence,
    ruleHypothesis,
    mlHypothesis,
    recommendation,
    ruleEvaluations,
    mlPrediction,
  } = diagnosis;

  const formatScenarioName = (s: FaultScenario) => {
    switch (s) {
      case 'NORMAL_OPERATION':
        return 'Normal Operation';
      case 'MECHANICAL_OVERLOAD':
        return 'Mechanical Overload';
      case 'EXCESSIVE_VIBRATION':
        return 'Excessive Vibration';
      case 'THERMAL_OVERHEATING':
        return 'Thermal Overheating';
      case 'SLOWDOWN_DEGRADATION':
        return 'Slowdown Degradation';
      case 'MOTOR_STALL':
        return 'Locked Rotor / Stall';
      case 'SENSOR_ANOMALY':
        return 'Sensor Acquisition Anomaly';
      default:
        return s;
    }
  };

  const getConsensusBadge = (status: typeof consensusStatus) => {
    switch (status) {
      case 'CONCORDANT_AGREEMENT':
        return {
          label: 'Concordant Agreement (Rule == ML)',
          color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case 'RULE_SAFETY_OVERRIDE':
        return {
          label: 'Safety Principle Override (Rule > ML)',
          color: 'text-red-400 bg-red-950/60 border-red-800/80',
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
        };
      case 'EARLY_WARNING_PREDICTIVE':
        return {
          label: 'Early Warning Predictive (ML Drift)',
          color: 'text-amber-400 bg-amber-950/60 border-amber-800/80',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      case 'DISCORDANT_UNCERTAINTY':
      default:
        return {
          label: 'Discordant / Operator Review Advised',
          color: 'text-purple-400 bg-purple-950/60 border-purple-800/80',
          icon: <Cpu className="w-3.5 h-3.5" />,
        };
    }
  };

  const badge = getConsensusBadge(consensusStatus);

  return (
    <div className="space-y-6">
      {/* 1. Consensus Banner & Dual Classifier Comparison */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span>Layer 5: Hybrid AI/ML Consensus Reconciler</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic physics rule evaluation synthesized with Random Forest probabilistic inference
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded border text-xs font-medium ${badge.color}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rule Hypothesis */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Knowledge Rule Output:</span>
            <div className="text-sm font-semibold text-slate-200">
              {formatScenarioName(ruleHypothesis)}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Determinism:</span>
              <span className="font-mono text-emerald-400">Deterministic (100%)</span>
            </div>
          </div>

          {/* ML Hypothesis */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Random Forest ML Output:</span>
            <div className="text-sm font-semibold text-slate-200">
              {formatScenarioName(mlHypothesis)}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Model Confidence:</span>
              <span className="font-mono text-sky-400">
                {(mlPrediction.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Consolidated Verdict */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Consolidated Diagnosis:</span>
            <div
              className={`text-sm font-bold font-mono ${
                finalSeverity === 'CRITICAL'
                  ? 'text-red-400'
                  : finalSeverity === 'WARNING'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {formatScenarioName(finalScenario)}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Overall Confidence:</span>
              <span className="font-mono text-slate-200">
                {(overallConfidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Prescriptive Maintenance SOP Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Prescriptive Industrial Maintenance Action Plan
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {recommendation.preventiveWorkOrder.split(':')[0]}
          </span>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Immediate Operator Action
            </span>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {recommendation.immediateAction}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
              <span className="text-[11px] text-slate-400 block mb-1">Root Cause Hypothesis:</span>
              <p className="text-xs text-slate-300 leading-relaxed">{recommendation.rootCause}</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
              <span className="text-[11px] text-slate-400 block mb-1">Standard Work Order Directive:</span>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {recommendation.preventiveWorkOrder}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="text-slate-400">Required Diagnostic Tools:</span>
            {recommendation.requiredTools.map((tool) => (
              <span
                key={tool}
                className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] border border-slate-700"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Deterministic Physics Rule Evaluation Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="border-b border-slate-800/80 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Deterministic Knowledge Base Evaluation Trace</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates live telemetry against priority-ordered physics invariants defined in knowledge_base.yaml
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-medium">Rule Identifier</th>
                <th className="pb-2 font-medium">Logical Condition</th>
                <th className="pb-2 font-medium">Current Telemetry</th>
                <th className="pb-2 font-medium">Trip Threshold</th>
                <th className="pb-2 font-medium text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {ruleEvaluations.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 font-sans font-medium text-slate-200">
                    <div>{rule.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{rule.id}</div>
                  </td>
                  <td className="py-2.5 text-slate-400 text-[11px] font-sans">
                    {rule.condition}
                  </td>
                  <td className="py-2.5 text-slate-300 tabular-nums">
                    {rule.metricValue}
                  </td>
                  <td className="py-2.5 text-slate-400 tabular-nums text-[11px]">
                    {rule.threshold}
                  </td>
                  <td className="py-2.5 text-right">
                    {rule.passed ? (
                      <span className="inline-flex items-center gap-1 text-red-400 font-semibold bg-red-950/60 px-2 py-0.5 rounded border border-red-900/80">
                        <Check className="w-3 h-3" />
                        TRIGGERED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                        <X className="w-3 h-3" />
                        PASS
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 10 Rolling Temporal Features for Random Forest */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="border-b border-slate-800/80 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Machine Learning Feature Extractor (Window W=10)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Temporal physics vectors continuously extracted from the rolling ingestion window for inference
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 block mb-1">Current Mean:</span>
            <span className="font-mono text-sm text-slate-100 tabular-nums">
              {mlPrediction.featureValues.current_mean} A
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 block mb-1">Current Std Dev:</span>
            <span className="font-mono text-sm text-slate-100 tabular-nums">
              {mlPrediction.featureValues.current_std} A
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 block mb-1">Current Peak:</span>
            <span className="font-mono text-sm text-slate-100 tabular-nums">
              {mlPrediction.featureValues.current_max} A
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 block mb-1">Speed Mean:</span>
            <span className="font-mono text-sm text-slate-100 tabular-nums">
              {mlPrediction.featureValues.speed_mean} RPM
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 block mb-1">Speed Drop Ratio:</span>
            <span className="font-mono text-sm text-slate-100 tabular-nums">
              {(mlPrediction.featureValues.speed_drop_ratio * 100).toFixed(1)}%
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 block mb-1">Temp Mean:</span>
            <span className="font-mono text-sm text-slate-100 tabular-nums">
              {mlPrediction.featureValues.temp_mean} °C
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 block mb-1">Temp Slope (dT/dt):</span>
            <span className="font-mono text-sm text-slate-100 tabular-nums">
              {mlPrediction.featureValues.temp_rate_of_change > 0 ? '+' : ''}
              {mlPrediction.featureValues.temp_rate_of_change} °C/s
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 block mb-1">Vibe RMS Mean:</span>
            <span className="font-mono text-sm text-slate-100 tabular-nums">
              {mlPrediction.featureValues.vibe_rms_mean} g
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 block mb-1">Vibe RMS Peak:</span>
            <span className="font-mono text-sm text-slate-100 tabular-nums">
              {mlPrediction.featureValues.vibe_rms_max} g
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 block mb-1">Vibe RMS Variance:</span>
            <span className="font-mono text-sm text-slate-100 tabular-nums">
              {mlPrediction.featureValues.vibe_rms_std} g
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

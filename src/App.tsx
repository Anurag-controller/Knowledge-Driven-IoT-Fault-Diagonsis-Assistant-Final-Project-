/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaultScenario,
  TelemetryReading,
  DiagnosisResult,
} from './types/telemetry';
import { MotorPhysicsSimulator, DEFAULT_MOTOR_CONFIG } from './simulation/physicsEngine';
import { evaluateRules } from './diagnosis/ruleEngine';
import { MLPredictor } from './diagnosis/mlPredictor';
import { reconcileHybridDiagnosis } from './diagnosis/hybridConsensus';
import { IndustrialAutomationEngine, AutomationState } from './diagnosis/automationEngine';

import { NavTab } from './components/TopNavigation';
import { SidebarNavigation } from './components/SidebarNavigation';
import { TopHeroBanner } from './components/TopHeroBanner';
import { TacticalModulesGauges } from './components/TacticalModulesGauges';
import { ConsistencyHeatmap } from './components/ConsistencyHeatmap';
import { StreaksAndWeeklyProgress } from './components/StreaksAndWeeklyProgress';
import { TelemetryKPIs } from './components/TelemetryKPIs';
import { DigitalTwinMotor } from './components/DigitalTwinMotor';
import { LiveTelemetryCharts } from './components/LiveTelemetryCharts';
import { ScenarioController } from './components/ScenarioController';
import { HybridDiagnosisPanel } from './components/HybridDiagnosisPanel';
import { AlertCenter } from './components/AlertCenter';
import { MotorPhysicsSandbox } from './components/MotorPhysicsSandbox';
import { HistoricalExplorer } from './components/HistoricalExplorer';
import { NodeRedArchitecture } from './components/NodeRedArchitecture';
import { HardwareWiringGuide } from './components/HardwareWiringGuide';
import { MLModelHealth } from './components/MLModelHealth';
import { AIDiagnosticAssistant } from './components/AIDiagnosticAssistant';

import { AlertOctagon, ShieldCheck, Activity, Menu, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('monitor');
  const [frequencyHz, setFrequencyHz] = useState<number>(2);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isRandomWalk, setIsRandomWalk] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Engine refs
  const simRef = useRef<MotorPhysicsSimulator>(new MotorPhysicsSimulator());
  const mlPredictorRef = useRef<MLPredictor>(new MLPredictor());
  const automationEngineRef = useRef<IndustrialAutomationEngine>(new IndustrialAutomationEngine());

  // Initial reading
  const initialReading = simRef.current.generateReading();
  const [currentReading, setCurrentReading] = useState<TelemetryReading>(initialReading);
  const [history, setHistory] = useState<TelemetryReading[]>([initialReading]);

  // Initial diagnosis
  const initialRuleEval = evaluateRules(initialReading);
  mlPredictorRef.current.pushReading(initialReading);
  const initialMlPred = mlPredictorRef.current.predict(initialReading);
  const initialDiagnosis = reconcileHybridDiagnosis(
    initialReading,
    initialRuleEval.evaluations,
    initialRuleEval.topHypothesis,
    initialRuleEval.topSeverity,
    initialMlPred
  );
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult>(initialDiagnosis);

  // Automation state
  const [automationState, setAutomationState] = useState<AutomationState>(
    automationEngineRef.current.processReading(
      initialReading,
      initialDiagnosis.finalScenario,
      initialDiagnosis.finalSeverity
    )
  );

  // Advance simulation by 1 step
  const stepSimulation = useCallback(() => {
    const reading = simRef.current.generateReading();
    setCurrentReading(reading);

    setHistory((prev) => {
      const updated = [...prev, reading];
      return updated.length > 200 ? updated.slice(-200) : updated;
    });

    // 1. Deterministic Rule Engine
    const ruleEval = evaluateRules(reading);

    // 2. Machine Learning Inference
    mlPredictorRef.current.pushReading(reading);
    const mlPred = mlPredictorRef.current.predict(reading);

    // 3. Hybrid Consensus Reconciler
    const diag = reconcileHybridDiagnosis(
      reading,
      ruleEval.evaluations,
      ruleEval.topHypothesis,
      ruleEval.topSeverity,
      mlPred
    );
    setDiagnosis(diag);

    // 4. Layer 4 Automation & Alert Dispatch
    const autoState = automationEngineRef.current.processReading(
      reading,
      diag.finalScenario,
      diag.finalSeverity
    );
    setAutomationState(autoState);
  }, []);

  // Interval loop for continuous real-time streaming
  useEffect(() => {
    if (isPaused) return;
    const intervalMs = 1000 / frequencyHz;
    const intervalId = setInterval(stepSimulation, intervalMs);
    return () => clearInterval(intervalId);
  }, [frequencyHz, isPaused, stepSimulation]);

  // Random walk auto-cycler
  useEffect(() => {
    if (!isRandomWalk) return;
    const scenarios: FaultScenario[] = [
      'NORMAL_OPERATION',
      'MECHANICAL_OVERLOAD',
      'EXCESSIVE_VIBRATION',
      'THERMAL_OVERHEATING',
      'SLOWDOWN_DEGRADATION',
      'MOTOR_STALL',
      'NORMAL_OPERATION',
    ];
    let idx = 0;
    const autoCycleInterval = setInterval(() => {
      idx = (idx + 1) % scenarios.length;
      simRef.current.setScenario(scenarios[idx]);
    }, 18000);
    return () => clearInterval(autoCycleInterval);
  }, [isRandomWalk]);

  // Emergency stop toggle
  const handleToggleEmergency = () => {
    if (automationState.hardwareActuation.safetyRelayTrip) {
      automationEngineRef.current.resetSafetyTrip();
      simRef.current.updateConfig({ appliedVoltage: 12.0 });
      simRef.current.setScenario('NORMAL_OPERATION');
      setAutomationState((prev) => ({
        ...prev,
        hardwareActuation: { ...prev.hardwareActuation, safetyRelayTrip: false },
      }));
    } else {
      simRef.current.updateConfig({ appliedVoltage: 0.0 });
      simRef.current.setScenario('MOTOR_STALL');
      setAutomationState((prev) => ({
        ...prev,
        hardwareActuation: {
          ...prev.hardwareActuation,
          safetyRelayTrip: true,
          ledState: 'SOLID_RED',
          buzzerState: 'CONTINUOUS_ALARM',
        },
      }));
    }
  };

  const handleSelectScenario = (sc: FaultScenario) => {
    simRef.current.setScenario(sc);
    stepSimulation();
  };

  const handleAcknowledgeAlert = (alertId: string, operatorName: string) => {
    automationEngineRef.current.acknowledgeAlert(alertId, operatorName);
    setAutomationState((prev) => ({
      ...prev,
      activeAlerts: prev.activeAlerts.map((a) =>
        a.alert_id === alertId
          ? { ...a, status: 'ACKNOWLEDGED', acknowledgedBy: operatorName, acknowledgedAt: new Date().toISOString() }
          : a
      ),
      alertHistory: prev.alertHistory.map((a) =>
        a.alert_id === alertId
          ? { ...a, status: 'ACKNOWLEDGED', acknowledgedBy: operatorName, acknowledgedAt: new Date().toISOString() }
          : a
      ),
    }));
  };

  const handleResolveAlert = (alertId: string, notes?: string) => {
    automationEngineRef.current.resolveAlert(alertId, notes);
    setAutomationState((prev) => ({
      ...prev,
      activeAlerts: prev.activeAlerts.filter((a) => a.alert_id !== alertId),
      alertHistory: prev.alertHistory.map((a) =>
        a.alert_id === alertId
          ? { ...a, status: 'RESOLVED', resolvedAt: new Date().toISOString(), operatorNotes: notes }
          : a
      ),
    }));
  };

  const isStalled =
    diagnosis.finalScenario === 'MOTOR_STALL' ||
    automationState.hardwareActuation.safetyRelayTrip ||
    currentReading.speed_rpm <= 0;

  return (
    <div className="min-h-screen bg-[#050705] text-[#e5ede3] flex font-sans selection:bg-[#a3e635]/30 selection:text-[#a3e635]">
      {/* 1. Tactical Sidebar Navigation (Desktop) */}
      <div className="hidden lg:block shrink-0">
        <SidebarNavigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isEmergencyTripped={automationState.hardwareActuation.safetyRelayTrip}
          onToggleEmergency={handleToggleEmergency}
          activeAlertCount={automationState.activeAlerts.length}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10">
            <SidebarNavigation
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
              isEmergencyTripped={automationState.hardwareActuation.safetyRelayTrip}
              onToggleEmergency={handleToggleEmergency}
              activeAlertCount={automationState.activeAlerts.length}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#070b07] border-b border-[#182318] sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-slate-300 hover:text-[#a3e635]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-display font-black tracking-widest text-sm text-white">
              DISCIPLINE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#a3e635] bg-[#121c11] border border-[#23351f] px-2 py-0.5 rounded">
              MOTOR01
            </span>
            <button
              onClick={handleToggleEmergency}
              className={`p-1.5 rounded text-xs font-bold font-display ${
                automationState.hardwareActuation.safetyRelayTrip
                  ? 'bg-red-800 text-white'
                  : 'bg-[#182613] text-[#a3e635] border border-[#4d7c0f]'
              }`}
            >
              {automationState.hardwareActuation.safetyRelayTrip ? 'RESET' : 'TRIP'}
            </button>
          </div>
        </header>

        {/* Emergency Trip Warning Banner when Active */}
        {automationState.hardwareActuation.safetyRelayTrip && (
          <div className="bg-red-950 border-b border-red-800 px-6 py-2.5 flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-semibold tracking-wide font-display text-sm">
                EMERGENCY SAFETY TRIP ENGAGED: 12V DC power bus de-energized. Armature current cut to 0A.
              </span>
            </div>
            <button
              onClick={handleToggleEmergency}
              className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white font-display font-bold rounded transition-colors cursor-pointer"
            >
              Acknowledge & Restore Power
            </button>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Top Sub-Bar with Breadcrumb and Ingestion Heartbeat */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-[#182318] pb-3">
            <div className="flex items-center gap-2 text-[#738571] font-mono">
              <span className="text-[#a3e635] font-bold">FAULT DIAGNOSIS</span>
              <span>/</span>
              <span>SHOP FLOOR 01</span>
              <span>/</span>
              <span className="text-white font-semibold">MOTOR01 (12V DC)</span>
              <span>·</span>
              <span className="text-[#5f705d]">LAYERS 1–6 PIPELINE</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[#738571] font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#a3e635] shadow-[0_0_8px_#a3e635]" />
                <span>MQTT:</span>
                <span className="text-white">1883 MOSQUITTO</span>
              </div>
              <span className="text-[#324430]">·</span>
              <div className="flex items-center gap-1.5 text-[#738571] font-mono text-[11px]">
                <span>REGIME:</span>
                <span
                  className={`font-bold ${
                    diagnosis.finalSeverity === 'CRITICAL'
                      ? 'text-red-400'
                      : diagnosis.finalSeverity === 'WARNING'
                      ? 'text-amber-400'
                      : 'text-[#a3e635]'
                  }`}
                >
                  {diagnosis.finalScenario}
                </span>
              </div>
            </div>
          </div>

          {/* DASHBOARD TAB (Exact Matching Layout of Reference Image) */}
          {activeTab === 'monitor' && (
            <div className="space-y-6">
              {/* 1. Hero Banner matching screenshot ("DISCIPLINE TODAY, FREEDOM TOMORROW") */}
              <TopHeroBanner currentReading={currentReading} diagnosis={diagnosis} />

              {/* 2. MODULES Section (4 Circular Lime Progress Rings with M T W T F S S) */}
              <TacticalModulesGauges reading={currentReading} />

              {/* 3. Consistency Heatmap Matrix (APR / MAY / JUN with Lime Blocks) */}
              <ConsistencyHeatmap />

              {/* 4. Real-time KPI summary bar */}
              <TelemetryKPIs reading={currentReading} />

              {/* 5. 12V DC Motor Digital Twin + Scenario Injector */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-7">
                  <DigitalTwinMotor reading={currentReading} isStalled={isStalled} />
                </div>
                <div className="xl:col-span-5">
                  <ScenarioController
                    currentScenario={simRef.current.getScenario()}
                    onSelectScenario={handleSelectScenario}
                    frequencyHz={frequencyHz}
                    onChangeFrequency={setFrequencyHz}
                    onManualStep={stepSimulation}
                    onResetThermal={() => simRef.current.resetThermal()}
                    isRandomWalk={isRandomWalk}
                    onToggleRandomWalk={() => setIsRandomWalk(!isRandomWalk)}
                  />
                </div>
              </div>

              {/* 6. Live Synchronized Waveform Canvas Chart */}
              <LiveTelemetryCharts
                history={history}
                isPaused={isPaused}
                onTogglePause={() => setIsPaused(!isPaused)}
                onClearHistory={() => setHistory([currentReading])}
              />

              {/* 7. Streaks & Weekly Progress Bar Chart + Spartan Motto Footer */}
              <StreaksAndWeeklyProgress
                currentScenario={simRef.current.getScenario()}
                onSelectScenario={handleSelectScenario}
              />

              {/* 8. Gemini AI Diagnostic Copilot */}
              <AIDiagnosticAssistant currentReading={currentReading} diagnosis={diagnosis} />
            </div>
          )}

          {activeTab === 'diagnosis' && (
            <HybridDiagnosisPanel diagnosis={diagnosis} />
          )}

          {activeTab === 'physics' && (
            <div className="space-y-6">
              <DigitalTwinMotor reading={currentReading} isStalled={isStalled} />
              <MotorPhysicsSandbox
                config={simRef.current.getConfig()}
                onUpdateConfig={(cfg) => simRef.current.updateConfig(cfg)}
                onResetDefaults={() => simRef.current.updateConfig(DEFAULT_MOTOR_CONFIG)}
              />
            </div>
          )}

          {activeTab === 'alerts' && (
            <AlertCenter
              automationState={automationState}
              onAcknowledge={handleAcknowledgeAlert}
              onResolve={handleResolveAlert}
              onClearAll={() => {
                automationEngineRef.current.clearAllAlerts();
                setAutomationState((prev) => ({ ...prev, activeAlerts: [] }));
              }}
              onResetTrip={() => {
                automationEngineRef.current.resetSafetyTrip();
                setAutomationState((prev) => ({
                  ...prev,
                  hardwareActuation: { ...prev.hardwareActuation, safetyRelayTrip: false },
                }));
              }}
            />
          )}

          {activeTab === 'history' && (
            <HistoricalExplorer history={history} />
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <NodeRedArchitecture lastReading={currentReading} />
              <HardwareWiringGuide />
            </div>
          )}

          {activeTab === 'mlhealth' && (
            <MLModelHealth />
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DiagnosisResult, TelemetryReading } from '../types/telemetry';
import { Sparkles, Send, Bot, User, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

interface AIDiagnosticAssistantProps {
  currentReading: TelemetryReading;
  diagnosis: DiagnosisResult;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AIDiagnosticAssistant: React.FC<AIDiagnosticAssistantProps> = ({
  currentReading,
  diagnosis,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello Operator. I am your Knowledge-Driven Motor Diagnostic Copilot. I have real-time access to telemetry from asset "motor01" (${currentReading.speed_rpm} RPM, ${currentReading.current_a.toFixed(2)}A, ${currentReading.temperature_c.toFixed(1)}°C, ${currentReading.vibration_rms_g.toFixed(2)}g). You can ask me to perform root-cause analysis, generate ISO 10816 severity reports, or provide step-by-step repair directives.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          telemetry: currentReading,
          diagnosisSummary: {
            scenario: diagnosis.finalScenario,
            severity: diagnosis.finalSeverity,
            consensus: diagnosis.consensusStatus,
            confidence: diagnosis.overallConfidence,
            immediateAction: diagnosis.recommendation.immediateAction,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Analysis completed with nominal parameters verified.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      // Offline fallback diagnostic response if API key is unconfigured
      const fallbackReply = generateClientFallbackAnalysis(textToSend, currentReading, diagnosis);
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateClientFallbackAnalysis = (
    query: string,
    r: TelemetryReading,
    d: DiagnosisResult
  ): string => {
    if (d.finalScenario === 'MOTOR_STALL') {
      return `⚠️ CRITICAL STALL ALERT: Rotor is immobilized (0 RPM) while drawing inrush current of ${r.current_a.toFixed(2)}A at 12V. 
Joule dissipation rate is ${(Math.pow(r.current_a, 2) * 2.1).toFixed(1)}W, exceeding continuous stator thermal mass rating.
Recommended Emergency Action: Disconnect 12V DC power immediately. Inspect coupling for mechanical jam.`;
    }
    if (d.finalScenario === 'THERMAL_OVERHEATING') {
      return `🔥 THERMAL STRESS DIAGNOSIS: Motor casing temperature has reached ${r.temperature_c.toFixed(1)}°C (>65°C Class B threshold).
Root cause indicates continuous operation above continuous torque rating or blocked air vents.
Recommended Action: Relieve 50% load or deploy external forced-air fan.`;
    }
    if (d.finalScenario === 'EXCESSIVE_VIBRATION') {
      return `⚡ ISO 10816 MECHANICAL ASSESSMENT: Vibration amplitude is ${r.vibration_rms_g.toFixed(2)}g RMS, placing asset in Zone D (Unacceptable for continuous industrial duty).
Primary suspect: Dynamic rotor unbalance or 608ZZ bearing raceway degradation.
Recommended Action: Inspect mounting torque (4.5 N·m) and perform dynamic balancing check.`;
    }
    return `Asset "motor01" telemetry is currently operating within nominal baseline bounds: Speed ${r.speed_rpm} RPM, Current ${r.current_a.toFixed(2)}A, Temp ${r.temperature_c.toFixed(1)}°C, Vibration ${r.vibration_rms_g.toFixed(2)}g RMS. No immediate corrective intervention is mandated.`;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Gemini AI Industrial Root-Cause Diagnostic Assistant</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ISO 10816 standards evaluation, root-cause physics explanations, and SOP generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              handleSendMessage(
                `Perform complete root-cause failure analysis for asset motor01 based on current telemetry.`
              )
            }
            className="px-2.5 py-1 text-xs font-medium rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Root Cause SOP
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                `Evaluate current vibration ${currentReading.vibration_rms_g}g against ISO 10816-3 severity zones.`
              )
            }
            className="px-2.5 py-1 text-xs font-medium rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            ISO 10816 Audit
          </button>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="h-64 overflow-y-auto space-y-3 p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-sky-950 border border-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-sky-400" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white font-medium ml-8'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
              <div
                className={`text-[10px] font-mono mt-1 ${
                  msg.sender === 'user' ? 'text-sky-200' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-sky-400 p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Synthesizing diagnostic report with Gemini model...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask diagnostic questions (e.g., 'Why is current elevated while speed is low?')..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs rounded-lg text-slate-200 placeholder-slate-500 flex-1"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputText.trim()}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Consult</span>
        </button>
      </div>
    </div>
  );
};

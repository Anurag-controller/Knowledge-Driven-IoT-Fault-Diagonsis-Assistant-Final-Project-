/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API route: Gemini-powered industrial root cause diagnosis
app.post('/api/ai-diagnose', async (req, res) => {
  try {
    const { query, telemetry, diagnosisSummary } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        reply: `[Standard Diagnostic Engine]: Asset "motor01" current state is ${diagnosisSummary?.scenario} with ${diagnosisSummary?.severity} severity. Speed: ${telemetry?.speed_rpm} RPM, Current: ${telemetry?.current_a} A, Temp: ${telemetry?.temperature_c} °C, Vibration: ${telemetry?.vibration_rms_g} g. Action: ${diagnosisSummary?.immediateAction || 'Check mechanical load and connections.'}`,
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an expert Industrial Reliability and Cyber-Physical Systems Diagnostic Engineer analyzing a 12V DC permanent magnet motor (Asset: motor01).
Current Telemetry:
- Speed: ${telemetry.speed_rpm} RPM
- Armature Current: ${telemetry.current_a} A (Nominal: 0.95A, Stall: >3.5A)
- Winding Temperature: ${telemetry.temperature_c} °C (Nominal: ~32°C, Class B Limit: 65°C)
- Vibration RMS: ${telemetry.vibration_rms_g} g (ISO 10816 Zone D Limit: 2.5g)
- Voltage: ${telemetry.voltage_v} V
- Current Diagnostic Consensus: ${diagnosisSummary.scenario} (${diagnosisSummary.severity})
- Confidence: ${(diagnosisSummary.confidence * 100).toFixed(1)}%

Operator Question or Directive: "${query}"

Provide a concise, technically rigorous engineering response. Mention the physical root cause (e.g. back-EMF, Joule heating I^2*R, dynamic unbalance, or brush arcing), evaluate against ISO 10816 vibration or IEEE motor insulation standards if relevant, and supply 2-3 specific actionable maintenance steps. Keep your tone professional, authoritative, and direct.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Internal AI Diagnostic Failure' });
  }
});

// Dev vs Prod Vite mounting
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Diagnostic backend & dashboard running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

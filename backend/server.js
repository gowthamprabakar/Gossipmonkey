import dotenv from 'dotenv';
import { createServerApp } from './src/app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const { httpServer } = createServerApp();

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // ──────────────────────────────────────────────────────────────────
  // Ollama model warmup: fire a silent request to pre-load the model
  // into memory. This prevents cold-start timeouts during the first
  // chat interaction (Ollama takes ~12s to load a 7B model cold).
  // ──────────────────────────────────────────────────────────────────
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
  const MODEL_NAME = process.env.OLLAMA_MODEL || 'mistral:latest';
  console.log(`[Ollama] Warming up ${MODEL_NAME}...`);
  fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: 'hi' }],
      stream: false
    }),
    signal: AbortSignal.timeout(60000)
  })
    .then(r => r.json())
    .then(() => console.log(`[Ollama] ✅ ${MODEL_NAME} warm and ready`))
    .catch(err => console.warn(`[Ollama] ⚠️ Warmup failed: ${err.message}`));
});

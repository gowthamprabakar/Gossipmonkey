import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry'
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  webServer: [
    {
      command: 'rm -f /tmp/chatmonkey-e2e.db && npm run start',
      cwd: '../backend',
      url: 'http://127.0.0.1:3000',
      timeout: 120_000,
      reuseExistingServer: true,
      env: {
        PORT: '3000',
        SESSION_SECRET: 'e2e-secret',
        DB_PATH: '/tmp/chatmonkey-e2e.db',
        OLLAMA_URL: 'http://127.0.0.1:1/api/chat',
        OLLAMA_TIMEOUT_MS: '1000'
      }
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173',
      cwd: '.',
      url: 'http://127.0.0.1:5173',
      timeout: 120_000,
      reuseExistingServer: true,
      env: {
        VITE_API_URL: 'http://127.0.0.1:3000/api',
        VITE_SOCKET_URL: 'http://127.0.0.1:3000'
      }
    }
  ]
});

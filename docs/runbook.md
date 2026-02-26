# Chat Monkey Runbook

## Local (without Docker)

### Backend
1. `cd backend`
2. `cp .env.example .env`
3. `npm install`
4. `npm test`
5. `npm run start`

### Frontend
1. `cd frontend`
2. `cp .env.example .env`
3. `npm install`
4. `npm test`
5. `npm run dev`

## Local (Docker Compose)
1. Ensure Docker is running.
2. From repo root: `docker compose up --build`
3. Frontend: `http://localhost:5173`
4. Backend health: `http://localhost:3000/`

## Ollama dependency
- Monkey AI is Ollama-only in this release.
- Start Ollama locally and pull the model configured in backend `.env`.
- If Ollama is unavailable, chat continues and the app shows `Monkey AI unavailable`.

## Troubleshooting
- If auth fails repeatedly, clear browser local storage keys:
  - `chat_monkey_persona`
  - `chat_monkey_token`
- If DB appears stale, stop backend and remove `backend/data/chatmonkey.db`.

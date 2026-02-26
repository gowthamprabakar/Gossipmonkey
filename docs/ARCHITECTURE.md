# 🏗️ Gossip Monkey Architecture

This document outlines the technical architecture of the Gossip Monkey monorepo, a real-time anonymous chat platform with integrated AI agents.

## System Overview

Gossip Monkey follows a **tiered monorepo architecture** with a decoupled React frontend and an Express/Socket.io backend, using SQLite for lightweight persistence.

```mermaid
graph TD
    User["🌐 Browser Client (React/Vite)"]
    
    subgraph "Backend (Node.js/Express)"
        API["📡 REST API Routes"]
        Socket["⚡ Socket.IO Handler"]
        Auth["🔑 Auth Service"]
        Monkey["🐒 Monkey Service (AI Logic)"]
        Cron["⏰ Scheduler (node-cron)"]
        DB[( "🗄️ SQLite Database" )]
    end
    
    subgraph "AI Infrastructure"
        Ollama["🧠 Local Ollama (LLM)"]
        ImageGen["🎨 Pollinations.ai (Image Gen)"]
    end
    
    User -- "HTTP REST" --> API
    User -- "WebSockets" --> Socket
    
    API -- "CRUD" --> DB
    Socket -- "Real-time Events" --> DB
    Socket -- "Auth Check" --> Auth
    
    Socket -- "Job Queue" --> Monkey
    Monkey -- "Inference" --> Ollama
    Monkey -- "Painting" --> ImageGen
    Monkey -- "Persistence" --> DB
    
    Cron -- "Triggers" --> Monkey
```

## Key Components

### 1. Frontend (React + Vite)
- **Monospace UI**: Custom CSS variables for a retro-terminal aesthetic.
- **Socket Manager**: A stabilized singleton service for handling cross-component socket listeners.
- **Dynamic Config**: Admin-only dashboards for per-room AI and economy management.

### 2. Backend (Node.js + Express)
- **Job Queue**: A FIFO queue system in `monkeyService.js` that serializes AI inference jobs to prevent local LLM (Ollama) overload.
- **Heartbeat Logic**: A background observer that triggers AI interactions based on room activity (3 tiers: Active, Cooling, Dead).
- **Hooks System**: Event-driven reaction engine (e.g., the Monkey AI reacts when a user is kicked or a room is locked).

### 3. Data Layer (SQLite)
- Uses built-in `node:sqlite` for zero-dependency portability.
- **Tables**: `personas`, `rooms`, `messages`, `monkey_memory`, `room_bans`, `flags`, `notifications`, `channel_bookmarks`.

### 4. AI Engine
- **Ollama Integration**: Uses `mistral` or `llama3` locally for privacy and cost-efficiency.
- **Structured JSON**: Backend enforces JSON schema outputs from the LLM for reliable field parsing (`shouldPaint`, `text`, `reason`).

## Folder Structure

```text
/ (root)
├── backend/            # Express, Socket.io, SQLite
│   ├── src/
│   │   ├── services/   # Core logic (Monkey, Room, Auth)
│   │   ├── routes/     # REST Endpoints
│   │   ├── socket/     # WebSocket Events
│   │   └── db/         # Database init & Schema
│   └── uploads/        # Local image storage
├── frontend/           # React, Tailwind, Vite
│   └── src/
│       ├── components/ # Chat, Settings, UI atoms
│       ├── pages/      # Route entry points
│       └── services/   # API & Socket clients
├── docs/               # Technical specs & assets
└── legacy/             # Original design mockups
```

# 🐒 Gossip Monkey — Technical & Product Documentation

> *"More Eyes & Gett Ears. All Yours."*

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Core Features](#core-features)
3. [Architecture Overview](#architecture-overview)
4. [Tech Stack](#tech-stack)
5. [Database Schema](#database-schema)
6. [Backend API Reference](#backend-api-reference)
7. [WebSocket Event Reference](#websocket-event-reference)
8. [Frontend Pages & Components](#frontend-pages--components)
9. [AI Monkey System](#ai-monkey-system)
10. [Banana Economy](#banana-economy)
11. [Privacy & Security Features](#privacy--security-features)
12. [Environment Setup & Running Locally](#environment-setup--running-locally)
13. [Project Structure](#project-structure)
14. [Technical & Product Documentation](#technical--product-documentation)

---

## Product Overview

**Gossip Monkey** is a real-time anonymous chat platform built on a **retro-futuristic terminal aesthetic**. It blends the raw feel of a command-line interface with rich social features: live chat rooms, AI-moderated conversations, a gamified banana economy, image sharing, and per-room configurable AI personalities.

### Who Is It For?

| Persona | How They Use It |
|---|---|
| **Community admins** | Create themed rooms with custom AI Monkeys, set rules, manage users |
| **Anonymous users** | Join channels, chat under a randomised persona, earn bananas |
| **Developers** | Extend the platform — add new AI personalities, economy rules, channel types |
| **Product owners** | Monitor room health, see flag reports, manage banned users |

### Design Philosophy

- **Anonymous by default** — no email, no phone, just a generated alias and avatar
- **Terminal aesthetic** — monospace fonts, green-on-black, box-drawing characters
- **Every room is unique** — admins configure their own AI personality, economy, and rules

---

## Core Features

### 1. 🎭 Anonymous Identity System
- Users create a **Persona** with a custom alias and a DiceBear-generated avatar
- Session is token-based (JWT-like signed token stored client-side)
- No PII collected — no email, phone, or real name required
- Personas have a **Banana Score** that accumulates over activity

### 2. 🏙️ Channel Browser (Lobby)
- Lists all active public rooms sorted by live participant count
- Displays room name, type (public/private), channel kind (general/local/event), and active node count
- Bookmarking system to pin favourite channels
- Filter/search by channel kind and region

### 3. 💬 Real-Time Chat
- WebSocket-based real-time messaging via **Socket.IO**
- Messages rendered in a terminal log style
- System messages for user join/leave events
- Full chat history loaded on room join (last 100 messages)
- Duplicate listener protection via useRef-stabilised callbacks

### 4. 📸 Image Upload & Sharing
- Users can upload images (≤5MB) via `[ UPLOAD ]` button in chat input
- Images stored on the server (`/uploads/` directory)
- Displayed inline in chat as `[IMAGE_DATA_PACKET]` with a visual preview
- Image-only rooms supported (admin can disable text messages)

### 5. 🛡️ Room Administration
Admins access the **`[ CONFIG ]`** panel with two tabs:

**System Tab:**
| Setting | Effect |
|---|---|
| Lockdown Mode | Prevents new users from joining |
| Approval Gate | New joiners must be approved by admin |
| Mute All Nodes | Only admin can send messages |
| Visuals Only | Images/`/paint` only; no text allowed |
| Slow Mode | Enforces delay between messages (5s / 10s / 30s / 60s) |

**Monkey Brain Tab** (see full details in [AI Monkey System](#ai-monkey-system))

### 6. 🐒 AI Monkey (Per-Room Configurable)
Each room has its own AI Monkey persona — unique name, avatar, and personality. See [AI Monkey System](#ai-monkey-system) for full detail.

### 7. 🍌 Banana Economy
A gamified reward system. See [Banana Economy](#banana-economy).

### 8. 👛 Profile / Persona Dossier
- Displays alias, avatar, current banana score
- Shows earned rewards history
- Accessible from the top nav bar (`Profile`)

### 9. 🔒 Private Room Access
- Private rooms require a 6-digit **access code**
- Dedicated `/join` page with terminal-styled input
- Optional approval gate on top of the access code

### 10. 🚩 Content Moderation
- Users can flag messages for admin review
- Admins see flagged messages in the admin panel
- Admins can resolve flags, delete messages, kick users, or ban users
- Banned users cannot rejoin the room

### 11. 🎨 AI Image Generation (`/paint`)
- Type `/paint <prompt>` in chat to generate an AI image (costs 10 bananas)
- Powered by an external image generation service (`imageService.js`)
- Generated images appear in the chat feed

### 12. 🌍 Privacy Controls
- Users can toggle location sharing preferences
- Panic mode setting to quickly hide activity
- Privacy preferences stored per-persona in the database

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Browser Client                     │
│  React (Vite) · Socket.IO Client · Tailwind CSS         │
└─────────────────────┬───────────────────────────────────┘
                      │  HTTP REST + WebSocket
┌─────────────────────▼───────────────────────────────────┐
│                   Express.js Server                     │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  REST API   │  │ Socket.IO   │  │  Static Files   │ │
│  │  Routes     │  │  Handler    │  │  /uploads/      │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│                                                         │
│  Services: auth · room · identity · monkey · channel · │
│            privacy · notification · image · upload      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │         SQLite (node:sqlite built-in)           │    │
│  │  personas · sessions · rooms · room_settings ·  │    │
│  │  messages · reactions · flags · room_bans ·     │    │
│  │  notifications · channel_bookmarks              │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                      │  HTTP API
┌─────────────────────▼───────────────────────────────────┐
│           Ollama (local LLM) — optional                 │
│           Model: mistral:latest (configurable)          │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Dev server & build tool |
| **Tailwind CSS** | Utility-first styling |
| **Socket.IO Client** | Real-time WebSocket communication |
| **React Router v6** | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 22+** | Runtime (uses native `node:sqlite`) |
| **Express.js v5** | HTTP server & REST API |
| **Socket.IO** | WebSocket server |
| **SQLite** (`node:sqlite`) | Embedded database — no external DB needed |
| **Multer** | Multipart file upload handling |
| **dotenv** | Environment variable management |

### External Services (Optional)
| Service | Purpose |
|---|---|
| **Ollama** (local) | LLM for AI Monkey replies (`mistral:latest`) |
| **DiceBear API** | Avatar generation from seed strings |
| **Image Gen API** | AI image generation for `/paint` command |

---

## Database Schema

### `personas`
| Column | Type | Description |
|---|---|---|
| `id` | TEXT PK | UUID |
| `alias` | TEXT | Display name |
| `avatar` | TEXT | Avatar URL |
| `score` | INTEGER | Banana balance (default: 100) |
| `status` | TEXT | `active` / `suspended` |
| `created_at` | TEXT | ISO timestamp |

### `sessions`
| Column | Type | Description |
|---|---|---|
| `id` | TEXT PK | UUID |
| `persona_id` | TEXT FK | Links to persona |
| `token_hash` | TEXT | Hashed session token |
| `expires_at` | TEXT | ISO timestamp |

### `rooms`
| Column | Type | Description |
|---|---|---|
| `id` | TEXT PK | UUID |
| `access_code` | TEXT | 6-char unique code |
| `name` | TEXT | Display name |
| `creator_id` | TEXT FK | Room admin persona |
| `type` | TEXT | `public` / `private` |
| `channel_kind` | TEXT | `general` / `local` / `event` |
| `geohash_prefix` | TEXT | Location-based routing |
| `deleted_at` | TEXT | Soft delete |

### `room_settings`
| Column | Type | Description |
|---|---|---|
| `room_id` | TEXT PK | FK to rooms |
| `approval_required` | INTEGER | 0/1 boolean |
| `slow_mode_seconds` | INTEGER | 0 = off |
| `image_only` | INTEGER | 0/1 boolean |
| `min_score` | INTEGER | Minimum banana score to join |
| `lock_room` | INTEGER | 0/1 boolean |
| `mute_all` | INTEGER | 0/1 boolean |
| `monkey_config_json` | TEXT | JSON blob with per-room AI config |

### `messages`
| Column | Type | Description |
|---|---|---|
| `id` | TEXT PK | UUID |
| `room_id` | TEXT FK | Room the message belongs to |
| `sender_id` | TEXT FK | Persona who sent it |
| `text` | TEXT | Message body |
| `image_url` | TEXT | Uploaded image URL (nullable) |
| `message_type` | TEXT | `user` / `image` / `monkey_action` |
| `deleted_at` | TEXT | Soft delete |

### `reactions`
| Column | Type | Description |
|---|---|---|
| `message_id` | TEXT FK | Target message |
| `persona_id` | TEXT FK | Who reacted |
| `reaction` | TEXT | Emoji string |
| Unique | | One reaction per user per message |

### `room_bans`
Tracks kicked/banned users per room. Includes `revoked_at` for unbanning.

### `flags`
Content reports submitted by users. Resolved by admins.

### `channel_bookmarks`
Per-persona bookmarked channels.

### `notifications`
In-app notifications with `payload_json` for flexible content.

---

## Backend API Reference

Base URL: `http://localhost:3000`

### Identity

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/identity/persona` | Create a new anonymous persona |
| `GET` | `/api/identity/persona/:id` | Get persona by ID |
| `GET` | `/api/identity/me` | Get current session persona |

### Rooms

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/rooms` | List all public rooms |
| `POST` | `/api/rooms` | Create a new room |
| `GET` | `/api/rooms/:id` | Get room details |
| `GET` | `/api/rooms/join/:code` | Find room by access code |

### Channels

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/channels` | List channels with filters |
| `POST` | `/api/channels/bookmark/:roomId` | Bookmark a channel |
| `DELETE` | `/api/channels/bookmark/:roomId` | Remove bookmark |

### Privacy

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/privacy/preferences` | Get user privacy settings |
| `PATCH` | `/api/privacy/preferences` | Update privacy settings |

### Uploads

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload an image file (multipart/form-data, field: `file`) |

Returns: `{ success: true, url: "http://localhost:3000/uploads/file-xxx.png" }`

---

## WebSocket Event Reference

All socket events require authentication via `auth: { token }` in the handshake.

### Client → Server (Emit)

| Event | Payload | Description |
|---|---|---|
| `join_room` | `{ roomId }` | Join a chat room |
| `leave_room` | `{ roomId }` | Leave a chat room |
| `send_message` | `{ roomId, text, imageUrl }` | Send a message |
| `react_message` | `{ roomId, messageId, reaction }` | Toggle a reaction |
| `flag_message` | `{ roomId, messageId }` | Flag content for review |
| `tip_user` | `{ roomId, toUserId, amount }` | Send bananas to a user |
| `kick_user` | `{ roomId, targetUserId }` | Kick a user (admin) |
| `unban_user` | `{ roomId, targetUserId }` | Unban a user (admin) |
| `approve_entry` | `{ socketId, roomId, approved }` | Approve/deny a knock (admin) |
| `delete_message` | `{ roomId, messageId }` | Delete a message (admin) |
| `delete_room` | `{ roomId }` | Delete the room (admin) |
| `update_room_settings` | `{ roomId, settings }` | Update room config (admin) |
| `request_room_admin_data` | `{ roomId }` | Request admin data bundle |
| `resolve_flag` | `{ roomId, flagId }` | Resolve a flag (admin) |

> **Note:** `update_room_settings.settings` accepts all room config fields **plus** `monkeyConfig` for AI Monkey settings.

### Server → Client (Listen)

| Event | Payload | Description |
|---|---|---|
| `receive_message` | Message object | New message in room |
| `system_message` | `{ type, text }` | System notification |
| `system_status` | `{ aiAvailable, reason }` | AI status update |
| `room_history` | `{ messages }` | Full message history on join |
| `participants_updated` | `{ participants }` | Updated participant list |
| `message_updated` | Message object | Reaction update on a message |
| `message_deleted` | `{ messageId }` | Message removed |
| `balance_update` | `{ userId, newScore }` | Banana score updated |
| `knock_request` | `{ socketId, persona }` | Knock pending (admin only) |
| `knock_pending` | `{ message }` | Waiting for approval (user) |
| `entry_granted` | `{ roomId }` | Entry approved |
| `entry_denied` | `{ message }` | Entry rejected |
| `flags_updated` | `{ flags }` | Flag list updated (admin) |
| `banned_users_updated` | `{ users }` | Ban list updated (admin) |
| `room_settings_updated` | `{ settings, monkeyConfig }` | Settings changed |
| `user_kicked` | `{ targetUserId }` | User was kicked |
| `room_deleted` | `{ roomId }` | Room was deleted |

---

## Frontend Pages & Components

### Pages (`/src/pages/`)

| Page | Route | Description |
|---|---|---|
| `SplashPage.jsx` | `/` | Terminal-animated landing page |
| `OnboardingPage.jsx` | `/onboarding` | Identity creation flow |
| `ChannelBrowserPage.jsx` | `/channels` | Channel lobby with room cards |
| `ChannelChatPage.jsx` | `/channels/:id` | Full chat interface for a room |
| `JoinPrivateChannelPage.jsx` | `/join` | 6-digit code entry for private rooms |
| `ProfilePage.jsx` | `/profile` | Persona dossier & reward history |
| `PrivacyPage.jsx` | `/privacy` | Privacy settings management |

### Key Components (`/src/components/`)

| Component | Description |
|---|---|
| `Chat.jsx` | Main chat interface — messages, sidebars, admin controls |
| `ChatInput.jsx` | Message input with text + image upload |
| `ChatSettingsModal.jsx` | Admin config modal — System tab + Monkey Brain tab |
| `IdentitySetup.jsx` | Persona creation form |
| `Lobby.jsx` | Channel browser grid |
| `Landing.jsx` | Animated landing page content |

### UI Components (`/src/components/ui/`)

| Component | Description |
|---|---|
| `Avatar.jsx` | DiceBear avatar renderer |
| `Button.jsx` | Styled terminal button |
| `ChatInput.jsx` | Textarea + upload button |
| `RoomCard.jsx` | Channel browser card |
| `Toast.jsx` | Notification toasts |

### Services (`/src/services/`)

| Service | Description |
|---|---|
| `socketService.js` | Socket.IO connection management + event emitters |
| `roomService.js` | REST calls for room CRUD |
| `identityService.js` | Persona session management |
| `apiClient.js` | Axios base client |
| `notificationService.js` | In-app notification fetching |

---

## AI Monkey System

Each chat room has its own **AI Monkey** — an LLM-powered moderator persona. Admins configure it via the **Monkey Brain** tab in the settings modal.

### How It Works

1. When a user sends a message, the backend calls `analyzeMessage()` in `monkeyService.js`
2. The Monkey checks if any **trigger words** appear in the message
3. If triggered, or randomly based on **reply frequency**, it calls Ollama (LLM)
4. The LLM uses the room's **system prompt** (derived from the selected personality preset)
5. The reply is emitted as a `receive_message` event with the Monkey's name and avatar
6. The message sender earns bananas (capped by daily limit)

### Monkey Config Schema (`monkey_config_json`)

```json
{
  "name": "Gossip Monkey",
  "avatarSeed": "Gossip",
  "personality": "sarcastic",
  "customPrompt": "",
  "triggerWords": ["monkey"],
  "replyFrequency": 0.2,
  "aiRewardAmount": 2,
  "maxDailyRewardPerUser": 20,
  "maxReplyLength": 280,
  "welcomeMessage": "Welcome to the jungle, {name}."
}
```

### Personality Presets

| Preset | Style |
|---|---|
| `sarcastic` | Dry wit, backhanded compliments — default |
| `hype` | Over-the-top CAPS LOCK energy 🔥 |
| `wise` | Short philosophical quotes and deep questions |
| `mentor` | Constructive, encouraging, gives advice |
| `chaotic` | Random conspiracy tangents, unhinged |
| `detective` | Noir monologue — everyone is a suspect 🕵️ |
| `silent` | Almost never replies — hits hard when it does |
| `custom` | Full custom system prompt |

### Welcome Message
- Sent to non-admin users 800ms after joining a room
- Supports `{name}` placeholder → replaced with the joining user's alias
- Leave empty to disable

### Daily Reward Cap
- Tracked in-memory per `roomId_personaId_date` key
- Resets at midnight (memory-based — clears on server restart)
- Configurable per room via `maxDailyRewardPerUser`

---

## Banana Economy

Bananas are the in-app currency that drive engagement.

### Earning Bananas

| Action | Reward |
|---|---|
| Start (new persona) | 🍌 100 |
| Received a reaction (`[ LFE ]` / `[ LOL ]`) | 🍌 +1 per reaction received |
| AI Monkey replies to your message | 🍌 +2 (configurable per room, 0-10) |
| Someone tips you | 🍌 +N (whatever amount they send) |

### Spending Bananas

| Action | Cost |
|---|---|
| AI art generation (`/paint <prompt>`) | 🍌 -10 |
| Tipping another user | 🍌 -N |

### Limits
- Daily AI reward cap per room: configurable (default: 20 bananas/day)
- Minimum score to join a room: configurable per room (`minScore`)

---

## Privacy & Security Features

### Authentication
- Session tokens are **HMAC-signed** strings, verified on every socket connection
- No session stored server-side — stateless verification via `authService.js`
- Tokens expire (configurable TTL)

### Anonymity
- Personas have no link to real identities
- Aliases and avatars are display-only; no email/phone is ever requested
- Users can create new personas at any time

### Privacy Controls
- **Allow Location**: opt-in for geo-based channel routing
- **Panic Mode**: quick-disable flag to hide all activity visibility

### Room Security
- Private rooms require a **6-character access code**
- **Approval Gate** adds a human admin approval step on top of the code
- **Lockdown Mode** prevents all new joins
- **Ban system**: banned users are persisted in `room_bans` table

### Content Safety
- **Flag system**: any user can flag any message
- Admins get real-time flag notifications
- Admins can delete messages and kick/ban users

---

## Environment Setup & Running Locally

### Prerequisites
- **Node.js 22+** (for native `node:sqlite`)
- **npm**
- **Ollama** (optional, for AI Monkey) — download from [ollama.com](https://ollama.com)

### Step 1: Clone & Install

```bash
cd "Gossip Monkey"

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Step 2: Configure Environment

Create `backend/.env`:
```env
PORT=3000
JWT_SECRET=your-secret-key-here

# Optional AI config
OLLAMA_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=mistral:latest
OLLAMA_TIMEOUT_MS=12000
```

### Step 3: Start Ollama (Optional)

```bash
ollama pull mistral
ollama serve
```

### Step 4: Run the Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → Server running on http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → App running on http://localhost:5173
```

### Step 5: Open the App

Navigate to **http://localhost:5173**

---

## Technical & Product Documentation

For deep dives into the system design, product vision, and contribution guidelines, see the `docs/` folder:

- **[Architecture Deep Dive](docs/ARCHITECTURE.md)**: Mermaid diagrams, data flow, and component breakdown.
- **[Product Specification (PRD)](docs/PRODUCT_SPEC.md)**: Vision, user journeys, functional requirements, and roadmap.
- **[Contribution Guide](docs/CONTRIBUTING.md)**: How to set up the dev environment and submit pull requests.

---

## Project Structure

```
Gossip Monkey/
├── backend/
│   ├── server.js               # Entry point
│   ├── .env                    # Environment config
│   ├── uploads/                # Uploaded image files
│   ├── data/
│   │   └── chatmonkey.db       # SQLite database (auto-created)
│   └── src/
│       ├── app.js              # Express app + Socket.IO setup
│       ├── db/
│       │   └── database.js     # Schema, migrations, seed data
│       ├── controllers/
│       │   ├── identityController.js
│       │   ├── roomController.js
│       │   ├── channelController.js
│       │   ├── privacyController.js
│       │   └── uploadController.js
│       ├── routes/
│       │   ├── identityRoutes.js
│       │   ├── roomRoutes.js
│       │   ├── channelRoutes.js
│       │   ├── privacyRoutes.js
│       │   └── uploadRoutes.js
│       ├── services/
│       │   ├── authService.js       # Token sign/verify
│       │   ├── identityService.js   # Persona CRUD
│       │   ├── roomService.js       # Room + message CRUD
│       │   ├── channelService.js    # Channel filtering + bookmarks
│       │   ├── monkeyService.js     # AI Monkey logic + presets
│       │   ├── imageService.js      # AI image generation
│       │   ├── notificationService.js
│       │   ├── privacyService.js
│       │   └── roomStore.js         # In-memory participant tracker
│       ├── socket/
│       │   └── socketHandler.js    # All WebSocket event handlers
│       └── middleware/
│           └── auth.js
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                 # Routes + global state
        ├── main.jsx
        ├── index.css               # Global terminal theme
        ├── pages/
        │   ├── SplashPage.jsx
        │   ├── OnboardingPage.jsx
        │   ├── ChannelBrowserPage.jsx
        │   ├── ChannelChatPage.jsx
        │   ├── JoinPrivateChannelPage.jsx
        │   ├── ProfilePage.jsx
        │   └── PrivacyPage.jsx
        ├── components/
        │   ├── Chat.jsx            # Core chat interface
        │   ├── ChatSettingsModal.jsx
        │   ├── ChatInput.jsx
        │   ├── IdentitySetup.jsx
        │   ├── Landing.jsx
        │   ├── Lobby.jsx
        │   └── ui/                 # Reusable UI components
        └── services/
            ├── socketService.js    # Socket connection + event emitters
            ├── roomService.js      # REST API calls
            ├── identityService.js  # Session management
            └── apiClient.js        # Base HTTP client
```

---

## Known Limitations & Roadmap Notes

| Item | Status | Notes |
|---|---|---|
| Daily reward cap | In-memory | Resets on server restart; use DB for persistence |
| Image storage | Local disk | Move to S3/Cloudinary for production |
| SQLite | Single-file | Fine for prototype; migrate to PostgreSQL for scale |
| Ollama | Local only | Cloud LLM API (OpenAI/Anthropic) as fallback not yet wired |
| Push notifications | Not implemented | WebSocket handles in-app; no native push |
| Mobile app | Web only | PWA shell could wrap the React app |

---

*Built with 🐒 by Gossip Monkey Team*

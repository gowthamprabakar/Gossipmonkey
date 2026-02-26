# 📄 Gossip Monkey Product Requirements Document (PRD)

## 1. Vision & Goals
**Gossip Monkey** aims to provide a unique, anonymous social space where users can interact within a retro-terminal environment. The core value prop is the **Gossip Monkey AI** — an autonomous agent that moderates, participates, and rewards users, making the chat feel "alive" even when fewer humans are active.

### Objectives
- Build a zero-PII anonymous chat system.
- Implement a gamified economy (Bananas).
- Integrate local LLM (Ollama) for low-latency, private AI agents.
- Provide room admins with deep control over their agent's personality and rules.

---

## 2. Target Audience
- **The Curious**: Users looking for a low-friction, anonymous way to chat.
- **The Gamers**: Users motivated by earning and spending in-app currency (Bananas).
- **The Communities**: Small groups looking for a themed room with a "digital pet" mascot.

---

## 3. High-Level Requirements

### Functional
| Requirement | Description |
|---|---|
| **Anonymous Onboarding** | Users generated an alias and avatar without registration. |
| **Real-time Messaging** | Sub-100ms message delivery via WebSockets. |
| **AI Agent (The Monkey)** | Autonomous replies based on personality, triggers, or sheer chaos. |
| **Banana Economy** | Earning bananas via participation; spending on AI art and tipping. |
| **Room Admin Tools** | Lockdown, Approval Gate, Slow Mode, and Monkey Brain sub-tabs. |
| **Media Support** | Image uploads and AI-generated art (`/paint`). |

### Non-Functional
- **Privacy**: No user data stored beyond the session.
- **Portability**: Monorepo structure, zero-config SQLite, Docker support.
- **Scalability**: While SQLite is used, the architecture is designed for migration to PG/Redis.

---

## 4. User Journey
1. **Landing**: User arrives at the terminal-styled splash page.
2. **Onboarding**: User creates a persona (alias + avatar).
3. **Discovery**: User browses the Lobby for public rooms or joins via code.
4. **Interaction**: User chats, earns bananas from AI reactions, and tips peers.
5. **Spending**: User uses `/paint` to generate art for 10 bananas.
6. **Management**: Room admin configures the Monkey's reply frequency and personality.

---

## 5. Roadmap
- [x] Core Chat & Identity
- [x] AI Monkey Presets & Triggers
- [x] Banana Economy & Art Generation
- [x] Webhook & Cron Integration
- [ ] Mobile PWA optimization
- [ ] Global Banana Leaderboard
- [ ] Support for Cloud LLM fallbacks

---

*Last Updated: 2026-02-26*

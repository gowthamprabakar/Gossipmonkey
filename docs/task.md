# Chat Monkey - Task List

## Planning
- [ ] Explore BMAD content
- [x] Brainstorm features using BMAD (Switched to Party Mode)
- [x] Evaluate BMAD Master Agent role
- [x] Activate BMAD Master Agent
- [x] Run Party Mode for Analysis & Planning
- [x] Define the unique features ("What makes it different?")
- [x] Create implementation plan based on user feedback
- [x] Set up project structure

## Implementation
- [x] Initialize frontend (React/Vite)
- [x] Set up backend (Node/Express)
- [x] Implement Identity Engine (Backend & Frontend MVP Done)
- [x] Implement Chat Core (Socket.io)
- [/] Implement 'The Monkey' AI Logic
  - [x] Basic Heuristic Engine (Roasts/Rewards)
  - [/] Advanced LLM Integration (Code Ready, Waiting for API Key)
- [x] Implement Chat Room Creation (Private/Public)
  - [x] Backend: Room Management API
  - [x] Frontend: Lobby & Room Creation UI
- [x] Implement AI Image Generation
  - [x] Backend: Image Service (Pollinations.ai)
  - [x] Chat Integration: '/paint' command logic
  - [x] Frontend: Display Images in Chat
  - [x] Frontend: Display Images in Chat

## Phase 2: Logic & Flow Refinement (Current Focus)
- [/] **Room Mechanics:**
  - [x] Implement Admin Role (Creator = Admin).
  - [x] Implement "Kick" functionality.
  - [x] **[NEW] Implement "Approval Mode" (Knock to Enter).**
  - [x] **[NEW] Implement "Ban List" (Prevent re-entry after kick).**
  - [x] **[NEW] Implement "Room Sharing" (Access Codes / Links).**
  - [ ] Add Room Logic (Min Score, Max Users).
- [ ] **Gossip Engine (The AI):**
  - [x] **[NEW] Implement "Monkey Vibe Check" (Sentiment Analysis via Ollama/Mistral).**
  - [x] **[NEW] Implement "Gossip Injection" (AI Interjections).**
  - [/] **[NEW] Implement "Tipping/Scoring" (Banana Economy).**

## Phase 3: Interaction & Moderation (Serious Engineering)
- [x] **Message Persistence (In-Memory):** Store messages to enable referencing (Reactions/Flags).
- [x] **Reactions:** Allow users to react to messages (🍌, ❤️, 😂, 👎).
- [x] **Moderation System (Master Monkey):**
  - [x] **Flagging:** Users flag messages.
  - [x] **Guardrail Workflow:** Master Monkey alerts Admin; Admin approves "Kill" (Delete).
- [x] **Room Management:**
  - [x] **Delete Room:** Admin can nuke the entire room.

## Phase 4: Formal Definition & Design (New Priority)
- [x] **Step 1: Sitemap & Flow Definition** (Review product_spec.md)
- [x] **Step 2: Component Breakdown** (List all React components needed)
- [x] **Step 3: User Stories & Acceptance Criteria** (Define "Done" for each feature)
- [x] **Step 4: UI/UX Wireframing** (High-fidelity design for specific screens)

## Phase 5: Polish & Launch (Active)
- [x] **UI/UX Overhaul (Premium Jungle Theme):**
    - [x] **Design System:** Tailwind Config (Colors, Fonts, Shadows). *Fixed v4 compatibility issue by downgrading to v3.4.*
    - [x] **Global Styles:** Glassmorphism, Animations, Layout.
    - [x] **Components:** Button, Avatar, Card, Modal, MessageBubble, ChatInput.
    - [x] **Pages:** Redesign Landing, Lobby, Chat, Profile.
- [ ] **Screenshot Protection:** Implement "Best Effort" prevention/warning system.
- [ ] **Deployment:** Deploy to public URL (Vercel/Render).

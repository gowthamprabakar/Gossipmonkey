# Chat Monkey - Implementation Plan

## User Review Required
> [!IMPORTANT]
> **No Screenshots Policy:** Preventing screenshots entirely on mobile/web is technically very difficult and often bypassable (e.g., using another phone). We need to discuss acceptable trade-offs (e.g., notification when screenshot taken, like Snapchat) or platform limitations (easier on mobile app than web).

## Proposed Changes
### Core Features
- [x] **Anonymous Chat:** No persistent user IDs visibly linked to messages.
- [x] **Persona System:** AI-generated base personas with evolutionary scoring.
- [x] **The "Monkey" AI:** Real-time chat observer for rewards/moderation (Heuristic Mode Active, Switching to Local Ollama/Mistral).
- [x] **Chat Rooms:** User-created rooms with rule-based access control (Persona Score).
- [x] **Media Sharing:** AI Image Generation via `/paint` command (Pollinations.ai).

## Phase 5: UI/UX Overhaul (Premium Jungle Theme)

### 1. Design System Implementation
- [x] **Tailwind Configuration:**
  - **Colors:**
    - `banana-yellow`: `#F4D03F` (Neon Accent)
    - `jungle-green`: `#1E272E` (Dark Background)
    - `glass-white`: `rgba(255, 255, 255, 0.1)` (Overlay)
  - **Typography:** Modern Sans-Serif (Inter/Outfit).
  - **Shadows:** Soft, colorful glows for neon effect.

### 2. Component Development
- [x] **Atoms:**
  - `Button` (Neon, Glass variants).
  - `Avatar` (with Status Dot).
  - `ReactionPill` (Animated).
- [x] **Molecules:**
  - `MessageBubble` (Glassmorphic, differing styles for Me/Others).
  - `RoomCard` (Grid item with hover effects).
  - `UserListItem` (Swipeable).
- [x] **Organisms:**
  - `ChatWindow` (Virtual scroll?).
  - `Sidebar` (Slide-in).
  - `ProfileModal` (Center pop-up).

### 3. Page Redesign
- [x] **Landing Page:** High energy, quick entry.
- [x] **Lobby:** Grid layout, search, filter tabs.
- [x] **Chat Room:** Immersive, maximize chat area.

### 4. Global Styles
- [x] **Animations:** `framer-motion` or CSS keyframes for entry/exit.
- [x] **Glassmorphism:** Utility classes for backdrop-blur.

## Verification
- Test responsiveness on Mobile (375px) vs Desktop (1440px).
- Verify Dark Mode contrast ratios.

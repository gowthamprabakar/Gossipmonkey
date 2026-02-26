# Chat Monkey - User Stories & Acceptance Criteria (Definition of Done)

## 1. Landing & Identity (The Hook)

### Story 1.1: Quick Identity Setup
**As a** new visitor,
**I want to** pick a random cool avatar and a name instantly,
**So that** I can enter a chat room without a painful signup process.

**Acceptance Criteria:**
- [ ] **UI:** "Enter the Jungle" button is the primary CTA.
- [ ] **UI:** Avatar carousel allows cycling through at least 5 presets.
- [ ] **Logic:** Clicking "Shuffle" generates a new random name (e.g., "Funky Baboon 99").
- [ ] **State:** On "Enter", user data is saved to `AuthContext` and persists on page reload (localStorage).

---

## 2. The Lobby (Discovery)

### Story 2.1: Room Discovery
**As a** user,
**I want to** see a list of lively rooms,
**So that** I can join a conversation that looks interesting.

**Acceptance Criteria:**
- [ ] **UI:** Grid logic displays `RoomCard` components.
- [ ] **Data:** Each card shows: Room Name, User Count (e.g., "12/50"), and a "Vibe" tag (e.g., "Chill", "Chaos").
- [ ] **Logic:** "Hot" tab sorts by User Count (Descending).
- [ ] **Empty State:** If no rooms exist, show a "Start the Party" CTA.

### Story 2.2: Create a Room
**As a** Host,
**I want to** create a room with specific rules,
**So that** I can control the vibe of the chat.

**Acceptance Criteria:**
- [ ] **UI:** Floating Action Button (FAB) `+` opens `CreateRoomModal`.
- [ ] **Form:** Input fields for Name and Tags.
- [ ] **Settings:** Toggle corresponding to current backend capability (Approval Mode `true/false`).
- [ ] **Outcome:** On Success, user is redirected immediately into the new Room.

---

## 3. The Chat Room (Engagement)

### Story 3.1: Real-Time Messaging (The Core)
**As a** chatter,
**I want to** send and receive messages instantly,
**So that** the conversation feels alive.

**Acceptance Criteria:**
- [ ] **UI:** Messages from self align right (Banana Yellow); others align left (Glass/Grey).
- [ ] **UX:** New messages auto-scroll to bottom.
- [ ] **Performance:** No perceived lag on send.
- [ ] **Visuals:** Avatar and Name appear above incoming messages.

### Story 3.2: Reactions (The Economy)
**As a** user,
**I want to** react to a funny message,
**So that** I can reward the author with bananas.

**Acceptance Criteria:**
- [ ] **UI:** Long-press/Hover on message shows Reaction Bar (🍌, ❤️, 😂, 👎).
- [ ] **Feedback:** Clicking a reaction plays a small animation (scale/pop).
- [ ] **Logic:** Reaction updates instantly for all users.
- [ ] **Economy:** Author's score increments by 1 for positive reactions.

### Story 3.3: Image Generation (AI)
**As a** creative user,
**I want to** use `/paint` command,
**So that** I can share memes or art.

**Acceptance Criteria:**
- [ ] **Input:** Typing `/paint [prompt]` triggers the generation flow.
- [ ] **Feedback:** System message "Artist Monkey is painting..." appears immediately.
- [ ] **Result:** Image loads inline within 5 seconds.
- [ ] **Error Handling:** If API fails, show "Monkey dropped the canvas" toast.

---

## 4. Moderation (The Law)

### Story 4.1: Admin Powers
**As a** Room Creator,
**I want to** manage the users in my room,
**So that** I can prevent trolls from ruining the vibe.

**Acceptance Criteria:**
- [ ] **UI:** Admin sees a "Shield" or "Crown" icon next to their name.
- [ ] **Action:** Clicking a user's avatar opens a menu with "Kick" option.
- [ ] **Feedback:** Kicked user is removed immediately and redirected to "Yeeted" screen.
- [ ] **Notification:** System message announces "User X was kicked".

### Story 4.2: Flagging & Deletion
**As a** User and Admin,
**I want to** flag bad content and remove it,
**So that** the room stays safe.

**Acceptance Criteria:**
- [ ] **User Action:** Non-admins can "Flag" a message.
- [ ] **Admin Alert:** Admin receives a visual alert (Badge/Toast) when a message is flagged.
- [ ] **Admin Action:** Admin can "Delete" any message. Deleted message is removed from DOM for all connected clients.

---

*Approved for Phase 4 Design & Development.*

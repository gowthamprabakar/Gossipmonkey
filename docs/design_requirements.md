# Chat Monkey - Complete Visual Design Requirements

You are the Lead Visual Designer for "Chat Monkey". We need high-fidelity HTML/CSS mockups for the entire application workflow.
The theme is **"Premium Jungle"** (Cyberpunk/Neon Jungle aesthetic).

## 📂 1. Onboarding & Identity
**Goal:** High energy entry. Get the user in within 5 seconds.
*   **1.1 Splash Screen (`splash.html`):**
    *   **Visual:** Centered Logo (Monkey Face with Neon Sunglasses), pulsing glow.
    *   **Text:** "Establishing Connection to the Jungle..."
    *   **Loader:** Digital progress bar or spinning banana.
*   **1.2 Landing / Identity Creation (`landing.html`):**
    *   **Hero:** "ENTER THE JUNGLE".
    *   **Avatar Selection:** Carousel or Grid of AI-generated monkey avatars (Cyber, King, Zen, Chaos).
    *   **Input:** "Claim Your Alias" (Name Input).
    *   **Action:** Giant "GO" button (Neon Yellow).
    *   **Footer:** "Anonymous & Ephemeral".

## 📂 2. Lobby & Discovery
**Goal:** Exploration. Make rooms look like "events".
*   **2.1 Main Lobby (`lobby.html`):**
    *   **Header:** User Profile Pill (Avatar + Name + Banana Score).
    *   **Tabs:** [🔥 Hot] [🌍 Public] [🔒 Private]
    *   **Search Bar:** "Search for vibes..."
    *   **Room Grid:** Cards showing Room Name, Creator, "Live" count, Rules summary.
    *   **Floating Action Button (FAB):** "+ Create" (Bottom Right).
*   **2.2 Empty State (`lobby_empty.html`):**
    *   **Visual:** A lonely monkey looking at a tumbleweed.
    *   **Text:** "It's quiet... too quiet. Start a riot."
    *   **Action:** "Create First Room" button.

## 📂 3. Room Management
**Goal:** Quick setup but powerful controls.
*   **3.1 Create Room Modal (`modal_create_room.html`):**
    *   **Input:** Room Name (e.g. "Chill Vibes Only").
    *   **Type Selector:** [Public] vs [Private (Code Required)] vs [Approval (Knock)].
    *   **Rules Input:** "Don't be a jerk."
    *   **Settings Toggles:** "Slow Mode", "Image Only", "Destruct Timer (1hr)".
*   **3.2 Password/Entry Modal (`modal_enter_code.html`):**
    *   **Visual:** Keypad or Code Input.
    *   **Text:** "This area is restricted."
    *   **Action:** "Unlock".

## 📂 4. The Chat Experience (Core)
**Goal:** Immersive. Content is King.
*   **4.1 Chat View - Default (`chat_main.html`):**
    *   **Header:** Room Title, "Leave" Icon, "Participants" Icon (User Count).
    *   **Message Area:** 
        *   **Me:** Right-aligned, Neon Yellow Bubble, sharp corners.
        *   **Others:** Left-aligned, Glass/White Bubble, rounded.
        *   **System:** Centered, gray text ("A wild user appeared").
    *   **Input Bar:** Glassmorphic panel at bottom. Text area + "Send" button + "Image" icon.
*   **4.2 Chat View - Media & Reactions (`chat_media.html`):**
    *   **Image Message:** Large image preview with rounded corners.
    *   **Reactions:** Small pill under message with Emoji + Count (e.g. "🍌 5").
    *   **Reply Context:** "Replying to @KingKong..." line above bubble.
*   **4.3 Admin/Mod Actions Overlay (`chat_message_actions.html`):**
    *   **Trigger:** Long-press on a message.
    *   **Menu Items:** [❤️ React] [↩️ Reply] [⚠️ Flag] [🗑️ Delete (Admin)] [🚫 Ban User (Admin)].

## 📂 5. Sidebar & Information
**Goal:** Management without leaving the chat.
*   **5.1 Room Details / User List (`sidebar_room_info.html`):**
    *   **Slide-out Panel:** From Right.
    *   **Room Stats:** Created by X, Rules list.
    *   **Participants List:** List of Avatars + Names.
        *   **Host:** Marked with Crown 👑.
        *   **Me:** Marked with "(You)".
*   **5.2 Notifications Hub (`sidebar_notifications.html`):**
    *   **Slide-out Panel:** From Right (or Bell Icon dropdown).
    *   **List Items:** 
        *   "You earned 10 Bananas!"
        *   "KingKong mentioned you."
        *   "Room 'Party' is closing in 5 mins."

## 📂 6. Profiles
**Goal:** Identity and Gamification.
*   **6.1 My Profile (`modal_profile_me.html`):**
    *   **Hero:** Large Avatar with "Edit" pencil.
    *   **Stats Card:** Total Bananas, Reputation Score.
    *   **Inventory:** Grid of unlocked Stickers/Badges (Locked items grayed out).
    *   **Settings:** "Sound Effects", "Notifications".
*   **6.2 Other User Profile (`modal_profile_user.html`):**
    *   **Hero:** Large Avatar.
    *   **Stats:** Reputation Score.
    *   **Action Buttons:** [Gift Banana 🍌] [Mute] [Report].

## 📂 7. Admin Dashboard (Room Host Only)
**Goal:** Power controls for the Host.
*   **7.1 Dashboard (`admin_dashboard.html`):**
    *   **Toggle:** "Lock Room" (Stop new joins).
    *   **Toggle:** "Mute All" (Only Host can talk).
    *   **Flagged Messages:** List of reported content to review.
    *   **Banned Users:** List of kicked users (with "Unban" option).

## 📂 8. States & Errors
**Goal:** Handle failure gracefully.
*   **8.1 Kicked/Banned Screen (`error_banned.html`):**
    *   **Visual:** Judge Monkey or Hammer.
    *   **Text:** "The Tribe has spoken. You have been removed."
    *   **Button:** "Back to Lobby".
*   **8.2 Crash / Monkey Down (`error_crash.html`):**
    *   **Visual:** Sad Monkey.
    *   **Text:** "We slipped on a banana peel. (500 Error)".
    *   **Button:** "Reload".
*   **8.3 Toast Notification (`component_toast.html`):**
    *   **Visual:** Small pill at top/bottom center.
    *   **Types:** Success (Green), Error (Red), Info (Blue).

---

**Colors (Tailwind References):**
*   **Primary Neon:** `#F4D03F` (Banana)
*   **Background:** `#1E272E` (Jungle Dark)
*   **Glass:** `rgba(255, 255, 255, 0.1)` with `backdrop-filter: blur(12px)`
*   **Text:** `White` (Headings), `Gray-400` (Subtext)

**Deliverables:**
Please provide the HTML/CSS for as many of these files as possible. We will integrate them directly into the React app.

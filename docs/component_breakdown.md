# Chat Monkey - Component Architecture

## 1. Contexts & State Management
- **`AuthContext`**: Manages current user Persona (ID, Name, Avatar, Score, Rewards).
- **`SocketContext`**: Handles global WebSocket connection, connection status, and event listeners.
- **`RoomProvider`**: Manages active room state (messages, users, rules) and cached room lists.
- **`UIProvider`**: Controls global UI state (Modals, Toasts, Theme toggles, Sidebar open/close).

## 2. Pages (Routes)
- **`LandingPage`**: Hero section, "Quick Play" entry, "Login" placeholder.
- **`IdentitySetup`**: Form for Name input and Avatar selection carousel.
- **`LobbyPage`**: 
  - Tabs for filtering (Hot/Public/Private).
  - Search Bar.
  - Grid/List of `RoomCard`s.
  - FAB (Floating Action Button) for `CreateRoom`.
- **`ChatRoomPage`**: The main game interface. Connects to `SocketContext`.
- **`KickedScreen`**: Error/Status page for banned users.

## 3. Organisms (Complex Sections)
- **`ChatWindow`**: The core scrolling area. Contains `MessageList` and `ChatInput`.
- **`RoomList`**: Virtualized list of `RoomCard` components for the Lobby.
- **`Sidebar/Drawer`**: Slide-out menu for User List, Room Info, and Settings.
- **`ProfileModal`**: Displays User Stats, Avatar large view, and Rewards.
- **`CreateRoomModal`**: Form with validation for creating new rooms.
- **`AdminDashboard`**: Overlay for creators to manage bans, flags, and rules.

## 4. Molecules (Functional Groups)
- **`MessageBubble`**:
  - Variants: `Incoming`, `Outgoing`, `System`, `Image`.
  - specialized props for `isFlashing` (new), `isFlagged` (admin view).
  - Contains: `Avatar`, `BubbleBody`, `ReactionPill`, `Timestamp`.
- **`RoomCard`**:
  - Displays: Name, User Count, "Locked" icon, Tags (e.g., "Slow Mode").
  - Action: "Join" button.
- **`UserListItem`**:
  - Displays: Avatar, Name, Role Badge (Admin/Monkey), Score.
  - Actions (Swipe/Hover): Kick, Ban, Tip.
- **`ChatInput`**:
  - specialized `Textarea` (auto-expanding).
  - `AttachmentButton` (for future).
  - `EmojiPicker` trigger.
- **`NotificationToast`**: Transient popup for "User Joined" or "Earned Banana".

## 5. Atoms (Basic UI Elements)
- **`Button`**:
  - Variants: `Primary` (Neon Yellow), `Secondary` (Glass), `Destructive` (Red).
  - Sizes: `sm`, `md`, `lg`, `fab`.
- **`Avatar`**: Circle image with online status dot and "King" hat for Admins.
- **`Badge`**: Pill-shaped text for Roles (Admin, Bot) or Scores.
- **`Icon`**: Wrapper for Lucide-React icons (consistent sizing/color).
- **`Input/Textarea`**: Glassmorphic styling, focus states.
- **`Modal`**: Base backdrop and container logic with animation.
- **`Skeleton`**: Loading placeholders for lists and cards.

## 6. Design Tokens (Tailwind Config)
- **Colors**:
  - `banana-500`: Neon Yellow (Primary).
  - `jungle-900`: Deep Dark Green/Slate (Background).
  - `glass-white`: White with 10-20% opacity + blur.
- **Animations**:
  - `slide-up`: Modals.
  - `pop-in`: Messages.
  - `shake`: Invalid actions.
- **Typography**: Inter or similar modern sans-serif.

---
*Ready for implementation planning.*

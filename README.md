# PUNDA — Real-Time WhatsApp-Style Web Messenger

PUNDA is a full-featured, real-time web application inspired by WhatsApp Web, built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase** (Postgres, Realtime, Auth, and Storage), with **WebRTC** peer-to-peer voice and video calls.

---

## 🚀 Features

- **Branding & Visuals**:
  - Original PUNDA branding: rounded chat bubble containing a stylized "P" with a golden spark accent.
  - Premium emerald green (`#16A34A` to `#22C55E`), clean light theme, and dark charcoal (`#111b21` / `#0c1317`) dark theme.
  - Animated splash screen on launch.
- **WhatsApp Web Layout**:
  - Desktop 3-panel layout: left navigation rail, chats list, large conversation area, right contact/group info panel.
  - Mobile full-screen chat with smooth back transitions and bottom navigation (Chats, Status, Calls, Settings).
  - Authentic chat background with subtle doodle wallpaper pattern.
- **Real-Time Messaging**:
  - Instant messages via Supabase Realtime with optimistic UI.
  - Formatted text (`*bold*`, `_italic_`, `~strike~`, URLs, `@mentions`).
  - Read receipts: single check (sent), double grey checks (delivered), double blue checks (read).
  - Typing indicator and online/last seen status.
  - In-chat message search and global chat search.
  - Message actions: Reply, forward, copy, pin, delete for me, delete for everyone.
  - Emoji reactions (👍, ❤️, 😂, 😮, 😢, 🙏) and categorized emoji picker.
- **Media Sharing & Voice Notes**:
  - Voice message recording (`MediaRecorder`) with animated waveform visualizer.
  - Interactive voice player with waveform scrub bar and duration.
  - Camera capture modal using device `getUserMedia` with file-upload fallback.
  - Send photos, videos, audio, and documents/PDFs with preview modal and download buttons.
- **Group Chats**:
  - Create groups with name, description, avatar, and members.
  - Admin & member roles with Admin Announcements-only mode.
- **Status Updates (24h Stories)**:
  - Post text statuses with customizable backgrounds and font styles.
  - Post photo and short video stories.
  - Full-screen story viewer with segmented progress bars, auto-advance, and tap-to-skip.
  - "Who viewed my status" viewer list.
  - Automatic 24-hour expiration filter.
- **Voice & Video Calls (WebRTC)**:
  - One-to-one voice and video calls with incoming and outgoing call screens.
  - Synthesized Web Audio ringtone and call audio cues.
  - Controls: Mute microphone, camera on/off, end call.
  - Signaling powered by Supabase Realtime channels.
  - Call history log saved in the database with 1-click callback.
- **Settings & Privacy**:
  - Privacy controls: Who can see Last Seen, Profile Photo, and About (`everyone`, `contacts`, `nobody`).
  - Chat sounds and background desktop notifications.
  - Two-step verification using Supabase TOTP authenticator app MFA.
  - Change password and delete account.

---

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 with dark mode classes
- **Backend & Database**: Supabase (Postgres, Row Level Security, Auth, Realtime, Storage)
- **Calling**: WebRTC with public Google STUN servers and optional TURN
- **Icons**: Lucide Icons
- **Dates**: date-fns

---

## 🛠️ Supabase Setup Guide

Follow these steps to connect your own Supabase project:

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Under **Project Settings -> API**, copy your **Project URL** and **anon public key**.

### 2. Run the Single SQL Migration
1. In your Supabase Dashboard, open **SQL Editor**.
2. Click **New Query**.
3. Open `supabase/schema.sql` from this repository, copy the entire SQL script, paste it into the editor, and click **Run**.
4. This script automatically:
   - Creates all tables (`profiles`, `friendships`, `invite_links`, `conversations`, `conversation_members`, `messages`, `message_status`, `message_reactions`, `statuses`, `status_views`, `calls`, `reports`).
   - Enables Row Level Security (RLS) on all tables with strict member isolation.
   - Sets up Storage buckets (`avatars`, `chat-media`, `statuses`) with file size and MIME type limits.
   - Configures triggers to auto-create user profiles and unique invite links on signup.
   - Enables Supabase Realtime publication on all message and chat tables.

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Enable Realtime in Supabase
In **Database -> Publications**, ensure `supabase_realtime` has `messages`, `conversations`, `conversation_members`, `friendships`, and `calls` enabled (this is automatically executed by `supabase/schema.sql`).

---

## 🏃 Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Build for production (verifies zero errors)
npm run build

# 3. Start production server
npm run start

# Or start development server with hot-reload
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Checklist Across 2 Accounts

| Step | Action | Expected Result |
|---|---|---|
| **1. Account A Signup** | Sign up with Name, `@handle`, Email & Password | Profile is created, user redirected to WhatsApp 3-panel chat shell |
| **2. Share Invite Link** | Click Contacts -> Find & Invite -> Copy Invite Link | Link copied in format `http://localhost:3000/invite/<code>` |
| **3. Account B Signup** | Open invite link in incognito / second browser | Redirected to signup with invite code prefilled |
| **4. Auto-Add Friend** | Complete Account B signup | Friend is automatically added, opening direct chat with Account A |
| **5. Real-Time Chat** | Type a message from Account B with `*bold*` | Message instantly appears on Account A's screen without page refresh |
| **6. Read Receipts** | View message on Account A | Double grey ticks on Account B turn into double sky-blue ticks |
| **7. Media / Camera** | Click clip icon -> Take photo or choose image | Image preview card displays with zoom preview and download options |
| **8. Voice Note** | Click mic icon, record 5 seconds, send | Waveform audio player renders; clicking play plays audio with progress bar |
| **9. WebRTC Voice Call** | Click phone icon in top bar | Outgoing ringing sound plays; incoming call screen rings on second browser |
| **10. Status Story** | Click Status tab -> Add text status with color | Contact sees green story ring; clicking opens story viewer with timer bar |

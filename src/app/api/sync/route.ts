import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  Profile,
  Conversation,
  Message,
  Status,
  Call,
  Friendship,
} from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DB_FILE = path.join(process.cwd(), '.server_db.json');

interface UserRecord extends Profile {
  email?: string;
  password?: string;
}

interface ServerSignal {
  id: string;
  conversation_id: string;
  from_id: string;
  to_id: string;
  type: 'offer' | 'answer' | 'ice' | 'end';
  payload: unknown;
  created_at: string;
}

interface ServerDB {
  users: UserRecord[];
  friendships: Friendship[];
  conversations: Conversation[];
  messages: Message[];
  statuses: Status[];
  calls: Call[];
  signals: ServerSignal[];
}

const DEFAULT_USERS: UserRecord[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Alex Johnson',
    username: 'alex_j',
    email: 'alex@punda.app',
    password: 'password123',
    phone: '+1 555-0192',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    about: 'Building real-time apps with PUNDA 🚀',
    last_seen: new Date().toISOString(),
    is_online: true,
    privacy_last_seen: 'everyone',
    privacy_avatar: 'everyone',
    privacy_about: 'everyone',
    wallpaper: 'default',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Sarah Connor',
    username: 'sarah_c',
    email: 'sarah@punda.app',
    password: 'password123',
    phone: '+1 555-0144',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    about: 'Available | WhatsApp enthusiast',
    last_seen: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    is_online: true,
    privacy_last_seen: 'everyone',
    privacy_avatar: 'everyone',
    privacy_about: 'everyone',
    wallpaper: 'emerald',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Michael Chen',
    username: 'mchen',
    email: 'michael@punda.app',
    password: 'password123',
    phone: '+1 555-0188',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    about: 'In a meeting 📞',
    last_seen: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    is_online: false,
    privacy_last_seen: 'everyone',
    privacy_avatar: 'everyone',
    privacy_about: 'everyone',
    wallpaper: 'default',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_FRIENDSHIPS: Friendship[] = [
  {
    id: 'fr-alex-sarah',
    requester_id: '11111111-1111-1111-1111-111111111111',
    receiver_id: '22222222-2222-2222-2222-222222222222',
    status: 'accepted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fr-alex-michael',
    requester_id: '11111111-1111-1111-1111-111111111111',
    receiver_id: '33333333-3333-3333-3333-333333333333',
    status: 'accepted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-sarah-1',
    type: 'private',
    name: 'Sarah Connor',
    description: null,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    created_by: '11111111-1111-1111-1111-111111111111',
    is_announcement_only: false,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'conv-michael-2',
    type: 'private',
    name: 'Michael Chen',
    description: null,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_by: '11111111-1111-1111-1111-111111111111',
    is_announcement_only: false,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: 'conv-group-punda-team',
    type: 'group',
    name: 'PUNDA Launch Team 🚀',
    description: 'Official development group for the PUNDA real-time WhatsApp web app.',
    avatar_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    created_by: '11111111-1111-1111-1111-111111111111',
    is_announcement_only: false,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
];

const DEFAULT_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    conversation_id: 'conv-sarah-1',
    sender_id: '22222222-2222-2222-2222-222222222222',
    type: 'text',
    content: 'Hi! Welcome to *PUNDA*!',
    media_url: null,
    media_name: null,
    media_size: null,
    media_mime: null,
    reply_to: null,
    edited_at: null,
    deleted_at: null,
    deleted_for: [],
    is_pinned: true,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    is_delivered: true,
    is_read: true,
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-sarah-1',
    sender_id: '11111111-1111-1111-1111-111111111111',
    type: 'text',
    content: 'Thanks Sarah! The real-time messaging feels super smooth.',
    media_url: null,
    media_name: null,
    media_size: null,
    media_mime: null,
    reply_to: 'msg-1',
    edited_at: null,
    deleted_at: null,
    deleted_for: [],
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    is_delivered: true,
    is_read: true,
  },
  {
    id: 'msg-3',
    conversation_id: 'conv-sarah-1',
    sender_id: '22222222-2222-2222-2222-222222222222',
    type: 'text',
    content: 'Hey! Did you see the new PUNDA voice calling and status features? 🎧',
    media_url: null,
    media_name: null,
    media_size: null,
    media_mime: null,
    reply_to: null,
    edited_at: null,
    deleted_at: null,
    deleted_for: [],
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    is_delivered: true,
    is_read: false,
  },
  {
    id: 'msg-m-1',
    conversation_id: 'conv-michael-2',
    sender_id: '11111111-1111-1111-1111-111111111111',
    type: 'text',
    content: 'Thanks Michael! See you tomorrow.',
    media_url: null,
    media_name: null,
    media_size: null,
    media_mime: null,
    reply_to: null,
    edited_at: null,
    deleted_at: null,
    deleted_for: [],
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    is_delivered: true,
    is_read: true,
  },
  {
    id: 'msg-g-1',
    conversation_id: 'conv-group-punda-team',
    sender_id: '22222222-2222-2222-2222-222222222222',
    type: 'text',
    content: 'Shared the database migration schema with everyone!',
    media_url: null,
    media_name: null,
    media_size: null,
    media_mime: null,
    reply_to: null,
    edited_at: null,
    deleted_at: null,
    deleted_for: [],
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    is_delivered: true,
    is_read: false,
  },
];

function toSafeProfile(user: UserRecord): Profile {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    phone: user.phone,
    avatar_url: user.avatar_url,
    about: user.about,
    last_seen: user.last_seen,
    is_online: user.is_online,
    privacy_last_seen: user.privacy_last_seen,
    privacy_avatar: user.privacy_avatar,
    privacy_about: user.privacy_about,
    wallpaper: user.wallpaper,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

// Helper to read and write database
function loadDB(): ServerDB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading server db:', err);
  }

  const initial: ServerDB = {
    users: DEFAULT_USERS,
    friendships: DEFAULT_FRIENDSHIPS,
    conversations: DEFAULT_CONVERSATIONS,
    messages: DEFAULT_MESSAGES,
    statuses: [],
    calls: [],
    signals: [],
  };
  saveDB(initial);
  return initial;
}

function saveDB(db: ServerDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving server db:', err);
  }
}

// GET Handler
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');
  const db = loadDB();

  switch (action) {
    case 'users': {
      const query = (searchParams.get('q') || '').trim().toLowerCase().replace('@', '');
      const users = db.users
        .filter((u) => u.id !== userId)
        .filter((u) => {
          if (!query) return true;
          return (
            u.username.toLowerCase().includes(query) ||
            u.name.toLowerCase().includes(query) ||
            (u.phone && u.phone.includes(query))
          );
        })
        .map(toSafeProfile);
      return NextResponse.json(users);
    }

    case 'friends': {
      if (!userId) return NextResponse.json([]);
      const userFriends = db.friendships
        .filter((f) => f.requester_id === userId || f.receiver_id === userId)
        .map((f) => {
          const friendId = f.requester_id === userId ? f.receiver_id : f.requester_id;
          const friendProfile = db.users.find((u) => u.id === friendId);
          const safeProfile = friendProfile ? toSafeProfile(friendProfile) : undefined;
          return { ...f, profile: safeProfile };
        });
      return NextResponse.json(userFriends);
    }

    case 'conversations': {
      if (!userId) return NextResponse.json([]);
      // Return conversations that include user or are default demo groups
      const convs = db.conversations.map((c) => {
        let otherMember: Profile | undefined;
        if (c.type === 'private') {
          // If conversation name matches a user or created_by
          const other = db.users.find((u) => u.id !== userId && (u.name === c.name || u.id === c.created_by));
          if (other) {
            otherMember = toSafeProfile(other);
          }
        }

        const convMessages = db.messages.filter((m) => m.conversation_id === c.id);
        const lastMsg = convMessages.length > 0 ? convMessages[convMessages.length - 1] : undefined;

        return {
          ...c,
          other_member: otherMember,
          last_message: lastMsg,
          unread_count: 0,
        };
      });
      return NextResponse.json(convs);
    }

    case 'messages': {
      const convId = searchParams.get('conversationId');
      if (!convId) return NextResponse.json([]);
      const since = searchParams.get('since');

      let convMessages = db.messages.filter((m) => m.conversation_id === convId);
      if (since) {
        convMessages = convMessages.filter((m) => m.created_at > since);
      }

      // Attach sender profile
      const enriched = convMessages.map((m) => {
        const sender = db.users.find((u) => u.id === m.sender_id);
        return {
          ...m,
          sender: sender ? toSafeProfile(sender) : undefined,
        };
      });
      return NextResponse.json(enriched);
    }

    case 'statuses': {
      const now = new Date().toISOString();
      const active = db.statuses
        .filter((s) => s.expires_at > now)
        .map((s) => {
          const author = db.users.find((u) => u.id === s.user_id);
          return {
            ...s,
            user: author ? toSafeProfile(author) : undefined,
          };
        });
      return NextResponse.json(active);
    }

    case 'calls': {
      if (!userId) return NextResponse.json([]);
      const userCalls = db.calls.filter((c) => c.caller_id === userId);
      return NextResponse.json(userCalls);
    }

    case 'signals': {
      const convId = searchParams.get('conversationId');
      const toId = searchParams.get('toId');
      const signals = db.signals.filter((s) => {
        const matchConv = convId ? s.conversation_id === convId : true;
        const matchTo = toId ? s.to_id === toId : true;
        return matchConv && matchTo;
      });
      // Purge delivered signals older than 30s
      db.signals = db.signals.filter((s) => Date.now() - new Date(s.created_at).getTime() < 30000);
      saveDB(db);
      return NextResponse.json(signals);
    }

    default:
      return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  }
}

// POST Handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const db = loadDB();

    switch (action) {
      case 'register': {
        const { name, username, email, password, phone } = body.data || {};
        if (!name || !username || !email || !password) {
          return NextResponse.json({ error: 'Name, username, email, and password are required.' }, { status: 400 });
        }

        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        const cleanEmail = email.trim().toLowerCase();

        const exists = db.users.find(
          (u) => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanEmail)
        );
        if (exists) {
          return NextResponse.json({ error: 'Username or email already in use.' }, { status: 400 });
        }

        const newUser: UserRecord = {
          id: 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
          name: name.trim(),
          username: cleanUsername,
          email: cleanEmail,
          password: password,
          phone: phone?.trim() || null,
          avatar_url: null,
          about: 'Hey there! I am using PUNDA.',
          last_seen: new Date().toISOString(),
          is_online: true,
          privacy_last_seen: 'everyone',
          privacy_avatar: 'everyone',
          privacy_about: 'everyone',
          wallpaper: 'default',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        db.users.push(newUser);

        // Auto-friend the demo users and other users for instant chatting convenience
        for (const defaultUser of db.users) {
          if (defaultUser.id !== newUser.id) {
            db.friendships.push({
              id: `fr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              requester_id: defaultUser.id,
              receiver_id: newUser.id,
              status: 'accepted',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            // Also create a private conversation
            db.conversations.push({
              id: `conv-${newUser.username}-${defaultUser.username}`,
              type: 'private',
              name: defaultUser.name,
              description: null,
              avatar_url: defaultUser.avatar_url,
              created_by: newUser.id,
              is_announcement_only: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }

        saveDB(db);
        const safeProfile = toSafeProfile(newUser);
        return NextResponse.json({ user: safeProfile, profile: safeProfile });
      }

      case 'login': {
        const { email, password } = body;
        const clean = (email || '').trim().toLowerCase();
        const user = db.users.find(
          (u) =>
            (u.email && u.email.toLowerCase() === clean) ||
            u.username.toLowerCase() === clean
        );

        if (!user) {
          return NextResponse.json({ error: 'User not found. Please register first.' }, { status: 404 });
        }

        if (user.password && user.password !== password) {
          return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
        }

        user.is_online = true;
        user.last_seen = new Date().toISOString();
        saveDB(db);

        const safeProfile = toSafeProfile(user);
        return NextResponse.json({ user: safeProfile, profile: safeProfile });
      }

      case 'update_profile': {
        const { userId, updates } = body;
        const idx = db.users.findIndex((u) => u.id === userId);
        if (idx === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        db.users[idx] = {
          ...db.users[idx],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        saveDB(db);
        const safeProfile = toSafeProfile(db.users[idx]);
        return NextResponse.json({ profile: safeProfile });
      }

      case 'create_conversation': {
        const { conv } = body;
        if (!conv) return NextResponse.json({ error: 'Missing conv' }, { status: 400 });
        const exists = db.conversations.find((c) => c.id === conv.id);
        if (!exists) {
          db.conversations.unshift(conv);
          saveDB(db);
        }
        return NextResponse.json(conv);
      }

      case 'send_message': {
        const { message } = body;
        if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 });

        const fullMsg: Message = {
          ...message,
          created_at: message.created_at || new Date().toISOString(),
          is_delivered: true,
          is_read: false,
          deleted_for: message.deleted_for || [],
        };

        db.messages.push(fullMsg);

        // Update conversation updated_at
        const conv = db.conversations.find((c) => c.id === fullMsg.conversation_id);
        if (conv) {
          conv.updated_at = fullMsg.created_at;
        }

        saveDB(db);
        return NextResponse.json(fullMsg);
      }

      case 'react_message': {
        const { messageId, userId, emoji } = body;
        const msg = db.messages.find((m) => m.id === messageId);
        if (msg) {
          msg.reactions = msg.reactions || [];
          const existing = msg.reactions.findIndex((r) => r.user_id === userId && r.emoji === emoji);
          if (existing >= 0) {
            msg.reactions.splice(existing, 1);
          } else {
            msg.reactions.push({
              id: `react-${Date.now()}`,
              message_id: messageId,
              user_id: userId,
              emoji,
              created_at: new Date().toISOString(),
            });
          }
          saveDB(db);
        }
        return NextResponse.json({ ok: true });
      }

      case 'pin_message': {
        const { messageId, isPinned } = body;
        const msg = db.messages.find((m) => m.id === messageId);
        if (msg) {
          msg.is_pinned = isPinned;
          saveDB(db);
        }
        return NextResponse.json({ ok: true });
      }

      case 'delete_message': {
        const { messageId, userId, forEveryone } = body;
        const msg = db.messages.find((m) => m.id === messageId);
        if (msg) {
          if (forEveryone) {
            msg.deleted_at = new Date().toISOString();
          } else {
            msg.deleted_for = msg.deleted_for || [];
            if (!msg.deleted_for.includes(userId)) {
              msg.deleted_for.push(userId);
            }
          }
          saveDB(db);
        }
        return NextResponse.json({ ok: true });
      }

      case 'post_status': {
        const { status } = body;
        if (status) {
          db.statuses.unshift(status);
          saveDB(db);
        }
        return NextResponse.json({ ok: true });
      }

      case 'log_call': {
        const { call } = body;
        if (call) {
          db.calls.unshift(call);
          saveDB(db);
        }
        return NextResponse.json({ ok: true });
      }

      case 'send_signal': {
        const { signal } = body;
        if (signal) {
          db.signals.push({
            ...signal,
            created_at: new Date().toISOString(),
          });
          saveDB(db);
        }
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: unknown) {
    console.error('API Sync POST error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}

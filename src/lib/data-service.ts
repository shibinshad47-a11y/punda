'use client';

import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';
import {
  Profile,
  Conversation,
  Message,
  Status,
  Call,
  Friendship,
  FriendshipStatus,
} from '@/types/database';
import { DEMO_USERS } from './auth-context';

// Local storage keys for persisting test data in preview mode
const STORAGE_FRIENDS = 'punda_friends_v1';
const STORAGE_CONVERSATIONS = 'punda_conversations_v1';
const STORAGE_MESSAGES = 'punda_messages_v1';
const STORAGE_STATUSES = 'punda_statuses_v1';
const STORAGE_CALLS = 'punda_calls_v1';
const STORAGE_BLOCKED = 'punda_blocked_v1';

// Seed initial realistic conversations
const getInitialConversations = (currentUserId: string): Conversation[] => {
  const other1 = DEMO_USERS[1]; // Sarah
  const other2 = DEMO_USERS[2]; // Michael

  return [
    {
      id: 'conv-sarah-1',
      type: 'private',
      name: other1.name,
      description: null,
      avatar_url: other1.avatar_url,
      created_by: currentUserId,
      is_announcement_only: false,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      other_member: other1,
      unread_count: 1,
      last_message: {
        id: 'msg-sarah-init',
        conversation_id: 'conv-sarah-1',
        sender_id: other1.id,
        type: 'text',
        content: 'Hey! Did you see the new PUNDA voice calling feature? 🎧',
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
    },
    {
      id: 'conv-michael-2',
      type: 'private',
      name: other2.name,
      description: null,
      avatar_url: other2.avatar_url,
      created_by: currentUserId,
      is_announcement_only: false,
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      other_member: other2,
      unread_count: 0,
      last_message: {
        id: 'msg-michael-init',
        conversation_id: 'conv-michael-2',
        sender_id: currentUserId,
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
    },
    {
      id: 'conv-group-punda-team',
      type: 'group',
      name: 'PUNDA Launch Team 🚀',
      description: 'Official development group for the PUNDA real-time WhatsApp web app.',
      avatar_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      created_by: currentUserId,
      is_announcement_only: false,
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      unread_count: 2,
      last_message: {
        id: 'msg-group-init',
        conversation_id: 'conv-group-punda-team',
        sender_id: other1.id,
        type: 'text',
        content: 'Shared the new database migration schema with everyone!',
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
    },
  ];
};

const getInitialMessages = (currentUserId: string): Record<string, Message[]> => {
  const other1 = DEMO_USERS[1];
  return {
    'conv-sarah-1': [
      {
        id: 'msg-1',
        conversation_id: 'conv-sarah-1',
        sender_id: other1.id,
        type: 'text',
        content: 'Hi Alex! Welcome to *PUNDA*!',
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
        sender_id: currentUserId,
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
        sender_id: other1.id,
        type: 'text',
        content: 'Hey! Did you see the new PUNDA voice calling feature? 🎧',
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
    ],
  };
};

export const dataService = {
  // 1. Search Users
  async searchUsers(query: string, currentUserId: string): Promise<Profile[]> {
    if (!query.trim()) return [];
    const clean = query.trim().toLowerCase().replace('@', '');

    if (!isSupabaseConfigured()) {
      try {
        const res = await fetch(`/api/sync?action=users&q=${encodeURIComponent(clean)}&userId=${currentUserId}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch (err) {
        console.warn('searchUsers sync error:', err);
      }
      return DEMO_USERS.filter(
        (u) =>
          u.id !== currentUserId &&
          (u.username.toLowerCase().includes(clean) ||
            u.name.toLowerCase().includes(clean) ||
            (u.phone && u.phone.includes(clean)))
      );
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .or(`username.ilike.%${clean}%,name.ilike.%${clean}%,phone.ilike.%${clean}%`)
        .limit(15);

      if (error) throw error;
      return (data || []) as Profile[];
    } catch (err) {
      console.warn('searchUsers Supabase error, fallback to demo:', err);
      return DEMO_USERS.filter((u) => u.id !== currentUserId && u.username.includes(clean));
    }
  },

  // 2. Friendships
  async getFriends(currentUserId: string): Promise<Friendship[]> {
    if (!isSupabaseConfigured()) {
      try {
        const res = await fetch(`/api/sync?action=friends&userId=${currentUserId}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch (err) {
        console.warn('getFriends sync error:', err);
      }
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_FRIENDS) : null;
      if (saved) return JSON.parse(saved);

      const defaultFriends: Friendship[] = [
        {
          id: 'fr-1',
          requester_id: currentUserId,
          receiver_id: DEMO_USERS[1].id,
          status: 'accepted',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile: DEMO_USERS[1],
        },
        {
          id: 'fr-2',
          requester_id: currentUserId,
          receiver_id: DEMO_USERS[2].id,
          status: 'accepted',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile: DEMO_USERS[2],
        },
      ];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_FRIENDS, JSON.stringify(defaultFriends));
      }
      return defaultFriends;
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id, requester_id, receiver_id, status, created_at, updated_at,
          requester:profiles!requester_id(*),
          receiver:profiles!receiver_id(*)
        `)
        .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      if (error) throw error;

      return (data || []).map((row: any) => {
        const otherProfile = row.requester_id === currentUserId ? row.receiver : row.requester;
        return {
          id: row.id,
          requester_id: row.requester_id,
          receiver_id: row.receiver_id,
          status: row.status as FriendshipStatus,
          created_at: row.created_at,
          updated_at: row.updated_at,
          profile: otherProfile,
        };
      });
    } catch (err) {
      console.warn('getFriends error:', err);
      return [];
    }
  },

  async sendFriendRequest(currentUserId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      const friends = await this.getFriends(currentUserId);
      const targetUser = DEMO_USERS.find((u) => u.id === targetUserId);
      if (!targetUser) return { success: false, error: 'User not found' };

      const newFriendship: Friendship = {
        id: `fr-${Date.now()}`,
        requester_id: currentUserId,
        receiver_id: targetUserId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: targetUser,
      };
      friends.push(newFriendship);
      localStorage.setItem(STORAGE_FRIENDS, JSON.stringify(friends));
      return { success: true };
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('friendships').insert({
        requester_id: currentUserId,
        receiver_id: targetUserId,
        status: 'pending',
      });
      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to send request' };
    }
  },

  async updateFriendshipStatus(
    friendshipId: string,
    status: FriendshipStatus,
    currentUserId: string
  ): Promise<{ success: boolean }> {
    if (!isSupabaseConfigured()) {
      const friends = await this.getFriends(currentUserId);
      const idx = friends.findIndex((f) => f.id === friendshipId);
      if (idx !== -1) {
        friends[idx].status = status;
        localStorage.setItem(STORAGE_FRIENDS, JSON.stringify(friends));
      }
      return { success: true };
    }

    try {
      const supabase = getSupabaseClient();
      await supabase.from('friendships').update({ status }).eq('id', friendshipId);
      return { success: true };
    } catch (err) {
      console.warn('updateFriendshipStatus error:', err);
      return { success: false };
    }
  },

  // 3. Process Invite Code
  async processInviteLink(code: string, currentUserId: string): Promise<{ success: boolean; conversation_id?: string; error?: string }> {
    if (!isSupabaseConfigured()) {
      // Find user who owns code or default to Sarah
      const inviter = DEMO_USERS.find((u) => u.id.startsWith(code) || code.includes(u.username)) || DEMO_USERS[1];
      if (inviter.id === currentUserId) {
        return { success: false, error: 'You cannot use your own invite link' };
      }

      // Add to friends and start conversation
      const conv = await this.getOrCreatePrivateConversation(currentUserId, inviter.id);
      return { success: true, conversation_id: conv.id };
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('process_invite_link', {
        invite_code: code.trim(),
      });
      if (error) throw error;
      return data;
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to process invite link' };
    }
  },

  // 4. Conversations
  async getConversations(currentUserId: string): Promise<Conversation[]> {
    if (!isSupabaseConfigured()) {
      try {
        const res = await fetch(`/api/sync?action=conversations&userId=${currentUserId}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch (err) {
        console.warn('getConversations sync error:', err);
      }
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_CONVERSATIONS) : null;
      if (saved) return JSON.parse(saved);
      const defaults = getInitialConversations(currentUserId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_CONVERSATIONS, JSON.stringify(defaults));
      }
      return defaults;
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          members:conversation_members(
            role, user_id, last_read_at,
            profile:profiles(*)
          ),
          messages:messages(
            id, type, content, media_url, created_at, sender_id
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((c: any) => {
        const other = c.type === 'private'
          ? c.members?.find((m: any) => m.user_id !== currentUserId)?.profile
          : null;
        const lastMsg = c.messages?.[c.messages.length - 1];

        return {
          id: c.id,
          type: c.type,
          name: c.type === 'private' && other ? other.name : c.name,
          description: c.description,
          avatar_url: c.type === 'private' && other ? other.avatar_url : c.avatar_url,
          created_by: c.created_by,
          is_announcement_only: c.is_announcement_only,
          created_at: c.created_at,
          updated_at: c.updated_at,
          other_member: other,
          last_message: lastMsg,
          unread_count: 0,
        };
      });
    } catch (err) {
      console.warn('getConversations Supabase error, falling back:', err);
      return getInitialConversations(currentUserId);
    }
  },

  async getOrCreatePrivateConversation(currentUserId: string, otherUserId: string): Promise<Conversation> {
    const convs = await this.getConversations(currentUserId);
    const existing = convs.find(
      (c) => c.type === 'private' && c.other_member?.id === otherUserId
    );
    if (existing) return existing;

    const otherProfile = DEMO_USERS.find((u) => u.id === otherUserId) || {
      id: otherUserId,
      name: 'PUNDA Contact',
      username: 'contact',
      phone: null,
      avatar_url: null,
      about: 'Available',
      last_seen: new Date().toISOString(),
      is_online: true,
      privacy_last_seen: 'everyone',
      privacy_avatar: 'everyone',
      privacy_about: 'everyone',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      type: 'private',
      name: otherProfile.name,
      description: null,
      avatar_url: otherProfile.avatar_url,
      created_by: currentUserId,
      is_announcement_only: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      other_member: otherProfile,
      unread_count: 0,
    };

    convs.unshift(newConv);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_CONVERSATIONS, JSON.stringify(convs));
    }
    return newConv;
  },

  async createGroupConversation(
    name: string,
    description: string,
    avatarUrl: string | null,
    memberIds: string[],
    currentUserId: string,
    isAnnouncementOnly = false
  ): Promise<Conversation> {
    const convs = await this.getConversations(currentUserId);
    const newGroup: Conversation = {
      id: `group-${Date.now()}`,
      type: 'group',
      name: name.trim(),
      description: description.trim() || null,
      avatar_url: avatarUrl,
      created_by: currentUserId,
      is_announcement_only: isAnnouncementOnly,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unread_count: 0,
    };

    convs.unshift(newGroup);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_CONVERSATIONS, JSON.stringify(convs));
    }
    return newGroup;
  },

  // 5. Messages
  async getMessages(conversationId: string, currentUserId: string): Promise<Message[]> {
    if (!isSupabaseConfigured()) {
      try {
        const res = await fetch(`/api/sync?action=messages&conversationId=${conversationId}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            return list.filter((m: Message) => !m.deleted_for?.includes(currentUserId));
          }
        }
      } catch (err) {
        console.warn('getMessages sync error:', err);
      }
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_MESSAGES) : null;
      const allMsgs = saved ? JSON.parse(saved) : getInitialMessages(currentUserId);
      return (allMsgs[conversationId] || []).filter(
        (m: Message) => !m.deleted_for?.includes(currentUserId)
      );
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(*),
          reactions:message_reactions(*, user_profile:profiles(*)),
          statuses:message_status(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Message[];
    } catch (err) {
      console.warn('getMessages error:', err);
      const defaults = getInitialMessages(currentUserId);
      return defaults[conversationId] || [];
    }
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: Message['type'] = 'text',
    mediaDetails?: { url: string; name?: string; size?: number; mime?: string },
    replyToId?: string
  ): Promise<Message> {
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversation_id: conversationId,
      sender_id: senderId,
      type,
      content: content.trim() || null,
      media_url: mediaDetails?.url || null,
      media_name: mediaDetails?.name || null,
      media_size: mediaDetails?.size || null,
      media_mime: mediaDetails?.mime || null,
      reply_to: replyToId || null,
      edited_at: null,
      deleted_at: null,
      deleted_for: [],
      is_pinned: false,
      created_at: new Date().toISOString(),
      is_delivered: true,
      is_read: false,
    };

    if (!isSupabaseConfigured()) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send_message', message: newMsg }),
        });
      } catch (err) {
        console.warn('sendMessage sync error:', err);
      }

      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_MESSAGES) : null;
      const allMsgs = saved ? JSON.parse(saved) : getInitialMessages(senderId);
      if (!allMsgs[conversationId]) allMsgs[conversationId] = [];
      allMsgs[conversationId].push(newMsg);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(allMsgs));
      }

      // Update conversation timestamp
      const convs = await this.getConversations(senderId);
      const conv = convs.find((c) => c.id === conversationId);
      if (conv) {
        conv.last_message = newMsg;
        conv.updated_at = newMsg.created_at;
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_CONVERSATIONS, JSON.stringify(convs));
        }
      }
      return newMsg;
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          type,
          content: newMsg.content,
          media_url: newMsg.media_url,
          media_name: newMsg.media_name,
          media_size: newMsg.media_size,
          media_mime: newMsg.media_mime,
          reply_to: replyToId,
        })
        .select('*, sender:profiles!sender_id(*)')
        .single();

      if (error) throw error;
      return data as Message;
    } catch (err) {
      console.warn('sendMessage Supabase error, returning optimistic msg:', err);
      return newMsg;
    }
  },

  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'react_message', messageId, userId, emoji }),
        });
      } catch (err) {
        console.warn('addReaction sync error:', err);
      }
      return;
    }
    try {
      const supabase = getSupabaseClient();
      await supabase.from('message_reactions').upsert({
        message_id: messageId,
        user_id: userId,
        emoji,
      });
    } catch (err) {
      console.warn('addReaction error:', err);
    }
  },

  async deleteMessage(
    messageId: string,
    conversationId: string,
    currentUserId: string,
    deleteForEveryone: boolean
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_message', messageId, userId: currentUserId, forEveryone: deleteForEveryone }),
        });
      } catch (err) {
        console.warn('deleteMessage sync error:', err);
      }
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_MESSAGES) : null;
      if (!saved) return;
      const allMsgs = JSON.parse(saved);
      if (!allMsgs[conversationId]) return;

      if (deleteForEveryone) {
        allMsgs[conversationId] = allMsgs[conversationId].map((m: Message) =>
          m.id === messageId ? { ...m, content: 'This message was deleted', deleted_at: new Date().toISOString() } : m
        );
      } else {
        allMsgs[conversationId] = allMsgs[conversationId].map((m: Message) =>
          m.id === messageId ? { ...m, deleted_for: [...(m.deleted_for || []), currentUserId] } : m
        );
      }
      localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(allMsgs));
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (deleteForEveryone) {
        await supabase
          .from('messages')
          .update({
            content: 'This message was deleted',
            deleted_at: new Date().toISOString(),
          })
          .eq('id', messageId);
      } else {
        await supabase.rpc('delete_message_for_me', { message_id: messageId });
      }
    } catch (err) {
      console.warn('deleteMessage error:', err);
    }
  },

  // 6. Statuses
  async getStatuses(userId?: string): Promise<Status[]> {
    if (!isSupabaseConfigured()) {
      try {
        const res = await fetch('/api/sync?action=statuses');
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch (err) {
        console.warn('getStatuses sync error:', err);
      }
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_STATUSES) : null;
      if (saved) return JSON.parse(saved);

      const defaults: Status[] = [
        {
          id: 'status-1',
          user_id: DEMO_USERS[1].id,
          type: 'text',
          content: '🚀 Excited about the PUNDA launch! Testing real-time WebRTC audio & video calls today!',
          media_url: null,
          bg_color: '#16A34A',
          font_style: 'sans',
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
          user: DEMO_USERS[1],
          views: [],
        },
      ];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_STATUSES, JSON.stringify(defaults));
      }
      return defaults;
    }

    try {
      const supabase = getSupabaseClient();
      const query = supabase
        .from('statuses')
        .select(`
          *,
          user:profiles!user_id(*),
          views:status_views(*, viewer:profiles(*))
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (userId) {
        // Can filter for user or friends
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Status[];
    } catch (err) {
      console.warn('getStatuses error:', err);
      return [];
    }
  },

  async postStatus(
    userId: string,
    type: 'text' | 'image' | 'video',
    content: string | null,
    mediaUrl: string | null,
    bgColor = '#16A34A',
    fontStyle = 'sans'
  ): Promise<Status> {
    const newStatus: Status = {
      id: `status-${Date.now()}`,
      user_id: userId,
      type,
      content,
      media_url: mediaUrl,
      bg_color: bgColor,
      font_style: fontStyle,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      views: [],
    };

    if (!isSupabaseConfigured()) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'post_status', status: newStatus }),
        });
      } catch (err) {
        console.warn('postStatus sync error:', err);
      }
      const list = await this.getStatuses(userId);
      list.unshift(newStatus);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_STATUSES, JSON.stringify(list));
      }
      return newStatus;
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('statuses')
        .insert({
          user_id: userId,
          type,
          content,
          media_url: mediaUrl,
          bg_color: bgColor,
          font_style: fontStyle,
        })
        .select('*, user:profiles!user_id(*)')
        .single();

      if (error) throw error;
      return data as Status;
    } catch (err) {
      console.warn('postStatus error:', err);
      return newStatus;
    }
  },

  // 7. Calls History
  async getCalls(userId?: string): Promise<Call[]> {
    if (!isSupabaseConfigured()) {
      try {
        const res = await fetch(`/api/sync?action=calls&userId=${userId || ''}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch (err) {
        console.warn('getCalls sync error:', err);
      }
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_CALLS) : null;
      if (saved) return JSON.parse(saved);

      const defaults: Call[] = [
        {
          id: 'call-1',
          conversation_id: 'conv-sarah-1',
          caller_id: DEMO_USERS[1].id,
          type: 'voice',
          status: 'ended',
          started_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          ended_at: new Date(Date.now() - 3600000 * 5 + 184000).toISOString(),
          duration_seconds: 184,
          caller: DEMO_USERS[1],
        },
        {
          id: 'call-2',
          conversation_id: 'conv-michael-2',
          caller_id: DEMO_USERS[2].id,
          type: 'video',
          status: 'missed',
          started_at: new Date(Date.now() - 3600000 * 26).toISOString(),
          ended_at: null,
          duration_seconds: 0,
          caller: DEMO_USERS[2],
        },
      ];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_CALLS, JSON.stringify(defaults));
      }
      return defaults;
    }

    try {
      const supabase = getSupabaseClient();
      const query = supabase
        .from('calls')
        .select('*, caller:profiles!caller_id(*)')
        .order('started_at', { ascending: false });

      if (userId) {
        // user filtered calls
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Call[];
    } catch (err) {
      console.warn('getCalls error:', err);
      return [];
    }
  },

  async logCall(
    callerId: string,
    conversationId: string | null,
    type: 'voice' | 'video',
    status: Call['status'],
    durationSeconds = 0
  ): Promise<void> {
    const newCall: Call = {
      id: `call-${Date.now()}`,
      caller_id: callerId,
      conversation_id: conversationId,
      type,
      status,
      started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    };

    if (!isSupabaseConfigured()) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'log_call', call: newCall }),
        });
      } catch (err) {
        console.warn('logCall sync error:', err);
      }
      const calls = await this.getCalls(callerId);
      calls.unshift(newCall);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_CALLS, JSON.stringify(calls));
      }
      return;
    }

    try {
      const supabase = getSupabaseClient();
      await supabase.from('calls').insert({
        caller_id: callerId,
        conversation_id: conversationId,
        type,
        status,
        started_at: newCall.started_at,
        ended_at: newCall.ended_at,
        duration_seconds: durationSeconds,
      });
    } catch (err) {
      console.warn('logCall error:', err);
    }
  },

  // 8. Block & Report
  async blockUser(targetUserId: string, currentUserId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const blocked = JSON.parse(localStorage.getItem(STORAGE_BLOCKED) || '[]');
      if (!blocked.includes(targetUserId)) {
        blocked.push(targetUserId);
        localStorage.setItem(STORAGE_BLOCKED, JSON.stringify(blocked));
      }
      return;
    }

    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('friendships')
        .upsert({ requester_id: currentUserId, receiver_id: targetUserId, status: 'blocked' });
    } catch (err) {
      console.warn('blockUser error:', err);
    }
  },

  async reportUser(reporterId: string, reportedId: string, reason: string): Promise<{ success: boolean }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }
    try {
      const supabase = getSupabaseClient();
      await supabase.from('reports').insert({
        reporter_id: reporterId,
        reported_id: reportedId,
        reason,
      });
      return { success: true };
    } catch {
      return { success: false };
    }
  },
};

'use client';

import React, { useState, useMemo } from 'react';
import { Conversation } from '@/types/database';
import { PundaLogo } from '../common/PundaLogo';
import {
  Search,
  MessageSquarePlus,
  Users,
  Check,
  CheckCheck,
  Mic,
  Image as ImageIcon,
  FileText,
  Video,
  X,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatsListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
}

export const ChatsList: React.FC<ChatsListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenNewChat,
  onOpenNewGroup,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all');

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isToday(d)) return format(d, 'HH:mm');
      if (isYesterday(d)) return 'Yesterday';
      return format(d, 'dd/MM/yy');
    } catch {
      return '';
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Search filter
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.last_message?.content && c.last_message.content.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Tab filter
      if (filter === 'unread') return (c.unread_count || 0) > 0;
      if (filter === 'groups') return c.type === 'group';
      return true;
    });
  }, [conversations, search, filter]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111b21] border-r border-zinc-200 dark:border-[#222d34] select-none">
      {/* Top Header */}
      <div className="h-16 px-4 bg-zinc-50 dark:bg-[#202c33] flex items-center justify-between shrink-0 border-b border-zinc-200/60 dark:border-[#2f3b43]">
        <div className="flex items-center gap-2">
          <PundaLogo size={32} />
          <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
            Chats
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenNewGroup}
            title="New Group"
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-200/60 dark:hover:bg-[#111b21] rounded-full transition-colors cursor-pointer"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onOpenNewChat}
            title="New Chat / Contacts"
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-200/60 dark:hover:bg-[#111b21] rounded-full transition-colors cursor-pointer"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-zinc-100 dark:border-[#222d34] bg-white dark:bg-[#111b21]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or start new chat..."
            className="w-full pl-9 pr-8 py-2 bg-zinc-100 dark:bg-[#202c33] border-none rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-white placeholder-zinc-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 dark:bg-[#202c33] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#2a3942]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              filter === 'unread'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 dark:bg-[#202c33] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#2a3942]'
            }`}
          >
            Unread
          </button>
          <button
            type="button"
            onClick={() => setFilter('groups')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              filter === 'groups'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 dark:bg-[#202c33] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#2a3942]'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-[#202c33]/40">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 space-y-2">
            <p className="text-xs font-medium">No chats found</p>
            <button
              type="button"
              onClick={onOpenNewChat}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              Start chatting with friends
            </button>
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isActive = c.id === activeConversationId;
            const isOnline = c.type === 'private' && c.other_member?.is_online;
            const lastMsg = c.last_message;

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={`flex items-center gap-3 p-3 px-4 cursor-pointer transition-colors relative ${
                  isActive
                    ? 'bg-zinc-100 dark:bg-[#2a3942]'
                    : 'hover:bg-zinc-50 dark:hover:bg-[#202c33]/70'
                }`}
              >
                {/* Avatar with optional online dot */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-700 dark:text-zinc-200 uppercase">
                    {c.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : c.type === 'group' ? (
                      <Users className="w-5 h-5 text-zinc-500" />
                    ) : (
                      c.name?.[0] || 'P'
                    )}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#111b21]" />
                  )}
                </div>

                {/* Info & Last message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                      {c.name || 'Conversation'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 shrink-0 ml-2">
                      {formatMessageTime(lastMsg?.created_at || c.updated_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1 truncate pr-2">
                      {/* Read receipts icon */}
                      {lastMsg?.is_read ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      ) : lastMsg?.is_delivered ? (
                        <CheckCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      )}

                      {/* Content preview icon */}
                      {lastMsg?.type === 'image' && <ImageIcon className="w-3.5 h-3.5 shrink-0" />}
                      {lastMsg?.type === 'video' && <Video className="w-3.5 h-3.5 shrink-0" />}
                      {lastMsg?.type === 'voice' && <Mic className="w-3.5 h-3.5 shrink-0 text-emerald-500" />}
                      {lastMsg?.type === 'file' && <FileText className="w-3.5 h-3.5 shrink-0" />}

                      <span className="truncate">
                        {lastMsg?.type === 'voice'
                          ? 'Voice message'
                          : lastMsg?.type === 'image'
                          ? 'Photo'
                          : lastMsg?.type === 'video'
                          ? 'Video'
                          : lastMsg?.content || 'No messages yet'}
                      </span>
                    </div>

                    {/* Unread badge */}
                    {(c.unread_count || 0) > 0 && (
                      <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

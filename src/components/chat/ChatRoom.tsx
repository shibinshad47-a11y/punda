'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { dataService } from '@/lib/data-service';
import { soundManager } from '@/lib/audio';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Conversation, Message } from '@/types/database';
import { FormattedMessageText } from './FormattedMessageText';
import { VoicePlayer } from './VoicePlayer';
import { VoiceRecorder } from './VoiceRecorder';
import { CameraModal } from './CameraModal';
import { MediaPreviewModal } from './MediaPreviewModal';
import { EmojiPickerPopover } from './EmojiPickerPopover';
import {
  Phone,
  Video,
  Search,
  Paperclip,
  Smile,
  Mic,
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  Pin,
  X,
  Reply,
  Copy,
  Trash2,
  FileText,
  Camera,
  Image as ImageIcon,
  Info,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';

interface ChatRoomProps {
  conversation: Conversation;
  onBack?: () => void;
  onToggleInfo?: () => void;
  onInitiateCall: (type: 'voice' | 'video') => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  conversation,
  onBack,
  onToggleInfo,
  onInitiateCall,
}) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Toolbars & modals state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' | 'file'; name?: string } | null>(null);

  // Search inside chat
  const [isSearchingInChat, setIsSearchingInChat] = useState(false);
  const [searchInChatQuery, setSearchInChatQuery] = useState('');

  // Typing state
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Action menu for selected message
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!profile) return;
    const list = await dataService.getMessages(conversation.id, profile.id);
    setMessages(list);
    setTimeout(() => scrollToBottom(false), 50);
  }, [conversation.id, profile, scrollToBottom]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Realtime subscription for instant messaging
  useEffect(() => {
    if (!isSupabaseConfigured() || !profile) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id !== profile.id) {
            soundManager.playMessageReceived();
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== profile.id) {
          setOtherUserTyping(true);
          setTimeout(() => setOtherUserTyping(false), 2500);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, profile, scrollToBottom]);

  // Broadcast typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      if (isSupabaseConfigured() && profile) {
        const supabase = getSupabaseClient();
        supabase.channel(`chat-${conversation.id}`).send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: profile.id },
        });
      }
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
  };

  const handleSendMessage = async (
    type: Message['type'] = 'text',
    content = inputText,
    mediaDetails?: { url: string; name?: string; size?: number; mime?: string }
  ) => {
    if (!profile) return;
    if (type === 'text' && !content.trim()) return;

    const sentContent = content.trim();
    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

    soundManager.playMessageSent();

    const newMsg = await dataService.sendMessage(
      conversation.id,
      profile.id,
      sentContent,
      type,
      mediaDetails,
      replyingTo?.id
    );

    setMessages((prev) => [...prev, newMsg]);
    scrollToBottom();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const type: Message['type'] = isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'file';

    const localUrl = URL.createObjectURL(file);
    handleSendMessage(type, file.name, {
      url: localUrl,
      name: file.name,
      size: file.size,
      mime: file.type,
    });
  };

  const handleSendVoiceNote = (blob: Blob, duration: number) => {
    const voiceUrl = URL.createObjectURL(blob);
    setIsRecordingVoice(false);
    handleSendMessage('voice', '', {
      url: voiceUrl,
      name: `Voice note (${duration}s)`,
      size: blob.size,
      mime: blob.type,
    });
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!profile) return;
    await dataService.addReaction(messageId, profile.id, emoji);
    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          const reactions = m.reactions ? [...m.reactions] : [];
          reactions.push({
            id: `r-${Date.now()}`,
            message_id: messageId,
            user_id: profile.id,
            emoji,
            created_at: new Date().toISOString(),
          });
          return { ...m, reactions };
        }
        return m;
      })
    );
    setActiveMessageMenuId(null);
  };

  const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    if (!profile) return;
    await dataService.deleteMessage(messageId, conversation.id, profile.id, deleteForEveryone);
    loadMessages();
    setActiveMessageMenuId(null);
  };

  const filteredMessages = messages.filter((m) => {
    if (!isSearchingInChat || !searchInChatQuery.trim()) return true;
    return m.content?.toLowerCase().includes(searchInChatQuery.toLowerCase());
  });

  const pinnedMessage = messages.find((m) => m.is_pinned);
  const isOnline = conversation.type === 'private' && conversation.other_member?.is_online;

  return (
    <div className="h-full flex flex-col bg-[#efeae2] dark:bg-[#0b141a] select-none relative overflow-hidden">
      {/* 1. TOP HEADER */}
      <div className="h-16 px-4 bg-zinc-50 dark:bg-[#202c33] border-b border-zinc-200/60 dark:border-[#2f3b43] flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#111b21] rounded-full cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Contact / Group Info Trigger */}
          <div
            onClick={onToggleInfo}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity min-w-0"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs uppercase">
                {conversation.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={conversation.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  conversation.name?.[0] || 'P'
                )}
              </div>
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#202c33]" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                {conversation.name}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {otherUserTyping ? (
                  <span className="text-emerald-500 font-semibold animate-pulse">typing...</span>
                ) : isOnline ? (
                  <span className="text-emerald-500 font-medium">online</span>
                ) : conversation.type === 'group' ? (
                  'Group conversation'
                ) : (
                  'Last seen recently'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Icons */}
        <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
          <button
            type="button"
            onClick={() => onInitiateCall('video')}
            className="p-2.5 hover:bg-zinc-200/60 dark:hover:bg-[#111b21] rounded-full transition-colors cursor-pointer"
            title="Video Call"
          >
            <Video className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </button>
          <button
            type="button"
            onClick={() => onInitiateCall('voice')}
            className="p-2.5 hover:bg-zinc-200/60 dark:hover:bg-[#111b21] rounded-full transition-colors cursor-pointer"
            title="Voice Call"
          >
            <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </button>
          <button
            type="button"
            onClick={() => setIsSearchingInChat((s) => !s)}
            className="p-2.5 hover:bg-zinc-200/60 dark:hover:bg-[#111b21] rounded-full transition-colors cursor-pointer"
            title="Search Messages"
          >
            <Search className="w-5 h-5" />
          </button>
          {onToggleInfo && (
            <button
              type="button"
              onClick={onToggleInfo}
              className="p-2.5 hover:bg-zinc-200/60 dark:hover:bg-[#111b21] rounded-full transition-colors cursor-pointer"
              title="Contact / Group Info"
            >
              <Info className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* In-Chat Search Bar */}
      {isSearchingInChat && (
        <div className="bg-zinc-100 dark:bg-[#111b21] px-4 py-2 flex items-center gap-2 border-b border-zinc-200 dark:border-[#2f3b43] z-20 animate-in slide-in-from-top-2">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchInChatQuery}
            onChange={(e) => setSearchInChatQuery(e.target.value)}
            placeholder="Search in this conversation..."
            className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              setIsSearchingInChat(false);
              setSearchInChatQuery('');
            }}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/80 backdrop-blur-sm border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-xs z-10">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 fill-current" />
            <span className="font-semibold text-emerald-800 dark:text-emerald-300 shrink-0">Pinned:</span>
            <span className="truncate text-zinc-700 dark:text-zinc-200">{pinnedMessage.content}</span>
          </div>
        </div>
      )}

      {/* 2. MESSAGES CONTAINER WITH WHATSAPP DOODLE PATTERN */}
      <div className="flex-1 overflow-y-auto p-4 md:px-8 space-y-3 chat-wallpaper-doodle-light dark:chat-wallpaper-doodle">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
            <div className="bg-white/80 dark:bg-[#111b21]/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-[#222d34] max-w-xs space-y-2">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                🔒 Messages are private and protected
              </p>
              <p className="text-[11px] text-zinc-400">
                Send a message to start this conversation.
              </p>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.sender_id === profile?.id;
            const isMenuOpen = activeMessageMenuId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}
              >
                {/* Speech Bubble */}
                <div
                  className={`relative max-w-[85%] md:max-w-[65%] rounded-2xl px-3.5 py-2 shadow-sm transition-all ${
                    isMe
                      ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-zinc-900 dark:text-white rounded-tr-none'
                      : 'bg-white dark:bg-[#202c33] text-zinc-900 dark:text-white rounded-tl-none'
                  }`}
                >
                  {/* Sender Name for group chats */}
                  {conversation.type === 'group' && !isMe && msg.sender && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                      {msg.sender.name}
                    </span>
                  )}

                  {/* Quoted / Reply Preview */}
                  {msg.reply_to && (
                    <div className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-black/20 border-l-4 border-emerald-500 text-xs text-zinc-600 dark:text-zinc-300">
                      <span className="font-semibold block text-[10px] text-emerald-600 dark:text-emerald-400">
                        Replying
                      </span>
                      <p className="truncate text-[11px] opacity-80">Previous message</p>
                    </div>
                  )}

                  {/* Media Content Types */}
                  {msg.type === 'image' && msg.media_url && (
                    <div
                      onClick={() => setPreviewMedia({ url: msg.media_url!, type: 'image', name: msg.media_name || 'Photo' })}
                      className="mb-1 rounded-xl overflow-hidden cursor-pointer max-h-80 hover:opacity-95 transition-opacity"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.media_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {msg.type === 'video' && msg.media_url && (
                    <div
                      onClick={() => setPreviewMedia({ url: msg.media_url!, type: 'video', name: msg.media_name || 'Video' })}
                      className="mb-1 rounded-xl overflow-hidden cursor-pointer max-h-80 relative"
                    >
                      <video src={msg.media_url} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {msg.type === 'voice' && msg.media_url && (
                    <VoicePlayer mediaUrl={msg.media_url} isSender={isMe} />
                  )}

                  {msg.type === 'file' && msg.media_url && (
                    <div
                      onClick={() => setPreviewMedia({ url: msg.media_url!, type: 'file', name: msg.media_name || 'Document' })}
                      className="flex items-center gap-3 p-2 bg-black/5 dark:bg-black/20 rounded-xl cursor-pointer hover:bg-black/10 transition-colors"
                    >
                      <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold truncate block">
                          {msg.media_name || 'Document.pdf'}
                        </span>
                        <span className="text-[10px] opacity-60">Click to view & download</span>
                      </div>
                    </div>
                  )}

                  {/* Text Content */}
                  {msg.content && (
                    <FormattedMessageText
                      content={msg.content}
                      className="text-[13.5px]"
                    />
                  )}

                  {/* Timestamp & Delivery Status */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-60 float-right ml-3 select-none">
                    <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                    {isMe && (
                      <span>
                        {msg.is_read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                        ) : msg.is_delivered ? (
                          <CheckCheck className="w-3.5 h-3.5 text-zinc-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Context Menu Dropdown Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMessageMenuId(isMenuOpen ? null : msg.id);
                    }}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 transition-opacity text-zinc-500 dark:text-zinc-300 cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Context Menu Options */}
                  {isMenuOpen && (
                    <div
                      className="absolute right-0 top-8 bg-white dark:bg-[#202c33] rounded-xl shadow-xl border border-zinc-200 dark:border-[#2f3b43] py-1.5 min-w-[150px] z-30 select-none animate-in fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Emoji Quick Reactions */}
                      <div className="flex items-center justify-around px-2 py-1.5 border-b border-zinc-100 dark:border-[#2f3b43]">
                        {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleAddReaction(msg.id, emoji)}
                            className="hover:scale-125 transition-transform text-base cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(msg);
                          setActiveMessageMenuId(null);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#111b21] flex items-center gap-2 cursor-pointer"
                      >
                        <Reply className="w-3.5 h-3.5" /> Reply
                      </button>

                      {msg.content && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content || '');
                            setActiveMessageMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#111b21] flex items-center gap-2 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id, false)}
                        className="w-full px-3 py-1.5 text-left text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#111b21] flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete for me
                      </button>

                      {isMe && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id, true)}
                          className="w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Reactions display badge */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex items-center gap-1 -mt-2.5 z-10 bg-white dark:bg-[#111b21] px-2 py-0.5 rounded-full border border-zinc-200 dark:border-[#2f3b43] shadow-sm text-xs">
                    {Array.from(new Set(msg.reactions.map((r) => r.emoji))).map((emoji) => (
                      <span key={emoji}>{emoji}</span>
                    ))}
                    <span className="text-[10px] font-bold text-zinc-400">{msg.reactions.length}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. INPUT TOOLBAR */}
      <div className="bg-zinc-100 dark:bg-[#202c33] border-t border-zinc-200/80 dark:border-[#2f3b43] p-2 relative z-20">
        {/* Reply Preview Bar */}
        {replyingTo && (
          <div className="flex items-center justify-between px-3 py-1.5 mb-1 bg-white/70 dark:bg-[#111b21]/70 backdrop-blur rounded-xl border-l-4 border-emerald-500 text-xs">
            <div className="min-w-0 pr-2">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px] block">
                Replying to message
              </span>
              <p className="truncate text-zinc-600 dark:text-zinc-300 text-[11px]">{replyingTo.content}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isRecordingVoice ? (
          <VoiceRecorder
            onSendVoice={handleSendVoiceNote}
            onCancel={() => setIsRecordingVoice(false)}
          />
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Emoji Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker((p) => !p);
                  setShowAttachmentMenu(false);
                }}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-200/60 dark:hover:bg-[#111b21] rounded-full transition-colors cursor-pointer"
                title="Emojis"
              >
                <Smile className="w-5 h-5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-40">
                  <EmojiPickerPopover
                    onSelectEmoji={(emoji) => setInputText((prev) => prev + emoji)}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}
            </div>

            {/* Attachments Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowAttachmentMenu((p) => !p);
                  setShowEmojiPicker(false);
                }}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-200/60 dark:hover:bg-[#111b21] rounded-full transition-colors cursor-pointer"
                title="Attach"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {showAttachmentMenu && (
                <div className="absolute bottom-12 left-0 bg-white dark:bg-[#202c33] rounded-2xl shadow-xl border border-zinc-200 dark:border-[#2f3b43] p-2 flex flex-col gap-1 z-40 min-w-[170px] animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachmentMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-[#111b21] rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>Photos & Videos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachmentMenu(false);
                      setShowCameraModal(true);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-[#111b21] rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-rose-500" />
                    <span>Take Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachmentMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-[#111b21] rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-sky-500" />
                    <span>Document / PDF</span>
                  </button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Message Input Box */}
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message (*bold*, _italic_, ~strike~, @mention)..."
              className="flex-1 bg-white dark:bg-[#111b21] text-zinc-900 dark:text-white placeholder-zinc-400 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-[#2a3942] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-shadow"
            />

            {/* Mic / Send Button */}
            {inputText.trim() ? (
              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecordingVoice(true)}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-200/60 dark:hover:bg-[#111b21] rounded-full transition-colors cursor-pointer"
                title="Record Voice Note"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Camera Capture Modal */}
      {showCameraModal && (
        <CameraModal
          onCapture={(blob) => {
            const url = URL.createObjectURL(blob);
            handleSendMessage('image', 'Camera photo', {
              url,
              name: `camera-${Date.now()}.jpg`,
              size: blob.size,
              mime: 'image/jpeg',
            });
          }}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {/* Media Preview Modal */}
      {previewMedia && (
        <MediaPreviewModal
          url={previewMedia.url}
          type={previewMedia.type}
          fileName={previewMedia.name}
          onClose={() => setPreviewMedia(null)}
        />
      )}
    </div>
  );
};

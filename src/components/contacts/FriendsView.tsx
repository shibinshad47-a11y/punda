'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { dataService } from '@/lib/data-service';
import { Profile, Friendship } from '@/types/database';
import {
  Search,
  UserPlus,
  Check,
  X,
  Share2,
  Copy,
  CheckCheck,
  MessageSquare,
  Loader2,
  ArrowLeft,
  Users,
  Sparkles,
} from 'lucide-react';

interface FriendsViewProps {
  onBack?: () => void;
  onSelectChat?: (conversationId: string) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onBack, onSelectChat }) => {
  const { profile } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'add'>('friends');

  const inviteCode = profile?.id ? profile.id.slice(0, 8) : 'punda';
  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/invite/${inviteCode}` : `/invite/${inviteCode}`;

  const loadFriends = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const list = await dataService.getFriends(profile.id);
    setFriends(list);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !searchQuery.trim()) return;
    setSearching(true);
    setFeedback(null);
    try {
      const results = await dataService.searchUsers(searchQuery, profile.id);
      setSearchResults(results);
      if (results.length === 0) {
        setFeedback({ text: 'No users found matching that username or phone', type: 'error' });
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    if (!profile) return;
    setActionLoading(targetUserId);
    const res = await dataService.sendFriendRequest(profile.id, targetUserId);
    setActionLoading(null);
    if (res.success) {
      setFeedback({ text: 'Friend request sent successfully!', type: 'success' });
      loadFriends();
    } else {
      setFeedback({ text: res.error || 'Failed to send request', type: 'error' });
    }
  };

  const handleUpdateStatus = async (friendshipId: string, status: 'accepted' | 'rejected') => {
    if (!profile) return;
    setActionLoading(friendshipId);
    await dataService.updateFriendshipStatus(friendshipId, status, profile.id);
    setActionLoading(null);
    setFeedback({
      text: status === 'accepted' ? 'Friend request accepted!' : 'Request rejected.',
      type: 'success',
    });
    loadFriends();
  };

  const handleStartChat = async (otherUserId: string) => {
    if (!profile) return;
    const conv = await dataService.getOrCreatePrivateConversation(profile.id, otherUserId);
    onSelectChat?.(conv.id);
  };

  const copyInvite = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleWebShare = async () => {
    const shareText = `Connect with me on PUNDA, the real-time private messaging web app! Click here to add me: ${inviteUrl}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on PUNDA',
          text: shareText,
          url: inviteUrl,
        });
      } catch {
        // Share cancelled
      }
    } else {
      // Fallback: WhatsApp web link
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');
  const pendingRequests = friends.filter((f) => f.status === 'pending');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111b21] overflow-hidden select-none">
      {/* Header */}
      <div className="h-16 px-4 bg-emerald-600 dark:bg-[#202c33] text-white flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>Contacts & Friends</span>
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-[#222d34] bg-zinc-50 dark:bg-[#111b21] text-xs font-semibold px-4">
        <button
          type="button"
          onClick={() => setActiveTab('friends')}
          className={`py-3 px-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'friends'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
          }`}
        >
          My Friends ({acceptedFriends.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`py-3 px-3 border-b-2 transition-all cursor-pointer relative ${
            activeTab === 'pending'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
          }`}
        >
          Requests
          {pendingRequests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-500 text-white rounded-full text-[10px]">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className={`py-3 px-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'add'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
          }`}
        >
          Find & Invite
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`mx-4 mt-3 p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-zinc-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: ACCEPTED FRIENDS */}
        {activeTab === 'friends' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : acceptedFriends.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No Friends Yet</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                  Share your unique invite link or search for users by their @handle to add contacts.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('add')}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
                >
                  Find People
                </button>
              </div>
            ) : (
              acceptedFriends.map((f) => {
                const u = f.profile;
                if (!u) return null;
                return (
                  <div
                    key={f.id}
                    className="p-3 bg-zinc-50 dark:bg-[#202c33] rounded-xl border border-zinc-200/80 dark:border-[#2a3942] flex items-center justify-between hover:border-emerald-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                          {u.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-sm text-zinc-700 dark:text-zinc-200 uppercase">
                              {u.name[0]}
                            </span>
                          )}
                        </div>
                        {u.is_online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#202c33]" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          {u.name}
                          {u.is_online && (
                            <span className="text-[10px] text-emerald-500 font-medium">online</span>
                          )}
                        </h4>
                        <p className="text-xs text-zinc-400">@{u.username}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartChat(u.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: PENDING REQUESTS */}
        {activeTab === 'pending' && (
          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 px-4">
                <CheckCheck className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No Pending Requests</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  You are all caught up on friend requests.
                </p>
              </div>
            ) : (
              pendingRequests.map((f) => {
                const u = f.profile;
                if (!u) return null;
                const isIncoming = f.receiver_id === profile?.id;
                return (
                  <div
                    key={f.id}
                    className="p-3 bg-zinc-50 dark:bg-[#202c33] rounded-xl border border-zinc-200/80 dark:border-[#2a3942] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs uppercase">
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.name[0]
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{u.name}</h4>
                        <p className="text-[11px] text-zinc-400">@{u.username}</p>
                      </div>
                    </div>

                    {isIncoming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={actionLoading === f.id}
                          onClick={() => handleUpdateStatus(f.id, 'accepted')}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === f.id}
                          onClick={() => handleUpdateStatus(f.id, 'rejected')}
                          className="p-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-red-100 hover:text-red-600 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400 italic">Request sent</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: FIND & INVITE */}
        {activeTab === 'add' && (
          <div className="space-y-6">
            {/* Share Invite Link Card */}
            <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Your Unique Invite Link</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Anyone with this link will automatically add you as a contact when opened!
              </p>

              <div className="flex items-center gap-2 bg-white dark:bg-[#111b21] p-2 rounded-xl border border-zinc-200 dark:border-[#2a3942]">
                <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 flex-1 truncate select-all">
                  {inviteUrl}
                </span>
                <button
                  type="button"
                  onClick={copyInvite}
                  className="px-2.5 py-1.5 bg-zinc-100 dark:bg-[#202c33] hover:bg-emerald-50 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleWebShare}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share via Apps & WhatsApp</span>
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Chat with me on PUNDA: ${inviteUrl}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Search by username/phone */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Search PUNDA Users
              </h3>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by @username or phone..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-[#202c33] border border-zinc-200 dark:border-[#2a3942] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-white placeholder-zinc-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Search</span>
                </button>
              </form>

              {/* Search Results */}
              <div className="space-y-2 pt-2">
                {searchResults.map((user) => {
                  const alreadyFriend = acceptedFriends.some((f) => f.profile?.id === user.id);
                  const alreadyRequested = pendingRequests.some((f) => f.profile?.id === user.id);

                  return (
                    <div
                      key={user.id}
                      className="p-3 bg-zinc-50 dark:bg-[#202c33] rounded-xl border border-zinc-200/80 dark:border-[#2a3942] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs uppercase">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.name[0]
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{user.name}</h4>
                          <p className="text-[11px] text-zinc-400">@{user.username}</p>
                        </div>
                      </div>

                      {alreadyFriend ? (
                        <button
                          type="button"
                          onClick={() => handleStartChat(user.id)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>
                      ) : alreadyRequested ? (
                        <span className="text-xs text-zinc-400 italic">Requested</span>
                      ) : (
                        <button
                          type="button"
                          disabled={actionLoading === user.id}
                          onClick={() => handleSendRequest(user.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

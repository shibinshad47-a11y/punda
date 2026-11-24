'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { dataService } from '@/lib/data-service';
import { Friendship } from '@/types/database';
import { X, Users, Camera, Check, Loader2, Megaphone } from 'lucide-react';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreated }) => {
  const { profile } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    dataService.getFriends(profile.id).then((res) => {
      setFriends(res.filter((f) => f.status === 'accepted'));
    });
  }, [profile]);

  const toggleMember = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!groupName.trim()) {
      setError('Please provide a group subject/name');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Please select at least 1 friend to add to the group');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const conv = await dataService.createGroupConversation(
        groupName.trim(),
        description.trim(),
        avatarUrl,
        selectedUserIds,
        profile.id,
        isAnnouncement
      );
      onCreated(conv.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111b21] w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-[#222d34] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-emerald-600 dark:bg-[#202c33] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h3 className="font-bold text-sm">Create New Group</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-black/10 rounded-full text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {/* Group Avatar & Name */}
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden border-2 border-emerald-500/30">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Group" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-7 h-7 text-zinc-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Add group icon"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Group Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Weekend Trip, Work Squad"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#202c33] border border-zinc-200 dark:border-[#2a3942] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          {/* Group Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Group Description (optional)
            </label>
            <textarea
              rows={2}
              placeholder="What is this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#202c33] border border-zinc-200 dark:border-[#2a3942] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-white resize-none"
            />
          </div>

          {/* Announcement Mode Checkbox */}
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#202c33] rounded-xl border border-zinc-200/80 dark:border-[#2a3942]">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-500" />
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Announcements Only</h4>
                <p className="text-[11px] text-zinc-400">Only group admins can post messages</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isAnnouncement}
              onChange={(e) => setIsAnnouncement(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Add Members ({selectedUserIds.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {friends.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No friends available to add.</p>
              ) : (
                friends.map((f) => {
                  const u = f.profile;
                  if (!u) return null;
                  const isSelected = selectedUserIds.includes(u.id);

                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleMember(u.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50'
                          : 'bg-zinc-50 dark:bg-[#202c33] border-zinc-200/80 dark:border-[#2a3942] hover:border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-300 dark:bg-zinc-600 flex items-center justify-center text-xs font-bold uppercase">
                          {u.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            u.name[0]
                          )}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-zinc-900 dark:text-white">{u.name}</h5>
                          <p className="text-[10px] text-zinc-400">@{u.username}</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-zinc-300 dark:border-zinc-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            <span>Create Group</span>
          </button>
        </form>
      </div>
    </div>
  );
};

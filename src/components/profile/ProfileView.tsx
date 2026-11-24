'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Camera, Check, X, Edit2, Loader2, Sparkles, User, Info, Phone, ArrowLeft, Copy, CheckCheck } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface ProfileViewProps {
  onBack?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack }) => {
  const { profile, updateProfile, isDemoMode } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profile?.name || '');

  const [editingAbout, setEditingAbout] = useState(false);
  const [about, setAbout] = useState(profile?.about || '');

  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');

  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState(profile?.phone || '');

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate size (max 5MB) & type
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ message: 'Avatar image must be under 5MB', type: 'error' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      setFeedback({ message: 'Only image files are allowed', type: 'error' });
      return;
    }

    setAvatarLoading(true);
    setFeedback(null);

    try {
      if (isDemoMode || !isSupabaseConfigured()) {
        const previewUrl = URL.createObjectURL(file);
        await updateProfile({ avatar_url: previewUrl });
        setFeedback({ message: 'Profile photo updated!', type: 'success' });
        setAvatarLoading(false);
        return;
      }

      const supabase = getSupabaseClient();
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const res = await updateProfile({ avatar_url: publicUrl });
      if (res.error) throw new Error(res.error);

      setFeedback({ message: 'Profile photo updated successfully!', type: 'success' });
    } catch (err: unknown) {
      setFeedback({
        message: err instanceof Error ? err.message : 'Failed to upload photo',
        type: 'error',
      });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveField = async (field: 'name' | 'about' | 'username' | 'phone') => {
    setSaving(true);
    setFeedback(null);

    const updates: Partial<typeof profile> = {};
    if (field === 'name') updates.name = name.trim();
    if (field === 'about') updates.about = about.trim();
    if (field === 'username') updates.username = username.trim().toLowerCase();
    if (field === 'phone') updates.phone = phone.trim();

    const res = await updateProfile(updates);
    setSaving(false);

    if (res.error) {
      setFeedback({ message: res.error, type: 'error' });
    } else {
      setFeedback({ message: `${field.toUpperCase()} updated!`, type: 'success' });
      if (field === 'name') setEditingName(false);
      if (field === 'about') setEditingAbout(false);
      if (field === 'username') setEditingUsername(false);
      if (field === 'phone') setEditingPhone(false);
    }
  };

  const inviteCode = profile?.id ? profile.id.slice(0, 8) : 'punda123';
  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/invite/${inviteCode}` : `/invite/${inviteCode}`;

  const copyInvite = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!profile) return null;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111b21] overflow-y-auto">
      {/* Header */}
      <div className="h-16 px-4 bg-emerald-600 dark:bg-[#202c33] text-white flex items-center gap-4 shrink-0 shadow-sm">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-lg font-bold tracking-tight">Profile</h2>
      </div>

      <div className="p-6 max-w-lg mx-auto w-full space-y-6">
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Profile Avatar with Camera Overlay */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-emerald-500/20 dark:border-emerald-500/30 shadow-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-emerald-600 text-white font-black text-4xl flex items-center justify-center uppercase">
                  {profile.name[0] || 'P'}
                </div>
              )}
            </div>

            {/* Camera Change Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Change profile picture"
            >
              {avatarLoading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <>
                  <Camera className="w-7 h-7 mb-1" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Change</span>
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <p className="mt-3 text-xs text-zinc-400">Click photo to update</p>
        </div>

        {/* Name section */}
        <div className="bg-zinc-50 dark:bg-[#202c33] p-4 rounded-xl border border-zinc-200/80 dark:border-[#2a3942]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Your Name
            </span>
            {!editingName && (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {editingName ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-white dark:bg-[#111b21] border border-emerald-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveField('name')}
                className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 cursor-pointer"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(profile.name);
                  setEditingName(false);
                }}
                className="p-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">{profile.name}</p>
          )}
          <p className="text-[11px] text-zinc-400 mt-1">This name will be visible to your PUNDA contacts.</p>
        </div>

        {/* Username section */}
        <div className="bg-zinc-50 dark:bg-[#202c33] p-4 rounded-xl border border-zinc-200/80 dark:border-[#2a3942]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Unique Handle
            </span>
            {!editingUsername && (
              <button
                type="button"
                onClick={() => setEditingUsername(true)}
                className="text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {editingUsername ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-white dark:bg-[#111b21] border border-emerald-500 rounded-lg pl-7 pr-3 py-1.5 text-sm focus:outline-none"
                />
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveField('username')}
                className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 cursor-pointer"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername(profile.username);
                  setEditingUsername(false);
                }}
                className="p-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">@{profile.username}</p>
          )}
          <p className="text-[11px] text-zinc-400 mt-1">Others can search and find you using this handle.</p>
        </div>

        {/* About section */}
        <div className="bg-zinc-50 dark:bg-[#202c33] p-4 rounded-xl border border-zinc-200/80 dark:border-[#2a3942]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> About / Status
            </span>
            {!editingAbout && (
              <button
                type="button"
                onClick={() => setEditingAbout(true)}
                className="text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {editingAbout ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="flex-1 bg-white dark:bg-[#111b21] border border-emerald-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveField('about')}
                className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 cursor-pointer"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAbout(profile.about);
                  setEditingAbout(false);
                }}
                className="p-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1">{profile.about || 'Available'}</p>
          )}
        </div>

        {/* Phone section */}
        <div className="bg-zinc-50 dark:bg-[#202c33] p-4 rounded-xl border border-zinc-200/80 dark:border-[#2a3942]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone Number
            </span>
            {!editingPhone && (
              <button
                type="button"
                onClick={() => setEditingPhone(true)}
                className="text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {editingPhone ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0192"
                className="flex-1 bg-white dark:bg-[#111b21] border border-emerald-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveField('phone')}
                className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 cursor-pointer"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhone(profile.phone || '');
                  setEditingPhone(false);
                }}
                className="p-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1">{profile.phone || 'Not added'}</p>
          )}
        </div>

        {/* Personal Invite Link Quick Share */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
            Your PUNDA Invite Link
          </span>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-xs text-zinc-600 dark:text-zinc-300 font-mono truncate select-all">
              {inviteUrl}
            </span>
            <button
              type="button"
              onClick={copyInvite}
              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-xs flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copiedLink ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

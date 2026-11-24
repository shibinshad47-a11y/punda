'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { dataService } from '@/lib/data-service';
import { Status } from '@/types/database';
import {
  Plus,
  CircleDashed,
  Eye,
  Camera,
  Type,
  X,
  Send,
  Loader2,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PRESET_BG_COLORS = ['#16A34A', '#0284C7', '#7C3AED', '#DB2777', '#EA580C', '#1F2937'];

interface StatusFeedProps {
  onOpenStoryViewer: (statuses: Status[], initialIndex?: number) => void;
}

export const StatusFeed: React.FC<StatusFeedProps> = ({ onOpenStoryViewer }) => {
  const { profile } = useAuth();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  // New Status Creator Modal
  const [showCreator, setShowCreator] = useState(false);
  const [statusType, setStatusType] = useState<'text' | 'media'>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedBg, setSelectedBg] = useState('#16A34A');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStatuses = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const list = await dataService.getStatuses(profile.id);
    setStatuses(list);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  const handleMediaSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setStatusType('media');
    }
  };

  const handleCreateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (statusType === 'text' && !textContent.trim()) return;

    setPosting(true);
    try {
      const isVideo = mediaFile?.type.startsWith('video/');
      const type = statusType === 'text' ? 'text' : isVideo ? 'video' : 'image';
      await dataService.postStatus(
        profile.id,
        type,
        statusType === 'text' ? textContent.trim() : null,
        mediaPreview,
        selectedBg
      );
      setShowCreator(false);
      setTextContent('');
      setMediaFile(null);
      setMediaPreview(null);
      loadStatuses();
    } finally {
      setPosting(false);
    }
  };

  const myStatuses = statuses.filter((s) => s.user_id === profile?.id);
  const contactStatuses = statuses.filter((s) => s.user_id !== profile?.id);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-4 bg-zinc-50 dark:bg-[#202c33] border-b border-zinc-200/60 dark:border-[#2f3b43] flex items-center justify-between shrink-0">
        <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <CircleDashed className="w-5 h-5 text-emerald-500" />
          <span>Status</span>
        </h2>
        <button
          type="button"
          onClick={() => setShowCreator(true)}
          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-colors cursor-pointer shadow-sm"
          title="Add New Status"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* My Status Card */}
        <div>
          <div
            onClick={() => {
              if (myStatuses.length > 0) {
                onOpenStoryViewer(myStatuses);
              } else {
                setShowCreator(true);
              }
            }}
            className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#202c33] rounded-2xl border border-zinc-200/80 dark:border-[#2a3942] hover:border-emerald-500/40 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-13 h-13 rounded-full overflow-hidden p-0.5 ${
                    myStatuses.length > 0
                      ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#202c33]'
                      : ''
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-sm uppercase">
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      profile?.name?.[0] || 'P'
                    )}
                  </div>
                </div>

                {/* Plus badge */}
                {myStatuses.length === 0 && (
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-[#202c33]">
                    +
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">My Status</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {myStatuses.length > 0
                    ? `${myStatuses.length} update${myStatuses.length > 1 ? 's' : ''} • Tap to view`
                    : 'Tap to add status update'}
                </p>
              </div>
            </div>

            {myStatuses.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <Eye className="w-3.5 h-3.5" />
                <span>{myStatuses[0].views?.length || 0} views</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Contact Updates */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Recent Updates
          </h3>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : contactStatuses.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 space-y-2">
              <CircleDashed className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" />
              <p className="text-xs">No status updates from friends yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contactStatuses.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => onOpenStoryViewer([s], idx)}
                  className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#202c33] rounded-2xl border border-zinc-200/80 dark:border-[#2a3942] hover:border-emerald-500/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#202c33] overflow-hidden p-0.5">
                      <div className="w-full h-full rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs uppercase">
                        {s.user?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          s.user?.name?.[0] || 'P'
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {s.user?.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Status Creator Modal */}
      {showCreator && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col">
            <div className="p-4 flex items-center justify-between text-white border-b border-zinc-800">
              <span className="font-bold text-sm">Create Status Update</span>
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStatus} className="p-6 space-y-4">
              {/* Type toggle */}
              <div className="flex gap-2 bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusType('text')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                    statusType === 'text' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  <span>Text Status</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                    statusType === 'media' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Photo / Video</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelected}
                className="hidden"
              />

              {/* Status Preview / Input Canvas */}
              {statusType === 'text' ? (
                <div
                  style={{ backgroundColor: selectedBg }}
                  className="w-full h-56 rounded-2xl p-6 flex items-center justify-center text-center transition-colors shadow-inner"
                >
                  <textarea
                    rows={4}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Type your status..."
                    className="w-full bg-transparent text-white font-bold text-xl placeholder-white/60 text-center resize-none focus:outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="w-full h-56 bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                  {mediaPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaPreview} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              )}

              {/* Color Palette (for text status) */}
              {statusType === 'text' && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  {PRESET_BG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedBg(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        selectedBg === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              )}

              <p className="text-[11px] text-zinc-400 text-center flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Status will automatically expire after 24 hours</span>
              </p>

              <button
                type="submit"
                disabled={posting || (statusType === 'text' && !textContent.trim())}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Post Status</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

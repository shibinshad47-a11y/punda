'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Status } from '@/types/database';
import { useAuth } from '@/lib/auth-context';
import { X, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StatusStoryViewerProps {
  statuses: Status[];
  initialIndex?: number;
  onClose: () => void;
}

export const StatusStoryViewer: React.FC<StatusStoryViewerProps> = ({
  statuses,
  initialIndex = 0,
  onClose,
}) => {
  const { profile } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);

  const durationMs = 5000;
  const currentStatus = statuses[currentIndex];
  const isMyStatus = currentStatus?.user_id === profile?.id;

  const nextStatus = useCallback(() => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, statuses.length, onClose]);

  const prevStatus = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  useEffect(() => {
    if (isPaused || showViewersList) return;

    const interval = 50;
    const increment = (interval / durationMs) * 100;

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          nextStatus();
          return 0;
        }
        return p + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, showViewersList, nextStatus]);

  if (!currentStatus) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* 1. Top Header & Segmented Progress Bars */}
      <div className="w-full max-w-lg mx-auto space-y-3 z-20">
        <div className="flex items-center gap-1.5 h-1">
          {statuses.map((_, i) => (
            <div key={i} className="flex-1 h-full bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{
                  width:
                    i < currentIndex
                      ? '100%'
                      : i === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-700 font-bold text-xs uppercase flex items-center justify-center">
              {currentStatus.user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentStatus.user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                currentStatus.user?.name?.[0] || 'P'
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold">{currentStatus.user?.name || 'PUNDA User'}</h4>
              <p className="text-[10px] text-white/70">
                {formatDistanceToNow(new Date(currentStatus.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 2. Main Story Canvas */}
      <div className="relative flex-1 w-full max-w-lg mx-auto flex items-center justify-center my-4 overflow-hidden rounded-3xl shadow-2xl">
        {currentStatus.type === 'text' ? (
          <div
            style={{ backgroundColor: currentStatus.bg_color || '#16A34A' }}
            className="w-full h-full p-8 flex items-center justify-center text-center text-white font-black text-2xl md:text-3xl leading-relaxed whitespace-pre-wrap select-text"
          >
            {currentStatus.content}
          </div>
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentStatus.media_url || ''}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        {/* Left & Right touch tap navigation zones */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            prevStatus();
          }}
          className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
        />
        <div
          onClick={(e) => {
            e.stopPropagation();
            nextStatus();
          }}
          className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
        />
      </div>

      {/* 3. Bottom Bar: Views for my status */}
      <div className="w-full max-w-lg mx-auto z-20">
        {isMyStatus ? (
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowViewersList((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-semibold text-white backdrop-blur-md transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{currentStatus.views?.length || 0} views</span>
            </button>

            {showViewersList && (
              <div
                className="mt-3 w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-xs max-h-48 overflow-y-auto space-y-2 animate-in slide-in-from-bottom-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between font-bold border-b border-zinc-800 pb-2">
                  <span>Viewed by ({currentStatus.views?.length || 0})</span>
                  <button type="button" onClick={() => setShowViewersList(false)}>
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
                {!currentStatus.views || currentStatus.views.length === 0 ? (
                  <p className="text-zinc-500 py-2 text-center">No views yet.</p>
                ) : (
                  currentStatus.views.map((v, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="font-medium">{v.viewer?.name || 'Friend'}</span>
                      <span className="text-[10px] text-zinc-400">
                        {formatDistanceToNow(new Date(v.viewed_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-[11px] text-white/50">
            Hold screen to pause • Tap edges to skip
          </div>
        )}
      </div>
    </div>
  );
};

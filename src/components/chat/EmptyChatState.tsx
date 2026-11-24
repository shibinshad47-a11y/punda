'use client';

import React from 'react';
import { PundaLogo } from '../common/PundaLogo';
import { Lock, MessageSquarePlus, Share2 } from 'lucide-react';

interface EmptyChatStateProps {
  onStartNewChat?: () => void;
  onShareInvite?: () => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({
  onStartNewChat,
  onShareInvite,
}) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-[#111b21] border-b-[6px] border-emerald-600 text-center select-none relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md flex flex-col items-center z-10">
        <div className="relative mb-6">
          <PundaLogo size={84} />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          PUNDA for Web
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </h2>

        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Send and receive real-time messages, media, and voice notes. Stay connected with friends with crystal-clear voice and video calls.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {onStartNewChat && (
            <button
              type="button"
              onClick={onStartNewChat}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Start New Chat</span>
            </button>
          )}

          {onShareInvite && (
            <button
              type="button"
              onClick={onShareInvite}
              className="px-4 py-2 bg-white dark:bg-[#202c33] hover:bg-zinc-100 dark:hover:bg-[#2a3942] border border-zinc-200 dark:border-[#2f3b43] text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-500" />
              <span>Invite Friends</span>
            </button>
          )}
        </div>

        <div className="mt-12 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
          <span>Secured with Supabase Postgres & Row Level Security</span>
        </div>
      </div>
    </div>
  );
};

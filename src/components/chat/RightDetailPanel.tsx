'use client';

import React, { useState } from 'react';
import { Conversation } from '@/types/database';
import { useAuth } from '@/lib/auth-context';
import { dataService } from '@/lib/data-service';
import {
  X,
  Phone,
  Video,
  Lock,
  UserX,
  Flag,
  Users,
  Image as ImageIcon,
  FileText,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

interface RightDetailPanelProps {
  conversation: Conversation;
  onClose: () => void;
  onInitiateCall: (type: 'voice' | 'video') => void;
}

export const RightDetailPanel: React.FC<RightDetailPanelProps> = ({
  conversation,
  onClose,
  onInitiateCall,
}) => {
  const { profile } = useAuth();
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isGroup = conversation.type === 'group';
  const otherUser = conversation.other_member;

  const handleBlockUser = async () => {
    if (!profile || !otherUser) return;
    await dataService.blockUser(otherUser.id, profile.id);
    setStatusMessage(`Blocked ${otherUser.name}`);
    setShowBlockConfirm(false);
  };

  const handleReportUser = async () => {
    if (!profile || !otherUser || !reportReason.trim()) return;
    await dataService.reportUser(profile.id, otherUser.id, reportReason.trim());
    setStatusMessage(`Report submitted. Thank you for keeping PUNDA safe.`);
    setShowReportDialog(false);
    setReportReason('');
  };

  return (
    <div className="w-80 h-full bg-white dark:bg-[#111b21] border-l border-zinc-200 dark:border-[#222d34] flex flex-col shrink-0 overflow-y-auto select-none z-30 animate-in slide-in-from-right-4">
      {/* Header */}
      <div className="h-16 px-4 bg-zinc-50 dark:bg-[#202c33] border-b border-zinc-200/60 dark:border-[#2f3b43] flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
          {isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-[#111b21] rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6 flex-1">
        {statusMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold">
            {statusMessage}
          </div>
        )}

        {/* Large Avatar & Name */}
        <div className="flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-500/20 shadow-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-2xl uppercase">
            {conversation.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={conversation.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : isGroup ? (
              <Users className="w-12 h-12 text-zinc-400" />
            ) : (
              conversation.name?.[0] || 'P'
            )}
          </div>
          <h2 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
            {conversation.name}
          </h2>
          {otherUser?.username && (
            <p className="text-xs text-zinc-400">@{otherUser.username}</p>
          )}

          {/* Quick Call Actions */}
          <div className="flex items-center gap-4 mt-4">
            <button
              type="button"
              onClick={() => onInitiateCall('voice')}
              className="p-3 bg-zinc-100 dark:bg-[#202c33] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex flex-col items-center gap-1 cursor-pointer transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Voice</span>
            </button>
            <button
              type="button"
              onClick={() => onInitiateCall('video')}
              className="p-3 bg-zinc-100 dark:bg-[#202c33] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex flex-col items-center gap-1 cursor-pointer transition-colors"
            >
              <Video className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Video</span>
            </button>
          </div>
        </div>

        {/* About / Description */}
        <div className="bg-zinc-50 dark:bg-[#202c33] p-4 rounded-xl border border-zinc-200/80 dark:border-[#2a3942] space-y-1">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
            {isGroup ? 'Group Description' : 'About'}
          </span>
          <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed">
            {isGroup
              ? conversation.description || 'No description provided'
              : otherUser?.about || 'Hey there! I am using PUNDA.'}
          </p>
          {otherUser?.phone && (
            <p className="text-[11px] text-zinc-400 pt-1 font-mono">{otherUser.phone}</p>
          )}
        </div>

        {/* Media & Docs Summary */}
        <div className="bg-zinc-50 dark:bg-[#202c33] p-4 rounded-xl border border-zinc-200/80 dark:border-[#2a3942] space-y-2">
          <span className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center justify-between">
            <span>Media, Links & Docs</span>
            <span className="text-[11px] text-zinc-400 font-normal">View all</span>
          </span>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="aspect-square bg-zinc-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="aspect-square bg-zinc-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-400">
              <FileText className="w-5 h-5" />
            </div>
            <div className="aspect-square bg-zinc-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-400">
              <Video className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Encryption badge */}
        <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
          <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Messages and calls are secured with Row Level Security.</span>
        </div>

        {/* Safety Actions: Block / Report */}
        {!isGroup ? (
          <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-[#222d34]">
            <button
              type="button"
              onClick={() => setShowBlockConfirm(true)}
              className="w-full py-2.5 px-3 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <UserX className="w-4 h-4" />
              <span>Block Contact</span>
            </button>
            <button
              type="button"
              onClick={() => setShowReportDialog(true)}
              className="w-full py-2.5 px-3 hover:bg-zinc-100 dark:hover:bg-[#202c33] text-zinc-600 dark:text-zinc-400 hover:text-red-500 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Flag className="w-4 h-4" />
              <span>Report Contact</span>
            </button>
          </div>
        ) : (
          <div className="pt-2 border-t border-zinc-200 dark:border-[#222d34]">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-3 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Group</span>
            </button>
          </div>
        )}
      </div>

      {/* Block Confirm Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111b21] p-5 rounded-2xl max-w-xs w-full space-y-3 border border-zinc-200 dark:border-[#222d34]">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-center text-zinc-900 dark:text-white">
              Block {otherUser?.name}?
            </h4>
            <p className="text-xs text-zinc-500 text-center">
              Blocked contacts will no longer be able to call you or send you messages.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#202c33] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlockUser}
                className="flex-1 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl cursor-pointer"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111b21] p-5 rounded-2xl max-w-sm w-full space-y-3 border border-zinc-200 dark:border-[#222d34]">
            <Flag className="w-6 h-6 text-red-500" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Report {otherUser?.name}
            </h4>
            <textarea
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Tell us what is wrong (e.g. spam, harassment, inappropriate content)..."
              className="w-full p-2.5 bg-zinc-50 dark:bg-[#202c33] border border-zinc-200 dark:border-[#2a3942] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-white"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReportDialog(false)}
                className="flex-1 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#202c33] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reportReason.trim()}
                onClick={handleReportUser}
                className="flex-1 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl disabled:opacity-50 cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

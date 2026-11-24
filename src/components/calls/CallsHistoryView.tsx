'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { dataService } from '@/lib/data-service';
import { Call } from '@/types/database';
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  Video,
  Loader2,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface CallsHistoryViewProps {
  onStartCall: (targetUserId: string, type: 'voice' | 'video') => void;
}

export const CallsHistoryView: React.FC<CallsHistoryViewProps> = ({ onStartCall }) => {
  const { profile } = useAuth();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'missed'>('all');

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    dataService.getCalls(profile.id).then((res) => {
      setCalls(res);
      setLoading(false);
    });
  }, [profile]);

  const formatCallDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isToday(d)) return `Today, ${format(d, 'HH:mm')}`;
      if (isYesterday(d)) return `Yesterday, ${format(d, 'HH:mm')}`;
      return format(d, 'dd/MM/yy, HH:mm');
    } catch {
      return '';
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const filteredCalls = calls.filter((c) => {
    if (filter === 'missed') return c.status === 'missed' || c.status === 'rejected';
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-4 bg-zinc-50 dark:bg-[#202c33] border-b border-zinc-200/60 dark:border-[#2f3b43] flex items-center justify-between shrink-0">
        <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Phone className="w-5 h-5 text-emerald-500" />
          <span>Calls History</span>
        </h2>

        {/* Filter Pills */}
        <div className="flex gap-1 bg-zinc-200/80 dark:bg-[#111b21] p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-500'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('missed')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              filter === 'missed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-500'
            }`}
          >
            Missed
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 space-y-2">
            <Phone className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" />
            <p className="text-xs">No call history recorded yet.</p>
          </div>
        ) : (
          filteredCalls.map((call) => {
            const isMissed = call.status === 'missed' || call.status === 'rejected';
            const callerName = call.caller?.name || 'Contact';

            return (
              <div
                key={call.id}
                className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#202c33] rounded-2xl border border-zinc-200/80 dark:border-[#2a3942] hover:border-emerald-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs uppercase text-zinc-700 dark:text-zinc-200">
                    {call.caller?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={call.caller.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      callerName[0]
                    )}
                  </div>

                  <div>
                    <h4
                      className={`text-sm font-semibold ${
                        isMissed ? 'text-red-500' : 'text-zinc-900 dark:text-white'
                      }`}
                    >
                      {callerName}
                    </h4>

                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                      {isMissed ? (
                        <PhoneMissed className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      ) : (
                        <PhoneIncoming className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                      <span>{formatCallDate(call.started_at)}</span>
                      {call.duration_seconds > 0 && (
                        <span>• {formatDuration(call.duration_seconds)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1-Click Callback Button */}
                <button
                  type="button"
                  onClick={() => onStartCall(call.caller_id, call.type)}
                  className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-full transition-colors cursor-pointer"
                  title={`Call back (${call.type})`}
                >
                  {call.type === 'video' ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <Phone className="w-5 h-5" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { soundManager } from '@/lib/audio';
import { WebRTCManager } from '@/lib/webrtc';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { dataService } from '@/lib/data-service';
import { Profile, CallType } from '@/types/database';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ActiveCallModalProps {
  callType: CallType;
  isIncoming?: boolean;
  targetUser?: Profile | null;
  conversationId?: string | null;
  onClose: () => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  callType,
  isIncoming = false,
  targetUser,
  conversationId,
  onClose,
}) => {
  const { profile } = useAuth();
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>(
    isIncoming ? 'ringing' : 'ringing'
  );
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCallConnected = useCallback(async () => {
    soundManager.stopRingtone();
    setCallStatus('connected');

    timerRef.current = setInterval(() => {
      setDurationSeconds((s) => s + 1);
    }, 1000);

    try {
      const webrtc = new WebRTCManager();
      webrtcRef.current = webrtc;

      webrtc.init(
        (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        },
        (signal) => {
          if (isSupabaseConfigured() && conversationId) {
            const supabase = getSupabaseClient();
            supabase.channel(`call-${conversationId}`).send({
              type: 'broadcast',
              event: 'signal',
              payload: signal,
            });
          }
        }
      );

      const localStream = await webrtc.getLocalMedia(callType);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not access media devices.';
      setError(msg);
    }
  }, [callType, conversationId]);

  useEffect(() => {
    if (isIncoming) {
      soundManager.startIncomingRingtone();
    } else {
      soundManager.startOutgoingRingtone();
      const connectTimer = setTimeout(() => {
        handleCallConnected();
      }, 2500);

      return () => {
        clearTimeout(connectTimer);
        soundManager.stopRingtone();
      };
    }

    return () => {
      soundManager.stopRingtone();
      if (timerRef.current) clearInterval(timerRef.current);
      webrtcRef.current?.cleanup();
    };
  }, [isIncoming, handleCallConnected]);

  const handleAcceptCall = () => {
    handleCallConnected();
  };

  const handleEndCall = () => {
    soundManager.playCallEnded();
    setCallStatus('ended');

    if (profile?.id) {
      dataService.logCall(
        profile.id,
        conversationId || null,
        callType,
        callStatus === 'connected' ? 'ended' : 'missed',
        durationSeconds
      );
    }

    if (timerRef.current) clearInterval(timerRef.current);
    webrtcRef.current?.cleanup();

    setTimeout(() => {
      onClose();
    }, 400);
  };

  const toggleMuteAudio = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    webrtcRef.current?.toggleAudio(!next);
  };

  const toggleMuteVideo = () => {
    const next = !isVideoMuted;
    setIsVideoMuted(next);
    webrtcRef.current?.toggleVideo(!next);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0c1317]/95 backdrop-blur-lg flex flex-col justify-between p-6 select-none animate-in fade-in">
      {/* Header Info */}
      <div className="text-center text-white z-20 space-y-1">
        <h2 className="text-xl font-black tracking-tight">{targetUser?.name || 'PUNDA Call'}</h2>
        <p className="text-xs text-zinc-400 font-medium">
          {callStatus === 'connected'
            ? `Connected • ${formatTimer(durationSeconds)}`
            : isIncoming
            ? 'Incoming Call...'
            : 'Ringing...'}
        </p>
      </div>

      {error && (
        <div className="mx-auto max-w-sm p-3 bg-red-950/60 border border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-300 z-20">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Call View Area */}
      <div className="relative flex-1 max-w-2xl w-full mx-auto my-4 flex items-center justify-center overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
        {callType === 'video' ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-zinc-800 border-4 border-emerald-500/30 flex items-center justify-center font-bold text-3xl text-white uppercase shadow-lg">
                {targetUser?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={targetUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  targetUser?.name?.[0] || 'P'
                )}
              </div>
            </div>

            <div className="absolute bottom-4 right-4 w-32 h-44 bg-zinc-800 rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-xl z-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-6">
            <div className="relative">
              <div className="absolute -inset-6 bg-emerald-500/20 rounded-full animate-ping pointer-events-none" />
              <div className="absolute -inset-3 bg-emerald-500/30 rounded-full animate-pulse pointer-events-none" />

              <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-emerald-500 shadow-2xl bg-zinc-800 flex items-center justify-center font-bold text-4xl text-white uppercase">
                {targetUser?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={targetUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  targetUser?.name?.[0] || 'P'
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>High Definition Voice Call</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-center gap-6 z-20 pb-4">
        {callStatus === 'ringing' && isIncoming ? (
          <>
            <button
              type="button"
              onClick={handleEndCall}
              className="w-16 h-16 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-600/40 cursor-pointer transition-transform hover:scale-105"
              title="Decline"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            <button
              type="button"
              onClick={handleAcceptCall}
              className="w-16 h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/40 cursor-pointer transition-transform hover:scale-105 animate-bounce"
              title="Accept"
            >
              <Phone className="w-7 h-7" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleMuteAudio}
              className={`p-4 rounded-full transition-colors cursor-pointer ${
                isAudioMuted ? 'bg-red-600 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
              title={isAudioMuted ? 'Unmute' : 'Mute'}
            >
              {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {callType === 'video' && (
              <button
                type="button"
                onClick={toggleMuteVideo}
                className={`p-4 rounded-full transition-colors cursor-pointer ${
                  isVideoMuted ? 'bg-red-600 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
                title={isVideoMuted ? 'Turn camera on' : 'Turn camera off'}
              >
                {isVideoMuted ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleEndCall}
              className="w-16 h-16 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-600/40 cursor-pointer transition-transform hover:scale-105"
              title="End Call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

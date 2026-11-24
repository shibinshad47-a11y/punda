'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Send, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied or unavailable.';
      setError(msg);
      setIsRecording(false);
    }
  }, []);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, [startRecording, cleanup]);

  const handleStopAndSend = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.onstop = () => {
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      cleanup();
      onSendVoice(audioBlob, duration);
    };

    mediaRecorderRef.current.stop();
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 w-full">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="px-2 py-1 bg-red-100 dark:bg-red-900/60 rounded font-semibold text-xs cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-full bg-zinc-100 dark:bg-[#202c33] px-4 py-2 rounded-2xl animate-in fade-in">
      <button
        type="button"
        onClick={handleCancel}
        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-[#111b21] rounded-full transition-colors cursor-pointer"
        title="Discard recording"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
          {formatDuration(duration)}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center gap-1 h-6 px-4">
        {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 65, 35, 75, 85].map((height, i) => (
          <span
            key={i}
            className="w-1 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"
            style={{
              height: `${Math.max(15, (height * (duration % 2 === 0 ? 0.8 : 1.2)) % 100)}%`,
              animationDelay: `${i * 70}ms`,
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleStopAndSend}
        className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
        title="Send voice note"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};

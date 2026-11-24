'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface VoicePlayerProps {
  mediaUrl: string;
  durationSeconds?: number;
  isSender?: boolean;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  mediaUrl,
  durationSeconds = 12,
  isSender = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSeconds);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Static waveform bar heights
  const bars = [35, 60, 90, 45, 80, 100, 70, 40, 85, 95, 60, 30, 75, 90, 50, 40, 65, 80];

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[220px]">
      <audio ref={audioRef} src={mediaUrl} preload="metadata" />

      {/* Play / Pause round button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 cursor-pointer ${
          isSender
            ? 'bg-emerald-700 dark:bg-emerald-600 text-white hover:bg-emerald-800'
            : 'bg-emerald-600 text-white hover:bg-emerald-500'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
      </button>

      {/* Waveform and progress */}
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <div className="flex items-center gap-0.5 h-6">
          {bars.map((bar, i) => {
            const barPercent = (i / bars.length) * 100;
            const isFilled = progressPercent >= barPercent;
            return (
              <span
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  isFilled
                    ? isSender
                      ? 'bg-emerald-800 dark:bg-emerald-300'
                      : 'bg-emerald-600 dark:bg-emerald-400'
                    : isSender
                    ? 'bg-emerald-700/30 dark:bg-emerald-900/50'
                    : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
                style={{ height: `${bar}%` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] opacity-75 font-mono">
          <span>{formatSecs(currentTime)}</span>
          <span className="flex items-center gap-1">
            <Mic className="w-3 h-3" />
            <span>{formatSecs(totalDuration)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

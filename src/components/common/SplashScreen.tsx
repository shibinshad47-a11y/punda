'use client';

import React, { useEffect, useState } from 'react';
import { PundaLogo } from './PundaLogo';
import { Lock } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  message?: string;
  minimumDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  message = 'Connecting securely to PUNDA...',
  minimumDurationMs = 1200,
}) => {
  const [progress, setProgress] = useState(15);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(65), 300);
    const timer2 = setTimeout(() => setProgress(100), 800);
    const finishTimer = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        onFinish?.();
      }, 350);
    }, minimumDurationMs);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(finishTimer);
    };
  }, [minimumDurationMs, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full" />

      {/* Center Logo & Loading state */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 animate-pulse">
          <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
          <PundaLogo size={96} />
        </div>

        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center justify-center gap-2">
          PUNDA
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
        </h1>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          {message}
        </p>

        {/* Smooth loading bar */}
        <div className="w-56 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Bottom Security / Privacy Badge */}
      <div className="flex flex-col items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
          <span>Real-time Secure Messaging</span>
        </div>
        <p className="text-[11px] text-zinc-400/80">Protected with Supabase Row Level Security</p>
      </div>
    </div>
  );
};

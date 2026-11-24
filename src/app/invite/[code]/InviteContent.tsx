'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { dataService } from '@/lib/data-service';
import { PundaLogo } from '@/components/common/PundaLogo';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

interface InviteContentProps {
  inviteCode: string;
}

export default function InviteContent({ inviteCode }: InviteContentProps) {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; conversation_id?: string; error?: string } | null>(null);

  useEffect(() => {
    if (authLoading || !profile?.id || !inviteCode) return;

    const autoAddFriend = async () => {
      setProcessing(true);
      const res = await dataService.processInviteLink(inviteCode, profile.id);
      setResult(res);
      setProcessing(false);

      if (res.success && res.conversation_id) {
        setTimeout(() => {
          router.push(`/?chat=${res.conversation_id}`);
        }, 1200);
      }
    };

    autoAddFriend();
  }, [authLoading, profile?.id, inviteCode, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0c1317]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // If user is not logged in, render the AuthScreen prefilled with the inviteCode
  if (!profile) {
    return <AuthScreen initialMode="signup" inviteCode={inviteCode} onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-[#0c1317] text-zinc-900 dark:text-white">
      <div className="max-w-md w-full bg-white dark:bg-[#111b21] rounded-2xl shadow-xl border border-zinc-200 dark:border-[#222d34] p-8 text-center space-y-4">
        <div className="flex justify-center mb-2">
          <PundaLogo size={64} />
        </div>

        <h2 className="text-xl font-black tracking-tight">PUNDA Invite Link</h2>

        {processing ? (
          <div className="py-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Connecting you with friend...
            </p>
          </div>
        ) : result?.success ? (
          <div className="py-4 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Friend Added!</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Opening your direct conversation now...
            </p>
            <button
              type="button"
              onClick={() => router.push(`/?chat=${result.conversation_id || ''}`)}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <span>Go to Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="py-4 space-y-3">
            <p className="text-xs text-red-500 font-medium">
              {result?.error || 'Unable to process this invite code.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

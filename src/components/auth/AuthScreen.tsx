'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PundaLogo } from '../common/PundaLogo';
import { Mail, Lock, User, Phone, ArrowRight, Loader2, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  initialMode?: 'signin' | 'signup';
  inviteCode?: string;
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'signin',
  inviteCode,
  onSuccess,
}) => {
  const { signIn, signUp, isDemoMode, switchDemoUser } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        if (!email.trim() || !password) {
          setError('Please provide your email/username and password');
          setLoading(false);
          return;
        }

        const res = await signIn(email.trim(), password);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMsg('Signed in successfully!');
          onSuccess?.();
        }
      } else {
        // Validation
        if (!name.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        if (!username.trim() || username.length < 3) {
          setError('Username must be at least 3 alphanumeric characters');
          setLoading(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid email address');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const res = await signUp({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
        });

        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMsg('Account created successfully!');
          onSuccess?.();
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-100 dark:bg-[#0c1317] text-zinc-900 dark:text-zinc-100 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 right-0 w-80 h-80 bg-emerald-600/10 blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-md bg-white dark:bg-[#111b21] rounded-2xl shadow-xl border border-zinc-200 dark:border-[#222d34] overflow-hidden z-10 transition-all">
        {/* Header Branding */}
        <div className="p-8 pb-6 text-center border-b border-zinc-100 dark:border-[#202c33]/70 bg-zinc-50/50 dark:bg-[#111b21]">
          <div className="flex justify-center mb-4">
            <PundaLogo size={68} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            {mode === 'signin' ? 'Welcome back to PUNDA' : 'Join PUNDA'}
          </h2>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {inviteCode
              ? `You have been invited to connect! Complete signup to chat.`
              : mode === 'signin'
              ? 'Real-time WhatsApp-style messaging for the modern web'
              : 'Sign up in seconds to start chatting and calling'}
          </p>

          {inviteCode && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Invite Code: {inviteCode}</span>
            </div>
          )}
        </div>

        {/* Mode Toggle Tabs */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-6 bg-zinc-100 dark:bg-[#202c33] rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white dark:bg-[#111b21] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white dark:bg-[#111b21] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-zinc-50 dark:bg-[#202c33] border border-zinc-200 dark:border-[#2a3942] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-white placeholder-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Username (unique)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">@</span>
                  <input
                    type="text"
                    required
                    placeholder="alex_j"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full pl-8 pr-3 py-2.5 text-sm bg-zinc-50 dark:bg-[#202c33] border border-zinc-200 dark:border-[#2a3942] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-white placeholder-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone Number (optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="tel"
                    placeholder="+1 555-0192"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-zinc-50 dark:bg-[#202c33] border border-zinc-200 dark:border-[#2a3942] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-white placeholder-zinc-400"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-zinc-50 dark:bg-[#202c33] border border-zinc-200 dark:border-[#2a3942] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-white placeholder-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-zinc-50 dark:bg-[#202c33] border border-zinc-200 dark:border-[#2a3942] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-white placeholder-zinc-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In to PUNDA' : 'Create PUNDA Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Access if testing or unconfigured */}
        {isDemoMode && (
          <div className="p-4 mx-6 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-zinc-600 dark:text-zinc-300">
            <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Instant Sandbox Test Accounts:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  switchDemoUser(0);
                  onSuccess?.();
                }}
                className="py-1.5 px-2 bg-white dark:bg-[#202c33] hover:bg-emerald-50 border border-zinc-200 dark:border-[#2a3942] rounded-lg text-center font-medium truncate cursor-pointer transition-colors"
              >
                Alex (@alex_j)
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoUser(1);
                  onSuccess?.();
                }}
                className="py-1.5 px-2 bg-white dark:bg-[#202c33] hover:bg-emerald-50 border border-zinc-200 dark:border-[#2a3942] rounded-lg text-center font-medium truncate cursor-pointer transition-colors"
              >
                Sarah (@sarah_c)
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoUser(2);
                  onSuccess?.();
                }}
                className="py-1.5 px-2 bg-white dark:bg-[#202c33] hover:bg-emerald-50 border border-zinc-200 dark:border-[#2a3942] rounded-lg text-center font-medium truncate cursor-pointer transition-colors"
              >
                Michael (@mchen)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

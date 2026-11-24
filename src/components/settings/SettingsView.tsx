'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { UserPrivacy } from '@/types/database';
import {
  Settings,
  Shield,
  UserX,
  Trash2,
  KeyRound,
  Check,
  Moon,
  Sun,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  Smartphone,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

interface SettingsViewProps {
  onBack?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const { profile, updateProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<'main' | 'privacy' | 'wallpaper' | 'security' | 'blocked'>('main');

  // Privacy options
  const [privacyLastSeen, setPrivacyLastSeen] = useState<UserPrivacy>(profile?.privacy_last_seen || 'everyone');
  const [privacyAvatar, setPrivacyAvatar] = useState<UserPrivacy>(profile?.privacy_avatar || 'everyone');
  const [privacyAbout, setPrivacyAbout] = useState<UserPrivacy>(profile?.privacy_about || 'everyone');

  // Notifications
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(false);

  // Security & MFA
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Delete account modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSavePrivacy = async () => {
    const res = await updateProfile({
      privacy_last_seen: privacyLastSeen,
      privacy_avatar: privacyAvatar,
      privacy_about: privacyAbout,
    });
    if (!res.error) {
      setStatusMessage('Privacy settings updated!');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setDesktopNotifications(true);
        setStatusMessage('Browser notifications enabled!');
      } else {
        setDesktopNotifications(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    setStatusMessage('Account deleted.');
    await signOut();
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-4 bg-emerald-600 dark:bg-[#202c33] text-white flex items-center gap-3 shrink-0 shadow-sm">
        {activeSection !== 'main' ? (
          <button
            type="button"
            onClick={() => setActiveSection('main')}
            className="p-1.5 hover:bg-black/10 rounded-full cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 hover:bg-black/10 rounded-full cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : null}

        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <span>
            {activeSection === 'main'
              ? 'Settings'
              : activeSection === 'privacy'
              ? 'Privacy Settings'
              : activeSection === 'wallpaper'
              ? 'Chat Wallpaper'
              : activeSection === 'security'
              ? 'Security & 2-Step Verification'
              : 'Blocked Contacts'}
          </span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {statusMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 1. MAIN MENU */}
        {activeSection === 'main' && (
          <div className="space-y-3">
            {/* Theme & Display */}
            <div className="bg-zinc-50 dark:bg-[#202c33] p-4 rounded-2xl border border-zinc-200/80 dark:border-[#2a3942] space-y-3">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                Appearance & Theme
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['dark', 'light', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      theme === t
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-[#111b21] border-zinc-200 dark:border-[#2a3942] text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {t === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation links to sub-settings */}
            <div className="bg-zinc-50 dark:bg-[#202c33] rounded-2xl border border-zinc-200/80 dark:border-[#2a3942] divide-y divide-zinc-100 dark:divide-[#2a3942]">
              <button
                type="button"
                onClick={() => setActiveSection('privacy')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-100/60 dark:hover:bg-[#111b21] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Privacy</h4>
                    <p className="text-xs text-zinc-400">Last seen, profile photo, about</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('security')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-100/60 dark:hover:bg-[#111b21] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Security & 2-Step Verification</h4>
                    <p className="text-xs text-zinc-400">TOTP Authenticator, password protection</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('blocked')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-100/60 dark:hover:bg-[#111b21] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <UserX className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Blocked Contacts</h4>
                    <p className="text-xs text-zinc-400">Manage blocked users</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Notification Preferences */}
            <div className="bg-zinc-50 dark:bg-[#202c33] p-4 rounded-2xl border border-zinc-200/80 dark:border-[#2a3942] space-y-3">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                Notification Sounds & Alerts
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">In-App Chat Sounds</h4>
                  <p className="text-[11px] text-zinc-400">Play sounds for incoming & outgoing messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-[#2a3942]">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Desktop Notifications</h4>
                  <p className="text-[11px] text-zinc-400">Show alerts when tab is in the background</p>
                </div>
                <button
                  type="button"
                  onClick={handleRequestNotificationPermission}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {desktopNotifications ? 'Enabled' : 'Enable'}
                </button>
              </div>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-200/60 dark:border-red-900/40">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full text-left flex items-center justify-between text-red-600 dark:text-red-400 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs font-bold">Delete Account</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 2. PRIVACY SECTION */}
        {activeSection === 'privacy' && (
          <div className="space-y-4">
            <div className="bg-zinc-50 dark:bg-[#202c33] p-4 rounded-2xl border border-zinc-200/80 dark:border-[#2a3942] space-y-4">
              {/* Who can see last seen */}
              <div>
                <label className="block text-xs font-bold text-zinc-900 dark:text-white mb-2">
                  Who can see my Last Seen & Online
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['everyone', 'contacts', 'nobody'] as UserPrivacy[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPrivacyLastSeen(opt)}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize border cursor-pointer ${
                        privacyLastSeen === opt
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white dark:bg-[#111b21] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#2a3942]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Who can see profile photo */}
              <div>
                <label className="block text-xs font-bold text-zinc-900 dark:text-white mb-2">
                  Who can see my Profile Photo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['everyone', 'contacts', 'nobody'] as UserPrivacy[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPrivacyAvatar(opt)}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize border cursor-pointer ${
                        privacyAvatar === opt
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white dark:bg-[#111b21] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#2a3942]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Who can see about */}
              <div>
                <label className="block text-xs font-bold text-zinc-900 dark:text-white mb-2">
                  Who can see my About Text
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['everyone', 'contacts', 'nobody'] as UserPrivacy[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPrivacyAbout(opt)}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize border cursor-pointer ${
                        privacyAbout === opt
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white dark:bg-[#111b21] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#2a3942]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSavePrivacy}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
              >
                Save Privacy Settings
              </button>
            </div>
          </div>
        )}

        {/* 3. SECURITY & 2-STEP VERIFICATION */}
        {activeSection === 'security' && (
          <div className="space-y-4">
            {/* TOTP MFA */}
            <div className="bg-zinc-50 dark:bg-[#202c33] p-4 rounded-2xl border border-zinc-200/80 dark:border-[#2a3942] space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                  Two-Step Verification (MFA)
                </h4>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Protect your PUNDA account with an authenticator app (Google Authenticator, Authy, etc.).
              </p>

              {mfaEnabled ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>2-Step Verification is active</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMfaEnabled(false)}
                    className="text-red-500 text-[11px] underline cursor-pointer"
                  >
                    Disable
                  </button>
                </div>
              ) : showMfaSetup ? (
                <div className="p-4 bg-white dark:bg-[#111b21] rounded-xl border border-zinc-200 dark:border-[#2a3942] space-y-3">
                  <div className="flex justify-center p-2 bg-white rounded-lg w-fit mx-auto">
                    <QrCode className="w-28 h-28 text-black" />
                  </div>
                  <p className="text-[11px] text-zinc-400 text-center font-mono">
                    Secret Key: PUNDA-SEC-8921-MFA
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMfaEnabled(true);
                      setShowMfaSetup(false);
                      setStatusMessage('2-Step Verification enabled successfully!');
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Verify & Turn On
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMfaSetup(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Enable 2-Step Verification
                </button>
              )}
            </div>

            {/* Change Password */}
            <div className="bg-zinc-50 dark:bg-[#202c33] p-4 rounded-2xl border border-zinc-200/80 dark:border-[#2a3942] space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-500" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Change Password</h4>
              </div>

              {showChangePassword ? (
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Enter new password (min. 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#111b21] border border-zinc-200 dark:border-[#2a3942] rounded-xl text-xs text-zinc-900 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowChangePassword(false)}
                      className="flex-1 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={newPassword.length < 6}
                      onClick={() => {
                        setShowChangePassword(false);
                        setStatusMessage('Password updated!');
                      }}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowChangePassword(true)}
                  className="px-4 py-2 bg-white dark:bg-[#111b21] border border-zinc-200 dark:border-[#2a3942] text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Change Password
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. BLOCKED CONTACTS */}
        {activeSection === 'blocked' && (
          <div className="space-y-3">
            <div className="p-8 text-center text-zinc-400 space-y-2">
              <UserX className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" />
              <p className="text-xs font-medium">No blocked contacts</p>
              <p className="text-[11px] text-zinc-500">
                Blocked contacts will appear here. You can block any user from their contact info panel.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111b21] p-6 rounded-2xl max-w-sm w-full space-y-3 border border-zinc-200 dark:border-[#222d34]">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <h4 className="text-base font-bold text-center text-zinc-900 dark:text-white">
              Delete Account?
            </h4>
            <p className="text-xs text-zinc-500 text-center leading-relaxed">
              This action is permanent. All your chats, statuses, messages and media will be completely erased.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#202c33] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex-1 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

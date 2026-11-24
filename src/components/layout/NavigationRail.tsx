'use client';

import React from 'react';
import { PundaLogo } from '../common/PundaLogo';
import { MessageSquare, CircleDashed, Phone, Settings, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';

export type ActiveTab = 'chats' | 'status' | 'calls' | 'settings' | 'profile';

interface NavigationRailProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unreadChatsCount?: number;
  unreadStatusesCount?: number;
  missedCallsCount?: number;
  isInActiveChat?: boolean;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  onTabChange,
  unreadChatsCount = 0,
  unreadStatusesCount = 0,
  missedCallsCount = 0,
  isInActiveChat = false,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();

  const navItems = [
    { id: 'chats' as ActiveTab, label: 'Chats', icon: MessageSquare, badge: unreadChatsCount },
    { id: 'status' as ActiveTab, label: 'Status', icon: CircleDashed, badge: unreadStatusesCount },
    { id: 'calls' as ActiveTab, label: 'Calls', icon: Phone, badge: missedCallsCount },
  ];

  return (
    <>
      {/* DESKTOP LEFT VERTICAL RAIL (hidden on mobile) */}
      <aside className="hidden md:flex flex-col items-center justify-between w-16 h-full bg-zinc-100 dark:bg-[#202c33] border-r border-zinc-200 dark:border-[#2f3b43] py-3 shrink-0 z-20 select-none">
        {/* Top Branding Logo */}
        <div className="flex flex-col items-center gap-6">
          <button
            type="button"
            onClick={() => onTabChange('chats')}
            className="p-1 rounded-xl hover:scale-105 transition-transform cursor-pointer"
            title="PUNDA"
          >
            <PundaLogo size={36} />
          </button>

          {/* Navigation Items */}
          <nav className="flex flex-col items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                  className={`relative p-3 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-[#111b21]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.badge > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-zinc-100 dark:ring-[#202c33]">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: Theme Toggle, Settings, Profile, Logout */}
        <div className="flex flex-col items-center gap-2">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-3 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-[#111b21] rounded-xl transition-colors cursor-pointer"
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => onTabChange('settings')}
            title="Settings"
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-[#111b21]'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Profile Avatar */}
          <button
            type="button"
            onClick={() => onTabChange('profile')}
            title="Your Profile"
            className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                : 'border-transparent hover:border-emerald-500'
            }`}
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                {profile?.name?.[0] || 'P'}
              </div>
            )}
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={signOut}
            title="Sign Out"
            className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (hidden when inside active chat) */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#111b21] border-t border-zinc-200 dark:border-[#222d34] items-center justify-around z-30 px-2 ${
          isInActiveChat ? 'hidden' : 'flex'
        }`}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </button>
          );
        })}

        {/* Mobile Settings */}
        <button
          type="button"
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'settings' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Settings</span>
        </button>

        {/* Mobile Profile */}
        <button
          type="button"
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'profile' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <div className="w-5 h-5 rounded-full overflow-hidden border border-zinc-300 dark:border-zinc-700">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center uppercase">
                {profile?.name?.[0] || 'P'}
              </div>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </button>
      </nav>
    </>
  );
};

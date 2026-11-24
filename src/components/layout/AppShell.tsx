'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { dataService } from '@/lib/data-service';
import { Conversation, Status, CallType, Profile } from '@/types/database';
import { NavigationRail, ActiveTab } from './NavigationRail';
import { ChatsList } from '../chat/ChatsList';
import { ChatRoom } from '../chat/ChatRoom';
import { EmptyChatState } from '../chat/EmptyChatState';
import { RightDetailPanel } from '../chat/RightDetailPanel';
import { CreateGroupModal } from '../chat/CreateGroupModal';
import { FriendsView } from '../contacts/FriendsView';
import { StatusFeed } from '../status/StatusFeed';
import { StatusStoryViewer } from '../status/StatusStoryViewer';
import { CallsHistoryView } from '../calls/CallsHistoryView';
import { ProfileView } from '../profile/ProfileView';
import { SettingsView } from '../settings/SettingsView';
import { ActiveCallModal } from '../calls/ActiveCallModal';
import { AuthScreen } from '../auth/AuthScreen';
import { SplashScreen } from '../common/SplashScreen';
import { useSearchParams } from 'next/navigation';

export const AppShell: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  // Splash screen state
  const [splashFinished, setSplashFinished] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showRightInfo, setShowRightInfo] = useState(false);

  // Overlays & Modals
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [storyViewerStatuses, setStoryViewerStatuses] = useState<{ list: Status[]; initialIndex: number } | null>(null);

  // Active WebRTC Call state
  const [activeCall, setActiveCall] = useState<{
    callType: CallType;
    isIncoming: boolean;
    targetUser?: Profile | null;
    conversationId?: string | null;
  } | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!profile) return;
    const list = await dataService.getConversations(profile.id);
    setConversations(list);

    // If active conversation not set or URL parameter provided
    const urlChatId = searchParams.get('chat');
    if (urlChatId) {
      setActiveConversationId(urlChatId);
    } else if (!activeConversationId && list.length > 0 && window.innerWidth >= 768) {
      setActiveConversationId(list[0].id);
    }
  }, [profile, searchParams, activeConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Initiate call
  const handleInitiateCall = (type: CallType) => {
    if (!activeConversation) return;
    setActiveCall({
      callType: type,
      isIncoming: false,
      targetUser: activeConversation.other_member,
      conversationId: activeConversation.id,
    });
  };

  const handleStartCallWithUser = async (targetUserId: string, type: CallType) => {
    if (!profile) return;
    const conv = await dataService.getOrCreatePrivateConversation(profile.id, targetUserId);
    setActiveConversationId(conv.id);
    setActiveTab('chats');
    setActiveCall({
      callType: type,
      isIncoming: false,
      targetUser: conv.other_member,
      conversationId: conv.id,
    });
  };

  if (!splashFinished) {
    return <SplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  if (authLoading) {
    return <SplashScreen minimumDurationMs={400} />;
  }

  // Protected route check: if unauthenticated, show AuthScreen
  if (!user && !profile) {
    return <AuthScreen />;
  }

  const unreadChatsCount = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-zinc-100 dark:bg-[#0c1317]">
      {/* 1. LEFT NAVIGATION RAIL (Desktop) */}
      <NavigationRail
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setActiveConversationId(null);
        }}
        unreadChatsCount={unreadChatsCount}
        isInActiveChat={Boolean(activeConversationId)}
      />

      {/* 2. SECONDARY SIDEBAR PANEL */}
      <div
        className={`w-full md:w-[380px] lg:w-[420px] h-full shrink-0 border-r border-zinc-200 dark:border-[#222d34] flex-col ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeTab === 'chats' && (
          <ChatsList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => {
              setActiveConversationId(id);
              setShowRightInfo(false);
            }}
            onOpenNewChat={() => setShowContactsModal(true)}
            onOpenNewGroup={() => setShowCreateGroupModal(true)}
          />
        )}

        {activeTab === 'status' && (
          <StatusFeed
            onOpenStoryViewer={(statuses, idx = 0) =>
              setStoryViewerStatuses({ list: statuses, initialIndex: idx })
            }
          />
        )}

        {activeTab === 'calls' && (
          <CallsHistoryView
            onStartCall={handleStartCallWithUser}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView onBack={() => setActiveTab('chats')} />
        )}

        {activeTab === 'settings' && (
          <SettingsView onBack={() => setActiveTab('chats')} />
        )}
      </div>

      {/* 3. MAIN CONVERSATION AREA */}
      <div
        className={`flex-1 h-full min-w-0 ${
          activeConversationId ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeConversation ? (
          <div className="flex-1 h-full flex flex-row min-w-0">
            <div className="flex-1 h-full min-w-0">
              <ChatRoom
                key={activeConversation.id}
                conversation={activeConversation}
                onBack={() => setActiveConversationId(null)}
                onToggleInfo={() => setShowRightInfo((p) => !p)}
                onInitiateCall={handleInitiateCall}
              />
            </div>

            {/* 4. RIGHT COLLAPSIBLE CONTACT / GROUP INFO PANEL (Desktop) */}
            {showRightInfo && (
              <div className="hidden lg:block h-full">
                <RightDetailPanel
                  conversation={activeConversation}
                  onClose={() => setShowRightInfo(false)}
                  onInitiateCall={handleInitiateCall}
                />
              </div>
            )}
          </div>
        ) : (
          <EmptyChatState
            onStartNewChat={() => setShowContactsModal(true)}
            onShareInvite={() => setShowContactsModal(true)}
          />
        )}
      </div>

      {/* Contacts / Friends Modal */}
      {showContactsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-[#222d34]">
            <FriendsView
              onBack={() => setShowContactsModal(false)}
              onSelectChat={(convId) => {
                setShowContactsModal(false);
                setActiveTab('chats');
                setActiveConversationId(convId);
                loadConversations();
              }}
            />
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onCreated={(convId) => {
            setActiveTab('chats');
            setActiveConversationId(convId);
            loadConversations();
          }}
        />
      )}

      {/* Active Call Screen */}
      {activeCall && (
        <ActiveCallModal
          callType={activeCall.callType}
          isIncoming={activeCall.isIncoming}
          targetUser={activeCall.targetUser}
          conversationId={activeCall.conversationId}
          onClose={() => setActiveCall(null)}
        />
      )}

      {/* Story Status Viewer */}
      {storyViewerStatuses && (
        <StatusStoryViewer
          statuses={storyViewerStatuses.list}
          initialIndex={storyViewerStatuses.initialIndex}
          onClose={() => setStoryViewerStatuses(null)}
        />
      )}
    </div>
  );
};

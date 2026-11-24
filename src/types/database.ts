export type UserPrivacy = 'everyone' | 'contacts' | 'nobody';
export type ConversationType = 'private' | 'group';
export type MemberRole = 'admin' | 'member';
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'voice' | 'file' | 'call';
export type CallType = 'voice' | 'video';
export type CallStatus = 'calling' | 'ongoing' | 'ended' | 'missed' | 'rejected' | 'busy';

export interface Profile {
  id: string;
  name: string;
  username: string;
  phone: string | null;
  avatar_url: string | null;
  about: string;
  last_seen: string;
  is_online: boolean;
  privacy_last_seen: UserPrivacy;
  privacy_avatar: UserPrivacy;
  privacy_about: UserPrivacy;
  wallpaper?: string;
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile; // Populated joined profile
}

export interface InviteLink {
  id: string;
  code: string;
  owner_id: string;
  created_at: string;
  expires_at: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  is_announcement_only: boolean;
  created_at: string;
  updated_at: string;
  // Computed / joined fields:
  members?: ConversationMember[];
  last_message?: Message;
  unread_count?: number;
  other_member?: Profile;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  role: MemberRole;
  last_read_at: string;
  created_at: string;
  profile?: Profile;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user_profile?: Profile;
}

export interface MessageStatus {
  message_id: string;
  user_id: string;
  delivered_at: string;
  read_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  content: string | null;
  media_url: string | null;
  media_name: string | null;
  media_size: number | null;
  media_mime: string | null;
  reply_to: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  deleted_for: string[];
  is_pinned: boolean;
  created_at: string;
  // Joined fields:
  sender?: Profile;
  reply_message?: Message;
  reactions?: MessageReaction[];
  statuses?: MessageStatus[];
  is_delivered?: boolean;
  is_read?: boolean;
}

export interface Status {
  id: string;
  user_id: string;
  type: 'text' | 'image' | 'video';
  content: string | null;
  media_url: string | null;
  bg_color: string;
  font_style: string;
  created_at: string;
  expires_at: string;
  user?: Profile;
  views?: StatusView[];
  is_viewed?: boolean;
}

export interface StatusView {
  status_id: string;
  viewer_id: string;
  viewed_at: string;
  viewer?: Profile;
}

export interface Call {
  id: string;
  conversation_id: string | null;
  caller_id: string;
  type: CallType;
  status: CallStatus;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  caller?: Profile;
  conversation?: Conversation;
  participants?: Profile[];
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  created_at: string;
}

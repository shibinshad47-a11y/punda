-- ==============================================================================
-- PUNDA WhatsApp-Style Chat Web App - Complete Supabase Database Schema
-- Run this migration in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Drop existing triggers if re-running
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ==============================================================================
-- TABLES
-- ==============================================================================

-- 2.1 Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  username text unique not null,
  phone text,
  avatar_url text,
  about text default 'Hey there! I am using PUNDA.',
  last_seen timestamptz default now(),
  is_online boolean default false,
  privacy_last_seen text default 'everyone' check (privacy_last_seen in ('everyone', 'contacts', 'nobody')),
  privacy_avatar text default 'everyone' check (privacy_avatar in ('everyone', 'contacts', 'nobody')),
  privacy_about text default 'everyone' check (privacy_about in ('everyone', 'contacts', 'nobody')),
  wallpaper text default 'default',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.2 Friendships Table
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('pending', 'accepted', 'rejected', 'blocked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint friendships_requester_receiver_unique unique (requester_id, receiver_id),
  constraint friendships_not_self check (requester_id <> receiver_id)
);

-- 2.3 Invite Links Table
create table if not exists public.invite_links (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '90 days')
);

-- 2.4 Conversations Table (private or group)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('private', 'group')),
  name text,
  description text,
  avatar_url text,
  created_by uuid references public.profiles(id) on delete set null,
  is_announcement_only boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.5 Conversation Members Table
create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('admin', 'member')) default 'member',
  last_read_at timestamptz default now(),
  created_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

-- 2.6 Messages Table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('text', 'image', 'video', 'audio', 'voice', 'file', 'call')) default 'text',
  content text,
  media_url text,
  media_name text,
  media_size bigint,
  media_mime text,
  reply_to uuid references public.messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_for uuid[] default '{}'::uuid[],
  is_pinned boolean default false,
  created_at timestamptz default now()
);

-- 2.7 Message Status Table (delivery and read receipts)
create table if not exists public.message_status (
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  delivered_at timestamptz default now(),
  read_at timestamptz,
  primary key (message_id, user_id)
);

-- 2.8 Message Reactions Table
create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now(),
  constraint reactions_user_message_unique unique (message_id, user_id, emoji)
);

-- 2.9 Statuses (Stories) Table
create table if not exists public.statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('text', 'image', 'video')),
  content text,
  media_url text,
  bg_color text default '#16A34A',
  font_style text default 'sans',
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '24 hours')
);

-- 2.10 Status Views Table
create table if not exists public.status_views (
  status_id uuid references public.statuses(id) on delete cascade not null,
  viewer_id uuid references public.profiles(id) on delete cascade not null,
  viewed_at timestamptz default now(),
  primary key (status_id, viewer_id)
);

-- 2.11 Calls Table (WebRTC audio / video call history & active calls)
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  caller_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('voice', 'video')),
  status text not null check (status in ('calling', 'ongoing', 'ended', 'missed', 'rejected', 'busy')) default 'calling',
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds integer default 0
);

-- 2.12 Reports Table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reported_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  created_at timestamptz default now()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_friendships_requester on public.friendships(requester_id, status);
create index if not exists idx_friendships_receiver on public.friendships(receiver_id, status);
create index if not exists idx_invite_links_code on public.invite_links(code);
create index if not exists idx_conversation_members_user on public.conversation_members(user_id);
create index if not exists idx_conversation_members_conv on public.conversation_members(conversation_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at desc);
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_message_status_user on public.message_status(user_id);
create index if not exists idx_message_reactions_msg on public.message_reactions(message_id);
create index if not exists idx_statuses_user_expires on public.statuses(user_id, expires_at);
create index if not exists idx_calls_conversation on public.calls(conversation_id);
create index if not exists idx_calls_caller on public.calls(caller_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.invite_links enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_status enable row level security;
alter table public.message_reactions enable row level security;
alter table public.statuses enable row level security;
alter table public.status_views enable row level security;
alter table public.calls enable row level security;
alter table public.reports enable row level security;

-- PROFILES POLICIES
-- Anyone authenticated can view profiles
create policy "Authenticated users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can update only their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- FRIENDSHIPS POLICIES
create policy "Users can view their friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy "Users can create friend requests"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id);

create policy "Users can update friendships they are part of"
  on public.friendships for update
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy "Users can delete their friendships"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = receiver_id);

-- INVITE LINKS POLICIES
create policy "Anyone authenticated can view invite links"
  on public.invite_links for select
  to authenticated
  using (true);

create policy "Users can manage their invite links"
  on public.invite_links for all
  to authenticated
  using (auth.uid() = owner_id);

-- CONVERSATIONS POLICIES
create policy "Users can view conversations they are members of"
  on public.conversations for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversations.id
      and cm.user_id = auth.uid()
    )
  );

create policy "Users can create conversations"
  on public.conversations for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Admins or members can update conversation details"
  on public.conversations for update
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversations.id
      and cm.user_id = auth.uid()
      and (cm.role = 'admin' or conversations.type = 'private')
    )
  );

-- CONVERSATION MEMBERS POLICIES
create policy "Members can view membership of their conversations"
  on public.conversation_members for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm2
      where cm2.conversation_id = conversation_members.conversation_id
      and cm2.user_id = auth.uid()
    )
  );

create policy "Users can join or add members"
  on public.conversation_members for insert
  to authenticated
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Users can leave or admins can remove members"
  on public.conversation_members for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
    )
  );

create policy "Admins can update member roles"
  on public.conversation_members for update
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
    )
  );

-- MESSAGES POLICIES
create policy "Members can view messages in their conversations"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
    )
    and not (auth.uid() = any(messages.deleted_for))
  );

create policy "Members can insert messages into their conversations"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_members cm
      join public.conversations c on c.id = cm.conversation_id
      where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
      and (c.is_announcement_only = false or cm.role = 'admin' or c.type = 'private')
    )
  );

create policy "Senders can update their messages"
  on public.messages for update
  to authenticated
  using (
    auth.uid() = sender_id
    or exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Senders can delete messages"
  on public.messages for delete
  to authenticated
  using (auth.uid() = sender_id);

-- MESSAGE STATUS POLICIES
create policy "Members can view message statuses"
  on public.message_status for select
  to authenticated
  using (
    exists (
      select 1 from public.messages m
      join public.conversation_members cm on cm.conversation_id = m.conversation_id
      where m.id = message_status.message_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Users can set their own message receipts"
  on public.message_status for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own message receipts"
  on public.message_status for update
  to authenticated
  using (auth.uid() = user_id);

-- MESSAGE REACTIONS POLICIES
create policy "Members can view message reactions"
  on public.message_reactions for select
  to authenticated
  using (
    exists (
      select 1 from public.messages m
      join public.conversation_members cm on cm.conversation_id = m.conversation_id
      where m.id = message_reactions.message_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Members can add reactions"
  on public.message_reactions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.messages m
      join public.conversation_members cm on cm.conversation_id = m.conversation_id
      where m.id = message_reactions.message_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Users can delete their own reactions"
  on public.message_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- STATUSES POLICIES
create policy "Users can view statuses of accepted friends and themselves"
  on public.statuses for select
  to authenticated
  using (
    auth.uid() = user_id
    or (
      expires_at > now()
      and exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.receiver_id = statuses.user_id)
          or (f.receiver_id = auth.uid() and f.requester_id = statuses.user_id))
      )
    )
  );

create policy "Users can create their own status"
  on public.statuses for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own status"
  on public.statuses for delete
  to authenticated
  using (auth.uid() = user_id);

-- STATUS VIEWS POLICIES
create policy "Status owners and viewers can see status views"
  on public.status_views for select
  to authenticated
  using (
    auth.uid() = viewer_id
    or exists (
      select 1 from public.statuses s
      where s.id = status_views.status_id
      and s.user_id = auth.uid()
    )
  );

create policy "Users can record their view of a status"
  on public.status_views for insert
  to authenticated
  with check (auth.uid() = viewer_id);

-- CALLS POLICIES
create policy "Members can view calls of their conversations"
  on public.calls for select
  to authenticated
  using (
    auth.uid() = caller_id
    or exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = calls.conversation_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Members can initiate calls"
  on public.calls for insert
  to authenticated
  with check (auth.uid() = caller_id);

create policy "Members can update calls"
  on public.calls for update
  to authenticated
  using (
    auth.uid() = caller_id
    or exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = calls.conversation_id
      and cm.user_id = auth.uid()
    )
  );

-- REPORTS POLICIES
create policy "Users can file reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION
-- ==============================================================================

-- Create buckets if they don't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('statuses', 'statuses', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']),
  ('chat-media', 'chat-media', true, 104857600, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm', 'audio/wav', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage Policies
drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "Users can update their avatars" on storage.objects;
create policy "Users can update their avatars"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "Chat media is accessible" on storage.objects;
create policy "Chat media is accessible"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'chat-media');

drop policy if exists "Chat media can be uploaded" on storage.objects;
create policy "Chat media can be uploaded"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'chat-media');

drop policy if exists "Statuses media is readable" on storage.objects;
create policy "Statuses media is readable"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'statuses');

drop policy if exists "Statuses media can be uploaded" on storage.objects;
create policy "Statuses media can be uploaded"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'statuses');

-- ==============================================================================
-- STORED PROCEDURES & TRIGGERS
-- ==============================================================================

-- 1. Automatic profile and invite link creation upon signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_name text;
  raw_username text;
  raw_phone text;
  generated_code text;
begin
  raw_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  raw_username := coalesce(new.raw_user_meta_data->>'username', lower(regexp_replace(raw_name, '[^a-zA-Z0-9_]', '', 'g')) || '_' || substr(md5(random()::text), 1, 4));
  raw_phone := new.raw_user_meta_data->>'phone';

  insert into public.profiles (id, name, username, phone, avatar_url, about, is_online, last_seen)
  values (
    new.id,
    raw_name,
    raw_username,
    raw_phone,
    new.raw_user_meta_data->>'avatar_url',
    'Hey there! I am using PUNDA.',
    true,
    now()
  )
  on conflict (id) do update set
    name = excluded.name,
    phone = coalesce(excluded.phone, profiles.phone);

  -- Create unique invite link for this user
  generated_code := lower(substr(md5(random()::text || new.id::text), 1, 8));
  insert into public.invite_links (code, owner_id)
  values (generated_code, new.id)
  on conflict do nothing;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Atomically create or get a 1-to-1 private conversation
create or replace function public.get_or_create_private_conversation(other_user_id uuid)
returns uuid as $$
declare
  conv_id uuid;
begin
  -- Search for existing private conversation with both members
  select cm1.conversation_id into conv_id
  from public.conversation_members cm1
  join public.conversation_members cm2 on cm1.conversation_id = cm2.conversation_id
  join public.conversations c on c.id = cm1.conversation_id
  where c.type = 'private'
    and cm1.user_id = auth.uid()
    and cm2.user_id = other_user_id
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  -- Create new private conversation
  insert into public.conversations (type, created_by)
  values ('private', auth.uid())
  returning id into conv_id;

  -- Add both members
  insert into public.conversation_members (conversation_id, user_id, role)
  values
    (conv_id, auth.uid(), 'admin'),
    (conv_id, other_user_id, 'member');

  return conv_id;
end;
$$ language plpgsql security definer;

-- 3. Accept invite code & automatically create friendship + conversation
create or replace function public.process_invite_link(invite_code text)
returns jsonb as $$
declare
  inviter_id uuid;
  conv_id uuid;
  inviter_name text;
begin
  select owner_id into inviter_id
  from public.invite_links
  where code = invite_code
  limit 1;

  if inviter_id is null then
    return jsonb_build_object('success', false, 'error', 'Invalid or expired invite link');
  end if;

  if inviter_id = auth.uid() then
    return jsonb_build_object('success', false, 'error', 'You cannot use your own invite link');
  end if;

  -- Get inviter name
  select name into inviter_name from public.profiles where id = inviter_id;

  -- Insert or accept friendship
  insert into public.friendships (requester_id, receiver_id, status)
  values (inviter_id, auth.uid(), 'accepted')
  on conflict (requester_id, receiver_id) do update set status = 'accepted';

  -- Get or create conversation
  conv_id := public.get_or_create_private_conversation(inviter_id);

  return jsonb_build_object(
    'success', true,
    'inviter_id', inviter_id,
    'inviter_name', inviter_name,
    'conversation_id', conv_id
  );
end;
$$ language plpgsql security definer;

-- 4. Delete expired statuses function (can be triggered or called periodically)
create or replace function public.delete_expired_statuses()
returns void as $$
begin
  delete from public.statuses where expires_at <= now();
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime on tables for live updates
-- ==============================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_status;
alter publication supabase_realtime add table public.message_reactions;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.conversation_members;
alter publication supabase_realtime add table public.friendships;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.statuses;
alter publication supabase_realtime add table public.status_views;
alter publication supabase_realtime add table public.calls;

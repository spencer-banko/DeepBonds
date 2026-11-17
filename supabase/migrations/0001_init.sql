-- DeepBonds core schema
-- Universities buy either a single-department package or a university-wide
-- package. Every alumnus belongs to one university and one or more
-- colleges/departments within it. Visibility between alumni is scoped by
-- the university's purchased package (see can_view_profile below), so
-- upgrading a university from department -> university_wide never requires
-- a data migration, only a one-column update.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Institutions
-- ---------------------------------------------------------------------------

create table universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  package_tier text not null default 'department' check (package_tier in ('department', 'university_wide')),
  created_at timestamptz not null default now()
);

create table colleges (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id) on delete cascade,
  name text not null,
  slug text not null,
  unique (university_id, slug)
);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  university_id uuid references universities(id) on delete set null,
  full_name text,
  grad_year int,
  degree text,
  major text,
  bio text,
  avatar_url text,
  is_verified boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profile_colleges (
  profile_id uuid not null references profiles(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  primary key (profile_id, college_id)
);

create table employment_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  company text not null,
  title text not null,
  industry text,
  city text,
  state text,
  country text default 'USA',
  is_current boolean not null default false,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create index employment_history_profile_idx on employment_history(profile_id);
create index employment_history_current_idx on employment_history(is_current) where is_current;

-- ---------------------------------------------------------------------------
-- Invitations (university-sent + self-registration for direct outreach)
-- ---------------------------------------------------------------------------

create table invitations (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id) on delete cascade,
  college_id uuid references colleges(id) on delete set null,
  email text not null,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  accepted_profile_id uuid references profiles(id) on delete set null
);

create index invitations_university_idx on invitations(university_id);

-- ---------------------------------------------------------------------------
-- Messaging
-- ---------------------------------------------------------------------------

create table conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'accepted' check (status in ('accepted', 'pending')),
  primary key (conversation_id, profile_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_conversation_idx on messages(conversation_id, created_at);

create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Visibility rule: department-package universities only let alumni see
-- people who share a college/department; university_wide packages open
-- visibility to the whole institution. Both sides must be verified.
-- ---------------------------------------------------------------------------

create or replace function can_view_profile(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    viewer = target
    or exists (
      select 1
      from profiles v
      join profiles t on t.id = target
      join universities u on u.id = v.university_id
      where v.id = viewer
        and v.is_verified
        and t.is_verified
        and v.university_id is not null
        and v.university_id = t.university_id
        and (
          u.package_tier = 'university_wide'
          or exists (
            select 1
            from profile_colleges vc
            join profile_colleges tc on tc.college_id = vc.college_id
            where vc.profile_id = viewer and tc.profile_id = target
          )
        )
    );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table universities enable row level security;
alter table colleges enable row level security;
alter table profiles enable row level security;
alter table profile_colleges enable row level security;
alter table employment_history enable row level security;
alter table invitations enable row level security;
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table blocks enable row level security;
alter table reports enable row level security;

-- Public reference data: the signup form needs to list universities/colleges
-- before the visitor has an account.
create policy "universities readable by anyone" on universities
  for select to anon, authenticated using (true);

create policy "colleges readable by anyone" on colleges
  for select to anon, authenticated using (true);

create policy "profiles viewable within network" on profiles
  for select to authenticated using (can_view_profile(auth.uid(), id));

create policy "profiles insert self" on profiles
  for insert to authenticated with check (id = auth.uid());

create policy "profiles update self" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "profile_colleges viewable within network" on profile_colleges
  for select to authenticated using (can_view_profile(auth.uid(), profile_id));

create policy "profile_colleges manage self" on profile_colleges
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "employment viewable within network" on employment_history
  for select to authenticated using (can_view_profile(auth.uid(), profile_id));

create policy "employment manage self" on employment_history
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "invitations managed by university admins" on invitations
  for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_admin and p.university_id = invitations.university_id
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_admin and p.university_id = invitations.university_id
    )
  );

create policy "conversation_participants update self" on conversation_participants
  for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "conversation_participants self" on conversation_participants
  for select to authenticated using (
    profile_id = auth.uid()
    or exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id and cp.profile_id = auth.uid()
    )
  );

create policy "conversations for participants" on conversations
  for select to authenticated using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversations.id and cp.profile_id = auth.uid()
    )
  );

create policy "messages for participants" on messages
  for select to authenticated using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.profile_id = auth.uid()
    )
  );

create policy "messages insert by participants" on messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.profile_id = auth.uid()
    )
  );

create policy "blocks manage own" on blocks
  for all to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

create policy "reports insert own" on reports
  for insert to authenticated with check (reporter_id = auth.uid());

create policy "reports visible to university admins" on reports
  for select to authenticated using (
    exists (
      select 1 from profiles admin_p
      join profiles reported_p on reported_p.id = reports.reported_id
      where admin_p.id = auth.uid() and admin_p.is_admin and admin_p.university_id = reported_p.university_id
    )
  );

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Lets an unauthenticated visitor on the signup page resolve an invite
-- token to a university/college name without exposing the invitations table.
create or replace function get_invitation_by_token(p_token text)
returns table (
  university_name text,
  college_name text,
  email text,
  status text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select u.name, c.name, i.email, i.status, i.expires_at
  from invitations i
  join universities u on u.id = i.university_id
  left join colleges c on c.id = i.college_id
  where i.token = p_token;
$$;

grant execute on function get_invitation_by_token(text) to anon, authenticated;

-- Converts a pending invitation into a verified profile for the signed-in
-- user. The inviting university vouched for this person, so they're
-- auto-verified (unlike self-registration via direct outreach).
create or replace function accept_invitation(
  p_token text,
  p_full_name text,
  p_grad_year int default null,
  p_degree text default null,
  p_major text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_user_email text;
  v_invitation invitations%rowtype;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select email into v_user_email from auth.users where id = v_user;

  select * into v_invitation from invitations where token = p_token for update;

  if v_invitation.id is null then
    raise exception 'invitation not found';
  end if;
  if v_invitation.status <> 'pending' then
    raise exception 'invitation already used or revoked';
  end if;
  if v_invitation.expires_at < now() then
    raise exception 'invitation expired';
  end if;
  if lower(v_invitation.email) <> lower(v_user_email) then
    raise exception 'invitation was issued to a different email address';
  end if;

  insert into profiles (id, university_id, full_name, grad_year, degree, major, is_verified)
  values (v_user, v_invitation.university_id, p_full_name, p_grad_year, p_degree, p_major, true)
  on conflict (id) do update
    set university_id = excluded.university_id,
        full_name = excluded.full_name,
        grad_year = excluded.grad_year,
        degree = excluded.degree,
        major = excluded.major,
        is_verified = true,
        updated_at = now();

  if v_invitation.college_id is not null then
    insert into profile_colleges (profile_id, college_id)
    values (v_user, v_invitation.college_id)
    on conflict do nothing;
  end if;

  update invitations
    set status = 'accepted', accepted_profile_id = v_user
    where id = v_invitation.id;

  return v_invitation.university_id;
end;
$$;

grant execute on function accept_invitation(text, text, int, text, text) to authenticated;

-- Finds or creates the 1:1 conversation between the caller and a recipient
-- inside the caller's visible network, then posts the message. Centralizing
-- this here means the client never needs direct insert access to
-- conversations/conversation_participants.
create or replace function send_message(p_recipient uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_conversation uuid;
begin
  if v_sender is null then
    raise exception 'not authenticated';
  end if;
  if v_sender = p_recipient then
    raise exception 'cannot message yourself';
  end if;
  if exists (
    select 1 from blocks
    where (blocker_id = p_recipient and blocked_id = v_sender)
       or (blocker_id = v_sender and blocked_id = p_recipient)
  ) then
    raise exception 'messaging is blocked between these accounts';
  end if;
  if not can_view_profile(v_sender, p_recipient) then
    raise exception 'recipient is outside your network';
  end if;

  select cp1.conversation_id into v_conversation
  from conversation_participants cp1
  join conversation_participants cp2 on cp1.conversation_id = cp2.conversation_id
  where cp1.profile_id = v_sender and cp2.profile_id = p_recipient
  limit 1;

  if v_conversation is null then
    insert into conversations default values returning id into v_conversation;
    insert into conversation_participants (conversation_id, profile_id, status)
      values (v_conversation, v_sender, 'accepted');
    insert into conversation_participants (conversation_id, profile_id, status)
      values (v_conversation, p_recipient, 'pending');
  else
    update conversation_participants
      set status = 'accepted'
      where conversation_id = v_conversation and profile_id = v_sender and status = 'pending';
  end if;

  insert into messages (conversation_id, sender_id, body) values (v_conversation, v_sender, p_body);

  return v_conversation;
end;
$$;

grant execute on function send_message(uuid, text) to authenticated;

-- Admin-only mutations that cross the usual row ownership boundary
-- (verifying someone else's profile, changing the university's package).
-- Implemented as SECURITY DEFINER RPCs with an explicit admin check rather
-- than broadening the base RLS policies on profiles/universities.

create or replace function admin_verify_member(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_university uuid;
begin
  select university_id into v_admin_university
  from profiles where id = auth.uid() and is_admin;

  if v_admin_university is null then
    raise exception 'not an admin';
  end if;

  update profiles
    set is_verified = true, updated_at = now()
    where id = p_profile_id and university_id = v_admin_university;
end;
$$;

grant execute on function admin_verify_member(uuid) to authenticated;

create or replace function admin_set_package_tier(p_tier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_university uuid;
begin
  if p_tier not in ('department', 'university_wide') then
    raise exception 'invalid package tier';
  end if;

  select university_id into v_admin_university
  from profiles where id = auth.uid() and is_admin;

  if v_admin_university is null then
    raise exception 'not an admin';
  end if;

  update universities set package_tier = p_tier where id = v_admin_university;
end;
$$;

grant execute on function admin_set_package_tier(text) to authenticated;

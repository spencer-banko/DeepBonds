export type PackageTier = "department" | "university_wide";
export type InvitationStatus = "pending" | "accepted" | "revoked";
export type ParticipantStatus = "accepted" | "pending";

export interface University {
  id: string;
  name: string;
  slug: string;
  package_tier: PackageTier;
  created_at: string;
}

export interface College {
  id: string;
  university_id: string;
  name: string;
  slug: string;
}

export interface Profile {
  id: string;
  university_id: string | null;
  full_name: string | null;
  grad_year: number | null;
  degree: string | null;
  major: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmploymentHistory {
  id: string;
  profile_id: string;
  company: string;
  title: string;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_current: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface Invitation {
  id: string;
  university_id: string;
  college_id: string | null;
  email: string;
  token: string;
  status: InvitationStatus;
  invited_by: string | null;
  created_at: string;
  expires_at: string;
  accepted_profile_id: string | null;
}

export interface ConversationParticipant {
  conversation_id: string;
  profile_id: string;
  status: ParticipantStatus;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

// These interfaces document the schema in supabase/migrations/0001_init.sql
// for use in component props. The Supabase clients in lib/supabase are
// intentionally untyped against a generated Database schema: the linked
// project was unreachable while scaffolding, so `supabase gen types
// typescript` couldn't run yet. Run it once migrations are applied, and
// wire the result back into createBrowserClient/createServerClient.

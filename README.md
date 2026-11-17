# DeepBonds

Live: https://deepbonds.vercel.app

Connect alumni. Discover opportunities. Build lifelong bonds.

DeepBonds is a university-focused alumni networking platform. Networks launch at the
department level (e.g. a single college of computing) and can upgrade to a university-wide
package without a data migration. Verified alumni get a searchable directory, an interactive
map of where the network currently works, and built-in direct messaging.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres, Auth, Row Level Security)
- `react-simple-maps` + `us-atlas` for the employment map (no geocoding API required —
  see `lib/data/city-coordinates.ts`)

## Getting started

1. Copy `.env.local.example` to `.env.local` (already done in this checkout) and fill in your
   Supabase project URL + publishable key if they differ.
2. Apply the schema to your Supabase project:
   - `supabase/migrations/0001_init.sql` — tables, RLS policies, and RPC functions
   - `supabase/seed.sql` — sample universities/colleges for local testing
3. `npm install`
4. `npm run dev` and open http://localhost:3000

## How the product model works

- Every alumnus belongs to one `university` and one or more `colleges` (many-to-many via
  `profile_colleges`).
- `universities.package_tier` is either `department` or `university_wide`. The
  `can_view_profile()` Postgres function (used in RLS) only lets alumni see people who share a
  college **unless** their university has bought the university-wide package — so upgrading a
  customer never requires migrating data, just flipping one column (see the admin dashboard).
- Alumni arrive two ways: a university-issued invitation (`invitations` table, auto-verified on
  signup) or self-registration (held as `is_verified = false` until a university admin approves
  them from `/admin`).
- Messaging, blocking, and reporting are centralized in SECURITY DEFINER RPCs
  (`send_message`, `accept_invitation`, `admin_verify_member`, `admin_set_package_tier`) so the
  client never needs broad table access — see the comments in
  `supabase/migrations/0001_init.sql`.

## Known gaps in this scaffold

- The employment map only plots cities present in `lib/data/city-coordinates.ts` (~100 major US
  metros). Extend that table or swap in a geocoding service for full coverage.
- Directory filtering happens in JS after fetching the viewer's visible network rather than as
  SQL predicates — fine at pilot scale, worth revisiting if a department grows very large.
- No automated tests yet.

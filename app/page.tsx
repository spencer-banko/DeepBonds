import Link from "next/link";
import { getCurrentUserAndProfile } from "@/lib/data/current-profile";

const FEATURES = [
  {
    title: "Department-first communities",
    body: "Launch with a single college — like the College of Computing — then expand to a university-wide network without migrating any data.",
  },
  {
    title: "Verified alumni only",
    body: "Every member arrives through a university invitation or a reviewed registration. Visibility is scoped to who your institution actually opened up.",
  },
  {
    title: "Searchable directory",
    body: "Filter classmates by department, graduation year, company, industry, or city in seconds.",
  },
  {
    title: "Interactive employment map",
    body: "See clusters of alumni by the city they currently work in, built from information members choose to share.",
  },
  {
    title: "Built-in direct messaging",
    body: "Reach out to a fellow alum with private messaging, message requests, and blocking and reporting controls.",
  },
  {
    title: "University admin dashboard",
    body: "Send invitations, manage department access, review pending verifications, and track engagement — all in one place.",
  },
];

export default async function Home() {
  const { user, profile } = await getCurrentUserAndProfile();

  return (
    <div>
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-accent">
            Alumni networking, built per institution
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Connect alumni. Discover opportunities.
            <br /> Build lifelong bonds.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted">
            DeepBonds helps university graduates discover where fellow alumni work, explore
            professional connections, and communicate directly through a verified alumni network —
            starting at the department level and growing with your institution.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            {user && profile ? (
              <Link
                href="/directory"
                className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Go to your directory
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark"
                >
                  Join your network
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-medium hover:border-brand"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-semibold">What launches first</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[var(--border)] bg-surface p-6"
            >
              <h3 className="font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold">How a university network grows</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div>
              <div className="text-sm font-medium text-accent">01</div>
              <h3 className="mt-1 font-medium">Pilot a college</h3>
              <p className="mt-2 text-sm text-muted">
                A single college or department buys in first — alumni only see others within that
                college.
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-accent">02</div>
              <h3 className="mt-1 font-medium">Invite and verify</h3>
              <p className="mt-2 text-sm text-muted">
                The university sends invitations, and DeepBonds supplements outreach to alumni it
                can find — every profile is reviewed before it&apos;s visible.
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-accent">03</div>
              <h3 className="mt-1 font-medium">Upgrade university-wide</h3>
              <p className="mt-2 text-sm text-muted">
                When the institution buys the full package, every college connects under one
                network — no rebuild required.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

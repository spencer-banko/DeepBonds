import Link from "next/link";
import { getCurrentUserAndProfile } from "@/lib/data/current-profile";
import { SignOutButton } from "@/components/sign-out-button";

const LINKS = [
  { href: "/directory", label: "Directory" },
  { href: "/map", label: "Map" },
  { href: "/messages", label: "Messages" },
];

export async function NavBar() {
  const { user, profile } = await getCurrentUserAndProfile();

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-sm font-semibold text-white">
            D
          </span>
          <span className="text-lg font-semibold tracking-tight">DeepBonds</span>
        </Link>

        {user && profile ? (
          <nav className="flex items-center gap-6 text-sm">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-foreground/80 hover:text-foreground">
                {link.label}
              </Link>
            ))}
            {profile.is_admin && (
              <Link href="/admin" className="text-foreground/80 hover:text-foreground">
                Admin
              </Link>
            )}
            <Link
              href={`/profile/${profile.id}`}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:border-brand"
            >
              {profile.full_name ?? "My profile"}
            </Link>
            <SignOutButton />
          </nav>
        ) : (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-foreground/80 hover:text-foreground">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark"
            >
              Join your network
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

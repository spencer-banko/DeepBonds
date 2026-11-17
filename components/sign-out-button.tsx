import { signOut } from "@/app/(auth)/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="text-foreground/60 hover:text-foreground">
        Sign out
      </button>
    </form>
  );
}

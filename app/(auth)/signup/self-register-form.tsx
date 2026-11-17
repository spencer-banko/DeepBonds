"use client";

import { useMemo, useState } from "react";
import { signUpSelf } from "@/app/(auth)/actions";

interface CollegeOption {
  id: string;
  name: string;
  university_id: string;
}

interface UniversityOption {
  id: string;
  name: string;
}

export function SelfRegisterForm({
  universities,
  colleges,
  error,
}: {
  universities: UniversityOption[];
  colleges: CollegeOption[];
  error?: string;
}) {
  const [universityId, setUniversityId] = useState(universities[0]?.id ?? "");
  const [collegeIds, setCollegeIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const availableColleges = useMemo(
    () => colleges.filter((c) => c.university_id === universityId),
    [colleges, universityId]
  );

  function toggleCollege(id: string) {
    setCollegeIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  return (
    <form
      action={async (formData: FormData) => {
        setPending(true);
        await signUpSelf({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          fullName: String(formData.get("fullName") ?? ""),
          gradYear: String(formData.get("gradYear") ?? ""),
          degree: String(formData.get("degree") ?? ""),
          major: String(formData.get("major") ?? ""),
          universityId,
          collegeIds,
        });
        setPending(false);
      }}
      className="mt-6 space-y-4"
    >
      {error && <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Full name</label>
        <input
          name="fullName"
          required
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Graduation year</label>
          <input
            name="gradYear"
            type="number"
            min={1900}
            max={2100}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Degree</label>
          <input
            name="degree"
            placeholder="B.S., M.S...."
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Major</label>
        <input
          name="major"
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">University</label>
        <select
          value={universityId}
          onChange={(e) => {
            setUniversityId(e.target.value);
            setCollegeIds([]);
          }}
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        >
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {availableColleges.length > 0 && (
        <div>
          <label className="block text-sm font-medium">College / department</label>
          <div className="mt-2 space-y-1.5">
            {availableColleges.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={collegeIds.includes(c.id)}
                  onChange={() => toggleCollege(c.id)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          minLength={8}
          required
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Request access"}
      </button>
      <p className="text-xs text-muted">
        Your account is reviewed before it&apos;s marked verified. Invited alumni skip this step.
      </p>
    </form>
  );
}

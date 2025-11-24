"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => {
    const target = searchParams.get("redirect");
    return target && target.startsWith("/admin") ? target : "/admin";
  }, [searchParams]);
  const existingError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <main className="max-w-sm mx-auto mt-24">
      <h1 className="text-2xl font-bold mb-6">Admin Login</h1>

      <form
        action="/api/admin/login"
        method="POST"
        className="flex flex-col gap-4"
        onSubmit={() => setSubmitting(true)}
      >
        <input type="hidden" name="redirect" value={redirectTo} />

        <input
          type="email"
          name="email"
          placeholder="Email admin"
          className="border px-3 py-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="border px-3 py-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          className="bg-black text-white py-2 rounded disabled:bg-gray-700 disabled:cursor-not-allowed"
          disabled={submitting}
        >
          {submitting ? "Memproses..." : "Login"}
        </button>

        {existingError && (
          <p className="text-sm text-red-600">{existingError}</p>
        )}
      </form>
    </main>
  );
}

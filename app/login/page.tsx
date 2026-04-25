"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function sendMagicLink() {
    setStatus("Sending magic link...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Check your email for the login link.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">AI Co-Host</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Host Login</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter your email to receive a secure magic link.
        </p>

        <label className="mt-6 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="host@example.com"
            type="email"
          />
        </label>

        <button
          onClick={sendMagicLink}
          className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Send magic link
        </button>

        {status && <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">{status}</p>}
      </div>
    </main>
  );
}

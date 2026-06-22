import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { loginLocal } from "@/api/access";
import { setCsrfToken } from "@/api/client";

// Login is the public entry screen shown when there is no active session. It
// offers Google SSO and local username/password. There is no self-registration:
// accounts are provisioned by an administrator.
export function Login() {
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await loginLocal(username, password);
      if (res?.csrfToken) setCsrfToken(res.csrfToken);
      // Re-fetch identity so the app gate re-renders into the console.
      await qc.invalidateQueries();
    } catch {
      setError("Invalid username or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
        <h1 className="mb-1 text-center text-lg font-semibold">Sign in to Capper</h1>
        <p className="mb-6 text-center text-xs text-muted">cloud.cappervm.com</p>

        <a
          href="/api/v1/auth/google/callback"
          className="mb-4 flex w-full items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-slate-800/60"
        >
          Sign in with Google
        </a>

        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username or email"
            autoComplete="username"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          No account? Contact your administrator.
        </p>
      </div>
    </div>
  );
}

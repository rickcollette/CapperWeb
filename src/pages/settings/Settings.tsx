import { useState } from "react";
import { setCsrfToken } from "@/api/client";
import { Link } from "react-router-dom";
import { PageHeader, Card, Button } from "@/components/common/ui";

export function Settings() {
  const [token, setToken] = useState("");
  const [sessionInfo, setSessionInfo] = useState<string>("");

  const createSession = async () => {
    const res = await fetch(`${import.meta.env.VITE_CAPPER_API_URL ?? "/api/v1"}/auth/session`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const body = await res.json();
    if (body.data?.csrfToken) {
      setCsrfToken(body.data.csrfToken);
      setSessionInfo(`Session active for ${body.data.principalId}`);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="API configuration and environment." />
      <Card className="mb-6 max-w-xl space-y-3 text-sm">
        <div><span className="text-muted">API URL</span><div className="font-mono">{import.meta.env.VITE_CAPPER_API_URL ?? "/api/v1"}</div></div>
        <div><span className="text-muted">Factory</span><div><Link to="/factory" className="text-primary hover:underline">In-app factory dashboard</Link> · external CapsuleBuilder also available</div></div>
        <div><span className="text-muted">OpenAPI</span><div><a href="/api/v1/openapi.json" className="text-primary hover:underline" target="_blank" rel="noreferrer">/api/v1/openapi.json</a></div></div>
        <div><span className="text-muted">UI framework</span><div>Custom Tailwind components — see docs/UI.md</div></div>
      </Card>
      <Card className="max-w-xl space-y-3">
        <h3 className="font-medium">Browser session</h3>
        <p className="text-sm text-muted">Paste a bearer token to establish a cookie session with CSRF protection for mutating requests.</p>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Bearer token value"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
        />
        <Button variant="primary" onClick={createSession}>Create session</Button>
        {sessionInfo && <p className="text-sm text-green-400">{sessionInfo}</p>}
      </Card>
    </div>
  );
}
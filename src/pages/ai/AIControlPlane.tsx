import { useState } from "react";
import {
  useAIAgents,
  useCreateAIAgent,
  useAISessions,
  useMCPServers,
  useCreateMCPServer,
} from "@/api/extras";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/common/ui";
import { cn } from "@/lib/utils";

type Tab = "agents" | "sessions" | "mcp";

function AgentsTab() {
  const { data, isLoading } = useAIAgents();
  const create = useCreateAIAgent();
  const [form, setForm] = useState({ name: "", model: "" });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: () => setForm({ name: "", model: "" }),
    });
  }

  return (
    <div>
      <Card className="mb-4 max-w-md">
        <form className="space-y-3" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-xs text-muted">Agent Name</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Agent name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Model</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="model (e.g. claude-sonnet-4-5)"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={create.isPending}>
            Create Agent
          </Button>
        </form>
      </Card>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !data?.length && (
        <EmptyState title="No agents" description="Register an AI agent to get started." />
      )}
      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Model</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3 font-mono text-xs">{a.model}</td>
                  <td className="p-3 text-muted">{a.owner}</td>
                  <td className="p-3 capitalize">{a.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SessionsTab() {
  const { data, isLoading } = useAISessions();

  return (
    <div>
      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !data?.length && (
        <EmptyState title="No sessions" description="Active AI sessions will appear here." />
      )}
      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Session ID</th>
                <th className="p-3">Agent</th>
                <th className="p-3">User</th>
                <th className="p-3">Status</th>
                <th className="p-3">Started</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.sessionId} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3 font-mono text-xs">{s.sessionId}</td>
                  <td className="p-3">{s.agent}</td>
                  <td className="p-3 text-muted">{s.principalUser}</td>
                  <td className="p-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(s.startedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MCPTab() {
  const { data, isLoading } = useMCPServers();
  const create = useCreateMCPServer();
  const [form, setForm] = useState({ name: "", endpoint: "" });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: () => setForm({ name: "", endpoint: "" }),
    });
  }

  return (
    <div>
      <Card className="mb-4 max-w-md">
        <form className="space-y-3" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-xs text-muted">Server Name</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Server name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Endpoint URL</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
              placeholder="endpoint (https://mcp.example.com)"
              value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={create.isPending}>
            Create MCP Server
          </Button>
        </form>
      </Card>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !data?.length && (
        <EmptyState title="No MCP servers" description="Register an MCP server to expose tools to agents." />
      )}
      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Endpoint</th>
                <th className="p-3">IAM Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => (
                <tr key={m.id} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3 font-mono text-xs">{m.endpoint}</td>
                  <td className="p-3 text-muted">{m.iamAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "agents", label: "Agents" },
  { id: "sessions", label: "Sessions" },
  { id: "mcp", label: "MCP" },
];

export function AIControlPlane() {
  const [tab, setTab] = useState<Tab>("agents");

  return (
    <div>
      <PageHeader
        title="AI Control Plane"
        description="Manage AI agents, sessions, and MCP server integrations."
      />

      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition",
              tab === t.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-slate-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "agents" && <AgentsTab />}
      {tab === "sessions" && <SessionsTab />}
      {tab === "mcp" && <MCPTab />}
    </div>
  );
}

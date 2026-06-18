import { useState } from "react";
import { Plus, Trash2, Check, X, ShieldAlert } from "lucide-react";
import {
  useMCPServers,
  useCreateMCPServer,
  useDeleteMCPServer,
  useMCPApprovals,
  useDecideMCPApproval,
  type MCPServer,
} from "@/api/serverless";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";

export function MCPServers() {
  const { data: servers = [], isLoading } = useMCPServers();
  const { data: approvals = [] } = useMCPApprovals();
  const create = useCreateMCPServer();
  const del = useDeleteMCPServer();
  const decide = useDecideMCPApproval();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", runtime: "mcp-go", approvalPolicy: "dangerous-only" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: () => { setShowForm(false); setForm({ name: "", runtime: "mcp-go", approvalPolicy: "dangerous-only" }); },
    });
  }

  return (
    <div>
      <PageHeader
        title="MCP Servers"
        description="Managed Model Context Protocol tool servers with per-tool IAM and approval gates."
        actions={
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New MCP Server
          </Button>
        }
      />

      {approvals.length > 0 && (
        <Card className="mb-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <h3 className="font-semibold">Pending Tool Approvals ({approvals.length})</h3>
          </div>
          <div className="space-y-2">
            {approvals.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span>
                  <span className="font-mono">{a.toolName}</span>
                  <span className="text-muted"> · requested by {a.principal || "agent"}</span>
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => decide.mutate({ id: a.id, decision: "approve" })}>
                    <Check className="h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => decide.mutate({ id: a.id, decision: "deny" })}>
                    <X className="h-3 w-3" /> Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showForm && (
        <Card className="mb-4 max-w-lg">
          <form className="space-y-3" onSubmit={submit}>
            <div>
              <label className="mb-1 block text-sm text-muted">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Approval Policy</label>
              <select
                value={form.approvalPolicy}
                onChange={(e) => setForm({ ...form, approvalPolicy: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="none">None</option>
                <option value="dangerous-only">Dangerous only</option>
                <option value="all">All tool calls</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={create.isPending}>Deploy</Button>
              <Button type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading && <p className="text-muted">Loading MCP servers…</p>}
      {!isLoading && !servers.length && (
        <EmptyState title="No MCP servers" description="Deploy an MCP server to expose AI-callable tools." />
      )}

      {!!servers.length && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Runtime</th>
                <th className="p-3">Approval Policy</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {servers.map((srv: MCPServer) => (
                <tr key={srv.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-medium">{srv.name}</td>
                  <td className="p-3 text-muted">{srv.runtime}</td>
                  <td className="p-3 capitalize">{srv.approvalPolicy.replace("-", " ")}</td>
                  <td className="p-3 capitalize">{srv.status}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => del.mutate(srv.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
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

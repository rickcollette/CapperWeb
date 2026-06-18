import { useState } from "react";
import Editor from "@monaco-editor/react";
import { useCreatePolicy, useIAMPolicies, useIAMSimulate, useIAMTokens, useIssueToken } from "@/api/resources";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";
import { IamNav } from "@/pages/iam/IamNav";

export function Policies() {
  const { data: policies } = useIAMPolicies();
  const create = useCreatePolicy();
  const [editor, setEditor] = useState(`{
  "name": "custom-policy",
  "statements": [{
    "effect": "allow",
    "actions": ["instance:list"],
    "resources": ["project:default"]
  }]
}`);

  return (
    <div>
      <PageHeader title="IAM Policies" description="Create and inspect access policies." />
      <IamNav active="policies" />
      <Card className="mb-6">
        <h3 className="mb-2 font-medium">Policy editor</h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <Editor
            height="200px"
            defaultLanguage="json"
            theme="vs-dark"
            value={editor}
            onChange={(v) => setEditor(v ?? "")}
            options={{ minimap: { enabled: false } }}
          />
        </div>
        <div className="mt-3">
          <Button
            variant="primary"
            onClick={() => {
              try {
                create.mutate(JSON.parse(editor));
              } catch {
                /* invalid json */
              }
            }}
          >
            Save policy
          </Button>
        </div>
      </Card>
      {!policies?.length ? <EmptyState title="No policies" /> : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-card text-left text-muted"><th className="p-3">Name</th><th className="p-3">Statements</th></tr></thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.statements?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function Simulate() {
  const simulate = useIAMSimulate();
  const [action, setAction] = useState("instance:list");
  const [resource, setResource] = useState("project:default");

  return (
    <div>
      <PageHeader title="IAM Simulate" description="Test whether an action is allowed." />
      <IamNav active="simulate" />
      <Card className="max-w-lg space-y-4">
        <label className="block space-y-1">
          <span className="text-sm text-muted">Action</span>
          <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="action (e.g. instance:list)" className="w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-muted">Resource</span>
          <input value={resource} onChange={(e) => setResource(e.target.value)} placeholder="resource (e.g. project:default)" className="w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <Button variant="primary" onClick={() => simulate.mutate({ action, resource })} disabled={simulate.isPending}>
          Simulate
        </Button>
        {simulate.data && (
          <p className={simulate.data.allowed ? "text-green-400" : "text-red-400"}>
            {simulate.data.allowed ? "Allowed" : "Denied"} — {simulate.data.reason}
          </p>
        )}
      </Card>
    </div>
  );
}

export function Tokens() {
  const { data: tokens } = useIAMTokens();
  const issue = useIssueToken();
  const [name, setName] = useState("");
  const [issued, setIssued] = useState("");

  return (
    <div>
      <PageHeader title="API Tokens" description="Issue and list bearer tokens." />
      <IamNav active="tokens" />
      <Card className="mb-6 max-w-md">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            issue.mutate({ name, ttl: "24h" }, {
              onSuccess: (d) => setIssued(d.bearer),
            });
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Token name" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <Button type="submit" variant="primary" disabled={issue.isPending}>Issue</Button>
        </form>
        {issued && <p className="mt-3 break-all font-mono text-xs text-amber-400">{issued}</p>}
      </Card>
      {!tokens?.length ? <EmptyState title="No tokens" /> : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-card text-left text-muted"><th className="p-3">Name</th><th className="p-3">Expires</th><th className="p-3">Created</th></tr></thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t.id} className="border-b border-border/60">
                  <td className="p-3">{t.name}</td>
                  <td className="p-3">{' '}{t.expiresAt}</td>
                  <td className="p-3">{' '}{t.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

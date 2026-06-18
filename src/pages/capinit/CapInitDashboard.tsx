import { useState } from "react";
import Editor from "@monaco-editor/react";
import {
  useCapInitRender,
  useCapInitStatus,
  useCapInitTemplates,
  useCreateCapInitTemplate,
  useDeleteCapInitTemplate,
} from "@/api/resources";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader } from "@/components/common/ui";

export function CapInitDashboard() {
  const { data: status } = useCapInitStatus();
  const { data: templates } = useCapInitTemplates();
  const create = useCreateCapInitTemplate();
  const del = useDeleteCapInitTemplate();
  const render = useCapInitRender();
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ id: "", name: "", description: "", content: "#cloud-config\nhostname: example\n" });
  const [preview, setPreview] = useState("");
  const [renderVars, setRenderVars] = useState<{ k: string; v: string }[]>([]);

  const save = () => {
    create.mutate(
      { ...draft, id: draft.id || draft.name.replace(/\s+/g, "-"), createdAt: "", updatedAt: "" },
      { onSuccess: () => { setEditorOpen(false); setDraft({ id: "", name: "", description: "", content: "#cloud-config\n" }); } },
    );
  };

  return (
    <div>
      <PageHeader
        title="CapInit"
        description="Cloud-init style metadata templates and instance initialization."
        actions={<Button variant="primary" onClick={() => setEditorOpen(true)}>New template</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><div className="text-muted">Metadata service</div><div className="mt-1 capitalize">{status?.enabled ? "enabled" : "not configured"}</div></Card>
        <Card><div className="text-muted">Metadata IP</div><div className="mt-1 font-mono text-sm">{status?.metadataIP ?? "169.254.169.254"}</div></Card>
        <Card><div className="text-muted">Templates</div><div className="mt-1 text-2xl font-semibold">{templates?.length ?? 0}</div></Card>
        <Card>
          <div className="text-muted">Render preview</div>
          <div className="mt-2 space-y-2">
            {renderVars.map((row, i) => (
              <div key={i} className="flex gap-1">
                <input value={row.k} onChange={(e) => setRenderVars((rv) => rv.map((r, j) => j === i ? { ...r, k: e.target.value } : r))} placeholder="key" className="w-24 rounded border border-border bg-background px-2 py-1 text-xs" />
                <input value={row.v} onChange={(e) => setRenderVars((rv) => rv.map((r, j) => j === i ? { ...r, v: e.target.value } : r))} placeholder="value" className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs" />
                <button type="button" className="text-xs text-muted hover:text-red-400" onClick={() => setRenderVars((rv) => rv.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setRenderVars((rv) => [...rv, { k: "", v: "" }])}>+ Var</Button>
              <Button size="sm" onClick={() => { if (templates?.[0]) render.mutate({ templateId: templates[0].id, vars: Object.fromEntries(renderVars.filter((r) => r.k).map((r) => [r.k, r.v])) }, { onSuccess: (d) => setPreview(d.rendered) }); }}>Preview first</Button>
            </div>
          </div>
        </Card>
      </div>
      {preview && <Card className="mb-6"><pre className="overflow-auto font-mono text-xs">{preview}</pre></Card>}
      {!templates?.length ? (
        <EmptyState title="No templates" description="Create CapInit templates for cloud-init style bootstrapping." />
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">{t.name}</h3>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => render.mutate({ templateId: t.id, vars: Object.fromEntries(renderVars.filter((r) => r.k).map((r) => [r.k, r.v])) }, { onSuccess: (d) => setPreview(d.rendered) })}>Render</Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteId(t.id)}>Delete</Button>
                </div>
              </div>
              <p className="text-sm text-muted">{t.description}</p>
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <Editor height="160px" defaultLanguage="yaml" theme="vs-dark" value={t.content} options={{ readOnly: true, minimap: { enabled: false } }} />
              </div>
            </Card>
          ))}
        </div>
      )}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-auto">
            <h3 className="mb-4 text-lg font-medium">New template</h3>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2" />
            <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description" className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2" />
            <Editor height="240px" defaultLanguage="yaml" theme="vs-dark" value={draft.content} onChange={(v) => setDraft({ ...draft, content: v ?? "" })} options={{ minimap: { enabled: false } }} />
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={save} disabled={!draft.name || create.isPending}>Save</Button>
            </div>
          </Card>
        </div>
      )}
      {deleteId && (
        <ConfirmDialog open title="Delete template?" confirmLabel="Delete" onCancel={() => setDeleteId(null)} onConfirm={() => del.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} />
      )}
    </div>
  );
}

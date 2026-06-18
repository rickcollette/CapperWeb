import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useLBs,
  useLB,
  useCreateLB,
  useAddLBBackend,
  useRemoveLBBackend,
  useUpdateLBBackend,
} from "@/api/extras";
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";

function CreateLBModal({ onClose }: { onClose: () => void }) {
  const create = useCreateLB();
  const [form, setForm] = useState({
    name: "",
    mode: "tcp" as "tcp" | "http",
    listenAddr: "",
    network: "",
    algorithm: "round-robin",
    selector: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold">Create Load Balancer</h3>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs text-muted">Name</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="LB name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Mode</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value as "tcp" | "http" })}
              size={2}
            >
              <option value="tcp">TCP</option>
              <option value="http">HTTP</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Listen Address</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
              placeholder="0.0.0.0:80"
              value={form.listenAddr}
              onChange={(e) => setForm({ ...form, listenAddr: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Network</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.network}
              onChange={(e) => setForm({ ...form, network: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Algorithm</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.algorithm}
              onChange={(e) => setForm({ ...form, algorithm: e.target.value })}
            >
              <option value="round-robin">Round Robin</option>
              <option value="least-connections">Least Connections</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Selector</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="label=value"
              value={form.selector}
              onChange={(e) => setForm({ ...form, selector: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LoadBalancers() {
  const { data, isLoading } = useLBs();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <PageHeader
        title="Load Balancers"
        description="Distribute traffic across capsule instances."
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            Create LB
          </Button>
        }
      />
      {showCreate && <CreateLBModal onClose={() => setShowCreate(false)} />}
      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Listen</th>
                <th className="p-3">Algorithm</th>
                <th className="p-3">Selector</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((lb) => (
                <tr key={lb.id} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3">
                    <Link to={`/lb/${lb.name}`} className="text-primary hover:underline">
                      {lb.name}
                    </Link>
                    <div className="text-xs text-muted">{lb.id}</div>
                  </td>
                  <td className="p-3 uppercase">{lb.mode}</td>
                  <td className="p-3 font-mono text-xs">{lb.listenAddr}</td>
                  <td className="p-3">{lb.algorithm}</td>
                  <td className="p-3 font-mono text-xs">{lb.selector}</td>
                  <td className="p-3">
                    <StatusBadge status={lb.status} />
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

function AddBackendForm({ lbName }: { lbName: string }) {
  const add = useAddLBBackend(lbName);
  const [form, setForm] = useState({ address: "", port: "", weight: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    add.mutate(
      {
        address: form.address,
        port: form.port ? Number(form.port) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
      },
      { onSuccess: () => setForm({ address: "", port: "", weight: "" }) },
    );
  }

  return (
    <form className="flex flex-wrap gap-2" onSubmit={handleSubmit}>
      <input
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
        placeholder="Address (e.g. 10.0.0.5)"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        required
      />
      <input
        className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        placeholder="Port"
        type="number"
        min={1}
        max={65535}
        value={form.port}
        onChange={(e) => setForm({ ...form, port: e.target.value })}
      />
      <input
        className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        placeholder="Weight"
        type="number"
        min={1}
        value={form.weight}
        onChange={(e) => setForm({ ...form, weight: e.target.value })}
      />
      <Button type="submit" variant="primary" disabled={add.isPending}>
        Add Backend
      </Button>
    </form>
  );
}

function WeightCell({ lbName, backendId, weight }: { lbName: string; backendId: string; weight?: number }) {
  const update = useUpdateLBBackend(lbName);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(weight ?? 1));

  if (editing) {
    return (
      <form
        className="flex items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate({ id: backendId, weight: Number(val) }, { onSuccess: () => setEditing(false) });
        }}
      >
        <input
          autoFocus
          type="number"
          min={1}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-16 rounded border border-border bg-background px-2 py-0.5 text-xs"
        />
        <button type="submit" className="text-xs text-primary">✓</button>
        <button type="button" className="text-xs text-muted" onClick={() => setEditing(false)}>✕</button>
      </form>
    );
  }
  return (
    <button
      type="button"
      className="group flex items-center gap-1 hover:text-primary"
      onClick={() => setEditing(true)}
      title="Click to edit weight"
    >
      {weight ?? "—"}
      <span className="hidden text-xs text-muted group-hover:inline">✎</span>
    </button>
  );
}

export function LBDetail() {
  const { name = "" } = useParams();
  const { data, isLoading } = useLB(name);
  const remove = useRemoveLBBackend(name);

  if (isLoading) return <p className="text-muted">Loading...</p>;
  if (!data) return <p className="text-red-400">Load balancer not found.</p>;

  const { lb, backends } = data;

  return (
    <div>
      <PageHeader title={lb.name} description={`${lb.mode.toUpperCase()} · ${lb.listenAddr}`} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-muted">Algorithm</p>
          <p className="mt-1 font-medium capitalize">{lb.algorithm}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Selector</p>
          <p className="mt-1 font-mono text-sm">{lb.selector || "—"}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Status</p>
          <div className="mt-1">
            <StatusBadge status={lb.status} />
          </div>
        </Card>
      </div>

      <h2 className="mb-3 text-lg font-medium">Backends</h2>
      <Card className="mb-4">
        <AddBackendForm lbName={name} />
      </Card>

      {!backends?.length ? (
        <EmptyState title="No backends" description="Add a backend to receive traffic." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Address</th>
                <th className="p-3">Port</th>
                <th className="p-3">Weight</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {backends.map((b) => (
                <tr key={b.id} className="border-b border-border/60">
                  <td className="p-3 font-mono text-xs">{b.address}</td>
                  <td className="p-3">{b.port ?? "—"}</td>
                  <td className="p-3"><WeightCell lbName={name} backendId={b.id} weight={b.weight} /></td>
                  <td className="p-3">
                    {b.status ? <StatusBadge status={b.status} /> : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(b.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link to="/lb" className="mt-4 inline-block text-sm text-primary hover:underline">
        ← Back to Load Balancers
      </Link>
    </div>
  );
}

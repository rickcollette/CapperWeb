import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import {
  useCordonNode,
  useUncordonNode,
  useDrainNode,
  useNodeServices,
} from "@/api/topology";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";
import { formatBytes } from "@/lib/utils";
import { MonitoringPanel } from "@/components/MonitoringPanel";

type Tab = "overview" | "services" | "monitoring" | "labels" | "taints" | "events";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "services", label: "Services" },
  { id: "monitoring", label: "Monitoring" },
  { id: "labels", label: "Labels" },
  { id: "taints", label: "Taints" },
  { id: "events", label: "Events" },
];

export function NodeDetail() {
  const { nodeName } = useParams<{ nodeName: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: node, isLoading } = useQuery({
    queryKey: ["nodes", nodeName],
    queryFn: () => apiFetch<any>(`/nodes/${nodeName}`),
    enabled: !!nodeName,
  });

  const cordon = useCordonNode();
  const uncordon = useUncordonNode();
  const drain = useDrainNode();
  const del = useMutation({
    mutationFn: (name: string) => apiFetch<void>(`/nodes/${name}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nodes"] });
      navigate("/nodes");
    },
  });

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!node) return <p className="text-red-400">Node not found.</p>;

  const name = node.name ?? nodeName;

  return (
    <div>
      <PageHeader
        title={name}
        description={`Node · ${node.status ?? "unknown"}`}
        actions={
          <div className="flex gap-2">
            {node.status !== "cordoned" && (
              <Button onClick={() => cordon.mutate(name)} disabled={cordon.isPending}>
                Cordon
              </Button>
            )}
            {node.status === "cordoned" && (
              <Button
                variant="primary"
                onClick={() => uncordon.mutate(name)}
                disabled={uncordon.isPending}
              >
                Uncordon
              </Button>
            )}
            <Button onClick={() => drain.mutate(name)} disabled={drain.isPending}>
              Drain
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab node={node} />}
      {tab === "services" && <ServicesTab nodeName={name} />}
      {tab === "monitoring" && <MonitoringPanel service="nodes" id={node.id ?? name} />}
      {tab === "labels" && <LabelsTab labels={node.labels} />}
      {tab === "taints" && <TaintsTab taints={node.taints} />}
      {tab === "events" && (
        <EmptyState title="No events" description="Event tracking not yet implemented." />
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete node?"
        description={`Permanently remove node "${name}" from the control plane?`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => del.mutate(name)}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function OverviewTab({ node }: { node: any }) {
  const inv = node.inventory ?? {};
  const roles: string[] = node.roles ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <h3 className="mb-3 font-semibold">Hardware</h3>
        <dl className="space-y-2 text-sm">
          <InfoRow label="CPU Cores" value={inv.cpuCount ?? node.cpu ?? "—"} />
          <InfoRow
            label="Memory"
            value={inv.memoryBytes ? formatBytes(inv.memoryBytes) : "—"}
          />
          <InfoRow
            label="Disk"
            value={inv.diskBytes ? formatBytes(inv.diskBytes) : "—"}
          />
          <InfoRow label="GPUs" value={inv.gpuCount ?? node.gpuCount ?? 0} />
          <InfoRow label="GPU Model" value={inv.gpuModel ?? "—"} />
          <InfoRow label="Agent Version" value={node.agentVersion ?? "—"} />
        </dl>
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">Status</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Status</dt>
            <dd>
              <StatusBadge status={node.status ?? "unknown"} />
            </dd>
          </div>
          <InfoRow label="Region" value={node.region ?? "—"} />
          <InfoRow label="Zone" value={node.zone ?? "—"} />
          <InfoRow
            label="Last Heartbeat"
            value={
              node.lastHeartbeat
                ? new Date(node.lastHeartbeat).toLocaleString()
                : "—"
            }
          />
          <InfoRow
            label="Registered"
            value={
              node.createdAt ? new Date(node.createdAt).toLocaleString() : "—"
            }
          />
        </dl>
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">Roles</h3>
        {roles.length === 0 ? (
          <p className="text-sm text-muted">No roles assigned.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {roles.map((r) => (
              <span
                key={r}
                className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-400"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function ServicesTab({ nodeName }: { nodeName: string }) {
  const { data, isLoading } = useNodeServices(nodeName);

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!data?.length)
    return <EmptyState title="No services" description="No services are running on this node." />;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card text-left text-muted">
            <th className="p-3">Service</th>
            <th className="p-3">Desired</th>
            <th className="p-3">Actual</th>
            <th className="p-3">Health</th>
            <th className="p-3">Version</th>
            <th className="p-3">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {data.map((svc: any, i: number) => (
            <tr key={i} className="border-b border-border/60 hover:bg-slate-800/30">
              <td className="p-3 font-medium">{svc.name ?? svc.serviceType ?? "—"}</td>
              <td className="p-3 text-muted">{svc.desiredState ?? "—"}</td>
              <td className="p-3">
                <StatusBadge status={svc.actualState ?? svc.state ?? "unknown"} />
              </td>
              <td className="p-3">
                <StatusBadge status={svc.health ?? "unknown"} />
              </td>
              <td className="p-3 text-xs text-muted">{svc.version ?? "—"}</td>
              <td className="p-3 text-xs text-muted">
                {svc.lastSeen ? new Date(svc.lastSeen).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LabelsTab({ labels }: { labels?: Record<string, string> }) {
  const entries = Object.entries(labels ?? {});
  if (!entries.length)
    return <EmptyState title="No labels" description="This node has no labels." />;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card text-left text-muted">
            <th className="p-3">Key</th>
            <th className="p-3">Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} className="border-b border-border/60">
              <td className="p-3 font-mono text-xs">{k}</td>
              <td className="p-3 font-mono text-xs text-muted">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaintsTab({ taints }: { taints?: Array<{ key: string; value?: string; effect: string }> }) {
  if (!taints?.length)
    return <EmptyState title="No taints" description="This node has no taints." />;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card text-left text-muted">
            <th className="p-3">Taint</th>
            <th className="p-3">Effect</th>
          </tr>
        </thead>
        <tbody>
          {taints.map((t, i) => (
            <tr key={i} className="border-b border-border/60">
              <td className="p-3 font-mono text-xs">
                {t.key}
                {t.value ? `=${t.value}` : ""}
              </td>
              <td className="p-3 text-xs text-muted">{t.effect}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLB,
  useDeleteLB,
  useCreateLBListener,
  useDeleteLBListener,
  useCreateLBTargetGroup,
  useDeleteLBTargetGroup,
  useAddLBTarget,
  useRemoveLBTarget,
  useAttachListenerCert,
  useDetachListenerCert,
} from "@/api/extras";
import { useCertificates } from "@/api/certificates";
import { DeleteResourceModal } from "@/components/DeleteResourceModal";
import { DeletionProgressModal } from "@/components/DeletionProgressModal";
import { useDeletionFlow } from "@/hooks/useDeletionFlow";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/common/ui";

type Tab = "overview" | "listeners" | "target-groups" | "tls" | "monitoring";

export function LBDetail() {
  const { name = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useLB(name);
  const delLB = useDeleteLB();
  const [tab, setTab] = useState<Tab>("overview");
  const targetsByGroup = useTargetsByGroup(data?.targetGroups, data?.targets);
  const deletion = useDeletionFlow({
    onDeletionComplete: () => {
      queryClient.invalidateQueries({ queryKey: ["load-balancers"] });
      queryClient.removeQueries({ queryKey: ["load-balancer", name] });
      navigate("/lb");
    },
  });

  const lb = data?.lb;
  const listeners = data?.listeners ?? [];

  if (isLoading) return <p className="text-muted">Loading...</p>;
  if (!lb) return <p className="text-red-400">Load balancer not found.</p>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "listeners", label: "Listeners" },
    { id: "target-groups", label: "Target Groups" },
    { id: "tls", label: "TLS" },
    { id: "monitoring", label: "Monitoring" },
  ];

  return (
    <div>
      <PageHeader
        title={lb.name}
        description={`${lb.scheme ?? "internal"} · VIP ${lb.vipAddress || lb.listenAddr || "unset"}`}
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab
          lb={lb}
          listenerCount={listeners.length}
          lbName={name}
          deletion={deletion}
          deleting={delLB.isPending}
        />
      )}
      {tab === "listeners" && (
        <ListenersTab lbName={name} listeners={listeners} targetGroups={data?.targetGroups ?? []} />
      )}
      {tab === "target-groups" && (
        <TargetGroupsTab lbName={name} targetGroups={data?.targetGroups ?? []} targetsByGroup={targetsByGroup} />
      )}
      {tab === "tls" && <TLSTab lbName={name} listeners={listeners} />}
      {tab === "monitoring" && <MonitoringTab lbName={name} listenerCount={listeners.length} />}

      {/* New deletion flow modals */}
      <DeleteResourceModal
        open={deletion.showConfirmModal}
        resourceType={deletion.state.resourceType}
        resourceId={deletion.state.resourceId}
        resourceName={deletion.state.resourceName}
        onClose={deletion.closeConfirmModal}
        onSuccess={(jobId) => {
          deletion.closeConfirmModal();
          deletion.onConfirmSuccess(jobId);
        }}
      />

      {deletion.state.jobId && (
        <DeletionProgressModal
          open={deletion.showProgressModal}
          jobId={deletion.state.jobId}
          resourceType={deletion.state.resourceType}
          resourceId={deletion.state.resourceId}
          onClose={deletion.closeModal}
          onComplete={(job) => {
            deletion.onDeletionComplete(job);
            if (job.status === 'completed') {
              setTimeout(() => deletion.closeModal(), 2000);
            }
          }}
        />
      )}

      <Link to="/lb" className="mt-6 inline-block text-sm text-primary hover:underline">
        ← Back to Load Balancers
      </Link>
    </div>
  );
}

function useTargetsByGroup(
  groups: { id: string }[] | undefined,
  targets: { id: string; targetGroupId: string; address: string }[] | undefined,
) {
  return useMemo(() => {
    const map: Record<string, { id: string; address: string }[]> = {};
    for (const g of groups ?? []) map[g.id] = [];
    for (const t of targets ?? []) {
      if (!map[t.targetGroupId]) map[t.targetGroupId] = [];
      map[t.targetGroupId].push({ id: t.id, address: t.address });
    }
    return map;
  }, [groups, targets]);
}

function OverviewTab({
  lb,
  listenerCount,
  lbName,
  deletion,
  deleting,
}: {
  lb: NonNullable<ReturnType<typeof useLB>["data"]>["lb"];
  listenerCount: number;
  lbName: string;
  deletion: ReturnType<typeof useDeletionFlow>;
  deleting: boolean;
}) {
  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-muted">Scheme</p>
          <p className="mt-1 font-medium capitalize">{lb.scheme ?? "internal"}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">VIP</p>
          <p className="mt-1 font-mono text-sm">{lb.vipAddress || "—"}</p>
          {lb.vipAddress && (
            <button type="button" className="mt-1 text-xs text-primary" onClick={() => copy(lb.vipAddress!)}>
              Copy
            </button>
          )}
        </Card>
        <Card>
          <p className="text-xs text-muted">Listeners</p>
          <p className="mt-1 font-medium">{listenerCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Status</p>
          <div className="mt-1">
            <StatusBadge status={lb.status} />
          </div>
        </Card>
      </div>
      <Card className="space-y-2 text-sm">
        <div>
          <span className="text-muted">Subnet:</span>{" "}
          <span className="font-mono">{lb.subnetId || lb.networkId || "—"}</span>
        </div>
        <div>
          <span className="text-muted">DNS:</span>{" "}
          <span className="font-mono">{lb.dnsName || "—"}</span>
        </div>
        <div>
          <span className="text-muted">Algorithm:</span> {lb.algorithm || "round-robin"}
        </div>
      </Card>
      <Button
        variant="danger"
        disabled={deleting}
        onClick={() => deletion.startDeletion('load-balancer', lbName, lb.name)}
        data-testid="lb-delete"
      >
        Delete Load Balancer
      </Button>
    </div>
  );
}

function ListenersTab({
  lbName,
  listeners,
  targetGroups,
}: {
  lbName: string;
  listeners: { id: string; protocol: string; port: number; targetGroupId: string; certificateId?: string }[];
  targetGroups: { id: string; name: string }[];
}) {
  const create = useCreateLBListener(lbName);
  const remove = useDeleteLBListener(lbName);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ protocol: "HTTP", port: 80, targetGroupId: "" });

  const tgMap = Object.fromEntries(targetGroups.map((t) => [t.id, t.name]));

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => setShowAdd(!showAdd)}>
          Add Listener
        </Button>
      </div>
      {showAdd && (
        <Card className="mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <select
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.protocol}
              onChange={(e) => setForm({ ...form, protocol: e.target.value })}
            >
              <option value="HTTP">HTTP</option>
              <option value="HTTPS">HTTPS</option>
              <option value="TCP">TCP</option>
            </select>
            <input
              type="number"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
            />
            <select
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.targetGroupId || targetGroups[0]?.id}
              onChange={(e) => setForm({ ...form, targetGroupId: e.target.value })}
            >
              {targetGroups.map((tg) => (
                <option key={tg.id} value={tg.id}>
                  {tg.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="primary"
            disabled={!targetGroups.length || create.isPending}
            onClick={() =>
              create.mutate(
                {
                  protocol: form.protocol,
                  port: form.port,
                  targetGroupId: form.targetGroupId || targetGroups[0].id,
                },
                { onSuccess: () => setShowAdd(false) },
              )
            }
          >
            Create
          </Button>
        </Card>
      )}
      {!listeners.length ? (
        <EmptyState title="No listeners" description="Add a listener to expose a port on the VIP." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="p-3">Port</th>
              <th className="p-3">Protocol</th>
              <th className="p-3">Target Group</th>
              <th className="p-3">Certificate</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {listeners.map((l) => (
              <tr key={l.id} className="border-b border-border/60">
                <td className="p-3 font-mono">{l.port}</td>
                <td className="p-3">{l.protocol}</td>
                <td className="p-3">{tgMap[l.targetGroupId] ?? l.targetGroupId}</td>
                <td className="p-3 font-mono text-xs">{l.certificateId || "—"}</td>
                <td className="p-3 text-right">
                  <Button variant="danger" size="sm" onClick={() => remove.mutate(l.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TargetGroupsTab({
  lbName,
  targetGroups,
  targetsByGroup,
}: {
  lbName: string;
  targetGroups: { id: string; name: string; protocol: string; port: number }[];
  targetsByGroup: Record<string, { id: string; address: string }[]>;
}) {
  const createTG = useCreateLBTargetGroup(lbName);
  const deleteTG = useDeleteLBTargetGroup(lbName);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newTG, setNewTG] = useState({ name: "", protocol: "tcp", port: 8080 });

  return (
    <div>
      <Card className="mb-4 flex flex-wrap gap-2">
        <input
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          placeholder="Target group name"
          value={newTG.name}
          onChange={(e) => setNewTG({ ...newTG, name: e.target.value })}
        />
        <input
          type="number"
          className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={newTG.port}
          onChange={(e) => setNewTG({ ...newTG, port: Number(e.target.value) })}
        />
        <Button
          variant="primary"
          disabled={!newTG.name || createTG.isPending}
          onClick={() => createTG.mutate(newTG, { onSuccess: () => setNewTG({ name: "", protocol: "tcp", port: 8080 }) })}
        >
          Add Target Group
        </Button>
      </Card>
      {!targetGroups.length ? (
        <EmptyState title="No target groups" description="Create a target group, then register backends." />
      ) : (
        <div className="space-y-2">
          {targetGroups.map((tg) => (
            <Card key={tg.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => setExpanded(expanded === tg.id ? null : tg.id)}
              >
                <span className="font-medium">{tg.name}</span>
                <span className="text-xs text-muted">
                  {tg.protocol}:{tg.port} · {(targetsByGroup[tg.id] ?? []).length} targets
                </span>
              </button>
              {expanded === tg.id && (
                <TargetGroupTargets lbName={lbName} tgId={tg.id} targets={targetsByGroup[tg.id] ?? []} />
              )}
              <div className="mt-2 text-right">
                <Button variant="danger" size="sm" onClick={() => deleteTG.mutate(tg.id)}>
                  Delete group
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TargetGroupTargets({
  lbName,
  tgId,
  targets,
}: {
  lbName: string;
  tgId: string;
  targets: { id: string; address: string }[];
}) {
  const add = useAddLBTarget(lbName, tgId);
  const remove = useRemoveLBTarget(lbName, tgId);
  const [addr, setAddr] = useState("");

  return (
    <div className="mt-3 border-t border-border pt-3">
      <form
        className="mb-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate({ address: addr }, { onSuccess: () => setAddr("") });
        }}
      >
        <input
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
          placeholder="ip:port"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
        />
        <Button type="submit" variant="primary" size="sm">
          Add
        </Button>
      </form>
      <ul className="space-y-1 text-sm font-mono">
        {targets.map((t) => (
          <li key={t.id} className="flex justify-between">
            <span>{t.address}</span>
            <button type="button" className="text-xs text-red-400" onClick={() => remove.mutate(t.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TLSTab({
  lbName,
  listeners,
}: {
  lbName: string;
  listeners: { id: string; protocol: string; port: number; certificateId?: string }[];
}) {
  const { data: certs } = useCertificates();
  const httpsListeners = listeners.filter((l) => l.protocol === "HTTPS" || l.certificateId);
  const eligible = (certs ?? []).filter(
    (c) => c.status === "issued" || c.status === "attached" || c.status === "imported",
  );

  if (!httpsListeners.length) {
    return (
      <EmptyState
        title="No TLS listeners"
        description="Create an HTTPS listener or attach certificates per listener."
      />
    );
  }

  return (
    <div className="space-y-4">
      {httpsListeners.map((l) => (
        <ListenerTLSCard key={l.id} lbName={lbName} listener={l} certs={eligible} />
      ))}
      <p className="text-sm text-muted">
        Issue certificates under{" "}
        <Link to="/certificates/new" className="text-primary hover:underline">
          Certificates
        </Link>
        .
      </p>
    </div>
  );
}

function ListenerTLSCard({
  lbName,
  listener,
  certs,
}: {
  lbName: string;
  listener: { id: string; protocol: string; port: number; certificateId?: string };
  certs: { id: string; name?: string; commonName: string }[];
}) {
  const attach = useAttachListenerCert(lbName, listener.id);
  const detach = useDetachListenerCert(lbName, listener.id);
  const [certId, setCertId] = useState("");

  return (
    <Card>
      <h3 className="font-medium">
        {listener.protocol} :{listener.port}
      </h3>
      <p className="text-sm text-muted">
        {listener.certificateId ? `Certificate: ${listener.certificateId}` : "No certificate attached"}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <select
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
        >
          <option value="">Select…</option>
          {certs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || c.commonName}
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          size="sm"
          disabled={!certId}
          onClick={() =>
            attach.mutate({
              certId,
              hostname: certs.find((c) => c.id === certId)?.commonName,
            })
          }
        >
          Attach
        </Button>
        {listener.certificateId && (
          <Button variant="danger" size="sm" onClick={() => detach.mutate(listener.certificateId!)}>
            Detach
          </Button>
        )}
      </div>
    </Card>
  );
}

function MonitoringTab({ lbName, listenerCount }: { lbName: string; listenerCount: number }) {
  return (
    <Card>
      <p className="text-sm text-muted">
        Load balancer <span className="font-mono text-foreground">{lbName}</span> with{" "}
        {listenerCount} listener{listenerCount === 1 ? "" : "s"}.
      </p>
      <p className="mt-2 text-sm text-muted">
        Per-listener request metrics are collected by the daemon reconcile loop. Detailed charts coming soon.
      </p>
    </Card>
  );
}

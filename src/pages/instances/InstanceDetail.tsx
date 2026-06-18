import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  useInstance,
  useInstanceActions,
  useInstanceEvents,
  useInstanceLogs,
  useInstanceMetadata,
  useLogFollow,
} from "@/api/instances";
import { useVolumes, useNetworks, useAttachNetwork, useDetachNetwork } from "@/api/resources";
import { Button, Card, ConfirmDialog, PageHeader, StatusBadge } from "@/components/common/ui";
import { InstanceTerminal } from "@/components/terminal/InstanceTerminal";

const tabs = ["Overview", "Events", "Logs", "Metrics", "Networking", "Storage", "CapInit", "Security", "Console", "JSON"] as const;

export function InstanceDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useInstance(id);
  const inst = data?.data;
  const caps = data?.capabilities;
  const actions = useInstanceActions(id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [logStream, setLogStream] = useState<"stdout" | "stderr" | "startup-error">("stdout");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [logFollow, setLogFollow] = useState(false);
  const { data: logs } = useInstanceLogs(id, logStream === "startup-error" ? "stdout" : logStream);
  const { text: followText, error: followError } = useLogFollow(id, logStream === "stderr" ? "stderr" : "stdout", logFollow && logStream !== "startup-error");
  const { data: volumes } = useVolumes();
  const { data: events } = useInstanceEvents(id);
  const { data: metadata } = useInstanceMetadata(id);
  const { data: networks } = useNetworks();
  const attachNetwork = useAttachNetwork();
  const detachNetwork = useDetachNetwork();
  const [selectedNetwork, setSelectedNetwork] = useState("");

  const attachedVolumes = (volumes ?? []).filter((v) => v.attachedInstanceId === id);

  const logText = useMemo(() => {
    if (logFollow && logStream !== "startup-error") return followText;
    if (typeof logs === "string") return logs;
    if (logs && typeof logs === "object") {
      if ("stdout" in logs) return (logs as { stdout?: string }).stdout ?? "";
      if ("stderr" in logs) return (logs as { stderr?: string }).stderr ?? "";
      if ("startupError" in logs) return (logs as { startupError?: string }).startupError ?? "";
    }
    return JSON.stringify(logs, null, 2);
  }, [logs, followText, logFollow, logStream]);

  if (isLoading) return <p className="text-muted">Loading...</p>;
  if (!inst) return <p className="text-red-400">Instance not found.</p>;

  return (
    <div>
      <PageHeader
        title={inst.name}
        description={`Instance ${inst.id}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              disabled={!caps?.canStart || inst.status === "running"}
              title="Requires: instance:run"
              onClick={() => actions.start.mutate()}
            >
              Start
            </Button>
            <Button
              disabled={!caps?.canStop || inst.status !== "running"}
              onClick={() => actions.stop.mutate()}
            >
              Stop
            </Button>
            <Button disabled={!caps?.canRestart} onClick={() => actions.restart.mutate()}>
              Restart
            </Button>
            <Button
              variant="danger"
              disabled={!caps?.canDelete}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          </div>
        }
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete instance?"
        description={`Permanently delete ${inst.name}? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          actions.remove.mutate(undefined, { onSuccess: () => navigate("/instances") });
          setConfirmDelete(false);
        }}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t ? "bg-primary/15 text-primary" : "text-muted hover:bg-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <Card className="grid gap-4 md:grid-cols-2">
          <div><span className="text-muted">State</span><div><StatusBadge status={inst.status} /></div></div>
          <div><span className="text-muted">PID</span><div>{inst.pid || "—"}</div></div>
          <div><span className="text-muted">Image</span><div className="font-mono text-sm">{inst.image}</div></div>
          <div><span className="text-muted">Digest</span><div className="truncate font-mono text-xs">{inst.imageDigest}</div></div>
          <div><span className="text-muted">Capsule type</span><div>{inst.capsuleType ?? "default"}</div></div>
          <div><span className="text-muted">Network IP</span><div>{inst.networkIp ?? "none"}</div></div>
          <div><span className="text-muted">Started</span><div>{inst.startedAt ?? "—"}</div></div>
          <div><span className="text-muted">Runtime</span><div>{inst.runtimeMode ?? "—"}</div></div>
        </Card>
      )}

      {tab === "Events" && (
        <Card>
          {!events?.length ? (
            <p className="text-muted">No events recorded for this instance.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {events.map((e) => (
                <li key={e.id} className="rounded-lg border border-border/60 px-3 py-2">
                  <div className="font-mono text-xs text-muted">{e.timestamp}</div>
                  <div>{e.action} · {e.principalId}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "Logs" && (
        <Card>
          <div className="mb-3 flex flex-wrap gap-2">
            {(["stdout", "stderr", "startup-error"] as const).map((s) => (
              <button key={s} onClick={() => setLogStream(s)} className={`rounded px-2 py-1 text-xs ${logStream === s ? "bg-primary/15 text-primary" : "text-muted hover:bg-slate-800"}`}>{s}</button>
            ))}
            {logStream !== "startup-error" && (
              <Button size="sm" variant={logFollow ? "primary" : "default"} onClick={() => setLogFollow((f) => !f)}>
                {logFollow ? "Following" : "Follow"}
              </Button>
            )}
          </div>
          {followError && (
            <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              Log stream error: {followError}
            </p>
          )}
          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap font-mono text-xs text-slate-300">{logText || "(empty)"}</pre>
        </Card>
      )}

      {tab === "Metrics" && (
        <Card className="grid gap-4 md:grid-cols-2">
          <div><span className="text-muted">Memory limit</span><div>{inst.resources?.memoryBytes ? `${Math.round(inst.resources.memoryBytes / 1024 / 1024)} MB` : "—"}</div></div>
          <div><span className="text-muted">Max processes</span><div>{inst.resources?.maxProcesses ?? "—"}</div></div>
          <div><span className="text-muted">CPU time limit</span><div>{inst.resources?.cpuTimeSecs ? `${inst.resources.cpuTimeSecs}s` : "—"}</div></div>
          <div><span className="text-muted">Restart count</span><div>{inst.restartPolicy ?? "—"}</div></div>
        </Card>
      )}

      {tab === "Storage" && (
        <Card>
          {!attachedVolumes.length ? <p className="text-muted">No volumes attached.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted"><th className="p-2">Volume</th><th className="p-2">Mount</th></tr></thead>
              <tbody>
                {attachedVolumes.map((v) => (
                  <tr key={v.id}><td className="p-2">{v.name}</td><td className="p-2 font-mono text-xs">{v.attachedPath ?? "—"}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "Security" && (
        <Card className="space-y-3 text-sm">
          <div><span className="text-muted">Runtime mode</span><div>{inst.runtimeMode ?? "auto"}</div></div>
          <div><span className="text-muted">Image digest</span><div className="font-mono text-xs">{inst.imageDigest}</div></div>
          <div><span className="text-muted">Restart policy</span><div>{inst.restartPolicy ?? "—"}</div></div>
          <p className="text-muted">IAM policy evaluation available via IAM → Simulate.</p>
        </Card>
      )}

      {tab === "Networking" && (
        <div className="space-y-4">
          <Card className="grid gap-4 md:grid-cols-2">
            <div><span className="text-muted">Network ID</span><div>{inst.networkId ?? "none"}</div></div>
            <div><span className="text-muted">IP address</span><div>{inst.networkIp ?? "—"}</div></div>
            <div><span className="text-muted">Hostname</span><div>{inst.hostname ?? "—"}</div></div>
            {inst.status === "running" && inst.networkId && (
              <div className="md:col-span-2">
                <span className="text-xs text-green-400">Hot-attach supported — instance is running</span>
              </div>
            )}
          </Card>
          {!inst.networkId ? (
            <Card>
              <p className="mb-3 text-sm font-medium">Attach to network</p>
              <div className="flex gap-2">
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select network…</option>
                  {(networks ?? []).map((n) => (
                    <option key={n.id} value={n.name}>{n.name} ({n.subnet})</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!selectedNetwork || attachNetwork.isPending}
                  onClick={() => attachNetwork.mutate({ network: selectedNetwork, instance: id })}
                >
                  {attachNetwork.isPending ? "Attaching…" : "Attach"}
                </Button>
              </div>
              {attachNetwork.isError && (
                <p className="mt-2 text-sm text-red-400">{String(attachNetwork.error)}</p>
              )}
            </Card>
          ) : (
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Detach from network</p>
                  <p className="text-xs text-muted">
                    {inst.status === "running"
                      ? "Instance is running — veth will be removed from the live network namespace."
                      : "Instance is stopped — safe to detach."}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={detachNetwork.isPending}
                  onClick={() => detachNetwork.mutate({ network: inst.networkId!, instance: id })}
                >
                  {detachNetwork.isPending ? "Detaching…" : "Detach"}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "CapInit" && (
        <Card>
          {metadata && Object.keys(metadata).length > 0 ? (
            <pre className="overflow-auto font-mono text-xs">{JSON.stringify(metadata, null, 2)}</pre>
          ) : (
            <p className="text-muted">No CapInit user-data metadata configured.</p>
          )}
        </Card>
      )}

      {tab === "Console" && caps?.canConnect && inst.status === "running" && (
        <InstanceTerminal instanceId={id} />
      )}

      {tab === "JSON" && (
        <div className="overflow-hidden rounded-xl border border-border">
          <Editor
            height="480px"
            defaultLanguage="JSON"
            theme="vs-dark"
            value={JSON.stringify(inst, null, 2)}
            options={{ readOnly: true, minimap: { enabled: false } }}
          />
        </div>
      )}

      <Link to="/instances" className="mt-4 inline-block text-sm text-primary hover:underline">
        ← Back to instances
      </Link>
    </div>
  );
}

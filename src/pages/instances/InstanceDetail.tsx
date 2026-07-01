import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
const Link = RouterLink;
import { useQueryClient } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import {
  useInstance,
  useInstanceActions,
  useInstanceEvents,
  useInstanceLogs,
  useInstanceMetadata,
  useLogFollow,
} from "@/api/instances";
import { useVolumes } from "@/api/resources";
import { Button, Card, PageHeader, StatusBadge } from "@/components/common/ui";
import { DeleteResourceModal } from "@/components/DeleteResourceModal";
import { DeletionProgressModal } from "@/components/DeletionProgressModal";
import { useDeletionFlow } from "@/hooks/useDeletionFlow";
import { InstanceTerminal } from "@/components/terminal/InstanceTerminal";
import { InstanceEditForm } from "@/components/InstanceEditForm";

const tabs = ["Overview", "Events", "Logs", "Metrics", "Networking", "Storage", "CapInit", "Security", "Console", "JSON"] as const;

export function InstanceDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useInstance(id);
  const inst = data?.data;
  const caps = data?.capabilities;
  const actions = useInstanceActions(id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [logStream, setLogStream] = useState<"stdout" | "stderr" | "startup-error">("stdout");
  const [logFollow, setLogFollow] = useState(false);
  const { data: logs } = useInstanceLogs(id, logStream === "startup-error" ? "stdout" : logStream);
  const { text: followText, error: followError } = useLogFollow(id, logStream === "stderr" ? "stderr" : "stdout", logFollow && logStream !== "startup-error");
  const { data: volumes } = useVolumes();
  const { data: events } = useInstanceEvents(id);
  const { data: metadata } = useInstanceMetadata(id);
  const deletion = useDeletionFlow({
    onDeletionComplete: () => {
      queryClient.invalidateQueries({ queryKey: ["instances"] });
      queryClient.removeQueries({ queryKey: ["instance", id] });
      navigate("/instances");
    },
  });

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
            <Button disabled={!caps?.canRestart} onClick={() => actions.reboot.mutate()}>
              Reboot
            </Button>
            <Button
              variant="danger"
              disabled={!caps?.canDelete}
              onClick={() => deletion.startDeletion('instance', inst.id, inst.name)}
            >
              Delete
            </Button>
          </div>
        }
      />

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
        <>
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

          <Card>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Safety</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Termination Protection</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${inst.terminationProtection ? "text-green-400" : "text-slate-400"}`}>
                    {inst.terminationProtection ? "Protected" : "Unprotected"}
                  </span>
                  <button
                    onClick={() => {
                      if (inst.terminationProtection) {
                        actions.unprotectTermination.mutate();
                      } else {
                        actions.protectTermination.mutate();
                      }
                    }}
                    disabled={actions.protectTermination.isPending || actions.unprotectTermination.isPending}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      inst.terminationProtection ? "bg-green-600" : "bg-slate-700"
                    } ${actions.protectTermination.isPending || actions.unprotectTermination.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${inst.terminationProtection ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </>
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

      {tab === "Metrics" && <InstanceEditForm instance={inst} />}

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
          <div><span className="text-muted">Key pair</span><div>{inst.keyName ?? "—"}</div></div>
          <div><span className="text-muted">Termination protection</span><div>{inst.terminationProtection ? "enabled" : "disabled"}</div></div>
          <div><span className="text-muted">Shutdown behavior</span><div>{inst.shutdownBehavior ?? "—"}</div></div>
          <div><span className="text-muted">Runtime mode</span><div>{inst.runtimeMode ?? "auto"}</div></div>
          <div><span className="text-muted">Image digest</span><div className="font-mono text-xs">{inst.imageDigest}</div></div>
          <div><span className="text-muted">Security groups</span><div className="font-mono text-xs">{(inst.securityGroupIds ?? []).join(", ") || "—"}</div></div>
        </Card>
      )}

      {tab === "Networking" && (
        <div className="space-y-4">
          <Card className="grid gap-4 md:grid-cols-2">
            <div><span className="text-muted">VPC</span><div className="font-mono text-xs">{inst.vpcId ?? "—"}</div></div>
            <div><span className="text-muted">Subnet</span><div className="font-mono text-xs">{inst.subnetId ?? "—"}</div></div>
            <div><span className="text-muted">Primary ENI</span><div className="font-mono text-xs">{inst.primaryEniId ?? "—"}</div></div>
            <div><span className="text-muted">Private IP</span><div>{inst.privateIpAddress ?? inst.networkIp ?? "—"}</div></div>
            <div><span className="text-muted">Public IP</span><div>{inst.publicIpAddress ?? "—"}</div></div>
            <div><span className="text-muted">Security groups</span><div className="font-mono text-xs">{(inst.securityGroupIds ?? []).join(", ") || "—"}</div></div>
            <div><span className="text-muted">Hostname</span><div>{inst.hostname ?? "—"}</div></div>
          </Card>

          <Card>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Network Interface Attachments</h3>
              <p className="text-xs text-muted">
                Manage additional network interfaces for this instance through the ENI management page.
              </p>
              <Link to="/networks/enis" className="text-primary hover:underline text-sm">
                Go to ENI Management →
              </Link>
            </div>
          </Card>
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

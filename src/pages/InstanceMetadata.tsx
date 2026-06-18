import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useInstance } from "@/api/instances";
import { apiFetch } from "@/api/client";
import { Card, PageHeader } from "@/components/common/ui";
import { Lock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

// The instance metadata record returned by GET /instances/{id}/metadata.
interface MetadataRecord {
  instanceId?: string;
  hostname?: string;
  project?: string;
  labels?: Record<string, string>;
  instanceType?: string;
  networkIp?: string;
  gateway?: string;
  dns?: string;
  userData?: string;
  tokenHash?: string;
  createdAt?: string;
  aiSessionId?: string;
  aiAgentId?: string;
  aiModel?: string;
  aiAssumedRole?: string;
  aiMcpServers?: string[];
  allowedActions?: string[];
  deniedActions?: string[];
  resourceLock?: boolean;
  secretRefs?: { name: string; key?: string; version?: string }[];
}

type MetaTab = "metadata" | "userdata" | "networkdata" | "identity" | "policy" | "secrets";

const TAB_LABELS: { id: MetaTab; label: string }[] = [
  { id: "metadata", label: "Metadata" },
  { id: "userdata", label: "User Data" },
  { id: "networkdata", label: "Network Data" },
  { id: "identity", label: "Identity" },
  { id: "policy", label: "Policy" },
  { id: "secrets", label: "Secret References" },
];

// Derive a tab's view from the real metadata record. Returns null when the
// record has no data for that tab — the UI renders an explicit empty state
// rather than fabricating values.
function tabView(tab: MetaTab, m: MetadataRecord | undefined): unknown | null {
  if (!m) return null;
  switch (tab) {
    case "metadata":
      return {
        instanceId: m.instanceId,
        hostname: m.hostname,
        project: m.project,
        instanceType: m.instanceType,
        labels: m.labels ?? {},
        createdAt: m.createdAt,
      };
    case "userdata":
      return m.userData ? { content: m.userData } : null;
    case "networkdata":
      return m.networkIp || m.gateway || m.dns
        ? { ip: m.networkIp, gateway: m.gateway, dns: m.dns }
        : null;
    case "identity":
      return m.aiSessionId || m.aiAgentId || m.aiAssumedRole || m.tokenHash
        ? {
            instanceId: m.instanceId,
            tokenIssued: !!m.tokenHash,
            aiSessionId: m.aiSessionId,
            aiAgentId: m.aiAgentId,
            aiAssumedRole: m.aiAssumedRole,
            aiModel: m.aiModel,
            aiMcpServers: m.aiMcpServers,
          }
        : null;
    case "policy":
      return m.allowedActions?.length || m.deniedActions?.length || m.resourceLock
        ? {
            allowedActions: m.allowedActions ?? [],
            deniedActions: m.deniedActions ?? [],
            resourceLock: !!m.resourceLock,
          }
        : null;
    case "secrets":
      return m.secretRefs?.length ? { references: m.secretRefs } : null;
    default:
      return null;
  }
}

function useMetadataRecord(instanceId: string) {
  return useQuery({
    queryKey: ["instance-metadata-record", instanceId],
    // 404 => no record yet; surface as null instead of throwing.
    queryFn: () =>
      apiFetch<MetadataRecord>(`/instances/${instanceId}/metadata`).catch(
        (e: { status?: number }) => {
          if (e?.status === 404) return null;
          throw e;
        },
      ),
    enabled: !!instanceId,
  });
}

function useMetadataServiceStatus(instanceId: string) {
  return useQuery({
    queryKey: ["instance-metadata-status", instanceId],
    queryFn: () =>
      apiFetch<{ running: boolean; address: string; tokenState: string; lastFetch?: string }>(
        `/instances/${instanceId}/metadata/status`,
      ).catch((e: { status?: number }) => {
        if (e?.status === 404) return null;
        throw e;
      }),
    enabled: !!instanceId,
  });
}

export function InstanceMetadata() {
  const { id = "" } = useParams();
  const [tab, setTab] = useState<MetaTab>("metadata");
  const { data: instanceData, isLoading: instanceLoading } = useInstance(id);
  const inst = instanceData?.data;
  const { data: status } = useMetadataServiceStatus(id);
  const { data: record, isLoading: recordLoading, isError, error } = useMetadataRecord(id);

  if (instanceLoading) return <p className="text-muted">Loading...</p>;
  if (!inst) return <p className="text-red-400">Instance not found.</p>;

  const hasAiModel = "aiModel" in inst && !!(inst as { aiModel?: unknown }).aiModel;
  const view = tabView(tab, record ?? undefined);

  return (
    <div>
      <PageHeader
        title={`${inst.name} — Metadata`}
        description={`Metadata service for instance ${inst.id}`}
      />

      {hasAiModel && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">Secure AI launch enabled.</span> Required by image
            policy. Cannot disable.
          </span>
        </div>
      )}

      <Card className="mb-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-sm">
        <div>
          <span className="text-muted block text-xs">Service status</span>
          <div className="mt-1 flex items-center gap-1.5">
            {status?.running ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Running</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-400">{status ? "Stopped" : "Unknown"}</span>
              </>
            )}
          </div>
        </div>
        <div>
          <span className="text-muted block text-xs">Address</span>
          <div className="mt-1 font-mono text-xs">{status?.address ?? "—"}</div>
        </div>
        <div>
          <span className="text-muted block text-xs">Token state</span>
          <div className="mt-1 capitalize">{status?.tokenState ?? "—"}</div>
        </div>
        <div>
          <span className="text-muted block text-xs">Last fetch</span>
          <div className="mt-1 font-mono text-xs">
            {status?.lastFetch ? new Date(status.lastFetch).toLocaleString() : "—"}
          </div>
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2">
        {TAB_LABELS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t.id ? "bg-primary/15 text-primary" : "text-muted hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {recordLoading ? (
          <p className="text-muted text-sm">Loading...</p>
        ) : isError ? (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Failed to load metadata: {(error as Error)?.message ?? "unknown error"}
          </div>
        ) : !record ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <AlertTriangle className="h-4 w-4" />
            No metadata record exists for this instance yet.
          </div>
        ) : view === null ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <AlertTriangle className="h-4 w-4" />
            No {TAB_LABELS.find((t) => t.id === tab)?.label.toLowerCase()} available for this
            instance.
          </div>
        ) : (
          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap font-mono text-xs text-slate-300">
            {JSON.stringify(view, null, 2)}
          </pre>
        )}
      </Card>

      <Link
        to={`/instances/${id}`}
        className="mt-4 inline-block text-sm text-primary hover:underline"
      >
        ← Back to instance
      </Link>
    </div>
  );
}

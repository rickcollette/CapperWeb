import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { Button, Card, PageHeader } from "@/components/common/ui";
import type { CapsuleType } from "@/types/capper";
import { Cpu, HardDrive, MemoryStick, Zap } from "lucide-react";

interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  principal: string;
}

function formatGB(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(0)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function useInstanceTypeByName(name: string) {
  return useQuery({
    queryKey: ["capsule-types", name],
    queryFn: async () => {
      try {
        return await apiFetch<CapsuleType>(`/capsule-types/${name}`);
      } catch {
        // Fall back to fetching the list and finding by name
        try {
          const list = await apiFetch<CapsuleType[]>("/capsule-types");
          return list.find((ct) => ct.name === name) ?? null;
        } catch {
          return null;
        }
      }
    },
    enabled: !!name,
  });
}

function useInstanceTypeAuditEvents(name: string) {
  return useQuery({
    queryKey: ["capsule-types-audit", name],
    // Return the real audit events. On error (e.g. 404), surface an empty list
    // rather than fabricating entries — the UI shows an honest "no events" state.
    queryFn: () => apiFetch<AuditEvent[]>(`/capsule-types/${name}/audit`).catch(() => []),
    enabled: !!name,
  });
}

export function InstanceTypeDetail() {
  const { name = "" } = useParams();
  const navigate = useNavigate();
  const { data: instanceType, isLoading } = useInstanceTypeByName(name);
  const { data: auditEvents = [] } = useInstanceTypeAuditEvents(name);

  if (isLoading) return <p className="text-muted">Loading...</p>;
  if (!instanceType)
    return <p className="text-red-400">Instance type &quot;{name}&quot; not found.</p>;

  const storageLabel = instanceType.diskBytes
    ? formatGB(instanceType.diskBytes)
    : "—";

  return (
    <div>
      <PageHeader
        title={instanceType.name}
        description={
          instanceType.description ??
          `${instanceType.family} family instance type`
        }
        actions={
          <Button
            variant="primary"
            onClick={() =>
              navigate(`/instances/new?type=${encodeURIComponent(instanceType.name)}`)
            }
          >
            Launch instance of this type
          </Button>
        }
      />

      {/* Resource envelope */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-start gap-3">
          <Cpu className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs text-muted">CPU</p>
            <p className="text-lg font-semibold">{instanceType.cpuCount}</p>
            <p className="text-xs text-muted">vCPUs</p>
          </div>
        </Card>
        <Card className="flex items-start gap-3">
          <MemoryStick className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs text-muted">Memory</p>
            <p className="text-lg font-semibold">{formatGB(instanceType.memoryBytes)}</p>
            <p className="text-xs text-muted">
              {Math.round(instanceType.memoryBytes / (1024 * 1024))} MiB
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3">
          <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs text-muted">Storage</p>
            <p className="text-lg font-semibold">{storageLabel}</p>
            <p className="text-xs text-muted">GiB envelope</p>
          </div>
        </Card>
        <Card className="flex items-start gap-3">
          <Zap className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />
          <div>
            <p className="text-xs text-muted">GPU</p>
            {instanceType.gpuEligible ? (
              <>
                <p className="text-lg font-semibold text-purple-400">{instanceType.gpuCount}</p>
                <p className="text-xs text-purple-400">GPU eligible</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-muted">0</p>
                <p className="text-xs text-muted">Not eligible</p>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Details card */}
      <Card className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <span className="text-muted">Family</span>
          <div className="mt-0.5 capitalize">{instanceType.family}</div>
        </div>
        <div>
          <span className="text-muted">Availability</span>
          <div className="mt-0.5">
            {instanceType.locked ? (
              <span className="text-amber-400">Locked</span>
            ) : (
              <span className="text-green-400">Available</span>
            )}
          </div>
        </div>
        <div>
          <span className="text-muted">GPU policy</span>
          <div className="mt-0.5">
            {instanceType.gpuEligible ? (
              <span className="text-green-400">Allowed</span>
            ) : (
              <span className="text-muted">Denied</span>
            )}
          </div>
        </div>
        <div>
          <span className="text-muted">Max processes (PID limit)</span>
          <div className="mt-0.5">{instanceType.pidLimit}</div>
        </div>
      </Card>

      {/* Audit events */}
      <Card className="mb-4">
        <h3 className="mb-3 text-sm font-medium">Recent Audit Events</h3>
        {auditEvents.length === 0 ? (
          <p className="text-sm text-muted">No audit events recorded.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-left text-muted">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Principal</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    className="border-b border-border/60 last:border-0 hover:bg-card/50"
                  >
                    <td className="p-3 font-mono text-xs">
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">{ev.action}</td>
                    <td className="p-3">{ev.principal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Link
        to="/instance-types"
        className="mt-2 inline-block text-sm text-primary hover:underline"
      >
        ← Back to instance types
      </Link>
    </div>
  );
}

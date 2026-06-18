import { usePostureFindings, useRunPostureScan } from "@/api/extras";
import type { PostureSeverity } from "@/types/capper";
import { Button, EmptyState, PageHeader } from "@/components/common/ui";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<PostureSeverity, string> = {
  critical: "border-red-500/40 bg-red-500/15 text-red-400",
  high: "border-orange-500/40 bg-orange-500/15 text-orange-400",
  medium: "border-amber-500/40 bg-amber-500/15 text-amber-400",
  low: "border-slate-500/40 bg-slate-500/15 text-slate-400",
};

const SEVERITY_ORDER: PostureSeverity[] = ["critical", "high", "medium", "low"];

function SeverityBadge({ severity }: { severity: PostureSeverity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low,
      )}
    >
      {severity}
    </span>
  );
}

function SeverityRow({ label, count }: { label: string; count: number }) {
  const sev = label.toLowerCase() as PostureSeverity;
  return (
    <div className={cn("rounded-xl border p-4", SEVERITY_STYLES[sev] ?? SEVERITY_STYLES.low)}>
      <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{count}</p>
    </div>
  );
}

export function Posture() {
  const { data, isLoading } = usePostureFindings();
  const scan = useRunPostureScan();

  const counts: Record<PostureSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  data?.forEach((f) => {
    if (f.severity in counts) counts[f.severity]++;
  });

  const sorted = data
    ? [...data].sort(
        (a, b) =>
          SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
      )
    : [];

  return (
    <div>
      <PageHeader
        title="Security Posture"
        description="Runtime security findings from continuous posture scanning."
        actions={
          <Button
            variant="primary"
            disabled={scan.isPending}
            onClick={() => scan.mutate()}
          >
            {scan.isPending ? "Scanning..." : "Run Scan"}
          </Button>
        }
      />

      {scan.isSuccess && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
          Scan triggered. Results will appear shortly.
        </div>
      )}
      {scan.isError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          Scan failed: {String(scan.error)}
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SEVERITY_ORDER.map((s) => (
          <SeverityRow key={s} label={s} count={counts[s]} />
        ))}
      </div>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !data?.length && (
        <EmptyState
          title="No findings"
          description="Run a scan to check for security issues."
        />
      )}
      {!!sorted.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Severity</th>
                <th className="p-3">Type</th>
                <th className="p-3">Detail</th>
                <th className="p-3">Path / PID</th>
                <th className="p-3">Scanned</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => (
                <tr
                  key={f.id}
                  className={cn(
                    "border-b border-border/60",
                    f.severity === "critical" && "bg-red-500/5",
                    f.severity === "high" && "bg-orange-500/5",
                  )}
                >
                  <td className="p-3">
                    <SeverityBadge severity={f.severity} />
                  </td>
                  <td className="p-3 font-medium">{f.type}</td>
                  <td className="p-3 text-muted">{f.detail}</td>
                  <td className="p-3 font-mono text-xs text-muted">
                    {f.path ?? (f.pid ? `PID ${f.pid}` : "—")}
                  </td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(f.scannedAt).toLocaleString()}
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

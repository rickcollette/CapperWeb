import { Link } from "react-router-dom";
import { useFactoryJobs, useFactoryStatus, useFactorySync } from "@/api/resources";
import { Card, PageHeader } from "@/components/common/ui";

const FACTORY_URL = import.meta.env.VITE_FACTORY_URL ?? `${window.location.origin.replace(/:8687$/, ":8080")}`;

export function FactoryDashboard() {
  const { data: status } = useFactoryStatus();
  const { data: sync } = useFactorySync();
  const { data: jobs } = useFactoryJobs();

  return (
    <div>
      <PageHeader
        title="Factory"
        description="Build jobs, scans, and sync with CapsuleBuilder."
        actions={
          <a href={FACTORY_URL} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
            Open CapsuleBuilder →
          </a>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><div className="text-muted">Agent</div><div className="mt-1 capitalize">{status?.connected ? "connected" : "disconnected"}</div></Card>
        <Card><div className="text-muted">Sync</div><div className="mt-1 text-sm">{sync?.lastSync || "never"}</div></Card>
        <Card><div className="text-muted">Artifacts</div><div className="mt-1 text-2xl font-semibold">{sync?.pendingArtifacts ?? 0}</div></Card>
        <Card><div className="text-muted">Failed transfers</div><div className="mt-1 text-2xl font-semibold text-red-400">{sync?.failedTransfers ?? 0}</div></Card>
      </div>
      <p className="mb-4 text-sm text-muted">{sync?.message ?? status?.message}</p>
      <h2 className="mb-3 text-lg font-medium">Jobs</h2>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-card text-left text-muted"><th className="p-3">Job</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {(jobs as { id?: string; status?: string }[] | undefined)?.map((j, i) => (
              <tr key={j.id ?? i} className="border-b border-border/60">
                <td className="p-3 font-mono text-xs">{j.id ?? `job-${i}`}</td>
                <td className="p-3 capitalize">{j.status ?? "unknown"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link to="/images" className="mt-4 inline-block text-sm text-primary hover:underline">View imported images</Link>
    </div>
  );
}

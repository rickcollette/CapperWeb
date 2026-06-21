import { Link } from "react-router-dom";
import { useNetworkingDashboard, useNetworkTopology } from "@/api/vpcnet";
import { useVPCs } from "@/api/topology";
import { Button, Card, PageHeader } from "@/components/common/ui";

export function NetworkingDashboard() {
  const { data: dash, isLoading } = useNetworkingDashboard();
  const { data: topo } = useNetworkTopology();
  const { data: vpcs } = useVPCs();

  return (
    <div>
      <PageHeader
        title="Networking Dashboard"
        description="VPC utilization, drift warnings, and topology overview."
        actions={<Link to="/vpcs"><Button size="sm">Manage VPCs</Button></Link>}
      />

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card><span className="text-muted text-sm">VPCs</span><div className="text-2xl font-semibold">{dash?.vpcCount ?? 0}</div></Card>
          <Card><span className="text-muted text-sm">Subnets</span><div className="text-2xl font-semibold">{dash?.subnetCount ?? 0}</div></Card>
          <Card><span className="text-muted text-sm">Drift warnings</span><div className="text-2xl font-semibold text-amber-400">{dash?.driftWarnings?.length ?? 0}</div></Card>
        </div>
      )}

      {!!vpcs?.length && (
        <Card className="mt-4">
          <h3 className="mb-2 font-medium">VPCs</h3>
          <ul className="space-y-1 text-sm">
            {vpcs.map((v: { id: string; name?: string; slug?: string; cidr?: string; primaryIpv4Cidr?: string }) => (
              <li key={v.id}>
                <Link to={`/vpcs/${v.id || v.slug}`} className="text-primary hover:underline">
                  {v.name || v.slug}
                </Link>
                <span className="ml-2 font-mono text-xs text-muted">{v.cidr || v.primaryIpv4Cidr}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {dash?.driftWarnings?.length ? (
        <Card className="mt-4">
          <h3 className="mb-2 font-medium">Subnet drift</h3>
          <ul className="space-y-1 text-sm font-mono text-muted">
            {dash.driftWarnings.map((d: { resourceId: string; reason?: string }) => (
              <li key={d.resourceId}>{d.resourceId}: {d.reason || "drift detected"}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="mt-4">
        <h3 className="mb-2 font-medium">Topology graph</h3>
        {!topo?.edges?.length ? (
          <p className="text-sm text-muted">No topology edges yet.</p>
        ) : (
          <ul className="max-h-64 overflow-auto text-xs font-mono text-muted">
            {topo.edges.map((e: { from: string; to: string; kind: string }, i: number) => (
              <li key={i}>{e.from} → {e.to} ({e.kind})</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

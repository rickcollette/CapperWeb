import { Link } from "react-router-dom";
import { useVPCs } from "@/api/topology";
import { Button, EmptyState, PageHeader, StatusBadge } from "@/components/common/ui";
import { Network } from "lucide-react";

export function VPCs() {
  const { data: vpcsData, isLoading } = useVPCs();
  const vpcs = vpcsData ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="VPCs"
        description="Virtual private cloud networks for tenant isolation."
        actions={
          <Link to="/vpcs/new">
            <Button>Create VPC</Button>
          </Link>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : vpcs.length === 0 ? (
        <div className="space-y-4 text-center">
          <EmptyState
            title="No VPCs"
            description="Create a VPC to isolate your workloads."
          />
          <Link to="/vpcs/new">
            <Button>Create VPC</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">CIDR</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {vpcs.map((vpc: { id: string; name?: string; slug?: string; cidr?: string; primaryIpv4Cidr?: string; status?: string }) => {
                const ref = vpc.id || vpc.slug;
                const cidr = vpc.cidr || vpc.primaryIpv4Cidr || "—";
                return (
                  <tr key={ref} className="border-b border-border/60 hover:bg-slate-800/30">
                    <td className="p-3">
                      <Link to={`/vpcs/${ref}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                        <Network className="h-4 w-4" />
                        {vpc.name || vpc.slug}
                      </Link>
                    </td>
                    <td className="p-3 font-mono text-xs">{cidr}</td>
                    <td className="p-3">
                      <StatusBadge status={vpc.status || "available"} />
                    </td>
                    <td className="p-3 text-right">
                      <Link to={`/vpcs/${ref}`} className="text-xs text-primary hover:underline">
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

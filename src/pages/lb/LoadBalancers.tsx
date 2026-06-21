import { Link } from "react-router-dom";
import { useLBs } from "@/api/extras";
import { Button, PageHeader, StatusBadge } from "@/components/common/ui";

export function LoadBalancers() {
  const { data, isLoading } = useLBs();

  return (
    <div>
      <PageHeader
        title="Load Balancers"
        description="ELB-style load balancers with listeners, target groups, and VIP placement."
        actions={
          <Link to="/lb/new">
            <Button variant="primary">Create LB</Button>
          </Link>
        }
      />
      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Scheme</th>
                <th className="p-3">VIP</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((lb) => (
                <tr key={lb.id} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3">
                    <Link to={`/lb/${lb.name}`} className="text-primary hover:underline">
                      {lb.name}
                    </Link>
                    <div className="text-xs text-muted">{lb.id}</div>
                  </td>
                  <td className="p-3 capitalize">{lb.scheme ?? "internal"}</td>
                  <td className="p-3 font-mono text-xs">{lb.vipAddress || lb.listenAddr || "—"}</td>
                  <td className="p-3 capitalize">{lb.type ?? lb.mode}</td>
                  <td className="p-3">
                    <StatusBadge status={lb.status} />
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

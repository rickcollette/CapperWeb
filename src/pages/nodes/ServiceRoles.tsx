import { Link } from "react-router-dom";
import { Server } from "lucide-react";
import { useServiceNodes } from "@/api/topology";
import { Card, EmptyState, PageHeader } from "@/components/common/ui";

export function ServiceRoles() {
  const { data, isLoading, error } = useServiceNodes();

  const roles = data ? Object.entries(data) : [];

  return (
    <div>
      <PageHeader
        title="Service Roles"
        description="Nodes grouped by their assigned service roles."
      />

      {isLoading && <p className="text-muted">Loading service roles…</p>}
      {error && <p className="text-red-400">Failed to load service roles.</p>}
      {!isLoading && !roles.length && (
        <EmptyState
          title="No service roles"
          description="Assign roles to nodes to see them here."
        />
      )}
      {!isLoading && !!roles.length && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map(([role, nodes]) => {
            const ready = (nodes as any[]).filter(
              (n) => n.status === "ready",
            ).length;
            return (
              <Card key={role} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2">
                    <Server className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold capitalize">{role}</p>
                    <p className="text-xs text-muted">
                      {ready} / {(nodes as any[]).length} ready
                    </p>
                  </div>
                </div>
                <Link
                  to={`/nodes?role=${encodeURIComponent(role)}`}
                  className="text-sm text-primary hover:underline"
                >
                  View nodes →
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

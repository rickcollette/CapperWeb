import { useState } from "react";
import { useRealms, useRegions, useZones, useNodes, useCordonNode, useUncordonNode, useDrainNode } from "@/api/topology";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/common/ui";
import { Cpu, Globe, MapPin, Server } from "lucide-react";

type Tab = "realms" | "regions" | "zones" | "nodes";

function RealmsTab() {
  const { data: realms = [], isLoading } = useRealms();
  if (isLoading) return <p className="text-sm text-muted">Loading…</p>;
  if (!realms.length) return <EmptyState title="No Realms" description="No realms registered." />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {realms.map((r: any) => (
        <Card key={r.id || r.slug} className="flex items-start gap-3 p-4">
          <Globe className="mt-0.5 h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="font-medium">{r.name || r.slug}</p>
            <p className="text-xs text-muted">{r.description || r.id}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function RegionsTab() {
  const { data: regions = [], isLoading } = useRegions();
  if (isLoading) return <p className="text-sm text-muted">Loading…</p>;
  if (!regions.length) return <EmptyState title="No Regions" description="No regions registered." />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {regions.map((r: any) => (
        <Card key={r.id || r.slug} className="flex items-start gap-3 p-4">
          <MapPin className="mt-0.5 h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="font-medium">{r.name || r.slug}</p>
            <p className="text-xs text-muted">{r.realm || r.id}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ZonesTab() {
  const { data: zones = [], isLoading } = useZones();
  if (isLoading) return <p className="text-sm text-muted">Loading…</p>;
  if (!zones.length) return <EmptyState title="No Zones" description="No zones registered." />;
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-slate-800/50">
          <tr>
            {["Name", "Region", "Status"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {zones.map((z: any) => (
            <tr key={z.id || z.slug} className="hover:bg-slate-800/30">
              <td className="px-4 py-2.5 font-medium">{z.name || z.slug}</td>
              <td className="px-4 py-2.5 text-muted text-xs">{z.region || "—"}</td>
              <td className="px-4 py-2.5"><StatusBadge status={z.status || "active"} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NodesTab() {
  const { data: nodes = [], isLoading } = useNodes();
  const cordon = useCordonNode();
  const uncordon = useUncordonNode();
  const drain = useDrainNode();

  if (isLoading) return <p className="text-sm text-muted">Loading…</p>;
  if (!nodes.length) return <EmptyState title="No Nodes" description="No physical nodes registered." />;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-slate-800/50">
          <tr>
            {["Name", "Zone", "Status", "Cordoned", "Actions"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {nodes.map((n: any) => (
            <tr key={n.id || n.name} className="hover:bg-slate-800/30">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-muted" />
                  <span className="font-medium">{n.name || n.id}</span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-xs text-muted">{n.zone || "—"}</td>
              <td className="px-4 py-2.5"><StatusBadge status={n.status || "unknown"} /></td>
              <td className="px-4 py-2.5 text-xs">{n.cordoned ? "Yes" : "No"}</td>
              <td className="px-4 py-2.5">
                <div className="flex gap-1">
                  {n.cordoned ? (
                    <Button size="sm" variant="ghost" onClick={() => uncordon.mutate(n.name)}>Uncordon</Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => cordon.mutate(n.name)}>Cordon</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => drain.mutate(n.name)}>Drain</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "realms", label: "Realms", icon: Globe },
  { id: "regions", label: "Regions", icon: MapPin },
  { id: "zones", label: "Zones", icon: Cpu },
  { id: "nodes", label: "Nodes", icon: Server },
];

export function Topology() {
  const [tab, setTab] = useState<Tab>("nodes");

  return (
    <div className="space-y-6">
      <PageHeader title="Topology" description="Realms, regions, availability zones, and physical nodes." />

      <div className="flex gap-1 border-b border-border pb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-slate-200"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "realms" && <RealmsTab />}
      {tab === "regions" && <RegionsTab />}
      {tab === "zones" && <ZonesTab />}
      {tab === "nodes" && <NodesTab />}
    </div>
  );
}

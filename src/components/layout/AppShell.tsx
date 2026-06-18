import { Suspense, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import {
  Activity,
  Archive,
  BarChart2,
  Box,
  BrainCircuit,
  Building2,
  Cloud,
  Cpu,
  Database,
  Factory,
  Globe,
  HardDrive,
  HeartPulse,
  Inbox,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lock,
  Map,
  Network,
  Package,
  Route,
  ScanLine,
  ScrollText,
  Search,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DaemonBadge } from "@/components/common/ui";
import { useDaemonStatus, useHealth, useInstances } from "@/api/instances";

import { features, featureEnabled, type FeatureKey } from "@/lib/features";

const MARKETPLACE_ENABLED = features.marketplace;

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  /** When set, the item is shown only if this feature is enabled in the profile. */
  feature?: FeatureKey;
};
type NavSection = { label: string; icon: React.ElementType; items: NavItem[] };

const navSectionsRaw: NavSection[] = [
  {
    label: "Compute",
    icon: Server,
    items: [
      { to: "/instances",     label: "Instances",      icon: Server },
      { to: "/images",        label: "Images",         icon: Package },
      { to: "/capsules",      label: "Capsules",       icon: Box },
      { to: "/instance-types",label: "Instance Types", icon: Cpu },
      { to: "/gpu",           label: "GPU",            icon: Cpu },
      { to: "/groups",        label: "Compute Groups", icon: Users, feature: "computeGroups" },
      { to: "/factory",       label: "Factory",        icon: Factory, feature: "computeGroups" },
      ...(MARKETPLACE_ENABLED ? [{ to: "/marketplace", label: "Marketplace", icon: Cloud }] : []),
    ],
  },
  {
    label: "Network",
    icon: Network,
    items: [
      { to: "/networks",  label: "Networks",       icon: Network },
      { to: "/vpcs",      label: "VPCs",           icon: Network, feature: "vpcs" },
      { to: "/lb",        label: "Load Balancers", icon: Zap },
      { to: "/firewalls", label: "Firewalls",      icon: ShieldCheck },
      { to: "/dns",       label: "DNS",            icon: Globe },
      { to: "/ingress",   label: "Ingress",        icon: Route },
      { to: "/routable-ips", label: "Routable IPs", icon: Globe },
      { to: "/health",    label: "Health",  icon: HeartPulse },
    ],
  },
  {
    label: "Storage",
    icon: HardDrive,
    items: [
      { to: "/storage",   label: "Storage",    icon: HardDrive },
      { to: "/databases", label: "Databases",  icon: Database },
      { to: "/backups",   label: "Backups",    icon: Archive },
    ],
  },
  {
    label: "Platform",
    icon: Sparkles,
    items: [
      { to: "/stacks",  label: "Stacks",    icon: Layers },
      { to: "/capinit", label: "CapInit",   icon: Sparkles },
      { to: "/queues",  label: "Queues",    icon: Inbox },
      { to: "/ai",      label: "AI",        icon: BrainCircuit },
      { to: "/certs",                        label: "Certificates (legacy)", icon: Lock },
      { to: "/certificates",               label: "Certificates",          icon: Lock },
      { to: "/certificates/acme-accounts", label: "ACME Accounts",         icon: ShieldCheck },
      { to: "/certificates/renewal-queue", label: "Renewal Queue",         icon: Archive },
      { to: "/kms",     label: "KMS",       icon: KeyRound },
      { to: "/secrets", label: "Secrets",   icon: KeyRound },
      { to: "/posture", label: "Posture",   icon: ScanLine },
      { to: "/governance", label: "Governance", icon: ShieldCheck, feature: "governance" },
    ],
  },
  {
    label: "Organization",
    icon: Building2,
    items: [
      { to: "/orgs",  label: "Organizations", icon: Building2, feature: "orgs" },
      { to: "/audit", label: "Audit Logs",     icon: ScrollText },
    ],
  },
  {
    label: "Topology",
    icon: Map,
    items: [
      { to: "/topology",          label: "Nodes & Zones",       icon: Map, feature: "topology" },
      { to: "/nodes",             label: "Nodes",               icon: Server, feature: "topology" },
      { to: "/node-pools",        label: "Node Pools",          icon: Layers, feature: "topology" },
      { to: "/nodes/service-roles", label: "Service Roles",     icon: Cpu, feature: "topology" },
      { to: "/nodes/simulator",   label: "Placement Simulator", icon: BarChart2, feature: "topology" },
    ],
  },
  {
    label: "IAM",
    icon: Shield,
    items: [
      { to: "/iam/users",    label: "Users",    icon: Shield },
      { to: "/iam/groups",   label: "Groups",   icon: Shield },
      { to: "/iam/roles",    label: "Roles",    icon: Shield },
      { to: "/iam/policies", label: "Policies", icon: Shield },
      { to: "/iam/simulate", label: "Simulate", icon: Shield },
      { to: "/iam/tokens",   label: "Tokens",   icon: Shield },
      { to: "/audit",        label: "Audit Log",icon: ScrollText },
    ],
  },
  {
    label: "Serverless",
    icon: Zap,
    items: [
      { to: "/functions", label: "Functions",   icon: Zap },
      { to: "/mcp",       label: "MCP Servers",  icon: BrainCircuit },
    ],
  },
  {
    label: "Observability",
    icon: Activity,
    items: [
      { to: "/resources",      label: "Resources", icon: BarChart2 },
      { to: "/observe/alerts", label: "Alerts",    icon: Activity },
    ],
  },
  {
    label: "System",
    icon: Settings,
    items: [
      { to: "/quotas",   label: "Quotas",   icon: BarChart2 },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

// Resolve the active deployment profile: drop feature-gated items, then any
// section left empty (e.g. the whole Topology section under the AIO profile).
const navSections: NavSection[] = navSectionsRaw
  .map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.feature || featureEnabled(item.feature)),
  }))
  .filter((section) => section.items.length > 0);

function NavSection({ section, defaultOpen = false }: { section: NavSection; defaultOpen?: boolean }) {
  const location = useLocation();
  const isActive = section.items.some((item) => {
    if (item.end) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  });
  const [open, setOpen] = useState(defaultOpen || isActive);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition",
          isActive ? "text-primary" : "text-slate-500 hover:text-slate-300",
        )}
      >
        <div className="flex items-center gap-2">
          <section.icon className="h-3.5 w-3.5" />
          {section.label}
        </div>
        <span className={cn("transition-transform", open ? "rotate-90" : "")}>›</span>
      </button>
      {open && (
        <div className="mt-0.5 ml-2 space-y-0.5 border-l border-border/40 pl-3">
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
                  isActive ? "bg-primary/10 text-primary" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
                )
              }
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchBar() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
        <Search className="h-3.5 w-3.5 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="w-40 bg-transparent outline-none placeholder:text-muted"
        />
      </div>
    </form>
  );
}

function RouteErrorBoundary() {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <Suspense fallback={<div className="flex h-48 items-center justify-center text-sm text-muted">Loading…</div>}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
}

export function AppShell() {
  const { data: health } = useHealth();
  const { data: daemon } = useDaemonStatus();
  const { data: instances } = useInstances();
  const failed = instances?.filter((i) => i.status === "failed").length ?? 0;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-[#080a0f]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-wide">Capper</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition mb-1",
                isActive ? "bg-primary/10 text-primary" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
              )
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>
          {navSections.map((section) => (
            <NavSection key={section.label} section={section} />
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-slate-900/60 px-6 py-3 backdrop-blur">
          <div className="text-sm text-muted">Control Plane · default project</div>
          <SearchBar />
          <div className="flex items-center gap-4">
            {failed > 0 && <span className="text-xs text-red-400">{failed} failed instance(s)</span>}
            <DaemonBadge online={daemon?.online} status={daemon?.status} />
            <span className="text-xs text-muted">API {health?.status === "ok" ? "healthy" : "unknown"}</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <RouteErrorBoundary />
        </main>
      </div>
    </div>
  );
}

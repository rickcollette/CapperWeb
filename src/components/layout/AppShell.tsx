import { Suspense, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import {
  Activity,
  Archive,
  Ban,
  BarChart2,
  Box,
  BrainCircuit,
  Building2,
  Cloud,
  Cpu,
  Database,
  Factory,
  Flame,
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
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DaemonBadge } from "@/components/common/ui";
import { useDaemonStatus, useHealth, useInstances, useVersion } from "@/api/instances";
import { useCurrentUser } from "@/api/access";
import { ApiError, apiFetch, isPendingError, setCsrfToken } from "@/api/client";
import { Login } from "@/pages/Login";
import { ChangePasswordForm } from "@/pages/account/ChangePasswordForm";

import { consoleVersion, features, featureEnabled, type FeatureKey } from "@/lib/features";

const MARKETPLACE_ENABLED = features.marketplace;

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  /** When set, NavLink is active for any path under this prefix (e.g. /iam). */
  matchPrefix?: string;
  /** When set, the item is shown only if this feature is enabled in the profile. */
  feature?: FeatureKey;
};
type NavSection = {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  /** When set, the whole section is shown only to platform admins. */
  adminOnly?: boolean;
};

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
      { to: "/networking", label: "Networking",     icon: Network, feature: "vpcs" },
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
      { to: "/backups",   label: "Backups",    icon: Archive },
    ],
  },
  {
    label: "Databases",
    icon: Database,
    items: [
      { to: "/databases",          label: "All Databases", icon: Database },
      { to: "/databases/postgres", label: "PostgreSQL",    icon: Database },
      { to: "/databases/mariadb",  label: "MariaDB",       icon: Database },
      { to: "/databases/redis",    label: "Redis",         icon: Database },
      { to: "/databases/capdb",    label: "CapDB",         icon: Database },
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
      { to: "/iam/users", label: "Users & Access", icon: Shield, matchPrefix: "/iam" },
      { to: "/audit",        label: "Audit Log", icon: ScrollText },
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
  {
    label: "Admin",
    icon: ShieldAlert,
    adminOnly: true,
    items: [
      { to: "/routable-ips",        label: "Routable IPs",   icon: Globe },
      { to: "/admin/ip-exclusions", label: "IP Exclusions",  icon: Lock },
      { to: "/admin/local-users",   label: "Local Users",    icon: Users },
      { to: "/admin/limits",        label: "Limits",         icon: BarChart2 },
      { to: "/admin/storage",       label: "Storage",        icon: HardDrive },
      { to: "/admin/fail2ban",      label: "Fail2ban",       icon: Ban },
      { to: "/admin/firewall",      label: "Firewall (UFW)", icon: Flame },
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
    if (item.matchPrefix) return location.pathname.startsWith(item.matchPrefix);
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
              className={({ isActive }) => {
                const active = item.matchPrefix
                  ? location.pathname.startsWith(item.matchPrefix)
                  : isActive;
                return cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
                  active ? "bg-primary/10 text-primary" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
                );
              }}
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

// SignOut clears the capper session, and for Google sessions also clears the
// oauth2-proxy session, then returns to the login screen.
function SignOut({ provider }: { provider?: string }) {
  async function onClick() {
    try {
      await apiFetch("/auth/session", { method: "DELETE" });
    } catch {
      /* ignore — clear client state regardless */
    }
    setCsrfToken(null);
    if (provider === "google") {
      window.location.href = "/oauth2/sign_out?rd=%2F";
    } else {
      window.location.assign("/");
    }
  }
  return (
    <button onClick={onClick} className="text-xs text-muted hover:text-primary" title="Sign out">
      Sign out
    </button>
  );
}

function AwaitingApproval() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="mb-2 text-lg font-semibold">Awaiting approval</h1>
        <p className="text-sm text-muted">
          Your account has been created and is pending approval by an administrator.
          You’ll have access once an admin approves your request.
        </p>
        <div className="mt-4">
          <a href="/oauth2/sign_out?rd=%2F" className="text-sm text-primary hover:underline">
            Sign out
          </a>
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  const { data: me, error: meError, isLoading: meLoading } = useCurrentUser();

  // No session → show the public login screen (Google + username/password).
  const unauthorized = meError instanceof ApiError && meError.status === 401;
  if (unauthorized) {
    return <Login />;
  }
  // A signed-in SSO user awaiting approval (or disabled) is gated out.
  if (isPendingError(meError)) {
    return <AwaitingApproval />;
  }
  if (meLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted">Loading…</div>;
  }
  // Admin-provisioned/reset local users must set a new password before access.
  if (me?.user?.mustChangePassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-center text-lg font-semibold">Set a new password</h1>
          <p className="mb-4 text-center text-xs text-muted">
            Your account requires a new password before you can continue.
          </p>
          <ChangePasswordForm forced />
        </div>
      </div>
    );
  }

  return <AppShellInner me={me} />;
}

function AppShellInner({ me }: { me: ReturnType<typeof useCurrentUser>["data"] }) {
  const { data: health } = useHealth();
  const { data: versionInfo } = useVersion();
  const { data: daemon } = useDaemonStatus();
  const { data: instances } = useInstances();
  const failed = instances?.filter((i) => i.status === "failed").length ?? 0;
  const versionLabel = versionInfo?.version ?? consoleVersion;

  // Admin-only sections (e.g. the Admin area) are hidden from non-admins.
  const isAdmin = me?.isAdmin ?? me?.roles?.includes("admin") ?? false;
  const visibleSections = navSections.filter((s) => !s.adminOnly || isAdmin);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-[#080a0f]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Activity className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 leading-tight">
            <div className="font-semibold tracking-wide">Capper</div>
            <div className="text-[10px] text-muted">v{versionLabel}</div>
          </div>
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
          {visibleSections.map((section) => (
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
            <NavLink to="/account" className="text-xs text-muted hover:text-primary">
              {me?.user?.email || me?.user?.name || "Account"}
            </NavLink>
            <SignOut provider={me?.user?.provider} />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <RouteErrorBoundary />
        </main>
      </div>
    </div>
  );
}

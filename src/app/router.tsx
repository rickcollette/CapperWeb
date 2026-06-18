import { lazy } from "react";
import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { features, type FeatureKey } from "@/lib/features";

const MARKETPLACE_ENABLED = features.marketplace;

// Gate a route element behind a feature flag: disabled features redirect to "/".
function gated(key: FeatureKey, element: RouteObject["element"]): RouteObject["element"] {
  return features[key] ? element : <Navigate to="/" replace />;
}

// Helper: wrap a named export as a default for React.lazy
function named<T extends Record<string, unknown>>(
  factory: () => Promise<T>,
  exportName: keyof T,
) {
  return () => factory().then((m) => ({ default: m[exportName] as React.ComponentType }));
}

// ── Page imports (each becomes its own async chunk) ────────────────────────

const Dashboard        = lazy(named(() => import("@/pages/Dashboard"), "Dashboard"));
const Account          = lazy(named(() => import("@/pages/Account"), "Account"));
const InstanceList     = lazy(named(() => import("@/pages/instances/InstanceList"), "InstanceList"));
const InstanceDetail   = lazy(named(() => import("@/pages/instances/InstanceDetail"), "InstanceDetail"));
const CreateInstance   = lazy(named(() => import("@/pages/instances/CreateInstance"), "CreateInstance"));
const ImageList        = lazy(named(() => import("@/pages/images/ImageList"), "ImageList"));
const ImageDetail      = lazy(named(() => import("@/pages/images/ImageDetail"), "ImageDetail"));
const NetworkList      = lazy(named(() => import("@/pages/networks/NetworkList"), "NetworkList"));
const NetworkDetail    = lazy(named(() => import("@/pages/networks/NetworkList"), "NetworkDetail"));
const StorageDashboard = lazy(named(() => import("@/pages/storage/StorageDashboard"), "StorageDashboard"));
const BucketDetail     = lazy(named(() => import("@/pages/storage/BucketDetail"), "BucketDetail"));
const DNSZones         = lazy(named(() => import("@/pages/dns/DNSZones"), "DNSZones"));
const ZoneDetail       = lazy(named(() => import("@/pages/dns/DNSZones"), "ZoneDetail"));
const CapInitDashboard = lazy(named(() => import("@/pages/capinit/CapInitDashboard"), "CapInitDashboard"));
const CapsuleRegistry  = lazy(named(() => import("@/pages/capsules/CapsuleRegistry"), "CapsuleRegistry"));
const AccessRequests   = lazy(named(() => import("@/pages/iam/AccessRequests"), "AccessRequests"));
const Users            = lazy(named(() => import("@/pages/iam/Users"), "Users"));
const Groups           = lazy(named(() => import("@/pages/iam/Groups"), "Groups"));
const Roles            = lazy(named(() => import("@/pages/iam/Roles"), "Roles"));
const Policies         = lazy(named(() => import("@/pages/iam/IAMPages"), "Policies"));
const Simulate         = lazy(named(() => import("@/pages/iam/IAMPages"), "Simulate"));
const Tokens           = lazy(named(() => import("@/pages/iam/IAMPages"), "Tokens"));
const AuditLog         = lazy(named(() => import("@/pages/settings/AuditLog"), "AuditLog"));
const Settings         = lazy(named(() => import("@/pages/settings/Settings"), "Settings"));
const Marketplace      = lazy(named(() => import("@/pages/marketplace/Marketplace"), "Marketplace"));
const FactoryDashboard = lazy(named(() => import("@/pages/factory/FactoryDashboard"), "FactoryDashboard"));
const LoadBalancers    = lazy(named(() => import("@/pages/lb/LoadBalancers"), "LoadBalancers"));
const LBDetail         = lazy(named(() => import("@/pages/lb/LoadBalancers"), "LBDetail"));
const Firewalls        = lazy(named(() => import("@/pages/firewalls/Firewalls"), "Firewalls"));
const HealthChecks     = lazy(named(() => import("@/pages/health/HealthChecks"), "HealthChecks"));
const Stacks           = lazy(named(() => import("@/pages/stacks/Stacks"), "Stacks"));
const StackDetail      = lazy(named(() => import("@/pages/stacks/Stacks"), "StackDetail"));
const Databases        = lazy(named(() => import("@/pages/databases/Databases"), "Databases"));
const AIControlPlane   = lazy(named(() => import("@/pages/ai/AIControlPlane"), "AIControlPlane"));
const Backups          = lazy(named(() => import("@/pages/backups/Backups"), "Backups"));
const InstanceTypes    = lazy(named(() => import("@/pages/instance-types/InstanceTypes"), "InstanceTypes"));
const InstanceTypeDetail = lazy(named(() => import("@/pages/InstanceTypeDetail"), "InstanceTypeDetail"));
const Quotas           = lazy(named(() => import("@/pages/quotas/Quotas"), "Quotas"));
const Posture          = lazy(named(() => import("@/pages/posture/Posture"), "Posture"));
const InstanceMetadata = lazy(named(() => import("@/pages/InstanceMetadata"), "InstanceMetadata"));
const MarketplaceReview = lazy(named(() => import("@/pages/MarketplaceReview"), "MarketplaceReview"));
const GPUInventory     = lazy(named(() => import("@/pages/GPUInventory"), "GPUInventory"));
const Certificates     = lazy(named(() => import("@/pages/certs/Certificates"), "Certificates"));
const Ingress          = lazy(named(() => import("@/pages/ingress/Ingress"), "Ingress"));
const Queues           = lazy(named(() => import("@/pages/queues/Queues"), "Queues"));
const Search           = lazy(named(() => import("@/pages/search/Search"), "Search"));
const VPCs             = lazy(named(() => import("@/pages/vpcs/VPCs"), "VPCs"));
const KMS              = lazy(named(() => import("@/pages/kms/KMS"), "KMS"));
const Topology         = lazy(named(() => import("@/pages/topology/Topology"), "Topology"));
const ComputeGroups    = lazy(named(() => import("@/pages/groups/ComputeGroups"), "ComputeGroups"));

// ── New pages ──────────────────────────────────────────────────────────────

// Organizations
const Organizations    = lazy(named(() => import("@/pages/org/Organizations"), "Organizations"));
const OrgDetail        = lazy(named(() => import("@/pages/org/OrgDetail"), "OrgDetail"));
const AccountDetail    = lazy(named(() => import("@/pages/org/AccountDetail"), "AccountDetail"));

// Nodes
const NodeList            = lazy(named(() => import("@/pages/nodes/NodeList"), "NodeList"));
const NodeDetail          = lazy(named(() => import("@/pages/nodes/NodeDetail"), "NodeDetail"));
const NodePools           = lazy(named(() => import("@/pages/nodes/NodePools"), "NodePools"));
const ServiceRoles        = lazy(named(() => import("@/pages/nodes/ServiceRoles"), "ServiceRoles"));
const PlacementSimulator  = lazy(named(() => import("@/pages/nodes/PlacementSimulator"), "PlacementSimulator"));

// Certificate Manager
const CertificateList  = lazy(named(() => import("@/pages/certificates/CertificateList"), "CertificateList"));
const CertificateDetail = lazy(named(() => import("@/pages/certificates/CertificateDetail"), "CertificateDetail"));
const CertificateNew   = lazy(named(() => import("@/pages/certificates/CertificateNew"), "CertificateNew"));
const ACMEAccountList  = lazy(named(() => import("@/pages/certificates/ACMEAccountList"), "ACMEAccountList"));
const RenewalQueue     = lazy(named(() => import("@/pages/certificates/RenewalQueue"), "RenewalQueue"));

// VPC Mobility
const VPCMobility      = lazy(named(() => import("@/pages/vpcs/VPCMobility"), "VPCMobility"));
const VPCJobDetail     = lazy(named(() => import("@/pages/vpcs/VPCJobDetail"), "VPCJobDetail"));

// Resource Monitor (capper-observe)
const Resources        = lazy(named(() => import("@/pages/observe/Resources"), "Resources"));
const ObserveAlerts    = lazy(named(() => import("@/pages/observe/Alerts"), "Alerts"));

// Serverless
const Functions        = lazy(named(() => import("@/pages/serverless/Functions"), "Functions"));
const MCPServers       = lazy(named(() => import("@/pages/serverless/MCPServers"), "MCPServers"));

// Public IPAM
const RoutableIPs      = lazy(named(() => import("@/pages/ipam/RoutableIPs"), "RoutableIPs"));

// Secrets + Governance
const Secrets          = lazy(named(() => import("@/pages/secrets/Secrets"), "Secrets"));
const Governance       = lazy(named(() => import("@/pages/governance/Governance"), "Governance"));

// ── Router ─────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true,                       element: <Dashboard /> },
      { path: "instances",                 element: <InstanceList /> },
      { path: "instances/new",             element: <CreateInstance /> },
      { path: "instances/:id",             element: <InstanceDetail /> },
      { path: "instances/:id/metadata",    element: <InstanceMetadata /> },
      { path: "images",                    element: <ImageList /> },
      { path: "images/:name",              element: <ImageDetail /> },
      { path: "capsules",                  element: <CapsuleRegistry /> },
      { path: "marketplace",               element: MARKETPLACE_ENABLED ? <Marketplace /> : <Navigate to="/" replace /> },
      { path: "marketplace/review/:id",    element: MARKETPLACE_ENABLED ? <MarketplaceReview /> : <Navigate to="/" replace /> },
      { path: "factory",                   element: gated("computeGroups", <FactoryDashboard />) },
      { path: "networks",                  element: <NetworkList /> },
      { path: "networks/:name",            element: <NetworkDetail /> },
      { path: "storage",                   element: <StorageDashboard /> },
      { path: "storage/buckets/:bucket",   element: <BucketDetail /> },
      { path: "dns",                       element: <DNSZones /> },
      { path: "dns/:zone",                 element: <ZoneDetail /> },
      { path: "capinit",                   element: <CapInitDashboard /> },
      { path: "account",                   element: <Account /> },
      { path: "iam/access",                element: <AccessRequests /> },
      { path: "iam/users",                 element: <Users /> },
      { path: "iam/groups",                element: <Groups /> },
      { path: "iam/roles",                 element: <Roles /> },
      { path: "iam/policies",              element: <Policies /> },
      { path: "iam/simulate",              element: <Simulate /> },
      { path: "iam/tokens",                element: <Tokens /> },
      { path: "audit",                     element: <AuditLog /> },
      { path: "settings",                  element: <Settings /> },
      { path: "lb",                        element: <LoadBalancers /> },
      { path: "lb/:name",                  element: <LBDetail /> },
      { path: "firewalls",                 element: <Firewalls /> },
      { path: "health",                    element: <HealthChecks /> },
      { path: "stacks",                    element: <Stacks /> },
      { path: "stacks/:name",              element: <StackDetail /> },
      { path: "databases",                 element: <Databases /> },
      { path: "databases/:engine",         element: <Databases /> },
      { path: "ai",                        element: <AIControlPlane /> },
      { path: "backups",                   element: <Backups /> },
      { path: "instance-types",            element: <InstanceTypes /> },
      { path: "instance-types/:name",      element: <InstanceTypeDetail /> },
      { path: "quotas",                    element: <Quotas /> },
      { path: "posture",                   element: <Posture /> },
      { path: "gpu",                       element: <GPUInventory /> },
      { path: "certs",                     element: <Certificates /> },
      { path: "ingress",                   element: <Ingress /> },
      { path: "queues",                    element: <Queues /> },
      { path: "search",                    element: <Search /> },
      { path: "vpcs",                      element: gated("vpcs", <VPCs />) },
      { path: "kms",                       element: <KMS /> },
      { path: "topology",                  element: gated("topology", <Topology />) },
      { path: "groups",                    element: gated("computeGroups", <ComputeGroups />) },

      // Resource Monitor (capper-observe)
      { path: "resources",                 element: <Resources /> },
      { path: "observe/alerts",            element: <ObserveAlerts /> },

      // Serverless
      { path: "functions",                 element: <Functions /> },
      { path: "mcp",                       element: <MCPServers /> },

      // Public IPAM
      { path: "routable-ips",              element: <RoutableIPs /> },

      // Secrets + Governance
      { path: "secrets",                   element: <Secrets /> },
      { path: "governance",                element: gated("governance", <Governance />) },

      // Organizations
      { path: "orgs",                      element: gated("orgs", <Organizations />) },
      { path: "orgs/:orgId",               element: gated("orgs", <OrgDetail />) },
      { path: "orgs/:orgId/accounts/:accountId", element: gated("orgs", <AccountDetail />) },

      // Nodes
      { path: "nodes",                     element: gated("topology", <NodeList />) },
      { path: "nodes/service-roles",       element: gated("topology", <ServiceRoles />) },
      { path: "nodes/simulator",           element: gated("topology", <PlacementSimulator />) },
      { path: "nodes/:nodeName",           element: gated("topology", <NodeDetail />) },
      { path: "node-pools",                element: gated("topology", <NodePools />) },

      // Certificate Manager
      { path: "certificates",              element: <CertificateList /> },
      { path: "certificates/new",          element: <CertificateNew /> },
      { path: "certificates/acme-accounts", element: <ACMEAccountList /> },
      { path: "certificates/renewal-queue", element: <RenewalQueue /> },
      { path: "certificates/:id",          element: <CertificateDetail /> },

      // VPC Mobility
      { path: "vpcs/:vpcId/mobility",      element: gated("vpcMobility", <VPCMobility />) },
      { path: "vpcs/:vpcId/mobility/jobs/:jobId", element: gated("vpcMobility", <VPCJobDetail />) },

      { path: "*",                         element: <Navigate to="/" replace /> },
    ],
  },
]);

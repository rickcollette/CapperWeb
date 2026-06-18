// Deployment-profile feature flags (build-time).
//
// The console ships in two profiles, selected by VITE_PROFILE at build time:
//   - "full" (default) — the complete control plane.
//   - "aio"            — single-node all-in-one. Cluster / multi-server features
//                        that have no backing service on one box are hidden so
//                        the UI never offers actions that can't work.
//
// build-aio.sh sets VITE_PROFILE=aio when packaging the AIO bundle.
const profile = (import.meta.env.VITE_PROFILE as string | undefined) ?? "full";
const isAIO = profile === "aio";

/** Build-stamped console version (VITE_CAPPER_VERSION), matching the binaries. */
export const consoleVersion =
  (import.meta.env.VITE_CAPPER_VERSION as string | undefined) ?? "dev";

// Marketplace keeps its existing independent flag; the AIO profile also hides it.
const marketplaceEnabled =
  import.meta.env.VITE_MARKETPLACE_ENABLED !== "false" && !isAIO;

/**
 * Feature switches resolved from the active deployment profile. Anything `false`
 * is hidden from the nav and its routes redirect to "/".
 */
export const features = {
  profile,
  isAIO,
  /** Nodes & Zones, Node Pools, Service Roles, Placement Simulator — multi-node. */
  topology: !isAIO,
  /** Compute Groups + Factory (fleet provisioning) — assume a fleet to scale. */
  computeGroups: !isAIO,
  /** VPCs — available single-node; only multi-zone mobility is cluster-only. */
  vpcs: true,
  /** VPC Mobility — cross-node/multi-zone migration; needs a fleet. */
  vpcMobility: !isAIO,
  /** Marketplace. */
  marketplace: marketplaceEnabled,
  /** Organizations — multi-tenant control surface. */
  orgs: !isAIO,
  /** Governance — multi-tenant policy surface. */
  governance: !isAIO,
} as const;

export type FeatureKey = keyof typeof features;

/** True when the named feature is enabled in the active profile. */
export function featureEnabled(key: FeatureKey): boolean {
  return Boolean(features[key]);
}

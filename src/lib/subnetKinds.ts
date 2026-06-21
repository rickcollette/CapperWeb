import type { Subnet, SubnetKind } from "@/types/capper";

export type SubnetPurpose = "launch" | "lb" | "lb-internal" | "nat";

const LAUNCH_KINDS = new Set<SubnetKind>(["private", "public"]);
const LB_EXTERNAL_KINDS = new Set<SubnetKind>(["public", "edge", "lb"]);
const LB_INTERNAL_KINDS = new Set<SubnetKind>(["private", "service", "lb"]);
const NAT_KINDS = new Set<SubnetKind>(["public"]);

export function subnetKind(sub: Subnet): SubnetKind {
  return (sub.kind || sub.subnetType || "private") as SubnetKind;
}

export function filterSubnetsForScheme(
  subnets: Subnet[] | undefined,
  scheme: "internal" | "internet-facing",
): Subnet[] {
  if (!subnets?.length) return [];
  const allowed = scheme === "internet-facing" ? LB_EXTERNAL_KINDS : LB_INTERNAL_KINDS;
  const filtered = subnets.filter((s) => allowed.has(subnetKind(s)));
  return filtered.length ? filtered : subnets;
}

export function filterSubnetsForPurpose(subnets: Subnet[] | undefined, purpose: SubnetPurpose): Subnet[] {
  if (!subnets?.length) return [];
  const map: Record<SubnetPurpose, Set<SubnetKind>> = {
    launch: LAUNCH_KINDS,
    lb: LB_EXTERNAL_KINDS,
    "lb-internal": LB_INTERNAL_KINDS,
    nat: NAT_KINDS,
  };
  const allowed = map[purpose];
  const filtered = subnets.filter((s) => allowed.has(subnetKind(s)));
  return filtered.length ? filtered : subnets;
}

export const SUBNET_KIND_OPTIONS: { value: SubnetKind; label: string }[] = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
  { value: "edge", label: "Edge" },
  { value: "lb", label: "Load Balancer" },
  { value: "service", label: "Service" },
];

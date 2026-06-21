import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { SubnetDependencies, VPCDependencies, VPCDetail } from "@/types/capper";
import type { SubnetPurpose } from "@/lib/subnetKinds";

function invalidateVpc(qc: ReturnType<typeof useQueryClient>, vpcRef: string) {
  qc.invalidateQueries({ queryKey: ["vpcs"] });
  qc.invalidateQueries({ queryKey: ["vpcs", vpcRef] });
  qc.invalidateQueries({ queryKey: ["vpcs", vpcRef, "detail"] });
  qc.invalidateQueries({ queryKey: ["vpcs", vpcRef, "summary"] });
  qc.invalidateQueries({ queryKey: ["vpcs", vpcRef, "subnets"] });
  qc.invalidateQueries({ queryKey: ["route-tables", vpcRef] });
  qc.invalidateQueries({ queryKey: ["security-groups", vpcRef] });
  qc.invalidateQueries({ queryKey: ["network-acls", vpcRef] });
  qc.invalidateQueries({ queryKey: ["internet-gateways", vpcRef] });
  qc.invalidateQueries({ queryKey: ["nat-gateways", vpcRef] });
}

// ─── VPCs ──────────────────────────────────────────────────────────────────

export function useVPCs() {
  return useQuery({ queryKey: ["vpcs"], queryFn: () => apiFetch<any[]>("/vpcs") });
}

export function useVPCDetail(vpcRef: string) {
  return useQuery({
    queryKey: ["vpcs", vpcRef, "detail"],
    queryFn: () => apiFetch<VPCDetail>(`/vpcs/${vpcRef}/detail`),
    enabled: !!vpcRef,
  });
}

export function useVPCDependencies(vpcRef: string) {
  return useQuery({
    queryKey: ["vpcs", vpcRef, "dependencies"],
    queryFn: () => apiFetch<VPCDependencies>(`/vpcs/${vpcRef}/dependencies`),
    enabled: !!vpcRef,
  });
}

export function useSubnetDependencies(subnetId: string) {
  return useQuery({
    queryKey: ["subnets", subnetId, "dependencies"],
    queryFn: () => apiFetch<SubnetDependencies>(`/subnets/${subnetId}/dependencies`),
    enabled: !!subnetId,
  });
}

export interface CreateVPCBody {
  name: string;
  slug?: string;
  cidr: string;
  description?: string;
  dnsDomain?: string;
  enableFlowLogs?: boolean;
  attachInternetGateway?: boolean;
  initialSubnets?: Array<{
    name: string;
    cidr: string;
    kind?: string;
    zoneId?: string;
    autoAssignPublicIp?: boolean;
  }>;
  natGateway?: { subnetId?: string; subnetCidr?: string; name?: string; publicIp?: string };
}

export function useCreateVPC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateVPCBody) =>
      apiFetch<VPCDetail>("/vpcs", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["vpcs"] });
      if (data?.vpc?.id) invalidateVpc(qc, data.vpc.id);
      if (data?.vpc?.slug) invalidateVpc(qc, data.vpc.slug);
    },
  });
}

export function usePatchVPC(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch(`/vpcs/${vpcRef}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => invalidateVpc(qc, vpcRef),
  });
}

export function useDeleteVPC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => apiFetch(`/vpcs/${slug}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vpcs"] }),
  });
}

export function useVPCSubnets(vpcSlug: string, purpose?: SubnetPurpose) {
  const qs = purpose ? `?purpose=${encodeURIComponent(purpose)}` : "";
  return useQuery({
    queryKey: ["vpcs", vpcSlug, "subnets", purpose ?? "all"],
    queryFn: () => apiFetch<any[]>(`/vpcs/${vpcSlug}/subnets${qs}`),
    enabled: !!vpcSlug,
  });
}

export function useCreateVPCSubnet(vpcSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      apiFetch(`/vpcs/${vpcSlug}/subnets`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateVpc(qc, vpcSlug),
  });
}

export function useDeleteSubnet(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subnetId: string) => apiFetch(`/subnets/${subnetId}`, { method: "DELETE" }),
    onSuccess: () => invalidateVpc(qc, vpcRef),
  });
}

export function useVPCRoutes(vpcSlug: string) {
  return useQuery({
    queryKey: ["vpcs", vpcSlug, "routes"],
    queryFn: () => apiFetch<any[]>(`/vpcs/${vpcSlug}/routes`),
    enabled: !!vpcSlug,
  });
}

export function useCreateVPCRoute(vpcSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      apiFetch(`/vpcs/${vpcSlug}/routes`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vpcs", vpcSlug, "routes"] }),
  });
}

// ─── KMS ───────────────────────────────────────────────────────────────────

export function useKMSKeys() {
  return useQuery({ queryKey: ["kms-keys"], queryFn: () => apiFetch<any[]>("/kms/keys") });
}

export function useCreateKMSKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; algorithm?: string }) =>
      apiFetch("/kms/keys", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kms-keys"] }),
  });
}

export function useRotateKMSKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiFetch(`/kms/keys/${name}/rotate`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kms-keys"] }),
  });
}

export function useKMSEncrypt() {
  return useMutation({
    mutationFn: ({ name, plaintext }: { name: string; plaintext: string }) =>
      apiFetch<{ ciphertext: string }>(`/kms/keys/${name}/encrypt`, {
        method: "POST",
        body: JSON.stringify({ plaintext }),
      }),
  });
}

export function useKMSDecrypt() {
  return useMutation({
    mutationFn: ({ name, ciphertext }: { name: string; ciphertext: string }) =>
      apiFetch<{ plaintext: string }>(`/kms/keys/${name}/decrypt`, {
        method: "POST",
        body: JSON.stringify({ ciphertext }),
      }),
  });
}

// ─── Topology: Realms ──────────────────────────────────────────────────────

export function useRealms() {
  return useQuery({ queryKey: ["realms"], queryFn: () => apiFetch<any[]>("/realms") });
}

// ─── Topology: Regions ─────────────────────────────────────────────────────

export function useRegions() {
  return useQuery({ queryKey: ["regions"], queryFn: () => apiFetch<any[]>("/regions") });
}

// ─── Topology: Zones ───────────────────────────────────────────────────────

export function useZones() {
  return useQuery({ queryKey: ["zones"], queryFn: () => apiFetch<any[]>("/zones") });
}

// ─── Topology: Nodes ───────────────────────────────────────────────────────

export function useNodes() {
  return useQuery({ queryKey: ["nodes"], queryFn: () => apiFetch<any[]>("/nodes") });
}

export function useCordonNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiFetch(`/nodes/${name}/cordon`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nodes"] }),
  });
}

export function useUncordonNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiFetch(`/nodes/${name}/uncordon`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nodes"] }),
  });
}

export function useDrainNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiFetch(`/nodes/${name}/drain`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nodes"] }),
  });
}

export function useApproveNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiFetch(`/nodes/${name}/approve`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nodes"] }),
  });
}

export function useNodeHeartbeat() {
  return useMutation({
    mutationFn: ({ node, body }: { node: string; body: any }) =>
      apiFetch(`/nodes/${node}/heartbeat`, { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useNodeInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ node, body }: { node: string; body: any }) =>
      apiFetch(`/nodes/${node}/inventory`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nodes"] }),
  });
}

export function useNodeServices(node: string) {
  return useQuery({
    queryKey: ["nodes", node, "services"],
    queryFn: () => apiFetch<any[]>(`/nodes/${node}/services`),
    enabled: !!node,
  });
}

export function usePostNodeServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ node, body }: { node: string; body: any[] }) =>
      apiFetch(`/nodes/${node}/services`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_d, { node }) => qc.invalidateQueries({ queryKey: ["nodes", node, "services"] }),
  });
}

export function useNodeJoin() {
  return useMutation({
    mutationFn: (body: any) =>
      apiFetch("/nodes/join", { method: "POST", body: JSON.stringify(body) }),
  });
}

// ─── Join Tokens ───────────────────────────────────────────────────────────

export function useJoinTokens() {
  return useQuery({ queryKey: ["join-tokens"], queryFn: () => apiFetch<any[]>("/join-tokens") });
}

export function useCreateJoinToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      apiFetch("/join-tokens", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["join-tokens"] }),
  });
}

export function useDeleteJoinToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/join-tokens/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["join-tokens"] }),
  });
}

// ─── Node Pools ────────────────────────────────────────────────────────────

export function useNodePools() {
  return useQuery({ queryKey: ["node-pools"], queryFn: () => apiFetch<any[]>("/node-pools") });
}

export function useCreateNodePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      apiFetch("/node-pools", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["node-pools"] }),
  });
}

export function useNodePool(pool: string) {
  return useQuery({
    queryKey: ["node-pools", pool],
    queryFn: () => apiFetch<any>(`/node-pools/${pool}`),
    enabled: !!pool,
  });
}

export function usePatchNodePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pool, body }: { pool: string; body: any }) =>
      apiFetch(`/node-pools/${pool}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["node-pools"] }),
  });
}

export function useDeleteNodePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pool: string) => apiFetch(`/node-pools/${pool}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["node-pools"] }),
  });
}

export function useNodePoolMembers(pool: string) {
  return useQuery({
    queryKey: ["node-pools", pool, "members"],
    queryFn: () => apiFetch<any[]>(`/node-pools/${pool}/members`),
    enabled: !!pool,
  });
}

export function useAddPoolMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pool, nodeId }: { pool: string; nodeId: string }) =>
      apiFetch(`/node-pools/${pool}/members`, { method: "POST", body: JSON.stringify({ nodeId }) }),
    onSuccess: (_d, { pool }) => qc.invalidateQueries({ queryKey: ["node-pools", pool, "members"] }),
  });
}

export function useRemovePoolMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pool, nodeID }: { pool: string; nodeID: string }) =>
      apiFetch(`/node-pools/${pool}/members/${nodeID}`, { method: "DELETE" }),
    onSuccess: (_d, { pool }) => qc.invalidateQueries({ queryKey: ["node-pools", pool, "members"] }),
  });
}

// ─── Service Nodes ─────────────────────────────────────────────────────────

export function useServiceNodes() {
  return useQuery({
    queryKey: ["service-nodes"],
    queryFn: () => apiFetch<Record<string, any[]>>("/service-nodes"),
  });
}

export function useServiceNodesByRole(role: string) {
  return useQuery({
    queryKey: ["service-nodes", role],
    queryFn: () => apiFetch<any[]>(`/service-nodes/${role}`),
    enabled: !!role,
  });
}

// ─── Compute Groups ────────────────────────────────────────────────────────

export function useGroups() {
  return useQuery({ queryKey: ["groups"], queryFn: () => apiFetch<any[]>("/groups") });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => apiFetch("/groups", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiFetch(`/groups/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useScaleGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, desired }: { name: string; desired: number }) =>
      apiFetch(`/groups/${name}/scale`, { method: "POST", body: JSON.stringify({ desired }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useGroupInstances(name: string) {
  return useQuery({
    queryKey: ["groups", name, "instances"],
    queryFn: () => apiFetch<any[]>(`/groups/${name}/instances`),
    enabled: !!name,
  });
}

// ─── VPC Mobility ──────────────────────────────────────────────────────────

export function useMobilityPlans(vpcId: string) {
  return useQuery({
    queryKey: ["vpcs", vpcId, "mobility", "plans"],
    queryFn: () => apiFetch<any[]>(`/vpcs/${vpcId}/mobility/plans`),
    enabled: !!vpcId,
  });
}

export function useMobilityPlan(vpcId: string, planId: string) {
  return useQuery({
    queryKey: ["vpcs", vpcId, "mobility", "plans", planId],
    queryFn: () => apiFetch<any>(`/vpcs/${vpcId}/mobility/plans/${planId}`),
    enabled: !!vpcId && !!planId,
  });
}

export function useCreateMobilityPlan(vpcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      operation?: string;
      copyMode?: string;
      strategy?: string;
      destinationRealmId?: string;
      destinationRegionId?: string;
      destinationZoneId?: string;
    }) =>
      apiFetch(`/vpcs/${vpcId}/mobility/plans`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vpcs", vpcId, "mobility", "plans"] }),
  });
}

export function useApproveMobilityPlan(vpcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      apiFetch(`/vpcs/${vpcId}/mobility/plans/${planId}/approve`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vpcs", vpcId, "mobility", "plans"] }),
  });
}

export function useExecuteMobilityPlan(vpcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      apiFetch(`/vpcs/${vpcId}/mobility/plans/${planId}/execute`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vpcs", vpcId, "mobility", "plans"] });
      qc.invalidateQueries({ queryKey: ["vpcs", vpcId, "mobility", "jobs"] });
    },
  });
}

export function useCancelMobilityPlan(vpcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      apiFetch(`/vpcs/${vpcId}/mobility/plans/${planId}/cancel`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vpcs", vpcId, "mobility", "plans"] }),
  });
}

export function useDryRunMobilityPlan(vpcId: string) {
  return useMutation({
    mutationFn: (params: { operation?: string; destinationRegionId?: string; destinationZoneId?: string }) => {
      const qs = new URLSearchParams();
      if (params.operation) qs.set("operation", params.operation);
      if (params.destinationRegionId) qs.set("destinationRegionId", params.destinationRegionId);
      if (params.destinationZoneId) qs.set("destinationZoneId", params.destinationZoneId);
      return apiFetch<any>(`/vpcs/${vpcId}/mobility/plans/dry-run?${qs}`);
    },
  });
}

export function useMobilityJobs(vpcId: string) {
  return useQuery({
    queryKey: ["vpcs", vpcId, "mobility", "jobs"],
    queryFn: () => apiFetch<any[]>(`/vpcs/${vpcId}/mobility/jobs`),
    enabled: !!vpcId,
  });
}

export function useMobilityJob(vpcId: string, jobId: string) {
  return useQuery({
    queryKey: ["vpcs", vpcId, "mobility", "jobs", jobId],
    queryFn: () => apiFetch<any>(`/vpcs/${vpcId}/mobility/jobs/${jobId}`),
    enabled: !!vpcId && !!jobId,
  });
}

export function useCancelMobilityJob(vpcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      apiFetch(`/vpcs/${vpcId}/mobility/jobs/${jobId}/cancel`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vpcs", vpcId, "mobility", "jobs"] }),
  });
}

export function useRollbackMobilityJob(vpcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      apiFetch(`/vpcs/${vpcId}/mobility/jobs/${jobId}/rollback`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vpcs", vpcId, "mobility", "jobs"] }),
  });
}

export function useMobilityJobSteps(vpcId: string, jobId: string) {
  return useQuery({
    queryKey: ["vpcs", vpcId, "mobility", "jobs", jobId, "steps"],
    queryFn: () => apiFetch<any[]>(`/vpcs/${vpcId}/mobility/jobs/${jobId}/steps`),
    enabled: !!vpcId && !!jobId,
  });
}

export function useMobilityJobMappings(vpcId: string, jobId: string) {
  return useQuery({
    queryKey: ["vpcs", vpcId, "mobility", "jobs", jobId, "mappings"],
    queryFn: () => apiFetch<any[]>(`/vpcs/${vpcId}/mobility/jobs/${jobId}/mappings`),
    enabled: !!vpcId && !!jobId,
  });
}

export function useVPCCopy(vpcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      copyMode?: string;
      destinationRealmId?: string;
      destinationRegionId?: string;
      destinationZoneId?: string;
    }) =>
      apiFetch(`/vpcs/${vpcId}/copy`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vpcs"] });
      qc.invalidateQueries({ queryKey: ["vpcs", vpcId, "mobility", "jobs"] });
    },
  });
}

export function useVPCMove(vpcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      confirm: string;
      strategy?: string;
      destinationRealmId?: string;
      destinationRegionId?: string;
      destinationZoneId?: string;
    }) =>
      apiFetch(`/vpcs/${vpcId}/move`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vpcs"] });
      qc.invalidateQueries({ queryKey: ["vpcs", vpcId, "mobility", "plans"] });
    },
  });
}

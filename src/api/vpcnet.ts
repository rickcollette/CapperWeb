import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { VPCDetail } from "@/types/capper";

function invalidateVpcNet(qc: ReturnType<typeof useQueryClient>, vpcRef: string) {
  qc.invalidateQueries({ queryKey: ["vpcs", vpcRef, "detail"] });
  qc.invalidateQueries({ queryKey: ["vpcs", vpcRef, "summary"] });
  qc.invalidateQueries({ queryKey: ["route-tables", vpcRef] });
  qc.invalidateQueries({ queryKey: ["security-groups", vpcRef] });
  qc.invalidateQueries({ queryKey: ["network-acls", vpcRef] });
  qc.invalidateQueries({ queryKey: ["internet-gateways", vpcRef] });
  qc.invalidateQueries({ queryKey: ["nat-gateways", vpcRef] });
  qc.invalidateQueries({ queryKey: ["flow-logs"] });
}

export function useVPCDetail(vpcRef: string) {
  return useQuery({
    queryKey: ["vpcs", vpcRef, "detail"],
    queryFn: () => apiFetch<VPCDetail>(`/vpcs/${vpcRef}/detail`),
    enabled: !!vpcRef,
  });
}

export function useSecurityGroups(vpcId: string) {
  return useQuery({
    queryKey: ["security-groups", vpcId],
    queryFn: () => apiFetch<any[]>(`/security-groups?vpcId=${encodeURIComponent(vpcId)}`),
    enabled: !!vpcId,
  });
}

export function useRouteTables(vpcRef: string) {
  return useQuery({
    queryKey: ["route-tables", vpcRef],
    queryFn: () => apiFetch<any[]>(`/vpcs/${vpcRef}/route-tables`),
    enabled: !!vpcRef,
  });
}

export function useNetworkACLs(vpcId: string) {
  return useQuery({
    queryKey: ["network-acls", vpcId],
    queryFn: () => apiFetch<any[]>(`/network-acls?vpcId=${encodeURIComponent(vpcId)}`),
    enabled: !!vpcId,
  });
}

export function useCreateSecurityGroup(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { vpcId: string; name: string; description?: string }) =>
      apiFetch("/security-groups", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateVpcNet(qc, vpcRef),
  });
}

export function useDeleteSecurityGroup(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sgId: string) => apiFetch(`/security-groups/${sgId}`, { method: "DELETE" }),
    onSuccess: () => invalidateVpcNet(qc, vpcRef),
  });
}

export function useAddSGRule(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sgId,
      ...body
    }: {
      sgId: string;
      direction: string;
      protocol: string;
      fromPort?: number;
      toPort?: number;
      cidr?: string;
      action?: string;
    }) => apiFetch(`/security-groups/${sgId}/rules`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateVpcNet(qc, vpcRef),
  });
}

export function useDeleteSGRule(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => apiFetch(`/security-group-rules/${ruleId}`, { method: "DELETE" }),
    onSuccess: () => invalidateVpcNet(qc, vpcRef),
  });
}

export function useAddRoute(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      routeTableId,
      ...body
    }: {
      routeTableId: string;
      destinationCidr: string;
      targetType: string;
      targetId: string;
    }) =>
      apiFetch(`/route-tables/${routeTableId}/routes`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateVpcNet(qc, vpcRef),
  });
}

export function useDeleteRoute(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeTableId, routeId }: { routeTableId: string; routeId: string }) =>
      apiFetch(`/route-tables/${routeTableId}/routes/${routeId}`, { method: "DELETE" }),
    onSuccess: () => invalidateVpcNet(qc, vpcRef),
  });
}

export function useAddNetworkACLEntry(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      aclId,
      ...body
    }: {
      aclId: string;
      ruleNumber: number;
      direction: string;
      action: string;
      protocol: string;
      cidr: string;
      fromPort?: number;
      toPort?: number;
    }) => apiFetch(`/network-acls/${aclId}/entries`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateVpcNet(qc, vpcRef),
  });
}

export function useDeleteNetworkACLEntry(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ aclId, ruleNumber }: { aclId: string; ruleNumber: number }) =>
      apiFetch(`/network-acls/${aclId}/entries/${ruleNumber}`, { method: "DELETE" }),
    onSuccess: () => invalidateVpcNet(qc, vpcRef),
  });
}

export function useCreateIGW(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { vpcId: string; name?: string }) =>
      apiFetch("/internet-gateways", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateVpcNet(qc, vpcRef),
  });
}

export function useDeleteIGW(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ igwId, vpcId }: { igwId: string; vpcId: string }) =>
      apiFetch(`/internet-gateways/${igwId}?vpcId=${encodeURIComponent(vpcId)}`, { method: "DELETE" }),
    onSuccess: () => invalidateVpcNet(qc, vpcRef),
  });
}

export function useCreateNATGateway(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { vpcId: string; subnetId: string; name?: string; publicIp?: string }) =>
      apiFetch("/nat-gateways", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateVpcNet(qc, vpcRef),
  });
}

export function useDeleteNATGateway(vpcRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (natId: string) => apiFetch(`/nat-gateways/${natId}`, { method: "DELETE" }),
    onSuccess: () => invalidateVpcNet(qc, vpcRef),
  });
}

export function useCreateFlowLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceType: string; resourceId: string; destination?: string }) =>
      apiFetch("/flow-logs", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flow-logs"] }),
  });
}

export function useKeyPairs() {
  return useQuery({
    queryKey: ["key-pairs"],
    queryFn: () => apiFetch<any[]>("/key-pairs"),
  });
}

export function useCreateKeyPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; publicKey: string; keyType?: string }) =>
      apiFetch("/key-pairs", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["key-pairs"] }),
  });
}

export function useVPCSummary(vpcRef: string) {
  return useQuery({
    queryKey: ["vpcs", vpcRef, "summary"],
    queryFn: () => apiFetch<any>(`/vpcs/${vpcRef}/summary`),
    enabled: !!vpcRef,
  });
}

export function useNetworkTopology() {
  return useQuery({
    queryKey: ["networking-topology"],
    queryFn: () => apiFetch<any>("/networking/topology"),
  });
}

export function useReachabilityAnalyze() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch("/reachability/analyze", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useNetworkingDashboard() {
  return useQuery({
    queryKey: ["networking-dashboard"],
    queryFn: () => apiFetch<any>("/networking/dashboard"),
  });
}

export function useLaunchTemplates() {
  return useQuery({
    queryKey: ["launch-templates"],
    queryFn: () => apiFetch<any[]>("/launch-templates"),
  });
}

export function useInternetGateways(vpcId: string) {
  return useQuery({
    queryKey: ["internet-gateways", vpcId],
    queryFn: () => apiFetch<any[]>(`/internet-gateways?vpcId=${encodeURIComponent(vpcId)}`),
    enabled: !!vpcId,
  });
}

export function useNatGateways(vpcId: string) {
  return useQuery({
    queryKey: ["nat-gateways", vpcId],
    queryFn: () => apiFetch<any[]>(`/nat-gateways?vpcId=${encodeURIComponent(vpcId)}`),
    enabled: !!vpcId,
  });
}

export function useFlowLogs(resourceId?: string) {
  return useQuery({
    queryKey: ["flow-logs", resourceId],
    queryFn: () => apiFetch<any[]>(`/flow-logs${resourceId ? `?resourceId=${encodeURIComponent(resourceId)}` : ""}`),
  });
}

export function useVpcEndpoints(vpcId?: string) {
  return useQuery({
    queryKey: ["vpc-endpoints", vpcId],
    queryFn: () => apiFetch<any[]>(`/vpc-endpoints${vpcId ? `?vpcId=${encodeURIComponent(vpcId)}` : ""}`),
  });
}

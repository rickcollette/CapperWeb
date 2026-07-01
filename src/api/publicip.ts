import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface PublicIP {
  allocationId: string;
  ipAddress: string;
  status: "available" | "associated" | "released";
  associationId?: string;
  resourceType?: string;
  resourceId?: string;
  instanceId?: string;
  eniId?: string;
  createdAt?: string;
  tags?: Record<string, string>;
}

export interface AllocatePublicIPRequest {
  tags?: Record<string, string>;
}

export interface AssociatePublicIPRequest {
  resourceType: "instance" | "eni";
  resourceId: string;
}

export function usePublicIPs() {
  return useQuery({
    queryKey: ["public-ips"],
    queryFn: () => apiFetch<PublicIP[]>("/public-ips"),
    refetchInterval: 5000,
  });
}

export function useAllocatePublicIP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AllocatePublicIPRequest = {}) =>
      apiFetch("/public-ips/allocate", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-ips"] });
    },
  });
}

export function useAssociatePublicIP(allocationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssociatePublicIPRequest) =>
      apiFetch(`/public-ips/${allocationId}/associate`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-ips"] });
    },
  });
}

export function useDisassociatePublicIP(associationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/public-ips/${associationId}/disassociate`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-ips"] });
    },
  });
}

export function useReleasePublicIP(allocationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/public-ips/${allocationId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-ips"] });
    },
  });
}

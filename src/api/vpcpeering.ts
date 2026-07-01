import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface VPCPeering {
  id: string;
  sourceVpcId: string;
  targetVpcId: string;
  status: "pending-acceptance" | "active" | "failed" | "deleted";
  requester?: string;
  accepter?: string;
  createdAt?: string;
  tags?: Record<string, string>;
}

export interface CreateVPCPeeringRequest {
  sourceVpcId: string;
  targetVpcId: string;
  tags?: Record<string, string>;
}

export function useVPCPeerings() {
  return useQuery({
    queryKey: ["vpc-peerings"],
    queryFn: () => apiFetch<VPCPeering[]>("/vpc-peerings"),
    refetchInterval: 5000,
  });
}

export function useCreateVPCPeering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateVPCPeeringRequest) =>
      apiFetch("/vpc-peerings", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vpc-peerings"] });
    },
  });
}

export function useDeleteVPCPeering(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/vpc-peerings/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vpc-peerings"] });
    },
  });
}

export function useAcceptVPCPeering(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/vpc-peerings/${id}/accept`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vpc-peerings"] });
    },
  });
}

export function useRejectVPCPeering(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/vpc-peerings/${id}/reject`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vpc-peerings"] });
    },
  });
}

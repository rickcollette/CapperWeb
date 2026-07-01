import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface VPCEndpoint {
  id: string;
  vpcId: string;
  type: "Gateway" | "Interface";
  serviceName: string;
  status: "available" | "creating" | "deleting" | "failed";
  subnetIds?: string[];
  securityGroupIds?: string[];
  routeTableIds?: string[];
  policy?: Record<string, any>;
  createdAt?: string;
  tags?: Record<string, string>;
}

export interface CreateVPCEndpointRequest {
  vpcId: string;
  type: "Gateway" | "Interface";
  serviceName: string;
  subnetIds?: string[];
  securityGroupIds?: string[];
  routeTableIds?: string[];
  policy?: Record<string, any>;
}

export function useVPCEndpoints(vpcId?: string) {
  return useQuery({
    queryKey: ["vpc-endpoints", vpcId],
    queryFn: () => {
      const path = vpcId ? `/vpc-endpoints?vpc=${vpcId}` : "/vpc-endpoints";
      return apiFetch<VPCEndpoint[]>(path);
    },
    refetchInterval: 5000,
  });
}

export function useCreateVPCEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateVPCEndpointRequest) =>
      apiFetch("/vpc-endpoints", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vpc-endpoints"] });
    },
  });
}

export function useDeleteVPCEndpoint(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/vpc-endpoints/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vpc-endpoints"] });
    },
  });
}

export function useUpdateVPCEndpointPolicy(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policy: Record<string, any>) =>
      apiFetch(`/vpc-endpoints/${id}/policy`, {
        method: "PUT",
        body: JSON.stringify({ policy }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vpc-endpoints"] });
    },
  });
}

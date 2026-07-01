import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface AutoscalePolicy {
  id: string;
  name: string;
  resourceType: string;
  minSize: number;
  maxSize: number;
  desiredSize: number;
  scalingType: "metric" | "scheduled";
  metricName?: string;
  targetValue?: number;
  schedule?: string;
  status: "active" | "inactive";
  createdAt?: string;
}

export interface CreateAutoscalePolicyRequest {
  name: string;
  resourceType: string;
  minSize: number;
  maxSize: number;
  desiredSize: number;
  scalingType: "metric" | "scheduled";
  metricName?: string;
  targetValue?: number;
  schedule?: string;
}

export function useAutoscalePolicies() {
  return useQuery({
    queryKey: ["autoscale-policies"],
    queryFn: () => apiFetch<AutoscalePolicy[]>("/autoscale/policies"),
    refetchInterval: 5000,
  });
}

export function useCreateAutoscalePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAutoscalePolicyRequest) =>
      apiFetch("/autoscale/policies", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["autoscale-policies"] });
    },
  });
}

export function useDeleteAutoscalePolicy(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/autoscale/policies/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["autoscale-policies"] });
    },
  });
}

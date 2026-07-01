import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface PlacementPolicy {
  id: string;
  name: string;
  type: "cluster" | "spread" | "partition";
  description?: string;
  rules?: Record<string, any>;
  status: "active" | "inactive";
  createdAt?: string;
  tags?: Record<string, string>;
}

export interface CreatePlacementPolicyRequest {
  name: string;
  type: "cluster" | "spread" | "partition";
  description?: string;
  rules?: Record<string, any>;
}

export function usePlacementPolicies() {
  return useQuery({
    queryKey: ["placement-policies"],
    queryFn: () => apiFetch<PlacementPolicy[]>("/placement/policies"),
    refetchInterval: 5000,
  });
}

export function useCreatePlacementPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePlacementPolicyRequest) =>
      apiFetch("/placement/policies", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["placement-policies"] });
    },
  });
}

export function useDeletePlacementPolicy(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/placement/policies/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["placement-policies"] });
    },
  });
}

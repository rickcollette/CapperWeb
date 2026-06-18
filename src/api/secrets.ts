import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

export interface SecretMeta {
  id: string;
  name: string;
  description?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function useSecrets() {
  return useQuery({ queryKey: ["secrets"], queryFn: () => apiFetch<SecretMeta[]>("/secrets") });
}

export function useCreateSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; value: string; description?: string }) =>
      apiFetch("/secrets", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["secrets"] }),
  });
}

export function useDeleteSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiFetch(`/secrets/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["secrets"] }),
  });
}

// ─── Governance ───────────────────────────────────────────────────────────────

export interface GovernancePolicy {
  id?: string;
  name: string;
  description?: string;
  rule?: string;
  enabled?: boolean;
}

export function useGovernancePolicies() {
  return useQuery({
    queryKey: ["governance-policies"],
    queryFn: () => apiFetch<GovernancePolicy[]>("/governance/policies"),
  });
}

export function useCreateGovernancePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<GovernancePolicy>) =>
      apiFetch("/governance/policies", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["governance-policies"] }),
  });
}

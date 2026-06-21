import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

export interface IPPool {
  id: string;
  name: string;
  cidr: string;
  scope: string;
  gateway?: string;
  usage: string[];
  status: string;
  allowAutoAllocate: boolean;
}

export interface RoutableIP {
  id: string;
  poolId: string;
  address: string;
  status: string;
  project?: string;
  name?: string;
  purpose?: string;
  targetType?: string;
  targetId?: string;
}

export function useIPPools() {
  return useQuery({ queryKey: ["ip-pools"], queryFn: () => apiFetch<IPPool[]>("/ip-pools") });
}

export function useIPs(pool?: string, status?: string) {
  const qs = new URLSearchParams();
  if (pool) qs.set("pool", pool);
  if (status) qs.set("status", status);
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: ["ips", pool, status],
    queryFn: () => apiFetch<RoutableIP[]>(`/ips${suffix}`),
  });
}

export function useCreateIPPool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      cidr: string;
      scope?: string;
      gateway?: string;
      usage?: string[];
      allowAutoAllocate?: boolean;
    }) => apiFetch("/ip-pools", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ip-pools"] });
      qc.invalidateQueries({ queryKey: ["ips"] });
    },
  });
}

export function useDeleteIPPool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/ip-pools/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ip-pools"] }),
  });
}

export function useReserveIP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { pool: string; name: string; purpose?: string; address?: string }) =>
      apiFetch("/ips/reserve", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ips"] }),
  });
}

export function useReleaseIP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/ips/${id}/release`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ips"] }),
  });
}

// ---- admin IP exclusions ---------------------------------------------------
// Addresses an admin has unlisted so the app stack never auto-allocates them
// (e.g. an address used by the Capper Server Host inside a small subnet).

export interface IPExclusion {
  id: string;
  address: string;
  poolId?: string;
  reason?: string;
  createdBy?: string;
  createdAt?: string;
}

export function useIPExclusions(pool?: string) {
  const suffix = pool ? `?pool=${encodeURIComponent(pool)}` : "";
  return useQuery({
    queryKey: ["ip-exclusions", pool],
    queryFn: () => apiFetch<IPExclusion[]>(`/admin/ip-exclusions${suffix}`),
  });
}

export function useAddIPExclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { address: string; poolId?: string; reason?: string }) =>
      apiFetch("/admin/ip-exclusions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ip-exclusions"] });
      qc.invalidateQueries({ queryKey: ["ips"] });
    },
  });
}

export function useRemoveIPExclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/ip-exclusions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ip-exclusions"] });
      qc.invalidateQueries({ queryKey: ["ips"] });
    },
  });
}

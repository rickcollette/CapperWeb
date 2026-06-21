import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

// Admin-only platform configuration (host limits, host storage, host security).

export interface HostLimit {
  key: string;
  label: string;
  limit: number;
  override: number; // 0 = unset / auto
  default: number;
  used: number;
  unit?: string;
}

export function useHostLimits() {
  return useQuery({
    queryKey: ["admin-host-limits"],
    queryFn: () => apiFetch<HostLimit[]>("/admin/limits/host"),
  });
}

// useSetHostLimits sets overrides. A null value clears the override (reverts to
// the built-in default).
export function useSetHostLimits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, number | null>) =>
      apiFetch("/admin/limits/host", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-host-limits"] }),
  });
}

// ---- host storage ----------------------------------------------------------

export interface HostDisk {
  name: string;
  path: string;
  sizeBytes: number;
  type: string;
  rotational: boolean;
  removable: boolean;
  model?: string;
  serial?: string;
  fsType?: string;
  mountpoint?: string;
  state: "unallocated" | "pool-member" | "in-use-by-host";
}

export interface StoragePool {
  id: string;
  name: string;
  backend: "directory" | "lvm";
  mountpoint?: string;
  device?: string;
  vgName?: string;
  totalBytes: number;
  health?: "healthy" | "degraded";
  allocatedBytes: number;
  availableBytes: number;
  createdAt?: string;
}

export interface StorageAllocation {
  id: string;
  poolId: string;
  owner?: string;
  name: string;
  path: string;
  sizeBytes: number;
  createdAt?: string;
}

export function useHostDisks() {
  return useQuery({ queryKey: ["admin-disks"], queryFn: () => apiFetch<HostDisk[]>("/admin/disks") });
}

export function useStoragePools() {
  return useQuery({ queryKey: ["admin-storage-pools"], queryFn: () => apiFetch<StoragePool[]>("/admin/storage-pools") });
}

export function useCreateStoragePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; backend?: string; mountpoint?: string; device?: string; vgName?: string }) =>
      apiFetch("/admin/storage-pools", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-storage-pools"] });
      qc.invalidateQueries({ queryKey: ["admin-disks"] });
    },
  });
}

export interface StorageSettings {
  defaultInstancePool: string;
}

export function useStorageSettings() {
  return useQuery({
    queryKey: ["admin-storage-settings"],
    queryFn: () => apiFetch<StorageSettings>("/admin/storage/settings"),
  });
}

export function useSetStorageSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { defaultInstancePool: string }) =>
      apiFetch("/admin/storage/settings", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-storage-settings"] }),
  });
}

export function useDeleteStoragePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/storage-pools/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-storage-pools"] });
      qc.invalidateQueries({ queryKey: ["admin-disks"] });
    },
  });
}

export function usePoolAllocations(poolId?: string) {
  return useQuery({
    queryKey: ["admin-storage-allocations", poolId],
    queryFn: () => apiFetch<StorageAllocation[]>(`/admin/storage-pools/${poolId}/allocations`),
    enabled: !!poolId,
  });
}

export function useReleaseAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/storage-allocations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-storage-allocations"] });
      qc.invalidateQueries({ queryKey: ["admin-storage-pools"] });
    },
  });
}

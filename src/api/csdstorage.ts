import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface CSDVolume {
  id: string;
  name: string;
  size: number;
  status: "available" | "in-use" | "creating" | "deleting";
  attachments?: Array<{
    instanceId: string;
    mountPath: string;
  }>;
  iops?: number;
  throughput?: number;
  encrypted?: boolean;
  createdAt?: string;
  tags?: Record<string, string>;
}

export interface CreateCSDVolumeRequest {
  name: string;
  size: number;
  iops?: number;
  throughput?: number;
  encrypted?: boolean;
  tags?: Record<string, string>;
}

export function useCSDVolumes() {
  return useQuery({
    queryKey: ["csd-volumes"],
    queryFn: () => apiFetch<CSDVolume[]>("/csd/volumes"),
    refetchInterval: 5000,
  });
}

export function useCSDVolume(id: string) {
  return useQuery({
    queryKey: ["csd-volumes", id],
    queryFn: () => apiFetch<CSDVolume>(`/csd/volumes/${id}`),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useCreateCSDVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCSDVolumeRequest) =>
      apiFetch("/csd/volumes", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["csd-volumes"] });
    },
  });
}

export function useDeleteCSDVolume(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/csd/volumes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["csd-volumes"] });
      qc.removeQueries({ queryKey: ["csd-volumes", id] });
    },
  });
}

export function useAttachCSDVolume(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { instanceId: string; mountPath: string }) =>
      apiFetch(`/csd/volumes/${id}/attach`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["csd-volumes", id] });
      qc.invalidateQueries({ queryKey: ["csd-volumes"] });
    },
  });
}

export function useDetachCSDVolume(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) =>
      apiFetch(`/csd/volumes/${id}/detach`, {
        method: "POST",
        body: JSON.stringify({ instanceId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["csd-volumes", id] });
      qc.invalidateQueries({ queryKey: ["csd-volumes"] });
    },
  });
}

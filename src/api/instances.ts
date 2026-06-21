import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiFetch, apiFetchWithCaps, API_BASE } from "@/api/client";
import type { CapperInstance, ResourceEvent } from "@/types/capper";

export function useInstances() {
  return useQuery({
    queryKey: ["instances"],
    queryFn: () => apiFetch<CapperInstance[]>("/instances"),
    refetchInterval: 5000,
  });
}

export function useInstance(id: string) {
  return useQuery({
    queryKey: ["instances", id],
    queryFn: () => apiFetchWithCaps<CapperInstance>(`/instances/${id}`),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export interface InstancePatch {
  resources?: {
    memoryBytes?: number;
    cpuTimeSecs?: number;
    maxProcesses?: number;
    fileSizeBytes?: number;
  };
  restartPolicy?: string;
  labels?: Record<string, string>;
}

export function useUpdateInstance(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InstancePatch) =>
      apiFetch(`/instances/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instances", id] });
      qc.invalidateQueries({ queryKey: ["instances"] });
    },
  });
}

export function useInstanceActions(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["instances"] });
    qc.invalidateQueries({ queryKey: ["instances", id] });
  };
  return {
    start: useMutation({
      mutationFn: () => apiFetch(`/instances/${id}/start`, { method: "POST" }),
      onSuccess: invalidate,
    }),
    stop: useMutation({
      mutationFn: () => apiFetch(`/instances/${id}/stop`, { method: "POST" }),
      onSuccess: invalidate,
    }),
    restart: useMutation({
      mutationFn: () => apiFetch(`/instances/${id}/restart`, { method: "POST" }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: () => apiFetch(`/instances/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

export type BulkInstanceAction = "start" | "stop" | "restart" | "delete";

async function runInstanceAction(id: string, action: BulkInstanceAction) {
  if (action === "delete") {
    return apiFetch(`/instances/${id}`, { method: "DELETE" });
  }
  return apiFetch(`/instances/${id}/${action}`, { method: "POST" });
}

export function useBulkInstanceActions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: BulkInstanceAction }) => {
      const results = await Promise.allSettled(ids.map((id) => runInstanceAction(id, action)));
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        const msg = failed.map((r) => (r as PromiseRejectedResult).reason?.message ?? "failed").join("; ");
        throw new Error(`${failed.length}/${ids.length} failed: ${msg}`);
      }
      return results.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instances"] }),
  });
}

export function useInstanceLogs(id: string, stream: "stdout" | "stderr" | "startup-error" = "stdout") {
  const path =
    stream === "startup-error"
      ? `/instances/${id}/logs`
      : `/instances/${id}/logs/${stream}`;
  return useQuery({
    queryKey: ["instances", id, "logs", stream],
    queryFn: async () => {
      const data = await apiFetch<Record<string, string>>(path);
      if (stream === "startup-error") {
        return data.startupError ?? "";
      }
      return data;
    },
    enabled: !!id,
    refetchInterval: 3000,
  });
}

export function useInstanceEvents(id: string) {
  return useQuery({
    queryKey: ["instances", id, "events"],
    queryFn: () => apiFetch<ResourceEvent[]>(`/instances/${id}/events`),
    enabled: !!id,
    refetchInterval: 10000,
  });
}

export function useInstanceMetadata(id: string) {
  return useQuery({
    queryKey: ["instances", id, "metadata"],
    queryFn: () => apiFetch<Record<string, unknown>>(`/instances/${id}/metadata`),
    enabled: !!id,
  });
}

export function useCreateInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      image: string;
      name?: string;
      instanceType?: string;
      network?: string;
      vpcId?: string;
      subnetId?: string;
      securityGroupIds?: string[];
      keyName?: string;
      privateIpAddress?: string;
      publicIpBehavior?: string;
      terminationProtection?: boolean;
      tags?: Record<string, string>;
      env?: Record<string, string>;
      capInitTemplate?: string;
      capInitContent?: string;
      volumes?: { name: string; mountPath: string }[];
      diskBytes?: number;
    }) => apiFetch<CapperInstance>("/instances", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instances"] }),
  });
}

export interface InstanceDiskCapacity {
  poolConfigured: boolean;
  poolName?: string;
  backend?: string;
  availableBytes: number;
  totalBytes: number;
  degraded?: boolean;
}

export function useInstanceDiskCapacity() {
  return useQuery({
    queryKey: ["instance-disk-capacity"],
    queryFn: () => apiFetch<InstanceDiskCapacity>("/instance-disk-capacity"),
  });
}

export function useLogFollow(id: string, stream: "stdout" | "stderr", enabled: boolean) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled || !id) return;
    setError(null);
    const ctrl = new AbortController();
    let active = true;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/instances/${id}/logs/${stream}?follow=true`,
          { credentials: "include", signal: ctrl.signal },
        );
        if (!res.ok) {
          setError(`Log stream returned ${res.status}`);
          return;
        }
        const reader = res.body?.getReader();
        if (!reader) { setError("No response body"); return; }
        const dec = new TextDecoder();
        while (active) {
          const { done, value } = await reader.read();
          if (done) break;
          setText((prev) => prev + dec.decode(value));
        }
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") {
          setError((e as Error)?.message ?? "Connection failed");
        }
      }
    })();
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [id, stream, enabled]);
  return { text, error };
}

export function useEvents(limit = 20) {
  return useQuery({
    queryKey: ["events", limit],
    queryFn: () => apiFetch<ResourceEvent[]>(`/events?limit=${limit}`),
    refetchInterval: 5000,
  });
}

export function useDaemonStatus() {
  return useQuery({
    queryKey: ["daemon-status"],
    queryFn: () => apiFetch<{ status: string; online: boolean }>("/daemon/status"),
    refetchInterval: 10000,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<{ status: string }>("/health"),
    refetchInterval: 30000,
  });
}

export function useVersion() {
  return useQuery({
    queryKey: ["version"],
    queryFn: () =>
      apiFetch<{ version: string; commit?: string; buildDate?: string }>("/version"),
    staleTime: 5 * 60 * 1000,
  });
}

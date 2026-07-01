import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface SchedulerState {
  totalNodes: number;
  availableCapacity: number;
  utilizedCapacity: number;
  pendingJobs: number;
  scheduledJobs: number;
  allocations: Array<{
    nodeId: string;
    jobId: string;
    cpuAllocated: number;
    memoryAllocated: number;
  }>;
}

export interface SchedulingDecision {
  jobId: string;
  decision: "scheduled" | "pending" | "rejected";
  reason?: string;
  targetNode?: string;
  timestamp?: string;
}

export function useSchedulerState() {
  return useQuery({
    queryKey: ["scheduler-state"],
    queryFn: () => apiFetch<SchedulerState>("/scheduler/state"),
    refetchInterval: 10000,
  });
}

export function useSchedulerMetrics() {
  return useQuery({
    queryKey: ["scheduler-metrics"],
    queryFn: () =>
      apiFetch<{
        efficiency: number;
        avgWaitTime: number;
        successRate: number;
      }>("/scheduler/metrics"),
    refetchInterval: 10000,
  });
}

export function useSchedulingDecisions() {
  return useQuery({
    queryKey: ["scheduling-decisions"],
    queryFn: () => apiFetch<SchedulingDecision[]>("/scheduler/decisions"),
    refetchInterval: 5000,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

export interface Resource {
  id: string;
  resourceType: string;
  name: string;
  project?: string;
  status: string;
  health: string;
  nodeId?: string;
  regionId?: string;
  zoneId?: string;
  labels?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface MetricSample {
  resourceType: string;
  resourceId: string;
  metricName: string;
  value: number;
  unit?: string;
  sampledAt: string;
}

export interface ResourceEvent {
  id: string;
  resourceType: string;
  resourceId: string;
  eventType: string;
  severity: string;
  message?: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  ruleId?: string;
  resourceType: string;
  resourceId: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  openedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  resourceType?: string;
  metricName: string;
  condition: string;
  threshold: number;
  severity: string;
  enabled: boolean;
}

// ─── Resources ───────────────────────────────────────────────────────────────

export function useResources(params: { type?: string; project?: string; health?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.type) qs.set("type", params.type);
  if (params.project) qs.set("project", params.project);
  if (params.health) qs.set("health", params.health);
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: ["resources", params],
    queryFn: () => apiFetch<Resource[]>(`/resources${suffix}`),
  });
}

export function useResource(id: string) {
  return useQuery({
    queryKey: ["resources", id],
    queryFn: () => apiFetch<Resource>(`/resources/${id}`),
    enabled: !!id,
  });
}

export function useResourceEvents(id: string) {
  return useQuery({
    queryKey: ["resources", id, "events"],
    queryFn: () => apiFetch<ResourceEvent[]>(`/resources/${id}/events`),
    enabled: !!id,
  });
}

export function useSyncResources() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/resources/sync", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export function useMetricsQuery(resourceType: string, resourceId: string, metric: string, range = "1h") {
  return useQuery({
    queryKey: ["metrics", resourceType, resourceId, metric, range],
    queryFn: () =>
      apiFetch<MetricSample[]>(
        `/metrics/query?resourceType=${encodeURIComponent(resourceType)}&resourceId=${encodeURIComponent(
          resourceId,
        )}&metric=${encodeURIComponent(metric)}&range=${range}`,
      ),
    enabled: !!resourceType && !!resourceId && !!metric,
  });
}

// ─── Events ──────────────────────────────────────────────────────────────────

export function useEvents(params: { project?: string; severity?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.project) qs.set("project", params.project);
  if (params.severity) qs.set("severity", params.severity);
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: ["resource-events", params],
    queryFn: () => apiFetch<ResourceEvent[]>(`/resource-events${suffix}`),
  });
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export function useAlerts(status = "") {
  const suffix = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["alerts", status],
    queryFn: () => apiFetch<Alert[]>(`/alerts${suffix}`),
  });
}

export function useAlertRules() {
  return useQuery({
    queryKey: ["alert-rules"],
    queryFn: () => apiFetch<AlertRule[]>("/alerts/rules"),
  });
}

export function useCreateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<AlertRule>) =>
      apiFetch("/alerts/rules", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
  });
}

export function useDeleteAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/alerts/rules/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
  });
}

export function useAckAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/alerts/${id}/ack`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/alerts/${id}/resolve`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

// ─── Service-specific monitoring (§6.6) ──────────────────────────────────────

export interface MonitoringData {
  resourceType: string;
  resourceId: string;
  metrics: Record<string, { value: number; unit: string; sampledAt: string }>;
  events: ResourceEvent[];
}

// useMonitoring fetches the latest metrics + recent events for a resource via
// its service-specific monitoring endpoint (e.g. service="nodes", id=nodeId).
export function useMonitoring(service: string, id: string) {
  return useQuery({
    queryKey: ["monitoring", service, id],
    queryFn: () => apiFetch<MonitoringData>(`/${service}/${id}/monitoring`),
    enabled: !!service && !!id,
    refetchInterval: 15000,
  });
}

// ─── Drift ───────────────────────────────────────────────────────────────────

export function useDrift() {
  return useQuery({
    queryKey: ["config-drift"],
    queryFn: () => apiFetch<any[]>("/config/drift"),
  });
}

export function useRepairDrift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) =>
      apiFetch(`/resources/${resourceId}/drift/repair`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["config-drift"] }),
  });
}

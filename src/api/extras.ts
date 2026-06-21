import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type {
  LoadBalancer,
  LBDetail,
  LBListener,
  LBTargetGroup,
  Firewall,
  HealthCheckResult,
  Stack,
  Database,
  DBEngine,
  AIAgent,
  AISession,
  MCPServer,
  Backup,
  BackupPolicy,
  Quota,
  PostureFinding,
} from "@/types/capper";

// ─── Load Balancers ────────────────────────────────────────────────────────

export function useLBs() {
  return useQuery({
    queryKey: ["lb"],
    queryFn: () => apiFetch<LoadBalancer[]>("/lb"),
  });
}

export function useLB(name: string) {
  return useQuery({
    queryKey: ["lb", name],
    queryFn: () => apiFetch<LBDetail>(`/lb/${name}`),
    enabled: !!name,
  });
}

export function useSubnetAvailableIPs(subnetId: string) {
  return useQuery({
    queryKey: ["subnet-available-ips", subnetId],
    queryFn: () => apiFetch<string[]>(`/subnets/${subnetId}/available-ips`),
    enabled: !!subnetId,
  });
}

export interface CreateLBBody {
  name: string;
  scheme?: "internal" | "internet-facing";
  type?: "application" | "network";
  vpcId?: string;
  subnetId: string;
  poolId?: string;
  vip?: string;
  autoVip?: boolean;
  algorithm?: string;
  listenerProtocol?: string;
  listenerPort?: number;
  listenerCertId?: string;
  targetGroupName?: string;
  targetGroupPort?: number;
  initialTargetAddr?: string;
  // legacy
  mode?: "tcp" | "http" | "https";
  listenAddr?: string;
  selector?: string;
  tlsCertId?: string;
}

export function useCreateLB() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateLBBody) =>
      apiFetch<LBDetail | LoadBalancer>("/lb", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lb"] }),
  });
}

export function useDeleteLB() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiFetch(`/lb/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lb"] }),
  });
}

export function useLBListeners(lbName: string) {
  return useQuery({
    queryKey: ["lb", lbName, "listeners"],
    queryFn: () => apiFetch<LBListener[]>(`/lb/${lbName}/listeners`),
    enabled: !!lbName,
  });
}

export function useCreateLBListener(lbName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { targetGroupId: string; protocol: string; port: number; certificateId?: string }) =>
      apiFetch(`/lb/${lbName}/listeners`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lb", lbName] });
      qc.invalidateQueries({ queryKey: ["lb", lbName, "listeners"] });
    },
  });
}

export function useDeleteLBListener(lbName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/lb/${lbName}/listeners/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lb", lbName] });
      qc.invalidateQueries({ queryKey: ["lb", lbName, "listeners"] });
    },
  });
}

export function useLBTargetGroups(lbName: string) {
  return useQuery({
    queryKey: ["lb", lbName, "target-groups"],
    queryFn: () => apiFetch<LBTargetGroup[]>(`/lb/${lbName}/target-groups`),
    enabled: !!lbName,
  });
}

export function useCreateLBTargetGroup(lbName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; protocol: string; port: number; healthPath?: string }) =>
      apiFetch(`/lb/${lbName}/target-groups`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lb", lbName] });
      qc.invalidateQueries({ queryKey: ["lb", lbName, "target-groups"] });
    },
  });
}

export function useDeleteLBTargetGroup(lbName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tgId: string) => apiFetch(`/lb/${lbName}/target-groups/${tgId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lb", lbName] });
      qc.invalidateQueries({ queryKey: ["lb", lbName, "target-groups"] });
    },
  });
}

export function useAddLBTarget(lbName: string, tgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { address: string }) =>
      apiFetch(`/lb/${lbName}/target-groups/${tgId}/targets`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lb", lbName] }),
  });
}

export function useRemoveLBTarget(lbName: string, tgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetId: string) =>
      apiFetch(`/lb/${lbName}/target-groups/${tgId}/targets/${encodeURIComponent(targetId)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lb", lbName] }),
  });
}

export function useAttachListenerCert(lbName: string, listenerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { certId: string; hostname?: string }) =>
      apiFetch(`/lb/${lbName}/listeners/${listenerId}/certificates`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lb", lbName] }),
  });
}

export function useDetachListenerCert(lbName: string, listenerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (certId: string) =>
      apiFetch(`/lb/${lbName}/listeners/${listenerId}/certificates?certId=${encodeURIComponent(certId)}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lb", lbName] }),
  });
}

// Legacy backend helpers (migrated LBs may still expose backends)
export function useAddLBBackend(lbName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { address: string }) =>
      apiFetch(`/lb/${lbName}/backends`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lb", lbName] }),
  });
}

export function useRemoveLBBackend(lbName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (address: string) =>
      apiFetch(`/lb/${lbName}/backends/${encodeURIComponent(address)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lb", lbName] }),
  });
}

// ─── Firewalls ─────────────────────────────────────────────────────────────

export function useFirewalls() {
  return useQuery({
    queryKey: ["firewalls"],
    queryFn: () => apiFetch<Firewall[]>("/firewalls"),
  });
}

export function useCreateFirewall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; network: string }) =>
      apiFetch("/firewalls", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["firewalls"] }),
  });
}

export function useApplyFirewall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch(`/firewalls/${name}/apply`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["firewalls"] }),
  });
}

export function useFirewallRules(name: string) {
  return useQuery({
    queryKey: ["firewall-rules", name],
    queryFn: () => apiFetch<import("@/types/capper").FirewallRule[]>(`/firewalls/${name}/rules`),
    enabled: !!name,
  });
}

export function useCreateFirewallRule(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<import("@/types/capper").FirewallRule, "id">) =>
      apiFetch(`/firewalls/${name}/rules`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["firewall-rules", name] });
      qc.invalidateQueries({ queryKey: ["firewalls"] });
    },
  });
}

export function useDeleteFirewallRule(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) =>
      apiFetch(`/firewalls/${name}/rules/${ruleId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["firewall-rules", name] });
      qc.invalidateQueries({ queryKey: ["firewalls"] });
    },
  });
}

// ─── Health Checks ─────────────────────────────────────────────────────────

export function useHealthChecks() {
  return useQuery({
    queryKey: ["health-checks"],
    queryFn: () => apiFetch<HealthCheckResult[]>("/health-checks"),
    refetchInterval: 10000,
  });
}

// ─── Stacks ────────────────────────────────────────────────────────────────

export function useStacks() {
  return useQuery({
    queryKey: ["stacks"],
    queryFn: () => apiFetch<Stack[]>("/stacks"),
  });
}

export function useStack(name: string) {
  return useQuery({
    queryKey: ["stacks", name],
    queryFn: () => apiFetch<Stack>(`/stacks/${name}`),
    enabled: !!name,
  });
}

export function useDestroyStack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch(`/stacks/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stacks"] }),
  });
}

// ─── Databases ─────────────────────────────────────────────────────────────

export function useDatabases() {
  return useQuery({
    queryKey: ["databases"],
    queryFn: () => apiFetch<Database[]>("/databases"),
  });
}

export function useCreateDatabase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; engine: DBEngine; version?: string }) =>
      apiFetch("/databases", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["databases"] }),
  });
}

export function useDeleteDatabase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch(`/databases/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["databases"] }),
  });
}

// ─── AI Control Plane ──────────────────────────────────────────────────────

export function useAIAgents() {
  return useQuery({
    queryKey: ["ai-agents"],
    queryFn: () => apiFetch<AIAgent[]>("/ai/agents"),
  });
}

export function useCreateAIAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; model: string }) =>
      apiFetch("/ai/agents", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-agents"] }),
  });
}

export function useAISessions() {
  return useQuery({
    queryKey: ["ai-sessions"],
    queryFn: () => apiFetch<AISession[]>("/ai/sessions"),
  });
}

export function useMCPServers() {
  return useQuery({
    queryKey: ["ai-mcp"],
    queryFn: () => apiFetch<MCPServer[]>("/ai/mcp"),
  });
}

export function useCreateMCPServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; endpoint: string }) =>
      apiFetch("/ai/mcp", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-mcp"] }),
  });
}

// ─── Backups ───────────────────────────────────────────────────────────────

export function useBackups() {
  return useQuery({
    queryKey: ["backups"],
    queryFn: () => apiFetch<Backup[]>("/backups"),
  });
}

export function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/backups", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backups"] }),
  });
}

export function useRestoreBackup() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/backups/${id}/restore`, { method: "POST" }),
  });
}

export function useBackupPolicies() {
  return useQuery({
    queryKey: ["backup-policies"],
    queryFn: () => apiFetch<BackupPolicy[]>("/backup-policies"),
  });
}

export function useCreateBackupPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; type: string; interval: string; retention: number }) =>
      apiFetch("/backup-policies", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backup-policies"] }),
  });
}

export function useDeleteBackupPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/backup-policies/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backup-policies"] }),
  });
}

// ─── Quotas ────────────────────────────────────────────────────────────────

export function useQuotas() {
  return useQuery({
    queryKey: ["quotas"],
    queryFn: () => apiFetch<Quota[]>("/quotas"),
  });
}

export function useSetQuota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resource: string; limit: number }) =>
      apiFetch("/quotas", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotas"] }),
  });
}

// ─── Posture ───────────────────────────────────────────────────────────────

export function usePostureFindings() {
  return useQuery({
    queryKey: ["posture-findings"],
    queryFn: () => apiFetch<PostureFinding[]>("/posture/findings"),
  });
}

export function useRunPostureScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/posture/scan", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posture-findings"] }),
  });
}

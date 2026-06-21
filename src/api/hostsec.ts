import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

// Admin host-OS security: fail2ban + UFW. Both are driven by exclusive
// server-side workers; these hooks just call the admin API.

// ---- fail2ban --------------------------------------------------------------

export interface Fail2banJail {
  name: string;
  currentlyBanned: number;
  totalBanned: number;
  currentlyFailed: number;
  totalFailed: number;
  bannedIps: string[] | null;
  banTime: number;
  findTime: number;
  maxRetry: number;
}

export interface Fail2banBannedIP {
  ip: string;
  jails: string[];
}

export interface Fail2banStatus {
  available: boolean;
  running: boolean;
  version?: string;
  totalBanned: number;
  jails: Fail2banJail[] | null;
  banned: Fail2banBannedIP[] | null;
}

export function useFail2banStatus() {
  return useQuery({
    queryKey: ["admin-fail2ban"],
    queryFn: () => apiFetch<Fail2banStatus>("/admin/fail2ban/status"),
  });
}

export function useFail2banBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { jail: string; ip: string }) =>
      apiFetch("/admin/fail2ban/ban", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-fail2ban"] }),
  });
}

export function useFail2banUnban() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { jail: string; ip: string }) =>
      apiFetch("/admin/fail2ban/unban", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fail2ban"] });
      qc.invalidateQueries({ queryKey: ["admin-fail2ban-blocklist"] });
    },
  });
}

export function useFail2banUnbanAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ip: string) =>
      apiFetch("/admin/fail2ban/unban-all", { method: "POST", body: JSON.stringify({ ip }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fail2ban"] });
      qc.invalidateQueries({ queryKey: ["admin-fail2ban-blocklist"] });
    },
  });
}

export function useFail2banFlush() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/admin/fail2ban/flush", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-fail2ban"] }),
  });
}

export function useFail2banReload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jail?: string) =>
      apiFetch("/admin/fail2ban/reload", { method: "POST", body: JSON.stringify({ jail: jail ?? "" }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-fail2ban"] }),
  });
}

export interface BlocklistEntry {
  id: string;
  jail: string;
  ip: string;
  reason?: string;
  createdAt?: string;
}

export function useFail2banBlocklist() {
  return useQuery({
    queryKey: ["admin-fail2ban-blocklist"],
    queryFn: () => apiFetch<BlocklistEntry[]>("/admin/fail2ban/blocklist"),
  });
}

export function useFail2banAddBlocklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { jail: string; ip: string; reason?: string }) =>
      apiFetch("/admin/fail2ban/blocklist", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fail2ban-blocklist"] });
      qc.invalidateQueries({ queryKey: ["admin-fail2ban"] });
    },
  });
}

export function useFail2banRemoveBlocklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/fail2ban/blocklist/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fail2ban-blocklist"] });
      qc.invalidateQueries({ queryKey: ["admin-fail2ban"] });
    },
  });
}

export function useFail2banAllowlist() {
  return useQuery({
    queryKey: ["admin-fail2ban-allowlist"],
    queryFn: () => apiFetch<{ ips: string[] }>("/admin/fail2ban/allowlist"),
  });
}

export function useFail2banSetAllowlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ips: string[]) =>
      apiFetch("/admin/fail2ban/allowlist", { method: "PUT", body: JSON.stringify({ ips }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-fail2ban-allowlist"] }),
  });
}

// ---- UFW -------------------------------------------------------------------

export interface UFWRule {
  num: number;
  to: string;
  action: string;
  from: string;
  raw: string;
}

export interface UFWStatus {
  available: boolean;
  enabled: boolean;
  rules: UFWRule[];
}

export function useUFWStatus() {
  return useQuery({ queryKey: ["admin-ufw"], queryFn: () => apiFetch<UFWStatus>("/admin/ufw/status") });
}

export function useUFWAddRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { action: string; port?: string; proto?: string; from?: string; comment?: string }) =>
      apiFetch("/admin/ufw/rules", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ufw"] }),
  });
}

export function useUFWDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (num: number) => apiFetch(`/admin/ufw/rules/${num}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ufw"] }),
  });
}

export function useUFWSetEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      apiFetch(`/admin/ufw/${enabled ? "enable" : "disable"}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ufw"] }),
  });
}

export interface UFWDefaults {
  incoming: string;
  outgoing: string;
  routed: string;
}

export function useUFWDefaults() {
  return useQuery({ queryKey: ["admin-ufw-defaults"], queryFn: () => apiFetch<UFWDefaults>("/admin/ufw/defaults") });
}

export function useUFWSetDefault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { direction: string; policy: string }) =>
      apiFetch("/admin/ufw/defaults", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ufw-defaults"] });
      qc.invalidateQueries({ queryKey: ["admin-ufw"] });
    },
  });
}

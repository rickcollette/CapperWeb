import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, API_BASE } from "@/api/client";
import type { Bucket, DNSRecord, DNSZone, Network, StorageObject, Volume } from "@/types/capper";

export function useNetworks() {
  return useQuery({
    queryKey: ["networks"],
    queryFn: () => apiFetch<Network[]>("/networks"),
  });
}

export function useNetwork(name: string) {
  return useQuery({
    queryKey: ["networks", name],
    queryFn: () =>
      apiFetch<{ network: Network; leases: { instanceId: string; ip: string; mac: string; createdAt: string }[] }>(`/networks/${name}`),
    enabled: !!name,
  });
}

export function useCreateNetwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; subnet?: string; mode?: string }) =>
      apiFetch("/networks", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["networks"] }),
  });
}

export function useDeleteNetwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/networks/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["networks"] }),
  });
}

export function usePeerNetworks() {
  return useQuery({
    queryKey: ["networks"],
    queryFn: () => apiFetch<Network[]>("/networks"),
  });
}

export function useAttachNetwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { network: string; instance: string }) =>
      apiFetch(`/networks/${body.network}/attach/${body.instance}`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["networks"] });
      qc.invalidateQueries({ queryKey: ["instances"] });
    },
  });
}

export function useDetachNetwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { network: string; instance: string }) =>
      apiFetch(`/networks/${body.network}/detach/${body.instance}`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["networks"] });
      qc.invalidateQueries({ queryKey: ["instances"] });
    },
  });
}

export function useBuckets() {
  return useQuery({
    queryKey: ["buckets"],
    queryFn: () => apiFetch<Bucket[]>("/storage/buckets"),
  });
}

export function useCreateBucket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; versioning?: boolean }) =>
      apiFetch("/storage/buckets", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buckets"] }),
  });
}

export function useBucket(name: string) {
  return useQuery({
    queryKey: ["buckets", name],
    queryFn: () => apiFetch<Bucket>(`/storage/buckets/${name}`),
    enabled: !!name,
  });
}

export function useBucketObjects(bucket: string, prefix = "") {
  return useQuery({
    queryKey: ["buckets", bucket, "objects", prefix],
    queryFn: () =>
      apiFetch<StorageObject[]>(
        `/storage/buckets/${bucket}/objects?prefix=${encodeURIComponent(prefix)}`,
      ),
    enabled: !!bucket,
  });
}

export function useVolumes() {
  return useQuery({
    queryKey: ["volumes"],
    queryFn: () => apiFetch<Volume[]>("/storage/volumes"),
  });
}

export function useCreateVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; sizeBytes: number }) =>
      apiFetch("/storage/volumes", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["volumes"] }),
  });
}

export function useDNSZones() {
  return useQuery({
    queryKey: ["dns-zones"],
    queryFn: () => apiFetch<DNSZone[]>("/dns/zones"),
  });
}

export function useCreateDNSZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; type?: string }) =>
      apiFetch("/dns/zones", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dns-zones"] }),
  });
}

export function useCreateDNSRecord(zone: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; type: string; values: string[]; ttl?: number }) =>
      apiFetch(`/dns/zones/${zone}/records`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dns-zones", zone] }),
  });
}

export function useDNSZone(zone: string) {
  return useQuery({
    queryKey: ["dns-zones", zone],
    queryFn: () =>
      apiFetch<{ zone: DNSZone; records: DNSRecord[] }>(`/dns/zones/${zone}`),
    enabled: !!zone,
  });
}

export function useDNSQuery() {
  return useMutation({
    mutationFn: (body: { fqdn: string; type: string }) =>
      apiFetch<{ text: string; records: unknown[] }>("/dns/query", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}

export function useCapsuleTypes() {
  return useQuery({
    queryKey: ["capsule-types"],
    queryFn: () => apiFetch<import("@/types/capper").CapsuleType[]>("/capsule-types"),
  });
}

export function useCapInitTemplates() {
  return useQuery({
    queryKey: ["capinit-templates"],
    queryFn: () => apiFetch<import("@/types/capper").CapInitTemplate[]>("/capinit/templates"),
  });
}

export function useCreateCapInitTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: import("@/types/capper").CapInitTemplate) =>
      apiFetch("/capinit/templates", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capinit-templates"] }),
  });
}

export function useUpdateCapInitTemplate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: import("@/types/capper").CapInitTemplate) =>
      apiFetch(`/capinit/templates/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capinit-templates"] }),
  });
}

export function useDeleteCapInitTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/capinit/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capinit-templates"] }),
  });
}

export function useCapInitRender() {
  return useMutation({
    mutationFn: (body: { templateId: string; vars?: Record<string, unknown> }) =>
      apiFetch<{ rendered: string }>("/capinit/render", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}

export function useCapInitStatus() {
  return useQuery({
    queryKey: ["capinit-status"],
    queryFn: () => apiFetch<{ enabled: boolean; metadataIP: string; templates: number }>("/capinit/status"),
  });
}

export function useIAMUsers() {
  return useQuery({
    queryKey: ["iam-users"],
    queryFn: () => apiFetch<import("@/types/capper").IAMUser[]>("/iam/users"),
  });
}

export function useCreateIAMUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; localUser?: string }) =>
      apiFetch("/iam/users", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["iam-users"] }),
  });
}

export function useIAMGroups() {
  return useQuery({
    queryKey: ["iam-groups"],
    queryFn: () => apiFetch<import("@/types/capper").IAMGroup[]>("/iam/groups"),
  });
}

export function useCreateIAMGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      apiFetch("/iam/groups", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["iam-groups"] }),
  });
}

export function useIAMRoles() {
  return useQuery({
    queryKey: ["iam-roles"],
    queryFn: () => apiFetch<import("@/types/capper").IAMRole[]>("/iam/roles"),
  });
}

export function useCreateIAMRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      apiFetch("/iam/roles", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["iam-roles"] }),
  });
}

export function useIAMPolicies() {
  return useQuery({
    queryKey: ["iam-policies"],
    queryFn: () => apiFetch<import("@/types/capper").IAMPolicy[]>("/iam/policies"),
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ["audit"],
    queryFn: () => apiFetch<import("@/types/capper").AuditRecord[]>("/iam/audit?limit=100"),
    refetchInterval: 10000,
  });
}

export function useUploadObject(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, file }: { key: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(
        `${API_BASE}/storage/buckets/${bucket}/objects/${encodeURIComponent(key)}`,
        { method: "POST", body: form, credentials: "include" },
      );
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buckets", bucket, "objects"] }),
  });
}

export function useDeleteObject(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) =>
      apiFetch(`/storage/buckets/${bucket}/objects/${encodeURIComponent(key)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buckets", bucket, "objects"] }),
  });
}

export function objectDownloadUrl(bucket: string, key: string) {
  return `${API_BASE}/storage/buckets/${bucket}/objects/${encodeURIComponent(key)}`;
}

export function useAttachVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { volume: string; instanceId: string; mountPath: string }) =>
      apiFetch(`/storage/volumes/${body.volume}/attach`, {
        method: "POST",
        body: JSON.stringify({ instanceId: body.instanceId, mountPath: body.mountPath }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["volumes"] }),
  });
}

export function useDetachVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch(`/storage/volumes/${name}/detach`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["volumes"] }),
  });
}

export function useIAMSimulate() {
  return useMutation({
    mutationFn: (body: { action: string; resource: string }) =>
      apiFetch<{ allowed: boolean; reason: string }>("/iam/simulate", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}

export function useIAMTokens() {
  return useQuery({
    queryKey: ["iam-tokens"],
    queryFn: () => apiFetch<import("@/types/capper").IAMToken[]>("/iam/tokens"),
  });
}

export function useIssueToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; ttl?: string }) =>
      apiFetch<{ token: unknown; bearer: string }>("/iam/tokens", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["iam-tokens"] }),
  });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: import("@/types/capper").IAMPolicy) =>
      apiFetch("/iam/policies", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["iam-policies"] }),
  });
}

export function useDeprecateCapsuleType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch(`/capsule-types/${name}/deprecate`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capsule-types"] }),
  });
}

export function useMarketplaceImages() {
  return useQuery({
    queryKey: ["marketplace"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/marketplace/images`, { credentials: "include" });
      const body = await res.json();
      return body.data as import("@/types/capper").MarketplaceListing[];
    },
  });
}

export function useMarketplaceAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" | "quarantine" | "install" }) =>
      apiFetch(`/marketplace/images/${id}/${action}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
  });
}

export function useFactoryStatus() {
  return useQuery({
    queryKey: ["factory-status"],
    queryFn: () => apiFetch<import("@/types/capper").FactoryStatus>("/factory/status"),
  });
}

export function useFactorySync() {
  return useQuery({
    queryKey: ["factory-sync"],
    queryFn: () => apiFetch<import("@/types/capper").FactorySyncStatus>("/factory/sync/status"),
  });
}

export function useFactoryJobs() {
  return useQuery({
    queryKey: ["factory-jobs"],
    queryFn: () => apiFetch<unknown[]>("/factory/jobs"),
  });
}

export function useAddGroupMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ group, user }: { group: string; user: string }) =>
      apiFetch(`/iam/groups/${group}/members`, {
        method: "POST",
        body: JSON.stringify({ user }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["iam-groups"] }),
  });
}

export function useRemoveGroupMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ group, user }: { group: string; user: string }) =>
      apiFetch(`/iam/groups/${group}/members/${user}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["iam-groups"] }),
  });
}

export function useDeleteIAMUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch(`/iam/users/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["iam-users"] }),
  });
}

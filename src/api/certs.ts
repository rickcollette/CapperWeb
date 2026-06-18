import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  name: string;
  commonName: string;
  status: string;
  expiresAt: string;
  renewAfter?: string;
  autoRenew: boolean;
  issuerType: string;
  acmeAccountId?: string;
  domains?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CertBinding {
  id: string;
  certId: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
}

export interface ACMEAccount {
  id: string;
  name: string;
  email: string;
  directoryUrl: string;
  issuerType: string;
  status: string;
  createdAt: string;
}

// ── Certificates ─────────────────────────────────────────────────────────────

export function useCertificates() {
  return useQuery({
    queryKey: ["certificates"],
    queryFn: () => apiFetch<Certificate[]>("/certificates"),
  });
}

export function useCertificate(id: string) {
  return useQuery({
    queryKey: ["certificates", id],
    queryFn: () => apiFetch<Certificate>(`/certificates/${id}`),
    enabled: !!id,
  });
}

export function useCreateCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      issuerType: "letsencrypt" | "import";
      domains?: string[];
      validationMethod?: string;
      acmeAccountId?: string;
      autoRenew?: boolean;
      certPem?: string;
      keyPem?: string;
    }) => apiFetch<Certificate>("/certificates", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certificates"] }),
  });
}

export function useDeleteCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/certificates/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certificates"] }),
  });
}

export function useRenewCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Certificate>(`/certificates/${id}/renew`, { method: "POST" }),
    onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ["certificates", id] }),
  });
}

export function useRevokeCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/certificates/${id}/revoke`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certificates"] }),
  });
}

export function useCertBindings(certId: string) {
  return useQuery({
    queryKey: ["certificates", certId, "bindings"],
    queryFn: () => apiFetch<CertBinding[]>(`/certificates/${certId}/bindings`),
    enabled: !!certId,
  });
}

// ── ACME Accounts ─────────────────────────────────────────────────────────────

export function useACMEAccounts() {
  return useQuery({
    queryKey: ["acme-accounts"],
    queryFn: () => apiFetch<ACMEAccount[]>("/certificates/acme-accounts"),
  });
}

export function useCreateACMEAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; email: string; issuerType: string }) =>
      apiFetch<ACMEAccount>("/certificates/acme-accounts", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acme-accounts"] }),
  });
}

export function useDeleteACMEAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/certificates/acme-accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acme-accounts"] }),
  });
}

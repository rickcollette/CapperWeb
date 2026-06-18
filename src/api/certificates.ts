import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

// ---- Types -----------------------------------------------------------------

export interface Certificate {
  id: string;
  project: string;
  accountId: string;
  name: string;
  commonName: string;
  sans: string[];
  issuer: string;
  status:
    | "pending"
    | "validating"
    | "issued"
    | "attached"
    | "renewing"
    | "renewed"
    | "failed"
    | "expired"
    | "revoked"
    | "imported";
  validationMethod: "http-01" | "dns-01";
  acmeAccountId: string;
  activeVersionId: string;
  notBefore: string;
  notAfter: string;
  autoRenew: boolean;
  renewAfter: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateVersion {
  id: string;
  certificateId: string;
  certPem?: string;
  chainPem?: string;
  fullChainPem?: string;
  privateKeyRef: string;
  fingerprintSha256: string;
  serialNumber: string;
  notBefore: string;
  notAfter: string;
  createdAt: string;
}

export interface ACMEAccount {
  id: string;
  name: string;
  email: string;
  directoryUrl: string;
  status: string;
  privateKeyRef: string;
  externalAccountBinding?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateBinding {
  id: string;
  certificateId: string;
  targetType: "lb" | "ingress";
  targetId: string;
  hostname: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ---- ACME Account hooks ----------------------------------------------------

export function useACMEAccounts() {
  return useQuery({
    queryKey: ["acme-accounts"],
    queryFn: () => apiFetch<ACMEAccount[]>("/certificates/acme/accounts"),
  });
}

export function useACMEAccount(name: string) {
  return useQuery({
    queryKey: ["acme-accounts", name],
    queryFn: () => apiFetch<ACMEAccount>(`/certificates/acme/accounts/${name}`),
    enabled: !!name,
  });
}

export interface CreateACMEAccountRequest {
  name: string;
  email: string;
  directoryUrl?: string;
  issuer?: "staging" | "production" | "letsencrypt";
}

export function useCreateACMEAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateACMEAccountRequest) =>
      apiFetch<ACMEAccount>("/certificates/acme/accounts", {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acme-accounts"] });
    },
  });
}

export function useDeleteACMEAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<void>(`/certificates/acme/accounts/${name}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acme-accounts"] });
    },
  });
}

// ---- Certificate hooks -----------------------------------------------------

export function useCertificates(status?: string) {
  return useQuery({
    queryKey: ["certificates", status],
    queryFn: () => {
      const params = status ? `?status=${encodeURIComponent(status)}` : "";
      return apiFetch<Certificate[]>(`/certificates${params}`);
    },
    refetchInterval: 10000,
  });
}

export function useCertificate(id: string) {
  return useQuery({
    queryKey: ["certificates", id],
    queryFn: () => apiFetch<Certificate>(`/certificates/${id}`),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export interface CreateCertificateRequest {
  name: string;
  // For ACME-issued certs:
  commonName?: string;
  sans?: string[];
  issuer?: string;
  validationMethod?: "http-01" | "dns-01";
  acmeAccount?: string;
  autoRenew?: boolean;
  project?: string;
  // For imported certs:
  certPem?: string;
  keyPem?: string;
  chainPem?: string;
}

export function useCreateCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCertificateRequest) =>
      apiFetch<Certificate>("/certificates", {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}

export function useDeleteCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/certificates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}

export function useRenewCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Certificate>(`/certificates/${id}/renew`, { method: "POST" }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
      qc.invalidateQueries({ queryKey: ["certificates", id] });
    },
  });
}

export function useReissueCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Certificate>(`/certificates/${id}/reissue`, { method: "POST" }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
      qc.invalidateQueries({ queryKey: ["certificates", id] });
    },
  });
}

export function useRevokeCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiFetch<void>(`/certificates/${id}/revoke`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
      qc.invalidateQueries({ queryKey: ["certificates", id] });
    },
  });
}

// ---- Certificate Binding hooks ---------------------------------------------

export function useCertBindings(certId: string) {
  return useQuery({
    queryKey: ["certificates", certId, "bindings"],
    queryFn: () =>
      apiFetch<CertificateBinding[]>(`/certificates/${certId}/bindings`),
    enabled: !!certId,
  });
}

export interface CreateCertBindingRequest {
  targetType: "lb" | "ingress";
  targetId: string;
  hostname: string;
}

export function useCreateCertBinding(certId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCertBindingRequest) =>
      apiFetch<CertificateBinding>(`/certificates/${certId}/bindings`, {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificates", certId, "bindings"] });
    },
  });
}

export function useDeleteCertBinding(certId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bindingId: string) =>
      apiFetch<void>(`/certificates/${certId}/bindings/${bindingId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificates", certId, "bindings"] });
    },
  });
}

// ---- LB Certificate attachment hooks ---------------------------------------

export function useAttachCertToLB() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lbId,
      certId,
      hostname,
    }: {
      lbId: string;
      certId: string;
      hostname: string;
    }) =>
      apiFetch<void>(`/lb/${lbId}/certificates`, {
        method: "POST",
        body: JSON.stringify({ certId, hostname }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}

export function useDetachCertFromLB() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lbId,
      certId,
      hostname,
    }: {
      lbId: string;
      certId: string;
      hostname?: string;
    }) => {
      const params = hostname
        ? `?hostname=${encodeURIComponent(hostname)}`
        : "";
      return apiFetch<void>(`/lb/${lbId}/certificates/${certId}${params}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}

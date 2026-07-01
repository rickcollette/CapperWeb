import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface S3Credential {
  id: string;
  accessKeyId: string;
  secretAccessKey?: string;
  status: "active" | "inactive";
  createdAt?: string;
  lastUsedAt?: string;
  tags?: Record<string, string>;
}

export interface CreateS3CredentialResponse {
  id: string;
  accessKeyId: string;
  secretAccessKey: string;
  createdAt: string;
}

export function useS3Credentials() {
  return useQuery({
    queryKey: ["s3-credentials"],
    queryFn: () => apiFetch<S3Credential[]>("/s3/credentials"),
    refetchInterval: 5000,
  });
}

export function useCreateS3Credential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<CreateS3CredentialResponse>("/s3/credentials", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["s3-credentials"] });
    },
  });
}

export function useDeleteS3Credential(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/s3/credentials/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["s3-credentials"] });
    },
  });
}

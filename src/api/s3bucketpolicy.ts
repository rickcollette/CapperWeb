import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface S3BucketPolicy {
  bucket: string;
  policy: Record<string, any>;
  lastModified?: string;
}

export function useS3BucketPolicy(bucket: string) {
  return useQuery({
    queryKey: ["s3-bucket-policy", bucket],
    queryFn: () => apiFetch<S3BucketPolicy>(`/s3/buckets/${bucket}/policy`),
    enabled: !!bucket,
  });
}

export function useUpdateS3BucketPolicy(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policy: Record<string, any>) =>
      apiFetch(`/s3/buckets/${bucket}/policy`, {
        method: "PUT",
        body: JSON.stringify({ policy }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["s3-bucket-policy", bucket] });
    },
  });
}

export function useDeleteS3BucketPolicy(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/s3/buckets/${bucket}/policy`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["s3-bucket-policy", bucket] });
    },
  });
}

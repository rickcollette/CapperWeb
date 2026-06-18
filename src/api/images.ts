import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchWithCaps, API_BASE } from "@/api/client";
import type { CapperImage, MarketplaceListing } from "@/types/capper";

export function useImages() {
  return useQuery({
    queryKey: ["images"],
    queryFn: () => apiFetch<CapperImage[]>("/images"),
  });
}

export function useImage(name: string) {
  return useQuery({
    queryKey: ["images", name],
    queryFn: () =>
      apiFetchWithCaps<{ image: CapperImage; manifest: unknown }>(
        `/images/${encodeURIComponent(name)}`,
      ),
    enabled: !!name,
  });
}

export function useScanImage(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/images/${encodeURIComponent(name)}/scan`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images", name] }),
  });
}

export function useImageSBOM(name: string) {
  return useMutation({
    mutationFn: async (embed?: boolean) => {
      const res = await fetch(
        `${API_BASE}/images/${encodeURIComponent(name)}/sbom${embed ? "?embed=true" : ""}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("SBOM generation failed");
      return res.text();
    },
  });
}

export function useUploadImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, name }: { file: File; name?: string }) => {
      const form = new FormData();
      form.append("file", file);
      if (name) form.append("name", name);
      const res = await fetch(`${API_BASE}/images/upload`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const body = await res.json();
      return body.data as CapperImage;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images"] }),
  });
}

export function usePublishImage(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { description?: string; labels?: Record<string, string> }) =>
      apiFetch<MarketplaceListing>(`/images/${encodeURIComponent(name)}/publish`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
  });
}

export function useDeleteImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch(`/images/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images"] }),
  });
}

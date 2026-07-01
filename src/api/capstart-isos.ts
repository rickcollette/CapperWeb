import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface ISO {
  id: string;
  name: string;
  version?: string;
  osType: string;
  architecture: string;
  fileSize?: number;
  checksum?: string;
  checksumType?: string;
  storagePath?: string;
  isVerified: boolean;
  url?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface UploadISORequest {
  name: string;
  version?: string;
  osType: string;
  architecture: string;
  checksum?: string;
  checksumType?: string;
  url?: string;
}

interface VerifyISOResult {
  valid: boolean;
  verified: boolean;
  checksum: string;
  message: string;
}

const API_BASE = "/api/v1/capstart";

// List all ISOs
export function useListISOs(osType?: string) {
  return useQuery({
    queryKey: ["capstart-isos", osType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (osType) params.append("os_type", osType);

      const response = await axios.get<{ data: ISO[] }>(
        `${API_BASE}/isos?${params}`
      );
      return response.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get a specific ISO
export function useGetISO(isoId: string) {
  return useQuery({
    queryKey: ["capstart-iso", isoId],
    queryFn: async () => {
      const response = await axios.get<{ data: ISO }>(
        `${API_BASE}/isos/${isoId}`
      );
      return response.data.data;
    },
    enabled: !!isoId,
    staleTime: 5 * 60 * 1000,
  });
}

// Upload ISO (URL-based or file)
export function useUploadISO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      file?: File;
      urlRequest?: UploadISORequest;
    }) => {
      if (payload.file) {
        // File upload
        const formData = new FormData();
        formData.append("file", payload.file);
        formData.append("name", payload.file.name.replace(/\.[^.]+$/, ""));
        formData.append("osType", "linux"); // Default, could be made configurable

        const response = await axios.post<{ data: ISO }>(
          `${API_BASE}/isos`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        return response.data.data;
      } else if (payload.urlRequest) {
        // URL-based ISO
        const response = await axios.post<{ data: ISO }>(
          `${API_BASE}/isos`,
          payload.urlRequest,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        return response.data.data;
      }
      throw new Error("Either file or urlRequest must be provided");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capstart-isos"] });
    },
  });
}

// Delete ISO
export function useDeleteISO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isoId: string) => {
      await axios.delete(`${API_BASE}/isos/${isoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capstart-isos"] });
    },
  });
}

// Verify ISO integrity
export function useVerifyISO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isoId: string) => {
      const response = await axios.post<{ data: VerifyISOResult }>(
        `${API_BASE}/isos/${isoId}/verify`
      );
      return response.data.data;
    },
    onSuccess: (_, isoId) => {
      queryClient.invalidateQueries({ queryKey: ["capstart-iso", isoId] });
      queryClient.invalidateQueries({ queryKey: ["capstart-isos"] });
    },
  });
}

// Start OS installation from ISO
export function useStartInstallation() {
  return useMutation({
    mutationFn: async (payload: {
      isoID: string;
      vmID: string;
      timeout?: number;
    }) => {
      const response = await axios.post(`${API_BASE}/install`, payload);
      return response.data.data;
    },
  });
}

// Get installation status
export function useGetInstallationStatus(jobId: string) {
  return useQuery({
    queryKey: ["capstart-installation", jobId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE}/install/${jobId}`
      );
      return response.data.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.status === "success" || data.status === "failed") {
        return false;
      }
      return 2000; // Poll every 2 seconds while running
    },
  });
}

// Cancel installation
export function useCancelInstallation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      await axios.post(`${API_BASE}/install/${jobId}/cancel`);
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["capstart-installation", jobId] });
    },
  });
}

// Get installation logs (polling)
export function useInstallationLogs(jobId: string) {
  return useQuery({
    queryKey: ["capstart-installation-logs", jobId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE}/install/${jobId}/logs`
      );
      return response.data.data;
    },
    enabled: !!jobId,
    refetchInterval: 2000,
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface NetworkInterface {
  id: string;
  vpcId: string;
  subnetId: string;
  status: "available" | "in-use" | "creating" | "deleting";
  description?: string;
  macAddress: string;
  privateIpAddress: string;
  privateIpAddresses?: Array<{
    privateIpAddress: string;
    primary: boolean;
    publicIpAddress?: string;
  }>;
  ipv6Addresses?: string[];
  securityGroupIds?: string[];
  attachmentId?: string;
  attachedInstanceId?: string;
  attachedDeviceIndex?: number;
  tags?: Record<string, string>;
  createdAt?: string;
}

export interface CreateENIRequest {
  vpcId: string;
  subnetId: string;
  description?: string;
  securityGroupIds?: string[];
  privateIpAddress?: string;
  privateIpAddresses?: string[];
}

export interface AttachENIRequest {
  instanceId: string;
  deviceIndex: number;
}

export function useNetworkInterfaces() {
  return useQuery({
    queryKey: ["network-interfaces"],
    queryFn: () => apiFetch<NetworkInterface[]>("/network-interfaces"),
    refetchInterval: 5000,
  });
}

export function useNetworkInterface(id: string) {
  return useQuery({
    queryKey: ["network-interfaces", id],
    queryFn: () => apiFetch<NetworkInterface>(`/network-interfaces/${id}`),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useCreateNetworkInterface() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateENIRequest) =>
      apiFetch("/network-interfaces", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network-interfaces"] });
    },
  });
}

export function useDeleteNetworkInterface(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/network-interfaces/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network-interfaces"] });
      qc.removeQueries({ queryKey: ["network-interfaces", id] });
    },
  });
}

export function useAttachNetworkInterface(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AttachENIRequest) =>
      apiFetch(`/network-interfaces/${id}/attach`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network-interfaces"] });
      qc.invalidateQueries({ queryKey: ["network-interfaces", id] });
    },
  });
}

export function useDetachNetworkInterface(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/network-interfaces/${id}/detach`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network-interfaces"] });
      qc.invalidateQueries({ queryKey: ["network-interfaces", id] });
    },
  });
}

export function useAddPrivateIp(eniId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { privateIpAddresses: string[] }) =>
      apiFetch(`/network-interfaces/${eniId}/private-ips`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network-interfaces", eniId] });
      qc.invalidateQueries({ queryKey: ["network-interfaces"] });
    },
  });
}

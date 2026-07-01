import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface Subnet {
  id: string;
  vpcId: string;
  cidrBlock: string;
  availabilityZone: string;
  status: "available" | "pending";
  availableIpAddressCount: number;
  mapPublicIpOnLaunch?: boolean;
  defaultForAz?: boolean;
  routeTableId?: string;
  tags?: Record<string, string>;
  createdAt?: string;
}

export interface UpdateSubnetRequest {
  mapPublicIpOnLaunch?: boolean;
  tags?: Record<string, string>;
}

export function useSubnet(subnetId: string) {
  return useQuery({
    queryKey: ["subnets", subnetId],
    queryFn: () => apiFetch<Subnet>(`/subnets/${subnetId}`),
    enabled: !!subnetId,
    refetchInterval: 5000,
  });
}

export function useUpdateSubnet(subnetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSubnetRequest) =>
      apiFetch(`/subnets/${subnetId}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subnets", subnetId] });
    },
  });
}

export function useAssociateRouteTable(subnetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeTableId: string) =>
      apiFetch(`/subnets/${subnetId}/associate-route-table`, {
        method: "POST",
        body: JSON.stringify({ routeTableId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subnets", subnetId] });
    },
  });
}

export function useDisassociateRouteTable(subnetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/subnets/${subnetId}/disassociate-route-table`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subnets", subnetId] });
    },
  });
}

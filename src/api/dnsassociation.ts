import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface DNSZoneVPCAssociation {
  zoneId: string;
  vpcId: string;
  associationId?: string;
  createdAt?: string;
}

export function useDNSZoneVPCAssociations(zoneId: string) {
  return useQuery({
    queryKey: ["dns-zone-associations", zoneId],
    queryFn: () =>
      apiFetch<DNSZoneVPCAssociation[]>(`/dns/zones/${zoneId}/vpc-associations`),
    enabled: !!zoneId,
    refetchInterval: 5000,
  });
}

export function useAssociateDNSZoneToVPC(zoneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vpcId: string) =>
      apiFetch(`/dns/zones/${zoneId}/vpc-associations`, {
        method: "POST",
        body: JSON.stringify({ vpcId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dns-zone-associations", zoneId] });
    },
  });
}

export function useDisassociateDNSZoneFromVPC(zoneId: string, associationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/dns/zones/${zoneId}/vpc-associations/${associationId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dns-zone-associations", zoneId] });
    },
  });
}

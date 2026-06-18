import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';

export interface AuditEvent {
  id: string;
  orgId: string;
  accountId: string;
  projectId: string;
  actorType: string;
  actorId: string;
  actorUrn: string;
  action: string;
  resourceCrn: string;
  decision: string;
  sourceIp: string;
  userAgent: string;
  requestId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export function useAuditEvents(accountId: string, params?: { limit?: number; before?: string }) {
  return useQuery({
    queryKey: ['audit', accountId, params],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.before) qs.set('before', params.before);
      const query = qs.toString() ? `?${qs}` : '';
      return apiFetch<AuditEvent[]>(`/accounts/${accountId}/audit${query}`);
    },
    enabled: !!accountId,
  });
}

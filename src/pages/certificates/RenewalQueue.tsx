import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCertificates, useRenewCertificate, type Certificate } from "@/api/certificates";
import { Button, EmptyState, PageHeader, StatusBadge } from "@/components/common/ui";
import { cn } from "@/lib/utils";

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

function expiryColor(notAfter: string): string {
  const days = (new Date(notAfter).getTime() - Date.now()) / 86400000;
  if (days < 7) return "text-red-400";
  if (days < 30) return "text-amber-400";
  return "text-slate-300";
}

export function RenewalQueue() {
  const { data, isLoading, error } = useCertificates();
  const renew = useRenewCertificate();

  const upcoming = useMemo(() => {
    if (!data) return [];
    const cutoff = Date.now() + SIXTY_DAYS_MS;
    return data
      .filter((c: Certificate) => c.notAfter && new Date(c.notAfter).getTime() < cutoff)
      .sort(
        (a: Certificate, b: Certificate) =>
          new Date(a.notAfter).getTime() - new Date(b.notAfter).getTime(),
      );
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Renewal Queue"
        description="Certificates expiring in the next 60 days."
      />

      {isLoading && <p className="text-muted">Loading…</p>}
      {error && <p className="text-red-400">Failed to load certificates.</p>}
      {!isLoading && !upcoming.length && (
        <EmptyState
          title="No certificates expiring soon"
          description="All certificates are valid for more than 60 days."
        />
      )}
      {!isLoading && !!upcoming.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Expires</th>
                <th className="p-3">Renew After</th>
                <th className="p-3">Status</th>
                <th className="p-3">Auto-Renew</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((cert: Certificate) => (
                <tr key={cert.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3">
                    <Link
                      to={`/certificates/${cert.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {cert.name}
                    </Link>
                    {cert.commonName && (
                      <div className="text-xs text-muted">{cert.commonName}</div>
                    )}
                  </td>
                  <td
                    className={cn(
                      "p-3 text-xs",
                      cert.notAfter ? expiryColor(cert.notAfter) : "text-muted",
                    )}
                  >
                    {cert.notAfter ? new Date(cert.notAfter).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3 text-xs text-muted">
                    {cert.renewAfter ? new Date(cert.renewAfter).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={cert.status} />
                  </td>
                  <td className="p-3 text-xs">
                    {cert.autoRenew ? (
                      <span className="text-green-400">On</span>
                    ) : (
                      <span className="text-muted">Off</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={renew.isPending}
                      onClick={() => renew.mutate(cert.id)}
                    >
                      Force Renew
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

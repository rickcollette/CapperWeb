import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RotateCcw } from "lucide-react";
import {
  useCertificates,
  useRenewCertificate,
  useDeleteCertificate,
  type Certificate,
} from "@/api/certificates";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
} from "@/components/common/ui";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  validating: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  issued: "border-green-500/30 bg-green-500/15 text-green-400",
  attached: "border-green-500/30 bg-green-500/15 text-green-400",
  renewing: "border-blue-500/30 bg-blue-500/15 text-blue-400",
  renewed: "border-blue-500/30 bg-blue-500/15 text-blue-400",
  failed: "border-red-500/30 bg-red-500/15 text-red-400",
  expired: "border-red-500/30 bg-red-500/15 text-red-400",
  revoked: "border-red-500/30 bg-red-500/15 text-red-400",
  imported: "border-slate-500/30 bg-slate-500/15 text-slate-400",
};

function expiryColor(notAfter: string): string {
  const days = (new Date(notAfter).getTime() - Date.now()) / 86400000;
  if (days < 7) return "text-red-400";
  if (days < 30) return "text-amber-400";
  return "text-muted";
}

export function CertificateList() {
  const { data, isLoading, error } = useCertificates();
  const renew = useRenewCertificate();
  const del = useDeleteCertificate();
  const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null);

  return (
    <div>
      <PageHeader
        title="Certificates"
        description="TLS certificates managed by the control plane."
        actions={
          <div className="flex gap-2">
            <Link to="/certificates/acme-accounts">
              <Button>ACME Accounts</Button>
            </Link>
            <Link to="/certificates/new">
              <Button variant="primary">
                <Plus className="h-4 w-4" /> New Certificate
              </Button>
            </Link>
          </div>
        }
      />

      {isLoading && <p className="text-muted">Loading certificates…</p>}
      {error && <p className="text-red-400">Failed to load certificates.</p>}
      {!isLoading && !data?.length && (
        <EmptyState
          title="No certificates"
          description="Issue or import a certificate to enable TLS on your services."
        />
      )}
      {!isLoading && !!data?.length && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Common Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Expires</th>
                <th className="p-3">Auto-Renew</th>
                <th className="p-3">Issuer</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((cert: Certificate) => (
                <tr key={cert.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3">
                    <Link
                      to={`/certificates/${cert.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {cert.name}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs">{cert.commonName || "—"}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                        statusStyles[cert.status] ?? statusStyles.pending,
                      )}
                    >
                      {cert.status}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "p-3 text-xs",
                      cert.notAfter ? expiryColor(cert.notAfter) : "text-muted",
                    )}
                  >
                    {cert.notAfter ? new Date(cert.notAfter).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3 text-xs">
                    {cert.autoRenew ? (
                      <span className="text-green-400">On</span>
                    ) : (
                      <span className="text-muted">Off</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted capitalize">{cert.issuer || "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={renew.isPending}
                        onClick={() => renew.mutate(cert.id)}
                      >
                        <RotateCcw className="h-3 w-3" /> Renew
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteTarget(cert)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete certificate?"
        description={`Delete certificate "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) del.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

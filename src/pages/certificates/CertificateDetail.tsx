import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RefreshCw, RotateCcw, Trash2, ShieldOff } from "lucide-react";
import {
  useCertificate,
  useRenewCertificate,
  useReissueCertificate,
  useRevokeCertificate,
  useDeleteCertificate,
  useCertBindings,
  useCreateCertBinding,
  useDeleteCertBinding,
} from "@/api/certificates";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, StatusBadge } from "@/components/common/ui";
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

export function CertificateDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cert, isLoading } = useCertificate(id);
  const { data: bindings = [] } = useCertBindings(id);
  const renew = useRenewCertificate();
  const reissue = useReissueCertificate();
  const revoke = useRevokeCertificate();
  const del = useDeleteCertificate();
  const createBinding = useCreateCertBinding(id);
  const deleteBinding = useDeleteCertBinding(id);

  const [newBinding, setNewBinding] = useState({
    targetType: "lb" as "lb" | "ingress",
    targetId: "",
    hostname: "",
  });
  const [showBindingForm, setShowBindingForm] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!cert) return <p className="text-red-400">Certificate not found.</p>;

  const expiresAt = cert.notAfter ? new Date(cert.notAfter) : null;
  const daysLeft = expiresAt
    ? Math.round((expiresAt.getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div>
      <PageHeader
        title={cert.name}
        description={cert.commonName || "Certificate"}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => renew.mutate(id)}
              disabled={renew.isPending}
            >
              <RefreshCw className="h-4 w-4" /> Renew Now
            </Button>
            <Button
              onClick={() => reissue.mutate(id)}
              disabled={reissue.isPending}
            >
              <RotateCcw className="h-4 w-4" /> Reissue
            </Button>
            <Button variant="danger" onClick={() => setRevokeOpen(true)}>
              <ShieldOff className="h-4 w-4" /> Revoke
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Metadata */}
        <Card>
          <h3 className="mb-3 font-semibold">Certificate Details</h3>
          <dl className="space-y-2 text-sm">
            <MetaRow label="Status">
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                  statusStyles[cert.status] ?? statusStyles.pending,
                )}
              >
                {cert.status}
              </span>
            </MetaRow>
            <MetaRow label="Common Name">
              <code className="text-xs">{cert.commonName}</code>
            </MetaRow>
            <MetaRow label="SANs">
              <span className="text-xs text-muted">{(cert.sans || []).join(", ") || "—"}</span>
            </MetaRow>
            <MetaRow label="Issuer">{cert.issuer}</MetaRow>
            <MetaRow label="Valid From">
              {cert.notBefore ? new Date(cert.notBefore).toLocaleDateString() : "—"}
            </MetaRow>
            <MetaRow label="Valid Until">
              <span
                className={
                  daysLeft !== null && daysLeft < 14 ? "text-red-400" : undefined
                }
              >
                {cert.notAfter ? new Date(cert.notAfter).toLocaleDateString() : "—"}
                {daysLeft !== null && ` (${daysLeft < 0 ? "expired" : `${daysLeft}d`})`}
              </span>
            </MetaRow>
            <MetaRow label="Auto-Renew">{cert.autoRenew ? "Yes" : "No"}</MetaRow>
            {cert.renewAfter && (
              <MetaRow label="Renew After">
                {new Date(cert.renewAfter).toLocaleDateString()}
              </MetaRow>
            )}
            {cert.failureReason && (
              <MetaRow label="Failure Reason">
                <span className="text-red-400 text-xs">{cert.failureReason}</span>
              </MetaRow>
            )}
          </dl>
        </Card>

        {/* Bindings */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Bindings</h3>
            <Button size="sm" onClick={() => setShowBindingForm((v) => !v)}>
              Attach Resource
            </Button>
          </div>

          {showBindingForm && (
            <Card className="mb-4">
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  createBinding.mutate(newBinding, {
                    onSuccess: () => setShowBindingForm(false),
                  });
                }}
              >
                <div>
                  <label className="mb-1 block text-sm text-muted">Target Type</label>
                  <select
                    value={newBinding.targetType}
                    onChange={(e) =>
                      setNewBinding({ ...newBinding, targetType: e.target.value as "lb" | "ingress" })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="lb">Load Balancer</option>
                    <option value="ingress">Ingress</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted">Resource ID</label>
                  <input
                    required
                    value={newBinding.targetId}
                    onChange={(e) => setNewBinding({ ...newBinding, targetId: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted">Hostname</label>
                  <input
                    required
                    value={newBinding.hostname}
                    onChange={(e) => setNewBinding({ ...newBinding, hostname: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="example.com"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setShowBindingForm(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={createBinding.isPending}>
                    Attach
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {!bindings.length ? (
            <EmptyState title="No bindings" description="Attach this certificate to a resource." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card text-left text-muted">
                    <th className="p-3">Type</th>
                    <th className="p-3">Resource</th>
                    <th className="p-3">Hostname</th>
                    <th className="p-3">Status</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {bindings.map((b) => (
                    <tr key={b.id} className="border-b border-border/60">
                      <td className="p-3 capitalize text-xs">{b.targetType}</td>
                      <td className="p-3 font-mono text-xs">{b.targetId}</td>
                      <td className="p-3 font-mono text-xs">{b.hostname}</td>
                      <td className="p-3"><StatusBadge status={b.status} /></td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteBinding.mutate(b.id)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={revokeOpen}
        title="Revoke certificate?"
        description="Revoking will invalidate the certificate. This cannot be undone."
        confirmLabel="Revoke"
        variant="danger"
        onConfirm={() => {
          revoke.mutate({ id });
          setRevokeOpen(false);
        }}
        onCancel={() => setRevokeOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete certificate?"
        description={`Permanently delete certificate "${cert.name}"?`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          del.mutate(id, { onSuccess: () => navigate("/certificates") });
          setDeleteOpen(false);
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-right">{children}</dd>
    </div>
  );
}

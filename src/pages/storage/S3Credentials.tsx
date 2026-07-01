import { useState } from "react";
import { useS3Credentials, useCreateS3Credential, useDeleteS3Credential } from "@/api/s3credentials";
import { PageHeader, Button, Card, StatusBadge } from "@/components/common/ui";
import type { CreateS3CredentialResponse } from "@/api/s3credentials";

export function S3Credentials() {
  const { data: credentials, isLoading } = useS3Credentials();
  const createMutation = useCreateS3Credential();
  const deleteMutation = useDeleteS3Credential("");
  const [showSecret, setShowSecret] = useState<CreateS3CredentialResponse | null>(null);

  const handleCreate = async () => {
    if (!confirm("Create new S3 credential? Save the secret immediately.")) return;
    try {
      const result = await createMutation.mutateAsync();
      setShowSecret(result as CreateS3CredentialResponse);
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete credential? This cannot be undone.")) {
      try {
        const { mutateAsync } = useDeleteS3Credential(id);
        await mutateAsync();
      } catch (err) {
        alert(`Error: ${err}`);
      }
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) return <p className="text-muted">Loading...</p>;

  return (
    <div>
      <PageHeader
        title="S3 Credentials"
        description="Manage access keys for S3 bucket access"
        actions={
          <Button variant="primary" onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Credential"}
          </Button>
        }
      />

      {showSecret && (
        <Card className="mb-4 border-yellow-900 bg-yellow-900/20 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-yellow-200">⚠ Save your secret now</span>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Access Key ID</p>
              <div className="flex gap-2">
                <code className="flex-1 bg-slate-800 px-3 py-2 rounded font-mono text-xs">
                  {showSecret.accessKeyId}
                </code>
                <Button
                  size="sm"
                  onClick={() => handleCopyToClipboard(showSecret.accessKeyId)}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Secret Access Key (only shown once)</p>
              <div className="flex gap-2">
                <code className="flex-1 bg-red-900/30 px-3 py-2 rounded font-mono text-xs text-red-300 break-all">
                  {showSecret.secretAccessKey}
                </code>
                <Button
                  size="sm"
                  onClick={() => handleCopyToClipboard(showSecret.secretAccessKey)}
                >
                  Copy
                </Button>
              </div>
            </div>
            <Button
              variant="default"
              onClick={() => setShowSecret(null)}
              className="w-full"
            >
              Close (secret will not be shown again)
            </Button>
          </div>
        </Card>
      )}

      {!credentials || credentials.length === 0 ? (
        <Card>
          <p className="text-muted">No S3 credentials created yet.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-semibold">Access Key ID</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">Created</th>
                <th className="px-4 py-2 text-left font-semibold">Last Used</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((cred) => (
                <tr key={cred.id} className="border-b border-border/50 hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-xs">{cred.accessKeyId}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={cred.status === "active" ? "running" : "stopped"} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {cred.createdAt?.split("T")[0] || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {cred.lastUsedAt?.split("T")[0] || "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(cred.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

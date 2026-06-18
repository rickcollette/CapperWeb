import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateCertificate, useACMEAccounts } from "@/api/certificates";
import { Button, Card, PageHeader } from "@/components/common/ui";

type IssuerType = "letsencrypt" | "import";

export function CertificateNew() {
  const navigate = useNavigate();
  const create = useCreateCertificate();
  const { data: acmeAccounts = [] } = useACMEAccounts();

  const [step, setStep] = useState<1 | 2>(1);
  const [issuerType, setIssuerType] = useState<IssuerType>("letsencrypt");

  // LE form state
  const [leForm, setLeForm] = useState({
    name: "",
    commonName: "",
    sans: "",
    validationMethod: "http-01" as "http-01" | "dns-01",
    acmeAccountId: "",
    autoRenew: true,
  });

  // Import form state
  const [importForm, setImportForm] = useState({
    name: "",
    certPem: "",
    keyPem: "",
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (issuerType === "letsencrypt") {
      create.mutate(
        {
          name: leForm.name,
          commonName: leForm.commonName,
          sans: leForm.sans
            ? leForm.sans
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          issuer: "letsencrypt",
          validationMethod: leForm.validationMethod,
          acmeAccount: leForm.acmeAccountId || undefined,
          autoRenew: leForm.autoRenew,
        },
        {
          onSuccess: (cert) => navigate(`/certificates/${cert.id}`),
          onError: (err) => setErrorMsg((err as Error).message),
        },
      );
    } else {
      create.mutate(
        {
          name: importForm.name,
          certPem: importForm.certPem,
          keyPem: importForm.keyPem || undefined,
        },
        {
          onSuccess: (cert) => navigate(`/certificates/${cert.id}`),
          onError: (err) => setErrorMsg((err as Error).message),
        },
      );
    }
  }

  return (
    <div>
      <PageHeader title="New Certificate" description="Issue a new certificate or import an existing one." />

      {step === 1 && (
        <Card className="max-w-lg">
          <h3 className="mb-4 font-semibold">Choose Certificate Type</h3>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-slate-800/30">
              <input
                type="radio"
                name="issuerType"
                value="letsencrypt"
                checked={issuerType === "letsencrypt"}
                onChange={() => setIssuerType("letsencrypt")}
                className="mt-0.5"
              />
              <div>
                <p className="font-medium">Let's Encrypt</p>
                <p className="text-sm text-muted">
                  Automatically issue and renew certificates via ACME.
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-slate-800/30">
              <input
                type="radio"
                name="issuerType"
                value="import"
                checked={issuerType === "import"}
                onChange={() => setIssuerType("import")}
                className="mt-0.5"
              />
              <div>
                <p className="font-medium">Import PEM</p>
                <p className="text-sm text-muted">
                  Import an existing certificate from PEM files.
                </p>
              </div>
            </label>
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={() => setStep(2)}>
              Continue →
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="max-w-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">
              {issuerType === "letsencrypt" ? "Let's Encrypt Certificate" : "Import PEM Certificate"}
            </h3>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-muted hover:text-slate-200"
            >
              ← Back
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {issuerType === "letsencrypt" ? (
              <>
                <Field label="Certificate Name *">
                  <input
                    required
                    value={leForm.name}
                    onChange={(e) => setLeForm({ ...leForm, name: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="my-cert"
                  />
                </Field>
                <Field label="Primary Domain (Common Name) *">
                  <input
                    required
                    value={leForm.commonName}
                    onChange={(e) => setLeForm({ ...leForm, commonName: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="example.com"
                  />
                </Field>
                <Field label="Additional Domains (comma-separated)">
                  <input
                    value={leForm.sans}
                    onChange={(e) => setLeForm({ ...leForm, sans: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="www.example.com, api.example.com"
                  />
                </Field>
                <Field label="Validation Method">
                  <div className="flex gap-4">
                    {(["http-01", "dns-01"] as const).map((m) => (
                      <label key={m} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="validationMethod"
                          value={m}
                          checked={leForm.validationMethod === m}
                          onChange={() => setLeForm({ ...leForm, validationMethod: m })}
                        />
                        {m}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="ACME Account">
                  <select
                    value={leForm.acmeAccountId}
                    onChange={(e) => setLeForm({ ...leForm, acmeAccountId: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— use default —</option>
                    {acmeAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.email})
                      </option>
                    ))}
                  </select>
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={leForm.autoRenew}
                    onChange={(e) => setLeForm({ ...leForm, autoRenew: e.target.checked })}
                    className="rounded"
                  />
                  Auto-renew before expiry
                </label>
              </>
            ) : (
              <>
                <Field label="Certificate Name *">
                  <input
                    required
                    value={importForm.name}
                    onChange={(e) => setImportForm({ ...importForm, name: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="my-imported-cert"
                  />
                </Field>
                <Field label="Certificate PEM *">
                  <textarea
                    required
                    rows={8}
                    value={importForm.certPem}
                    onChange={(e) => setImportForm({ ...importForm, certPem: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
                    placeholder="-----BEGIN CERTIFICATE-----&#10;..."
                  />
                </Field>
                <Field label="Private Key PEM (optional)">
                  <textarea
                    rows={6}
                    value={importForm.keyPem}
                    onChange={(e) => setImportForm({ ...importForm, keyPem: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
                  />
                </Field>
              </>
            )}

            {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => navigate("/certificates")}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={create.isPending}>
                {create.isPending
                  ? "Submitting…"
                  : issuerType === "letsencrypt"
                  ? "Issue Certificate"
                  : "Import Certificate"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted">{label}</label>
      {children}
    </div>
  );
}

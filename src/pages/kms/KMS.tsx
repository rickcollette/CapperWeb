import { useState } from "react";
import { useKMSKeys, useCreateKMSKey, useRotateKMSKey, useKMSEncrypt, useKMSDecrypt } from "@/api/topology";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";
import { KeyRound, RefreshCw } from "lucide-react";

function EncryptPanel({ keyName }: { keyName: string }) {
  const encrypt = useKMSEncrypt();
  const decrypt = useKMSDecrypt();
  const [text, setText] = useState("");
  const [cipher, setCipher] = useState("");
  const [result, setResult] = useState("");

  return (
    <div className="space-y-3 border-t border-border pt-4 mt-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Plaintext to encrypt"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
        />
        <Button
          size="sm"
          onClick={() =>
            encrypt.mutate(
              { name: keyName, plaintext: text },
              { onSuccess: (r: any) => { setCipher(r.ciphertext); setResult(""); } },
            )
          }
          disabled={!text}
        >
          Encrypt
        </Button>
      </div>
      <div className="flex gap-2">
        <input
          value={cipher}
          onChange={(e) => setCipher(e.target.value)}
          placeholder="Ciphertext to decrypt"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-mono text-xs"
        />
        <Button
          size="sm"
          onClick={() =>
            decrypt.mutate(
              { name: keyName, ciphertext: cipher },
              { onSuccess: (r: any) => setResult(r.plaintext) },
            )
          }
          disabled={!cipher}
        >
          Decrypt
        </Button>
      </div>
      {result && (
        <p className="rounded bg-slate-800 px-3 py-2 font-mono text-xs text-green-300">
          {result}
        </p>
      )}
    </div>
  );
}

function KeyCard({ k }: { k: any }) {
  const rotate = useRotateKMSKey();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeyRound className="h-4 w-4 text-primary" />
          <div>
            <p className="font-medium">{k.name}</p>
            <p className="text-xs text-muted">{k.algorithm || "AES-256-GCM"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {k.rotatedAt ? `Rotated ${new Date(k.rotatedAt).toLocaleDateString()}` : "Not rotated"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            title="Rotate key"
            onClick={() => rotate.mutate(k.name)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Rotate
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Hide" : "Encrypt/Decrypt"}
          </Button>
        </div>
      </div>
      {expanded && <EncryptPanel keyName={k.name} />}
    </Card>
  );
}

export function KMS() {
  const { data: keys = [], isLoading } = useKMSKeys();
  const create = useCreateKMSKey();
  const [form, setForm] = useState({ name: "", algorithm: "AES-256-GCM" });
  const [showCreate, setShowCreate] = useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setForm({ name: "", algorithm: "AES-256-GCM" }); setShowCreate(false); } });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="KMS / Secrets"
        description="Manage encryption keys and perform encrypt/decrypt operations."
        actions={<Button onClick={() => setShowCreate((s) => !s)}>Create Key</Button>}
      />

      {showCreate && (
        <Card className="p-4">
          <form onSubmit={handleCreate} className="flex items-center gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Key name"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
            <select
              value={form.algorithm}
              onChange={(e) => setForm((f) => ({ ...f, algorithm: e.target.value }))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option>AES-256-GCM</option>
              <option>RSA-4096</option>
              <option>ECDSA-P256</option>
            </select>
            <Button type="submit">Create</Button>
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : keys.length === 0 ? (
        <EmptyState title="No KMS Keys" description="Create a key to encrypt and decrypt data." />
      ) : (
        <div className="space-y-3">
          {keys.map((k: any) => <KeyCard key={k.id || k.name} k={k} />)}
        </div>
      )}
    </div>
  );
}

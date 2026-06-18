import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useCreateInstance } from "@/api/instances";
import { useImages } from "@/api/images";
import { useCapsuleTypes, useCapInitTemplates, useNetworks, useVolumes } from "@/api/resources";
import { Button, Card, PageHeader } from "@/components/common/ui";
import { useLaunchWizard, WIZARD_STEPS } from "@/stores/launchWizard";
import { formatBytes, imageDisplayName } from "@/lib/utils";

export function CreateInstance() {
  const navigate = useNavigate();
  const { data: images } = useImages();
  const { data: types } = useCapsuleTypes();
  const { data: networks } = useNetworks();
  const { data: volumes } = useVolumes();
  const { data: templates } = useCapInitTemplates();
  const create = useCreateInstance();
  const wizard = useLaunchWizard();
  const [envKey, setEnvKey] = useState("");
  const [envVal, setEnvVal] = useState("");

  const submit = () => {
    create.mutate(
      {
        image: wizard.image,
        name: wizard.name || undefined,
        instanceType: wizard.instanceType || undefined,
        network: wizard.network || undefined,
        env: Object.keys(wizard.env).length ? wizard.env : undefined,
        volumes: wizard.volumes.length ? wizard.volumes : undefined,
        capInitTemplate: wizard.capInitMode === "template" ? wizard.capInitTemplate : undefined,
        capInitContent: wizard.capInitMode === "paste" ? wizard.capInitContent : undefined,
      },
      {
        onSuccess: (inst) => {
          wizard.reset();
          navigate(`/instances/${inst.id}`);
        },
      },
    );
  };

  return (
    <div>
      <PageHeader title="Launch Instance" description="Six-step launch wizard." />
      <div className="mb-6 flex flex-wrap gap-2">
        {WIZARD_STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => wizard.setStep(i)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              wizard.step === i ? "bg-primary/15 text-primary" : "text-muted hover:bg-slate-800"
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <Card className="max-w-2xl">
        {wizard.step === 0 && (
          <label className="block space-y-1">
            <span className="text-sm text-muted">Image</span>
            <select
              required
              value={wizard.image}
              onChange={(e) => wizard.update({ image: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            >
              <option value="">Select image...</option>
              {images?.map((img) => (
                <option key={img.id} value={img.name}>{imageDisplayName(img.name)}</option>
              ))}
            </select>
          </label>
        )}

        {wizard.step === 1 && (
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm text-muted">Capsule type</span>
              <select
                value={wizard.instanceType}
                onChange={(e) => wizard.update({ instanceType: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="">Default (from image)</option>
                {types?.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} — {t.cpuCount} CPU, {formatBytes(t.memoryBytes)}
                    {t.diskBytes ? `, ${formatBytes(t.diskBytes)} disk` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-muted">Name (optional)</span>
              <input
                value={wizard.name}
                onChange={(e) => wizard.update({ name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </div>
        )}

        {wizard.step === 2 && (
          <label className="block space-y-1">
            <span className="text-sm text-muted">Network</span>
            <select
              value={wizard.network}
              onChange={(e) => wizard.update({ network: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            >
              <option value="">No network</option>
              {networks?.map((n) => (
                <option key={n.id} value={n.name}>{n.name} ({n.subnet})</option>
              ))}
            </select>
          </label>
        )}

        {wizard.step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Attach existing volumes at launch.</p>
            <div className="flex flex-wrap gap-2">
              <select
                value={wizard.volumeName}
                onChange={(e) => wizard.update({ volumeName: e.target.value })}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Volume...</option>
                {volumes?.filter((v) => !v.attachedInstanceId).map((v) => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
              <input
                value={wizard.volumeMount}
                onChange={(e) => wizard.update({ volumeMount: e.target.value })}
                placeholder="Mount path"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
              />
              <Button
                onClick={() => {
                  if (wizard.volumeName && wizard.volumeMount) {
                    wizard.update({
                      volumes: [...wizard.volumes, { name: wizard.volumeName, mountPath: wizard.volumeMount }],
                      volumeName: "",
                    });
                  }
                }}
              >
                Add
              </Button>
            </div>
            <ul className="text-sm font-mono text-muted">
              {wizard.volumes.map((v) => (
                <li key={v.name}>{v.name} → {v.mountPath}</li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input placeholder="ENV key" value={envKey} onChange={(e) => setEnvKey(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input placeholder="value" value={envVal} onChange={(e) => setEnvVal(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <Button onClick={() => { if (envKey) { wizard.update({ env: { ...wizard.env, [envKey]: envVal } }); setEnvKey(""); setEnvVal(""); } }}>Add env</Button>
            </div>
          </div>
        )}

        {wizard.step === 4 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["none", "template", "paste"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => wizard.update({ capInitMode: m })}
                  className={`rounded-lg px-3 py-1.5 text-sm capitalize ${wizard.capInitMode === m ? "bg-primary/15 text-primary" : "text-muted"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            {wizard.capInitMode === "template" && (
              <select
                value={wizard.capInitTemplate}
                onChange={(e) => wizard.update({ capInitTemplate: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="">Select template...</option>
                {templates?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            {wizard.capInitMode === "paste" && (
              <div className="overflow-hidden rounded-lg border border-border">
                <Editor
                  height="200px"
                  defaultLanguage="yaml"
                  theme="vs-dark"
                  value={wizard.capInitContent}
                  onChange={(v) => wizard.update({ capInitContent: v ?? "" })}
                  options={{ minimap: { enabled: false } }}
                />
              </div>
            )}
          </div>
        )}

        {wizard.step === 5 && (
          <div className="space-y-4">
            <dl className="grid gap-2 text-sm">
              <div><dt className="text-muted">Image</dt><dd className="font-mono">{imageDisplayName(wizard.image)}</dd></div>
              <div><dt className="text-muted">Type</dt><dd>{wizard.instanceType || "default"}</dd></div>
              <div><dt className="text-muted">Network</dt><dd>{wizard.network || "none"}</dd></div>
              <div><dt className="text-muted">Volumes</dt><dd>{wizard.volumes.length || "none"}</dd></div>
              <div><dt className="text-muted">CapInit</dt><dd>{wizard.capInitMode}</dd></div>
            </dl>
            {create.error && <p className="text-sm text-red-400">{create.error.message}</p>}
            <Button variant="primary" disabled={create.isPending || !wizard.image} onClick={submit}>
              {create.isPending ? "Launching..." : "Launch Instance"}
            </Button>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button disabled={wizard.step === 0} onClick={wizard.back}>Back</Button>
          {wizard.step < 5 && (
            <Button variant="primary" onClick={() => { if (wizard.step === 0 && !wizard.image) return; wizard.next(); }}>Next</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

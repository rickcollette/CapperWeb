import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useCreateInstance, useInstanceDiskCapacity } from "@/api/instances";
import { useImages } from "@/api/images";
import { useVPCs, useVPCSubnets } from "@/api/topology";
import { useCapsuleTypes, useCapInitTemplates, useVolumes } from "@/api/resources";
import { useKeyPairs, useSecurityGroups } from "@/api/vpcnet";
import { Button, Card, PageHeader } from "@/components/common/ui";
import { useLaunchWizard, WIZARD_STEPS } from "@/stores/launchWizard";
import { formatBytes, imageDisplayName } from "@/lib/utils";
import { features } from "@/lib/features";

export function CreateInstance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: images } = useImages();
  const { data: types } = useCapsuleTypes();
  const { data: vpcs } = useVPCs();
  const create = useCreateInstance();
  const wizard = useLaunchWizard();
  const activeVpc = wizard.vpcId || vpcs?.[0]?.slug || vpcs?.[0]?.id || "";
  const { data: subnets } = useVPCSubnets(activeVpc, "launch");
  const { data: securityGroups } = useSecurityGroups(activeVpc);
  const { data: keyPairs } = useKeyPairs();
  const { data: volumes } = useVolumes();
  const { data: templates } = useCapInitTemplates();
  const { data: diskCap } = useInstanceDiskCapacity();
  const [envKey, setEnvKey] = useState("");
  const [envVal, setEnvVal] = useState("");

  const sortedTypes = useMemo(() => {
    if (!types?.length) return [];
    return [...types].sort((a, b) => {
      if (a.family === "standard" && b.family !== "standard") return -1;
      if (b.family === "standard" && a.family !== "standard") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [types]);

  useEffect(() => {
    if (!images?.length) return;
    const typeParam = searchParams.get("type");
    const state = useLaunchWizard.getState();
    const patch: { instanceType?: string; image?: string } = {};
    if (!state.instanceType) {
      if (typeParam) patch.instanceType = typeParam;
      else if (features.isAIO) patch.instanceType = "cap-micro";
    }
    if (!state.image && features.isAIO) {
      const preferred = images.find((i) => i.name === "alpine" || i.name === "alpine.cap")
        ?? images.find((i) => i.name === "alma" || i.name === "alma.cap")
        ?? images[0];
      if (preferred) patch.image = preferred.name;
    }
    if (Object.keys(patch).length) useLaunchWizard.getState().update(patch);
  }, [searchParams, images]);

  const submit = () => {
    if (!wizard.subnetId) return;
    if (!diskCap?.poolConfigured) return;
    create.mutate(
      {
        image: wizard.image,
        name: wizard.name || undefined,
        instanceType: wizard.instanceType || undefined,
        vpcId: wizard.vpcId || undefined,
        subnetId: wizard.subnetId,
        securityGroupIds: wizard.securityGroupIds.length ? wizard.securityGroupIds : undefined,
        keyName: wizard.keyName || undefined,
        publicIpBehavior: wizard.publicIpBehavior || undefined,
        terminationProtection: wizard.terminationProtection,
        tags: Object.keys(wizard.tags).length ? wizard.tags : undefined,
        env: Object.keys(wizard.env).length ? wizard.env : undefined,
        volumes: wizard.volumes.length ? wizard.volumes : undefined,
        diskBytes: wizard.diskGiB ? Math.round(Number(wizard.diskGiB) * 1024 ** 3) : undefined,
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
      <PageHeader title="Launch Instance" description="Nine-step EC2-style launch wizard." />
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
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm text-muted">Name</span>
              <input
                value={wizard.name}
                onChange={(e) => wizard.update({ name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </div>
        )}

        {wizard.step === 1 && (
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

        {wizard.step === 2 && (
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm text-muted">Instance type</span>
              <select
                value={wizard.instanceType}
                onChange={(e) => wizard.update({ instanceType: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="">Default (from image)</option>
                {sortedTypes.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} — {t.cpuCount} CPU, {formatBytes(t.memoryBytes)}
                    {t.diskBytes ? `, ${formatBytes(t.diskBytes)} disk` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {wizard.step === 3 && (
          <label className="block space-y-1">
            <span className="text-sm text-muted">SSH key pair</span>
            <select
              value={wizard.keyName}
              onChange={(e) => wizard.update({ keyName: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            >
              <option value="">No key pair</option>
              {keyPairs?.map((k: { name: string }) => (
                <option key={k.name} value={k.name}>{k.name}</option>
              ))}
            </select>
          </label>
        )}

        {wizard.step === 4 && (
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm text-muted">VPC</span>
              <select
                value={wizard.vpcId}
                onChange={(e) => wizard.update({ vpcId: e.target.value, subnetId: "" })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="">Select VPC...</option>
                {vpcs?.map((v: { id: string; name: string; slug?: string }) => (
                  <option key={v.id} value={v.slug || v.id}>{v.name} ({v.id})</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-muted">Subnet</span>
              <select
                value={wizard.subnetId}
                onChange={(e) => wizard.update({ subnetId: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="">Select subnet...</option>
                {subnets?.map((s: { id: string; name: string; cidr: string }) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.cidr})</option>
                ))}
              </select>
            </label>
            {!diskCap?.poolConfigured && (
              <p className="text-sm text-amber-400">
                Configure a default storage pool under Admin → Storage before launching instances.
              </p>
            )}
            <label className="block space-y-1">
              <span className="text-sm text-muted">Public IP</span>
              <select
                value={wizard.publicIpBehavior}
                onChange={(e) => wizard.update({ publicIpBehavior: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="none">Do not assign</option>
                <option value="auto">Auto-assign</option>
              </select>
            </label>
          </div>
        )}

        {wizard.step === 5 && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Select security groups to attach at launch.</p>
            {!activeVpc ? (
              <p className="text-sm text-amber-400">Select a VPC in the previous step.</p>
            ) : !securityGroups?.length ? (
              <p className="text-sm text-muted">No security groups in this VPC. The default group applies.</p>
            ) : (
              <div className="space-y-2">
                {securityGroups.map((sg: { id: string; name: string; description?: string }) => {
                  const checked = wizard.securityGroupIds.includes(sg.id);
                  return (
                    <label key={sg.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const ids = checked
                            ? wizard.securityGroupIds.filter((id) => id !== sg.id)
                            : [...wizard.securityGroupIds, sg.id];
                          wizard.update({ securityGroupIds: ids });
                        }}
                      />
                      <span className="font-medium">{sg.name}</span>
                      {sg.description && <span className="text-muted">{sg.description}</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {wizard.step === 6 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-3">
              <div className="mb-1 text-sm font-medium">Root disk size</div>
              {diskCap?.poolConfigured ? (
                <p className="mb-2 text-xs text-muted">
                  Drawn from pool <span className="font-mono">{diskCap.poolName}</span> ({diskCap.backend})
                  {diskCap.degraded
                    ? " — pool is degraded"
                    : ` — ${formatBytes(diskCap.availableBytes)} available of ${formatBytes(diskCap.totalBytes)}`}
                </p>
              ) : (
                <p className="mb-2 text-xs text-muted">
                  No default instance pool set — the disk lives on the control-plane host. To draw disks from a storage pool (e.g. your LVM VG),
                  set it under <span className="font-medium">Admin → Storage → Default instance disk pool</span>. You can still set a size below.
                </p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={wizard.diskGiB}
                  onChange={(e) => wizard.update({ diskGiB: e.target.value })}
                  placeholder={(() => {
                    const t = sortedTypes.find((x) => x.name === wizard.instanceType);
                    return t?.diskBytes ? String(Math.round(t.diskBytes / 1024 ** 3)) : "default";
                  })()}
                  className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <span className="text-sm text-muted">GiB</span>
                {diskCap?.poolConfigured && !diskCap.degraded && (
                  <Button
                    onClick={() => wizard.update({ diskGiB: String(Math.floor(diskCap.availableBytes / 1024 ** 3)) })}
                  >
                    Max
                  </Button>
                )}
              </div>
              {wizard.diskGiB && diskCap?.poolConfigured && Number(wizard.diskGiB) * 1024 ** 3 > diskCap.availableBytes && (
                <p className="mt-2 text-xs text-red-400">Exceeds available pool capacity ({formatBytes(diskCap.availableBytes)}).</p>
              )}
            </div>

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

        {wizard.step === 7 && (
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

        {wizard.step === 8 && (
          <div className="space-y-4">
            <dl className="grid gap-2 text-sm">
              <div><dt className="text-muted">Image</dt><dd className="font-mono">{imageDisplayName(wizard.image)}</dd></div>
              <div><dt className="text-muted">Type</dt><dd>{wizard.instanceType || "default"}</dd></div>
              <div><dt className="text-muted">VPC / Subnet</dt><dd>{wizard.vpcId || "—"} / {wizard.subnetId || "—"}</dd></div>
              <div><dt className="text-muted">Key pair</dt><dd>{wizard.keyName || "none"}</dd></div>
              <div><dt className="text-muted">Root disk</dt><dd>{wizard.diskGiB ? `${wizard.diskGiB} GiB` : "type default"}</dd></div>
              <div><dt className="text-muted">Volumes</dt><dd>{wizard.volumes.length || "none"}</dd></div>
              <div><dt className="text-muted">CapInit</dt><dd>{wizard.capInitMode}</dd></div>
            </dl>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={wizard.terminationProtection} onChange={(e) => wizard.update({ terminationProtection: e.target.checked })} />
              Enable termination protection
            </label>
            {create.error && <p className="text-sm text-red-400">{create.error.message}</p>}
            <Button variant="primary" disabled={create.isPending || !wizard.image || !wizard.subnetId || !diskCap?.poolConfigured} onClick={submit}>
              {create.isPending ? "Launching..." : "Launch Instance"}
            </Button>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button disabled={wizard.step === 0} onClick={wizard.back}>Back</Button>
          {wizard.step < 8 && (
            <Button variant="primary" onClick={() => {
              if (wizard.step === 1 && !wizard.image) return;
              if (wizard.step === 4 && !wizard.subnetId) return;
              wizard.next();
            }}>Next</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

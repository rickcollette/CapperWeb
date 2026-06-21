import { Link } from "react-router-dom";
import { useState } from "react";
import { useBuckets, useVolumes, useAttachVolume, useDetachVolume, useCreateBucket, useCreateVolume } from "@/api/resources";
import { useStorageSettings } from "@/api/admin";
import { useInstances } from "@/api/instances";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";
import { formatBytes } from "@/lib/utils";

export function StorageDashboard() {
  const { data: buckets } = useBuckets();
  const { data: volumes } = useVolumes();
  const { data: instances } = useInstances();
  const attach = useAttachVolume();
  const detach = useDetachVolume();
  const createBucket = useCreateBucket();
  const createVolume = useCreateVolume();
  const { data: storageSettings } = useStorageSettings();
  const poolReady = !!storageSettings?.defaultInstancePool;
  const [attachForm, setAttachForm] = useState({ volume: "", instanceId: "", mountPath: "/mnt/data" });
  const [showAttach, setShowAttach] = useState(false);
  const [bucketName, setBucketName] = useState("");
  const [volName, setVolName] = useState("");
  const [volSize, setVolSize] = useState("1");

  return (
    <div>
      <PageHeader title="Storage" description="Buckets, objects, and volumes." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card><div className="text-muted">Buckets</div><div className="text-2xl font-semibold">{buckets?.length ?? 0}</div></Card>
        <Card><div className="text-muted">Volumes</div><div className="text-2xl font-semibold">{volumes?.length ?? 0}</div></Card>
      </div>

      <h2 className="mb-3 text-lg font-medium">Create bucket</h2>
      <Card className="mb-8 max-w-md">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); createBucket.mutate({ name: bucketName }, { onSuccess: () => setBucketName("") }); }}>
          <input value={bucketName} onChange={(e) => setBucketName(e.target.value)} placeholder="Bucket name" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <Button type="submit" variant="primary">Create Bucket</Button>
        </form>
      </Card>

      <h2 className="mb-3 text-lg font-medium">Create volume</h2>
      <Card className="mb-8 max-w-md">
        {!poolReady && (
          <p className="mb-3 text-sm text-amber-400">
            Configure a default storage pool under Admin → Storage before creating volumes.
          </p>
        )}
        <form className="flex gap-2" onSubmit={(e) => {
          e.preventDefault();
          if (!poolReady) return;
          createVolume.mutate({ name: volName, sizeBytes: parseInt(volSize, 10) * 1024 * 1024 * 1024 }, { onSuccess: () => { setVolName(""); setVolSize("1"); } });
        }}>
          <input value={volName} onChange={(e) => setVolName(e.target.value)} placeholder="Volume name" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" required disabled={!poolReady} />
          <input value={volSize} onChange={(e) => setVolSize(e.target.value)} placeholder="Size (GB)" className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm" disabled={!poolReady} />
          <Button type="submit" variant="primary" disabled={!poolReady}>Create Volume</Button>
        </form>
      </Card>

      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-lg font-medium">Volumes</h2>
        <button type="button" className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20" onClick={() => setShowAttach(!showAttach)}>
          {showAttach ? "Close" : "Attach Volume"}
        </button>
      </div>
      {showAttach && (
        <Card className="mb-8 max-w-xl">
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={attachForm.volume}
              onChange={(e) => setAttachForm({ ...attachForm, volume: e.target.value })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Volume...</option>
              {volumes?.map((v) => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
            <select
              value={attachForm.instanceId}
              onChange={(e) => setAttachForm({ ...attachForm, instanceId: e.target.value })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Instance...</option>
              {instances?.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            <Button
              variant="primary"
              disabled={!attachForm.volume || !attachForm.instanceId || attach.isPending}
              onClick={() => attach.mutate(attachForm)}
            >
              Attach
            </Button>
          </div>
        </Card>
      )}

      <h2 className="mb-3 text-lg font-medium">Buckets</h2>
      {!buckets?.length ? <EmptyState title="No buckets" /> : (
        <div className="mb-8 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-card text-left text-muted"><th className="p-3">Name</th><th className="p-3">Created</th></tr></thead>
            <tbody>
              {buckets.map((b) => (
                <tr key={b.id} className="border-b border-border/60">
                  <td className="p-3"><Link to={`/storage/buckets/${b.name}`} className="text-primary hover:underline">{b.name}</Link></td>
                  <td className="p-3">{b.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!volumes?.length ? <EmptyState title="No volumes" /> : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Size</th>
                <th className="p-3">Attached</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {volumes.map((v) => (
                <tr key={v.id} className="border-b border-border/60">
                  <td className="p-3">{v.name}</td>
                  <td className="p-3">{formatBytes(v.sizeBytes)}</td>
                  <td className="p-3">{v.attachedInstanceId ?? "—"}</td>
                  <td className="p-3">
                    {v.attachedInstanceId && (
                      <Button size="sm" onClick={() => detach.mutate(v.name)} disabled={detach.isPending}>
                        Detach
                      </Button>
                    )}
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

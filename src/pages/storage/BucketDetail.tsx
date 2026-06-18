import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { FolderUp } from "lucide-react";
import { useBucket, useBucketObjects, useUploadObject, useDeleteObject, objectDownloadUrl } from "@/api/resources";
import { ConfirmDialog, PageHeader } from "@/components/common/ui";
import { formatBytes } from "@/lib/utils";

export function BucketDetail() {
  const { bucket = "" } = useParams();
  const [prefix, setPrefix] = useState("");
  const { data: meta } = useBucket(bucket);
  const { data: objects } = useBucketObjects(bucket, prefix);
  const upload = useUploadObject(bucket);
  const del = useDeleteObject(bucket);
  const [uploadKey, setUploadKey] = useState("");
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const prefixes = new Set<string>();
  for (const o of objects ?? []) {
    const rest = o.key.slice(prefix.length);
    const slash = rest.indexOf("/");
    if (slash >= 0) {
      prefixes.add(prefix + rest.slice(0, slash + 1));
    }
  }

  return (
    <div>
      <PageHeader title={bucket} description="Object browser with prefix navigation." />
      {meta && <p className="mb-4 text-sm text-muted">Created {meta.createdAt}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setPrefix("")}
          className="text-primary hover:underline"
        >
          /
        </button>
        {prefix.split("/").filter(Boolean).map((part, i, arr) => {
          const p = arr.slice(0, i + 1).join("/") + "/";
          return (
            <span key={p}>
              <span className="text-muted"> / </span>
              <button type="button" onClick={() => setPrefix(p)} className="text-primary hover:underline">
                {part}
              </button>
            </span>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          placeholder="Object key"
          value={uploadKey}
          onChange={(e) => setUploadKey(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-slate-800">
          <FolderUp className="h-4 w-4" />
          Upload
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              const key = uploadKey || file?.name;
              if (file && key) {
                upload.mutate({ key, file });
              }
            }}
          />
        </label>
        {upload.isPending && <span className="text-sm text-muted">Uploading...</span>}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card text-left text-muted">
              <th className="p-3">Key</th>
              <th className="p-3">Size</th>
              <th className="p-3">Modified</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...prefixes].sort().map((p) => (
              <tr key={p} className="border-b border-border/60 hover:bg-slate-800/30">
                <td className="p-3">
                  <button type="button" onClick={() => setPrefix(p)} className="font-mono text-xs text-primary hover:underline">
                    📁 {p.slice(prefix.length)}
                  </button>
                </td>
                <td className="p-3">—</td>
                <td className="p-3">—</td>
              </tr>
            ))}
            {objects
              ?.filter((o) => !o.key.slice(prefix.length).includes("/"))
              .map((o) => (
                <tr key={o.key} className="border-b border-border/60">
                  <td className="p-3 font-mono text-xs">{o.key.slice(prefix.length) || o.key}</td>
                  <td className="p-3">{formatBytes(o.sizeBytes)}</td>
                  <td className="p-3">{o.createdAt}</td>
                  <td className="p-3">
                    <a href={objectDownloadUrl(bucket, o.key)} className="mr-2 text-primary hover:underline">Download</a>
                    <button type="button" className="text-red-400 hover:underline" onClick={() => setDeleteKey(o.key)}>Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Link to="/storage" className="mt-4 inline-block text-sm text-primary hover:underline">← Back</Link>
      {deleteKey && (
        <ConfirmDialog open title="Delete object?" description={deleteKey} confirmLabel="Delete" onCancel={() => setDeleteKey(null)} onConfirm={() => del.mutate(deleteKey, { onSuccess: () => setDeleteKey(null) })} />
      )}
    </div>
  );
}

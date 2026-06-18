import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { useImages, useUploadImage, useDeleteImage } from "@/api/images";
import { Button, ConfirmDialog, EmptyState, PageHeader } from "@/components/common/ui";
import { formatBytes } from "@/lib/utils";

export function ImageList() {
  const { data, isLoading } = useImages();
  const upload = useUploadImage();
  const del = useDeleteImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title="Images"
        description="Local capsule images available for launch."
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".cap"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload.mutate({ file });
              }}
            />
            <Button variant="primary" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
              <Upload className="h-4 w-4" /> Upload .cap
            </Button>
          </>
        }
      />
      {isLoading && <p className="text-muted">Loading images...</p>}
      {!isLoading && !data?.length && <EmptyState title="No images" description="Import or upload a .cap image." />}
      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Digest</th>
                <th className="p-3">Size</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((img) => (
                <tr key={img.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3">
                    <Link to={`/images/${encodeURIComponent(img.name)}`} className="font-medium text-primary hover:underline">
                      {img.name}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs">{img.digest.slice(0, 16)}…</td>
                  <td className="p-3">{formatBytes(img.sizeBytes)}</td>
                  <td className="p-3">{img.createdAt ?? "—"}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(img.name)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete image "${deleteTarget}"?`}
        description="This permanently removes the image from local storage."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { if (deleteTarget) del.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

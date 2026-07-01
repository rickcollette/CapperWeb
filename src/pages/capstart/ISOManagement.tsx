import { useState, useRef } from "react";
import { useListISOs, useUploadISO, useDeleteISO, useVerifyISO } from "@/api/capstart-isos";
import { PageHeader, Button, Card, StatusBadge } from "@/components/common/ui";

export function ISOManagement() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: isos = [], isLoading } = useListISOs();
  const uploadMutation = useUploadISO();
  const deleteMutation = useDeleteISO();
  const verifyMutation = useVerifyISO();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleUpload(files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".iso")) {
      alert("Please select an ISO file");
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync({ file });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (isoId: string) => {
    if (!window.confirm("Delete this ISO? This cannot be undone.")) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(isoId);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleVerify = async (isoId: string) => {
    try {
      await verifyMutation.mutateAsync(isoId);
    } catch (error) {
      console.error("Verification failed:", error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <div>
      <PageHeader
        title="ISO Management"
        description="Upload and manage OS installation ISOs"
      />

      {/* Upload Area */}
      <Card
        className={`mb-6 border-2 border-dashed transition-colors cursor-pointer ${
          dragActive ? "border-accent bg-accent/5" : "border-border"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".iso"
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleUpload(e.target.files[0]);
            }
          }}
          disabled={uploading}
        />

        <div className="text-center py-12">
          <div className="mb-4 text-4xl">📀</div>
          <p className="font-semibold mb-2">
            {uploading ? "Uploading..." : "Drag & Drop ISO here"}
          </p>
          <p className="text-sm text-muted mb-4">
            or click to select from your computer
          </p>
          <Button variant="default" disabled={uploading}>
            {uploading ? "Uploading..." : "Select ISO File"}
          </Button>
        </div>
      </Card>

      {/* ISO List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted">Loading ISOs...</p>
        </div>
      ) : isos.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-muted">No ISOs uploaded yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {isos.map((iso) => (
            <Card key={iso.id} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📀</span>
                  <div>
                    <h4 className="font-semibold text-sm">{iso.name}</h4>
                    <p className="text-xs text-muted">
                      {iso.osType} · {iso.architecture}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted">
                  <span>Size: {formatFileSize(iso.fileSize)}</span>
                  <span>Version: {iso.version || "Unknown"}</span>
                  {iso.isVerified && (
                    <span className="text-green-400">✓ Verified</span>
                  )}
                  {iso.url && <span>URL-based</span>}
                </div>
              </div>

              <div className="flex gap-2">
                {!iso.isVerified && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleVerify(iso.id)}
                  >
                    Verify
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(iso.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

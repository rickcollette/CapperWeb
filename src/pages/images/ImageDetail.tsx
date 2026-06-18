import { Link, useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import { useImage, useScanImage, useImageSBOM, usePublishImage, useDeleteImage } from "@/api/images";
import { Button, Card, ConfirmDialog, PageHeader } from "@/components/common/ui";
import type { MarketplaceListing } from "@/types/capper";
import { imageDisplayName } from "@/lib/utils";

const tabs = [
  { key: "manifest", label: "Manifest" },
  { key: "sbom", label: "SBOM" },
  { key: "scan", label: "Scan" },
] as const;
type TabKey = (typeof tabs)[number]["key"];

const SCAN_BADGE: Record<string, string> = {
  pass: "bg-green-500/15 text-green-400",
  warn: "bg-yellow-500/15 text-yellow-400",
  fail: "bg-red-500/15 text-red-400",
};

export function ImageDetail() {
  const { name = "" } = useParams();
  const navigate = useNavigate();
  const decoded = decodeURIComponent(name);
  const { data, isLoading } = useImage(decoded);
  const scan = useScanImage(decoded);
  const sbom = useImageSBOM(decoded);
  const publish = usePublishImage(decoded);
  const del = useDeleteImage();
  const [tab, setTab] = useState<TabKey>("manifest");
  const [sbomText, setSbomText] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [publishDesc, setPublishDesc] = useState("");
  const [publishModal, setPublishModal] = useState(false);
  const [publishedListing, setPublishedListing] = useState<MarketplaceListing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <p className="text-muted">Loading...</p>;
  if (!data?.data) return <p className="text-red-400">Image not found.</p>;

  const { image, manifest } = data.data;

  return (
    <div>
      <PageHeader
        title={imageDisplayName(image.name)}
        description={`Digest ${image.digest}`}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setTab("sbom");
                sbom.mutate(false, {
                  onSuccess: (text) => setSbomText(text),
                });
              }}
              disabled={sbom.isPending}
            >
              Generate SBOM
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setTab("scan");
                scan.mutate(undefined, {
                  onSuccess: (result) => setScanResult(JSON.stringify(result, null, 2)),
                });
              }}
              disabled={scan.isPending}
            >
              Scan Image
            </Button>
            <Button
              onClick={() => setPublishModal(true)}
              disabled={publish.isPending || !!publishedListing}
              title={publishedListing ? "Already published to marketplace" : undefined}
            >
              {publishedListing ? "Published" : "Publish"}
            </Button>
            <Button
              variant="danger"
              onClick={() => setConfirmDelete(true)}
              disabled={del.isPending}
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t.key ? "bg-primary/15 text-primary" : "text-muted hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {publishedListing && (
        <Card className="mb-4 border-green-500/30 bg-green-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-400">Published to marketplace</p>
              <p className="text-sm text-muted">
                Status: <span className="capitalize">{publishedListing.status}</span>
                {publishedListing.scanStatus && (
                  <span className={`ml-2 rounded px-2 py-0.5 text-xs ${SCAN_BADGE[publishedListing.scanStatus] ?? ""}`}>
                    Scan: {publishedListing.scanStatus} ({publishedListing.scanFindings ?? 0} findings)
                  </span>
                )}
              </p>
            </div>
            <Link to="/marketplace" className="text-sm text-primary hover:underline">
              View in marketplace →
            </Link>
          </div>
        </Card>
      )}

      {tab === "manifest" && (
        <div className="overflow-hidden rounded-xl border border-border">
          <Editor
            height="520px"
            defaultLanguage="json"
            theme="vs-dark"
            value={JSON.stringify(manifest ?? image, null, 2)}
            options={{ readOnly: true, minimap: { enabled: false } }}
          />
        </div>
      )}

      {tab === "sbom" && (
        <Card>
          {sbomText ? (
            <pre className="max-h-[520px] overflow-auto font-mono text-xs">{sbomText}</pre>
          ) : (
            <p className="text-muted">Click Generate SBOM to produce SPDX output.</p>
          )}
        </Card>
      )}

      {tab === "scan" && (
        <Card>
          {scanResult ? (
            <pre className="max-h-[520px] overflow-auto font-mono text-xs">{scanResult}</pre>
          ) : (
            <p className="text-muted">Click Scan to run posture checks on the image rootfs.</p>
          )}
        </Card>
      )}

      <Link to="/images" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to images</Link>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete image "${image.name}"?`}
        description="This permanently removes the image from local storage."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          del.mutate(image.name, { onSuccess: () => navigate("/images") });
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      {publishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md">
            <h3 className="mb-4 text-lg font-medium">Publish to marketplace</h3>
            <p className="mb-3 text-sm text-muted">
              This will run a security scan on the image and create a marketplace listing with status <em>pending</em>.
            </p>
            <input
              value={publishDesc}
              onChange={(e) => setPublishDesc(e.target.value)}
              placeholder="Description (optional)"
              className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setPublishModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={publish.isPending}
                onClick={() => {
                  publish.mutate(
                    { description: publishDesc },
                    {
                      onSuccess: (listing) => {
                        setPublishedListing(listing as MarketplaceListing);
                        setPublishModal(false);
                      },
                    },
                  );
                }}
              >
                {publish.isPending ? "Publishing…" : "Publish"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

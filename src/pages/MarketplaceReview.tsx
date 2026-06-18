import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { Button, Card, PageHeader } from "@/components/common/ui";
import type { MarketplaceListing } from "@/types/capper";

type ReviewAction = "approve" | "reject" | "quarantine";

// ScanSummary mirrors GET /marketplace/images/{id}/scans.
interface ScanSummary {
  status: string;
  findings: number;
  severities?: Record<string, number>;
  scannedAt?: string;
  sbomDigest?: string;
}

const SCAN_BADGE: Record<string, string> = {
  pass: "bg-green-500/15 text-green-400",
  warn: "bg-yellow-500/15 text-yellow-400",
  fail: "bg-red-500/15 text-red-400",
};

const RISK_BADGE: Record<string, string> = {
  low: "bg-green-500/15 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/15 text-red-400 border-red-500/30",
};

function riskLevel(listing: MarketplaceListing): "low" | "medium" | "high" {
  const h = listing.scanSeverities?.high ?? 0;
  const c = listing.scanSeverities?.critical ?? 0;
  if (c > 0 || h > 2) return "high";
  if (h > 0 || (listing.scanFindings ?? 0) > 0) return "medium";
  return "low";
}

function useMarketplaceListing(id: string) {
  return useQuery({
    queryKey: ["marketplace", id],
    queryFn: () => apiFetch<MarketplaceListing>(`/marketplace/images/${id}`),
    enabled: !!id,
  });
}

function useMarketplaceScanSummary(id: string) {
  return useQuery({
    queryKey: ["marketplace-scan", id],
    // Surface the real scan summary; on 404 return null for an honest empty state.
    queryFn: () =>
      apiFetch<ScanSummary>(`/marketplace/images/${id}/scans`).catch((e: { status?: number }) => {
        if (e?.status === 404) return null;
        throw e;
      }),
    enabled: !!id,
  });
}

function useReviewAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action, note }: { action: ReviewAction; note?: string }) =>
      apiFetch(`/marketplace/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketplace", id] });
      qc.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
}

export function MarketplaceReview() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: listing, isLoading } = useMarketplaceListing(id);
  const { data: scan } = useMarketplaceScanSummary(id);
  const reviewAction = useReviewAction(id);
  const [rejectNote, setRejectNote] = useState("");
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null);

  if (isLoading) return <p className="text-muted">Loading...</p>;
  if (!listing) return <p className="text-red-400">Listing not found.</p>;

  const risk = riskLevel(listing);

  function handleAction(action: ReviewAction) {
    if (action === "reject" && !rejectNote.trim()) {
      setPendingAction("reject");
      return;
    }
    reviewAction.mutate(
      { action, note: action === "reject" ? rejectNote : undefined },
      { onSuccess: () => navigate("/marketplace") },
    );
  }

  return (
    <div>
      <PageHeader
        title="Review Listing"
        description="Approve, reject, or quarantine this marketplace submission."
      />

      {/* Listing details */}
      <Card className="mb-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{listing.name}</h2>
            {listing.version && (
              <span className="text-sm text-muted">v{listing.version}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-md border px-2.5 py-0.5 text-xs font-medium capitalize ${RISK_BADGE[risk]}`}
            >
              {risk} risk
            </span>
            <span className="rounded-md border border-border px-2 py-0.5 text-xs capitalize">
              {listing.status}
            </span>
          </div>
        </div>
        <dl className="grid gap-2 text-sm">
          {listing.description && (
            <div className="flex justify-between">
              <dt className="text-muted">Description</dt>
              <dd className="max-w-sm text-right">{listing.description}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Digest</dt>
            <dd className="max-w-xs truncate font-mono text-xs">{listing.digest ?? "—"}</dd>
          </div>
          {listing.scanScannedAt && (
            <div className="flex justify-between">
              <dt className="text-muted">Scanned at</dt>
              <dd>{new Date(listing.scanScannedAt).toLocaleString()}</dd>
            </div>
          )}
          {listing.scanSeverities && Object.keys(listing.scanSeverities).length > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Severities</dt>
              <dd className="flex gap-2">
                {Object.entries(listing.scanSeverities).map(([sev, count]) => (
                  <span key={sev} className="text-xs">
                    <span className="capitalize">{sev}</span>: {count}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Scan summary (real data from the scan endpoint) */}
      {scan && (
        <Card className="mb-4">
          <h3 className="mb-3 text-sm font-medium">Scan Summary</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
            <div>
              <dt className="text-xs text-muted">Status</dt>
              <dd>
                <span className={`rounded px-2 py-0.5 text-xs capitalize ${SCAN_BADGE[scan.status] ?? ""}`}>
                  {scan.status || "unknown"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Total Findings</dt>
              <dd className="font-medium">{scan.findings ?? 0}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted">SBOM Digest</dt>
              <dd className="truncate font-mono text-xs">{scan.sbomDigest || "—"}</dd>
            </div>
            {scan.scannedAt && (
              <div className="col-span-2">
                <dt className="text-xs text-muted">Scanned At</dt>
                <dd className="text-xs">{new Date(scan.scannedAt).toLocaleString()}</dd>
              </div>
            )}
          </dl>
          {scan.severities && Object.keys(scan.severities).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(scan.severities).map(([sev, count]) => (
                <span key={sev} className="rounded-md border border-border px-2 py-0.5 text-xs">
                  <span className="capitalize text-muted">{sev}</span>: {count}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Reject note (shown when reject pending or always visible) */}
      {(pendingAction === "reject" || listing.status === "pending") && (
        <Card className="mb-4">
          <label className="mb-1.5 block text-sm font-medium">
            Reviewer note <span className="text-muted">(required for rejection)</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            rows={3}
            placeholder="Explain the reason for rejection…"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={reviewAction.isPending || listing.status === "approved"}
          onClick={() => handleAction("approve")}
        >
          {reviewAction.isPending ? "Saving…" : "Approve"}
        </Button>
        <Button
          disabled={reviewAction.isPending || listing.status === "rejected"}
          onClick={() => {
            setPendingAction("reject");
            handleAction("reject");
          }}
        >
          Reject
        </Button>
        <Button
          variant="danger"
          disabled={reviewAction.isPending || listing.status === "quarantined"}
          onClick={() => handleAction("quarantine")}
        >
          Quarantine
        </Button>
      </div>

      {reviewAction.isError && (
        <p className="mt-3 text-sm text-red-400">{String(reviewAction.error)}</p>
      )}

      <Link to="/marketplace" className="mt-4 inline-block text-sm text-primary hover:underline">
        ← Back to marketplace
      </Link>
    </div>
  );
}

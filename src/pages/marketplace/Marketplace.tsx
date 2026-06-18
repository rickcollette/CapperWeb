import { useMemo, useState } from "react";
import { useMarketplaceImages, useMarketplaceAction } from "@/api/resources";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";
import type { MarketplaceListing } from "@/types/capper";

const TABS = ["all", "pending", "approved", "quarantined", "rejected"] as const;

const SCAN_BADGE: Record<string, string> = {
  pass: "bg-green-500/15 text-green-400",
  warn: "bg-yellow-500/15 text-yellow-400",
  fail: "bg-red-500/15 text-red-400",
};

export function Marketplace() {
  const { data: listings = [] } = useMarketplaceImages();
  const action = useMarketplaceAction();
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);

  const filtered = useMemo(() => {
    if (tab === "all") return listings;
    return listings.filter((l) => l.status === tab);
  }, [listings, tab]);

  return (
    <div>
      <PageHeader title="Marketplace" description="Public and private capsule image marketplace." />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${tab === t ? "bg-primary/15 text-primary" : "text-muted hover:bg-slate-800"}`}
          >
            {t}
            {t !== "all" && (
              <span className="ml-1.5 text-xs opacity-60">
                {listings.filter((l) => l.status === t).length}
              </span>
            )}
          </button>
        ))}
      </div>
      {!filtered.length ? (
        <EmptyState title="No listings" description="Publish an image from the Images page to create a marketplace listing." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((l) => (
            <MarketplaceCard
              key={l.id}
              listing={l}
              onAction={(a) => action.mutate({ id: l.id, action: a })}
              onDetail={() => setSelected(l)}
            />
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-lg">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium">{selected.name}</h3>
                <p className="text-sm text-muted">{selected.description ?? "—"}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-muted hover:text-foreground">✕</button>
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Status</dt>
                <dd className="capitalize">{selected.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Digest</dt>
                <dd className="font-mono text-xs truncate max-w-[220px]">{selected.digest ?? "—"}</dd>
              </div>
              {selected.scanStatus && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted">Scan result</dt>
                    <dd>
                      <span className={`rounded px-2 py-0.5 text-xs ${SCAN_BADGE[selected.scanStatus] ?? ""}`}>
                        {selected.scanStatus}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Findings</dt>
                    <dd>{selected.scanFindings ?? 0}</dd>
                  </div>
                  {selected.scanSeverities && Object.keys(selected.scanSeverities).length > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted">Severities</dt>
                      <dd className="flex gap-2">
                        {Object.entries(selected.scanSeverities).map(([sev, count]) => (
                          <span key={sev} className="text-xs">
                            <span className="capitalize">{sev}</span>: {count}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted">Scanned at</dt>
                    <dd>{selected.scanScannedAt ? new Date(selected.scanScannedAt).toLocaleString() : "—"}</dd>
                  </div>
                </>
              )}
              {selected.createdAt && (
                <div className="flex justify-between">
                  <dt className="text-muted">Published</dt>
                  <dd>{new Date(selected.createdAt).toLocaleString()}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={() => { action.mutate({ id: selected.id, action: "install" }); setSelected(null); }}>Install</Button>
              <Button size="sm" onClick={() => { action.mutate({ id: selected.id, action: "approve" }); setSelected(null); }}>Approve</Button>
              <Button size="sm" onClick={() => { action.mutate({ id: selected.id, action: "reject" }); setSelected(null); }}>Reject</Button>
              <Button size="sm" variant="danger" onClick={() => { action.mutate({ id: selected.id, action: "quarantine" }); setSelected(null); }}>Quarantine</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function MarketplaceCard({
  listing,
  onAction,
  onDetail,
}: {
  listing: MarketplaceListing;
  onAction: (a: "approve" | "reject" | "quarantine" | "install") => void;
  onDetail: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <button type="button" onClick={onDetail} className="font-medium hover:text-primary text-left">
            {listing.name}
          </button>
          <p className="text-sm text-muted truncate">{listing.description ?? listing.version ?? "—"}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-md border border-border px-2 py-0.5 text-xs capitalize">{listing.status}</span>
          {listing.scanStatus && (
            <span className={`rounded px-2 py-0.5 text-xs ${SCAN_BADGE[listing.scanStatus] ?? ""}`}>
              {listing.scanStatus} · {listing.scanFindings ?? 0} finding{listing.scanFindings !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={() => onAction("install")}>Install</Button>
        <Button size="sm" onClick={() => onAction("approve")}>Approve</Button>
        <Button size="sm" onClick={() => onAction("reject")}>Reject</Button>
        <Button size="sm" variant="danger" onClick={() => onAction("quarantine")}>Quarantine</Button>
        <Button size="sm" onClick={onDetail}>Details</Button>
      </div>
    </Card>
  );
}

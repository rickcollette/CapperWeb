import { useAuditLog } from "@/api/resources";
import { EmptyState, PageHeader, Pagination, usePagination } from "@/components/common/ui";

const PAGE_SIZE = 50;

export function AuditLog() {
  const { data, isLoading } = useAuditLog();
  const { page, setPage, total, paginated } = usePagination(data ?? [], PAGE_SIZE);

  return (
    <div>
      <PageHeader title="Audit Log" description="IAM authorization decisions and control plane activity." />
      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !data?.length && <EmptyState title="No audit records" />}
      {!!data?.length && (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-left text-muted">
                  <th className="p-3">Time</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="p-3 font-mono text-xs">{r.timestamp}</td>
                    <td className="p-3">{r.principalType}:{r.principalId}</td>
                    <td className="p-3">{r.action}</td>
                    <td className="p-3">{r.resource}</td>
                    <td className="p-3 capitalize">{r.decision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={total} onChange={setPage} />
          </div>
          <p className="mt-2 text-xs text-muted">{data.length} total records</p>
        </>
      )}
    </div>
  );
}

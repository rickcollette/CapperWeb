import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { EmptyState, PageHeader } from "@/components/common/ui";

interface SearchResult {
  type: string;
  id: string;
  name: string;
  labels: Record<string, string>;
}

function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => apiFetch<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
  });
}

const TYPE_LINKS: Record<string, (r: SearchResult) => string> = {
  instance: (r) => `/instances/${r.id}`,
  image: (r) => `/images/${encodeURIComponent(r.name)}`,
  network: (r) => `/networks/${r.name}`,
  lb: (r) => `/lb/${r.name}`,
  stack: (r) => `/stacks/${r.name}`,
};

export function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const { data, isLoading } = useSearch(q);

  return (
    <div>
      <PageHeader title="Search Results" description={q ? `Results for "${q}"` : "Enter a query to search"} />
      {q.length < 2 && <p className="text-sm text-muted">Type at least 2 characters to search.</p>}
      {isLoading && <p className="text-muted">Searching…</p>}
      {!isLoading && data?.length === 0 && q.length >= 2 && (
        <EmptyState title="No results" description={`Nothing found for "${q}"`} />
      )}
      {!!data?.length && (
        <div className="space-y-2">
          {data.map((r) => {
            const href = TYPE_LINKS[r.type]?.(r);
            return (
              <div key={`${r.type}/${r.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-card/70">
                <span className="min-w-[80px] rounded bg-slate-700 px-2 py-0.5 text-center text-xs capitalize text-muted">
                  {r.type}
                </span>
                {href ? (
                  <Link to={href} className="font-medium text-primary hover:underline">{r.name}</Link>
                ) : (
                  <span className="font-medium">{r.name}</span>
                )}
                {Object.keys(r.labels ?? {}).length > 0 && (
                  <div className="ml-auto flex gap-1">
                    {Object.entries(r.labels).map(([k, v]) => (
                      <span key={k} className="rounded bg-slate-700/60 px-1.5 py-0.5 text-xs text-muted">{k}={v}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

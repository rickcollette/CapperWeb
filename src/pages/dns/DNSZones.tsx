import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { useDNSZones, useDNSZone, useDNSQuery, useCreateDNSZone, useCreateDNSRecord } from "@/api/resources";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";

export function DNSZones() {
  const { data, isLoading } = useDNSZones();
  const create = useCreateDNSZone();
  const [name, setName] = useState("");

  return (
    <div>
      <PageHeader title="DNS Zones" description="Internal DNS for Capper networks." />
      <Card className="mb-6 max-w-md">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); create.mutate({ name }, { onSuccess: () => setName("") }); }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="zone.name." className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <Button type="submit" variant="primary" disabled={create.isPending}>Create zone</Button>
        </form>
      </Card>
      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !data?.length && <EmptyState title="No zones" />}
      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-card text-left text-muted"><th className="p-3">Zone</th><th className="p-3">Type</th><th className="p-3">TTL</th></tr></thead>
            <tbody>
              {data.map((z) => (
                <tr key={z.id} className="border-b border-border/60">
                  <td className="p-3"><Link to={`/dns/${z.name}`} className="text-primary hover:underline">{z.name}</Link></td>
                  <td className="p-3">{z.type}</td>
                  <td className="p-3">{z.defaultTtl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Card className="mt-6 max-w-lg"><DNSQueryTester /></Card>
    </div>
  );
}

function DNSQueryTester() {
  const query = useDNSQuery();
  const [fqdn, setFqdn] = useState("gateway.cap");
  const [type, setType] = useState("A");
  return (
    <div>
      <h3 className="mb-3 font-medium">Query Tester</h3>
      <div className="flex flex-wrap gap-2">
        <input value={fqdn} onChange={(e) => setFqdn(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" size={6}>
          <option>A</option><option>AAAA</option><option>CNAME</option><option>TXT</option><option>MX</option><option>SRV</option>
        </select>
        <Button onClick={() => query.mutate({ fqdn, type })} disabled={query.isPending}>Query</Button>
      </div>
      {query.data && <pre className="mt-3 rounded-lg bg-background p-3 font-mono text-xs">{query.data.text}</pre>}
    </div>
  );
}

export function ZoneDetail() {
  const { zone = "" } = useParams();
  const { data, isLoading } = useDNSZone(zone);
  const createRecord = useCreateDNSRecord(zone);
  const [recName, setRecName] = useState("");
  const [recType, setRecType] = useState("A");
  const [recValue, setRecValue] = useState("");

  if (isLoading) return <p className="text-muted">Loading...</p>;
  if (!data) return <p className="text-red-400">Zone not found.</p>;

  return (
    <div>
      <PageHeader title={data.zone.name} description={`Zone ${data.zone.type}`} />
      <Card className="mb-6 max-w-xl">
        <form className="flex flex-wrap gap-2" onSubmit={(e) => {
          e.preventDefault();
          const values = recValue.split(",").map((v) => v.trim()).filter(Boolean);
          createRecord.mutate({ name: recName, type: recType, values }, { onSuccess: () => { setRecName(""); setRecValue(""); } });
        }}>
          <input value={recName} onChange={(e) => setRecName(e.target.value)} placeholder="record name" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <select value={recType} onChange={(e) => setRecType(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option>A</option><option>AAAA</option><option>CNAME</option><option>TXT</option><option>MX</option><option>SRV</option>
          </select>
          <input value={recValue} onChange={(e) => setRecValue(e.target.value)} placeholder="value (comma-separate for multi-value)" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <Button type="submit" variant="primary">Add record</Button>
        </form>
      </Card>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-card text-left text-muted"><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Values</th></tr></thead>
          <tbody>
            {data.records?.map((r) => (
              <tr key={r.id} className="border-b border-border/60">
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.type}</td>
                <td className="p-3 font-mono text-xs">{r.values.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link to="/dns" className="mt-4 inline-block text-sm text-primary hover:underline">← Back</Link>
    </div>
  );
}

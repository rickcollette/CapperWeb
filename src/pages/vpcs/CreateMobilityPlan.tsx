import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCreateMobilityPlan } from "@/api/topology";
import { Button, Card, PageHeader } from "@/components/common/ui";

export function CreateMobilityPlan() {
  const { vpcId = "" } = useParams();
  const navigate = useNavigate();
  const create = useCreateMobilityPlan(vpcId);
  const [form, setForm] = useState({
    operation: "copy",
    copyMode: "full",
    strategy: "rolling",
    destinationRegionId: "",
    destinationZoneId: "",
  });

  if (!vpcId) return <p className="text-red-400">No VPC ID provided.</p>;

  return (
    <div>
      <PageHeader
        title="Create Mobility Plan"
        description={`Plan a move, copy, or sync for VPC ${vpcId}.`}
      />
      <Card className="max-w-md space-y-4">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              {
                operation: form.operation,
                copyMode: form.copyMode,
                strategy: form.strategy,
                destinationRegionId: form.destinationRegionId || undefined,
                destinationZoneId: form.destinationZoneId || undefined,
              },
              { onSuccess: () => navigate(`/vpcs/${vpcId}/mobility`) },
            );
          }}
        >
          <div>
            <label className="mb-1 block text-sm text-muted">Operation</label>
            <select
              value={form.operation}
              onChange={(e) => setForm({ ...form, operation: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="copy">Copy</option>
              <option value="move">Move</option>
              <option value="sync">Sync</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Copy Mode</label>
            <select
              value={form.copyMode}
              onChange={(e) => setForm({ ...form, copyMode: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="full">Full</option>
              <option value="incremental">Incremental</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Strategy</label>
            <select
              value={form.strategy}
              onChange={(e) => setForm({ ...form, strategy: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="rolling">Rolling</option>
              <option value="blue-green">Blue-Green</option>
              <option value="cutover">Cutover</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Destination Region ID</label>
            <input
              value={form.destinationRegionId}
              onChange={(e) => setForm({ ...form, destinationRegionId: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Destination Zone ID</label>
            <input
              value={form.destinationZoneId}
              onChange={(e) => setForm({ ...form, destinationZoneId: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          {create.isError && <p className="text-sm text-red-400">{String(create.error)}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Link to={`/vpcs/${vpcId}/mobility`}>
              <Button type="button">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create Plan"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

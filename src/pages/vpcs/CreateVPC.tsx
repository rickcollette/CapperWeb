import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateVPC } from "@/api/topology";
import { SUBNET_KIND_OPTIONS } from "@/lib/subnetKinds";
import { cidrContains, isValidCidr } from "@/lib/cidr";
import type { SubnetKind } from "@/types/capper";
import { Button, Card, PageHeader } from "@/components/common/ui";
import { Plus, Trash2 } from "lucide-react";

const STEPS = ["Identity", "Initial Subnets", "Connectivity"] as const;

type SubnetRow = {
  name: string;
  cidr: string;
  kind: SubnetKind;
  zoneId: string;
};

export function CreateVPC() {
  const navigate = useNavigate();
  const create = useCreateVPC();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    cidr: "10.0.0.0/16",
    description: "",
    dnsDomain: "",
    enableFlowLogs: false,
    attachInternetGateway: false,
    natSubnetId: "",
    natName: "",
  });
  const [subnets, setSubnets] = useState<SubnetRow[]>([]);
  const [validationError, setValidationError] = useState("");

  function addSubnetRow() {
    setSubnets((rows) => [...rows, { name: "", cidr: "", kind: "private", zoneId: "" }]);
  }

  function updateSubnet(i: number, patch: Partial<SubnetRow>) {
    setSubnets((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeSubnet(i: number) {
    setSubnets((rows) => rows.filter((_, idx) => idx !== i));
  }

  const publicSubnets = subnets.filter((s) => s.kind === "public" || s.kind === "edge");

  function submit() {
    setValidationError("");
    if (!isValidCidr(form.cidr)) {
      setValidationError("Enter a valid VPC CIDR (e.g. 10.0.0.0/16).");
      return;
    }
    const activeSubnets = subnets.filter((s) => s.cidr.trim());
    for (const s of activeSubnets) {
      if (!isValidCidr(s.cidr.trim())) {
        setValidationError(`Subnet "${s.name || s.cidr}" has an invalid CIDR.`);
        return;
      }
      if (!cidrContains(form.cidr, s.cidr.trim())) {
        setValidationError(
          `Subnet ${s.cidr.trim()} is not inside VPC CIDR ${form.cidr}. Adjust the subnet or VPC CIDR.`,
        );
        return;
      }
    }
    const slug = form.name.toLowerCase().replace(/\s+/g, "-");
    create.mutate(
      {
        name: form.name,
        slug,
        cidr: form.cidr,
        description: form.description || undefined,
        dnsDomain: form.dnsDomain || undefined,
        enableFlowLogs: form.enableFlowLogs,
        attachInternetGateway: form.attachInternetGateway,
        initialSubnets: activeSubnets
          .map((s) => ({
            name: s.name.trim() || `subnet-${s.cidr.replace(/\//g, "-")}`,
            cidr: s.cidr.trim(),
            kind: s.kind,
            zoneId: s.zoneId.trim() || undefined,
          })),
        natGateway:
          form.natSubnetId && form.attachInternetGateway
            ? { subnetCidr: form.natSubnetId, name: form.natName || "nat-gateway" }
            : undefined,
      },
      {
        onSuccess: (detail) => {
          const id = detail?.vpc?.id || detail?.vpc?.slug || slug;
          navigate(`/vpcs/${id}`);
        },
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="Create VPC"
        description="Provision a VPC with optional subnets, internet gateway, and NAT."
      />

      <div className="mb-6 flex gap-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`rounded-full px-4 py-1.5 text-sm ${
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-card text-foreground"
                  : "bg-muted/30 text-muted"
            }`}
            onClick={() => setStep(i)}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <Card className="max-w-lg space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted">Name</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">CIDR</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
              value={form.cidr}
              onChange={(e) => setForm({ ...form, cidr: e.target.value })}
              placeholder="10.0.0.0/16"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Description (optional)</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">DNS domain (optional)</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.dnsDomain}
              onChange={(e) => setForm({ ...form, dnsDomain: e.target.value })}
              placeholder="internal.example.com"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enableFlowLogs}
              onChange={(e) => setForm({ ...form, enableFlowLogs: e.target.checked })}
            />
            Enable flow logs
          </label>
          <div className="flex justify-end gap-2">
            <Link to="/vpcs" className="text-sm text-muted hover:text-foreground">
              Cancel
            </Link>
            <Button variant="primary" disabled={!form.name || !form.cidr} onClick={() => setStep(1)}>
              Next
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="max-w-2xl space-y-4">
          <p className="text-sm text-muted">
            Optionally add subnets within <span className="font-mono">{form.cidr}</span>. Skip to create an empty VPC.
          </p>
          {subnets.map((row, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-5">
              <input
                placeholder="Name"
                value={row.name}
                onChange={(e) => updateSubnet(i, { name: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                placeholder="CIDR"
                value={row.cidr}
                onChange={(e) => updateSubnet(i, { cidr: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
              />
              <select
                value={row.kind}
                onChange={(e) => updateSubnet(i, { kind: e.target.value as SubnetKind })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {SUBNET_KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                placeholder="Zone (optional)"
                value={row.zoneId}
                onChange={(e) => updateSubnet(i, { zoneId: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                className="flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10"
                onClick={() => removeSubnet(i)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button variant="ghost" onClick={addSubnetRow}>
            <Plus className="h-4 w-4" /> Add subnet
          </Button>
          <div className="flex justify-between">
            <Button onClick={() => setStep(0)}>Back</Button>
            <div className="flex gap-2">
              <Button onClick={() => setStep(2)}>Skip</Button>
              <Button variant="primary" onClick={() => setStep(2)}>
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="max-w-lg space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.attachInternetGateway}
              onChange={(e) => setForm({ ...form, attachInternetGateway: e.target.checked })}
            />
            Attach Internet Gateway (adds 0.0.0.0/0 route on main route table)
          </label>
          {form.attachInternetGateway && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-xs text-muted">Optional NAT gateway in a public subnet</p>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.natSubnetId}
                onChange={(e) => setForm({ ...form, natSubnetId: e.target.value })}
              >
                <option value="">No NAT gateway</option>
                {publicSubnets
                  .filter((s) => s.cidr.trim())
                  .map((s, i) => (
                    <option key={i} value={s.cidr.trim()}>
                      {s.name || s.cidr} ({s.cidr})
                    </option>
                  ))}
              </select>
              <p className="text-xs text-muted">
                NAT is created after subnets are provisioned. Select a public subnet from step 2, or add one on the detail page.
              </p>
              {form.natSubnetId && (
                <input
                  placeholder="NAT gateway name"
                  value={form.natName}
                  onChange={(e) => setForm({ ...form, natName: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              )}
            </div>
          )}
          {create.isError && (
            <p className="text-sm text-red-400">
              {create.error instanceof Error ? create.error.message : String(create.error)}
            </p>
          )}
          {validationError && <p className="text-sm text-red-400">{validationError}</p>}
          <div className="flex justify-between">
            <Button onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" disabled={create.isPending || !form.name} onClick={submit}>
              {create.isPending ? "Creating…" : "Create VPC"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

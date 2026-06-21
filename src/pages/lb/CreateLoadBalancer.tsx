import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateLB, useSubnetAvailableIPs } from "@/api/extras";
import { useIPPools, useIPs } from "@/api/ipam";
import { useVPCs, useVPCSubnets } from "@/api/topology";
import { useCertificates } from "@/api/certificates";
import { filterSubnetsForScheme } from "@/lib/subnetKinds";
import { Button, Card, PageHeader } from "@/components/common/ui";

const STEPS = ["Identity", "Placement", "First Listener"] as const;

export function CreateLoadBalancer() {
  const navigate = useNavigate();
  const create = useCreateLB();
  const { data: vpcs } = useVPCs();
  const { data: pools } = useIPPools();
  const { data: certs } = useCertificates("issued");

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    type: "application" as "application" | "network",
    scheme: "internal" as "internal" | "internet-facing",
    vpcId: "",
    subnetId: "",
    poolId: "",
    vip: "",
    autoVip: true,
    skipListener: false,
    listenerProtocol: "HTTP",
    listenerPort: 80,
    listenerCertId: "",
    targetGroupName: "",
    targetGroupPort: 8080,
    initialTargetAddr: "",
    algorithm: "round-robin",
  });

  const activeVpc = form.vpcId || vpcs?.[0]?.slug || vpcs?.[0]?.id || "";
  const subnetPurpose = form.scheme === "internet-facing" ? "lb" : "lb-internal";
  const { data: subnets } = useVPCSubnets(activeVpc, subnetPurpose);
  const filteredSubnets = useMemo(
    () => filterSubnetsForScheme(subnets, form.scheme),
    [subnets, form.scheme],
  );
  const subnetId = form.subnetId || filteredSubnets[0]?.id || "";
  const { data: availableIPs } = useSubnetAvailableIPs(
    form.scheme === "internal" ? subnetId : "",
  );

  const lbPools = useMemo(
    () => (pools ?? []).filter((p) => p.usage?.includes("load-balancer")),
    [pools],
  );
  const poolId = form.poolId || lbPools[0]?.id || "";
  const { data: routableIPs } = useIPs(poolId, "available");

  const protocols = form.type === "network" ? ["TCP"] : ["HTTP", "HTTPS", "TCP"];

  function submit() {
    if (!subnetId) return;
    create.mutate(
      {
        name: form.name,
        scheme: form.scheme,
        type: form.type,
        vpcId: activeVpc,
        subnetId,
        poolId: form.scheme === "internet-facing" ? poolId : undefined,
        vip: form.autoVip ? undefined : form.vip || undefined,
        autoVip: form.autoVip,
        algorithm: form.algorithm,
        listenerProtocol: form.skipListener ? undefined : form.listenerProtocol,
        listenerPort: form.skipListener ? undefined : form.listenerPort,
        listenerCertId: form.skipListener ? undefined : form.listenerCertId || undefined,
        targetGroupName: form.skipListener ? undefined : form.targetGroupName || `${form.name}-tg`,
        targetGroupPort: form.skipListener ? undefined : form.targetGroupPort,
        initialTargetAddr: form.skipListener ? undefined : form.initialTargetAddr || undefined,
      },
      {
        onSuccess: () => navigate(`/lb/${form.name}`),
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="Create Load Balancer"
        description="Configure exposure, VIP placement, and an optional first listener."
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
            <label className="mb-1 block text-xs text-muted">Type</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as "application" | "network",
                  listenerProtocol: e.target.value === "network" ? "TCP" : "HTTP",
                })
              }
            >
              <option value="application">Application (HTTP/HTTPS)</option>
              <option value="network">Network (TCP)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Link to="/lb" className="text-sm text-muted hover:text-foreground">
              Cancel
            </Link>
            <Button variant="primary" disabled={!form.name} onClick={() => setStep(1)}>
              Next
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="max-w-lg space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted">Scheme</label>
            <div className="flex gap-2">
              {(["internal", "internet-facing"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize ${
                    form.scheme === s ? "border-primary bg-primary/10" : "border-border"
                  }`}
                  onClick={() => setForm({ ...form, scheme: s, subnetId: "", vip: "", autoVip: true })}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">VPC</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={activeVpc}
              onChange={(e) => setForm({ ...form, vpcId: e.target.value, subnetId: "" })}
            >
              {(vpcs ?? []).map((v) => (
                <option key={v.id ?? v.slug} value={v.slug ?? v.id}>
                  {v.name ?? v.slug}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Subnet</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={subnetId}
              onChange={(e) => setForm({ ...form, subnetId: e.target.value })}
            >
              {filteredSubnets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? s.cidr ?? s.id}
                </option>
              ))}
            </select>
          </div>

          {form.scheme === "internet-facing" ? (
            <>
              <div>
                <label className="mb-1 block text-xs text-muted">IP Pool</label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={poolId}
                  onChange={(e) => setForm({ ...form, poolId: e.target.value, vip: "" })}
                >
                  {lbPools.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.cidr})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">VIP</label>
                <label className="mb-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.autoVip}
                    onChange={(e) => setForm({ ...form, autoVip: e.target.checked })}
                  />
                  Auto-allocate from pool
                </label>
                {!form.autoVip && (
                  <select
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                    value={form.vip}
                    onChange={(e) => setForm({ ...form, vip: e.target.value })}
                  >
                    <option value="">Select routable IP…</option>
                    {(routableIPs ?? []).map((ip) => (
                      <option key={ip.id} value={ip.address}>
                        {ip.address}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1 block text-xs text-muted">Private VIP</label>
              <label className="mb-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.autoVip}
                  onChange={(e) => setForm({ ...form, autoVip: e.target.checked })}
                />
                Auto-allocate next free IP in subnet
              </label>
              {!form.autoVip && (
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                  value={form.vip}
                  onChange={(e) => setForm({ ...form, vip: e.target.value })}
                >
                  <option value="">Select IP…</option>
                  {(availableIPs ?? []).map((ip) => (
                    <option key={ip} value={ip}>
                      {ip}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex justify-between gap-2">
            <Button onClick={() => setStep(0)}>Back</Button>
            <Button variant="primary" disabled={!subnetId} onClick={() => setStep(2)}>
              Next
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="max-w-lg space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.skipListener}
              onChange={(e) => setForm({ ...form, skipListener: e.target.checked })}
            />
            Skip first listener (configure on detail page)
          </label>

          {!form.skipListener && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">Protocol</label>
                  <select
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.listenerProtocol}
                    onChange={(e) => setForm({ ...form, listenerProtocol: e.target.value })}
                  >
                    {protocols.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Port</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.listenerPort}
                    onChange={(e) => setForm({ ...form, listenerPort: Number(e.target.value) })}
                  />
                </div>
              </div>
              {form.listenerProtocol === "HTTPS" && (
                <div>
                  <label className="mb-1 block text-xs text-muted">TLS Certificate</label>
                  <select
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.listenerCertId}
                    onChange={(e) => setForm({ ...form, listenerCertId: e.target.value })}
                  >
                    <option value="">Select certificate…</option>
                    {(certs ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.commonName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs text-muted">Target group name</label>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder={`${form.name}-tg`}
                  value={form.targetGroupName}
                  onChange={(e) => setForm({ ...form, targetGroupName: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Target port</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={form.targetGroupPort}
                  onChange={(e) => setForm({ ...form, targetGroupPort: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Initial backend (optional)</label>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                  placeholder="10.0.1.5:8080"
                  value={form.initialTargetAddr}
                  onChange={(e) => setForm({ ...form, initialTargetAddr: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="flex justify-between gap-2">
            <Button onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" disabled={create.isPending || !form.name} onClick={submit}>
              {create.isPending ? "Creating…" : "Create Load Balancer"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useVPCDetail,
  useCreateVPCSubnet,
  useDeleteSubnet,
  usePatchVPC,
} from "@/api/topology";
import {
  useAddRoute,
  useDeleteRoute,
  useCreateSecurityGroup,
  useDeleteSecurityGroup,
  useAddSGRule,
  useDeleteSGRule,
  useAddNetworkACLEntry,
  useDeleteNetworkACLEntry,
  useCreateIGW,
  useDeleteIGW,
  useCreateNATGateway,
  useDeleteNATGateway,
  useReachabilityAnalyze,
  useFlowLogs,
  useCreateFlowLog,
} from "@/api/vpcnet";
import { SUBNET_KIND_OPTIONS, subnetKind } from "@/lib/subnetKinds";
import type {
  NetworkACLEntry,
  Route,
  SecurityGroupRule,
  Subnet,
  SubnetKind,
} from "@/types/capper";
import { Button, Card, ConfirmDialog, PageHeader, StatusBadge } from "@/components/common/ui";
import { DeleteResourceModal } from "@/components/DeleteResourceModal";
import { DeletionProgressModal } from "@/components/DeletionProgressModal";
import { useDeletionFlow } from "@/hooks/useDeletionFlow";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

const tabs = [
  "Overview",
  "Subnets",
  "Route Tables",
  "Security Groups",
  "NACLs",
  "Gateways",
  "Flow Logs",
  "Reachability",
] as const;

type Tab = (typeof tabs)[number];

export function VPCDetail() {
  const { vpcId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: detail, isLoading } = useVPCDetail(vpcId);
  const [tab, setTab] = useState<Tab>("Overview");
  const deletion = useDeletionFlow({
    onDeletionComplete: () => {
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
      queryClient.removeQueries({ queryKey: ["vpc-detail", vpcId] });
      navigate("/vpcs");
    },
  });

  if (isLoading) return <p className="text-muted">Loading VPC…</p>;
  if (!detail?.vpc) return <p className="text-red-400">VPC not found.</p>;

  const vpc = detail.vpc;
  const vpcRef = vpc.id || vpcId;

  return (
    <div>
      <PageHeader
        title={vpc.name || vpc.slug || vpcRef}
        description={`VPC ${vpc.id} · ${vpc.cidr || vpc.primaryIpv4Cidr || ""}`}
        actions={
          <Link to={`/vpcs/${vpcRef}/mobility`}>
            <Button size="sm">Mobility</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <OverviewTab vpcRef={vpcRef} vpc={vpc} detail={detail} deletion={deletion} />
      )}
      {tab === "Subnets" && <SubnetsTab vpcRef={vpcRef} subnets={detail.subnets ?? []} />}
      {tab === "Route Tables" && <RouteTablesTab vpcRef={vpcRef} routeTables={detail.routeTables ?? []} />}
      {tab === "Security Groups" && (
        <SecurityGroupsTab vpcRef={vpcRef} vpcId={vpc.id} groups={detail.securityGroups ?? []} />
      )}
      {tab === "NACLs" && <NACLsTab vpcRef={vpcRef} acls={detail.networkAcls ?? []} />}
      {tab === "Gateways" && (
        <GatewaysTab
          vpcRef={vpcRef}
          vpcId={vpc.id}
          igws={detail.internetGateways ?? []}
          nats={detail.natGateways ?? []}
          subnets={detail.subnets ?? []}
        />
      )}
      {tab === "Flow Logs" && <FlowLogsTab vpcRef={vpcRef} vpc={vpc} />}
      {tab === "Reachability" && <ReachabilityTab />}

      {/* New deletion flow modals */}
      <DeleteResourceModal
        open={deletion.showConfirmModal}
        resourceType={deletion.state.resourceType}
        resourceId={deletion.state.resourceId}
        resourceName={deletion.state.resourceName}
        onClose={deletion.closeConfirmModal}
        onSuccess={(jobId) => {
          deletion.closeConfirmModal();
          deletion.onConfirmSuccess(jobId);
        }}
      />

      {deletion.state.jobId && (
        <DeletionProgressModal
          open={deletion.showProgressModal}
          jobId={deletion.state.jobId}
          resourceType={deletion.state.resourceType}
          resourceId={deletion.state.resourceId}
          onClose={deletion.closeModal}
          onComplete={(job) => {
            deletion.onDeletionComplete(job);
            if (job.status === 'completed') {
              setTimeout(() => deletion.closeModal(), 2000);
            }
          }}
        />
      )}

      <Link to="/vpcs" className="mt-6 inline-block text-sm text-primary hover:underline">
        ← Back to VPCs
      </Link>
    </div>
  );
}

function OverviewTab({
  vpcRef,
  vpc,
  detail,
  deletion,
}: {
  vpcRef: string;
  vpc: { id: string; cidr?: string; primaryIpv4Cidr?: string; status?: string; enableFlowLogs?: boolean; name?: string };
  detail: NonNullable<ReturnType<typeof useVPCDetail>["data"]>;
  deletion: ReturnType<typeof useDeletionFlow>;
}) {
  const cidr = vpc.cidr || vpc.primaryIpv4Cidr || "";

  function copy() {
    if (cidr) navigator.clipboard.writeText(cidr);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <span className="text-xs text-muted">Status</span>
          <div className="mt-1">
            <StatusBadge status={vpc.status || "available"} />
          </div>
        </Card>
        <Card>
          <span className="text-xs text-muted">CIDR</span>
          <p className="mt-1 font-mono text-sm">{cidr || "—"}</p>
          {cidr && (
            <button type="button" className="mt-1 text-xs text-primary" onClick={copy}>
              Copy
            </button>
          )}
        </Card>
        <Card>
          <span className="text-xs text-muted">Flow logs</span>
          <p className="mt-1">{vpc.enableFlowLogs ? "Enabled" : "Disabled"}</p>
        </Card>
      </div>
      <Card className="grid gap-4 md:grid-cols-3">
        <div>
          <span className="text-muted">Subnets</span>
          <div>{detail.subnets?.length ?? 0}</div>
        </div>
        <div>
          <span className="text-muted">Route tables</span>
          <div>{detail.routeTables?.length ?? 0}</div>
        </div>
        <div>
          <span className="text-muted">Security groups</span>
          <div>{detail.securityGroups?.length ?? 0}</div>
        </div>
        <div>
          <span className="text-muted">Network ACLs</span>
          <div>{detail.networkAcls?.length ?? 0}</div>
        </div>
        <div>
          <span className="text-muted">IGW / NAT</span>
          <div>
            {detail.internetGateways?.length ?? 0} / {detail.natGateways?.length ?? 0}
          </div>
        </div>
      </Card>
      <Button
        variant="danger"
        onClick={() => deletion.startDeletion('vpc', vpcRef, vpc.name || vpcRef)}
        data-testid="vpc-delete"
      >
        Delete VPC
      </Button>
    </div>
  );
}

function SubnetsTab({ vpcRef, subnets }: { vpcRef: string; subnets: Subnet[] }) {
  const create = useCreateVPCSubnet(vpcRef);
  const remove = useDeleteSubnet(vpcRef);
  const [form, setForm] = useState({ name: "", cidr: "", kind: "private" as SubnetKind, zoneId: "" });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim() || `subnet-${form.cidr.replace(/\//g, "-")}`;
    create.mutate(
      { name, cidr: form.cidr.trim(), kind: form.kind, zoneId: form.zoneId.trim() || undefined },
      { onSuccess: () => setForm({ name: "", cidr: "", kind: "private", zoneId: "" }) },
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="p-2">Name</th>
              <th className="p-2">CIDR</th>
              <th className="p-2">Kind</th>
              <th className="p-2">Available IPs</th>
              <th className="p-2">Zone</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {subnets.map((s) => (
              <tr key={s.id} className="border-t border-border/60">
                <td className="p-2 font-mono text-xs">{s.name}</td>
                <td className="p-2 font-mono text-xs">{s.cidr}</td>
                <td className="p-2">{subnetKind(s)}</td>
                <td className="p-2">{s.availableIpCount ?? "—"}</td>
                <td className="p-2 text-muted">{s.zone || s.zoneId || "—"}</td>
                <td className="p-2 text-right">
                  <button
                    type="button"
                    className="rounded p-1 text-red-400 hover:bg-red-500/10"
                    onClick={() => setConfirmId(s.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={form.cidr}
            onChange={(e) => setForm((f) => ({ ...f, cidr: e.target.value }))}
            placeholder="CIDR"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
            required
          />
          <select
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as SubnetKind }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {SUBNET_KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            value={form.zoneId}
            onChange={(e) => setForm((f) => ({ ...f, zoneId: e.target.value }))}
            placeholder="Zone"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <Button type="submit" size="sm" disabled={create.isPending}>
            <Plus className="h-3 w-3" /> Add subnet
          </Button>
        </form>
      </Card>
      <ConfirmDialog
        open={!!confirmId}
        title="Delete subnet?"
        description="Instances, ENIs, or load balancers in this subnet will block deletion."
        onConfirm={() => {
          if (confirmId) remove.mutate(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

function RouteTablesTab({
  vpcRef,
  routeTables,
}: {
  vpcRef: string;
  routeTables: { routeTable: { id: string; name: string; isMain?: boolean }; routes: Route[] }[];
}) {
  const addRoute = useAddRoute(vpcRef);
  const delRoute = useDeleteRoute(vpcRef);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ destinationCidr: "", targetType: "local", targetId: "local" });

  return (
    <div className="space-y-3">
      {routeTables.map(({ routeTable: rt, routes }) => (
        <Card key={rt.id}>
          <button
            type="button"
            className="flex w-full items-center gap-2 text-left"
            onClick={() => setOpen(open === rt.id ? null : rt.id)}
          >
            {open === rt.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium">{rt.name || rt.id}</span>
            {rt.isMain && <span className="text-xs text-muted">(main)</span>}
          </button>
          {open === rt.id && (
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-muted">
                    <th className="p-1 text-left">Destination</th>
                    <th className="p-1 text-left">Target</th>
                    <th className="p-1" />
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.id}>
                      <td className="p-1">{r.destinationCidr || r.destination}</td>
                      <td className="p-1">
                        {r.targetType}:{r.targetId}
                      </td>
                      <td className="p-1 text-right">
                        <button
                          type="button"
                          className="text-red-400"
                          onClick={() => delRoute.mutate({ routeTableId: rt.id, routeId: r.id })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addRoute.mutate(
                    { routeTableId: rt.id, ...form },
                    { onSuccess: () => setForm({ destinationCidr: "", targetType: "local", targetId: "local" }) },
                  );
                }}
              >
                <input
                  placeholder="0.0.0.0/0"
                  value={form.destinationCidr}
                  onChange={(e) => setForm({ ...form, destinationCidr: e.target.value })}
                  className="rounded border border-border bg-background px-2 py-1 text-sm"
                  required
                />
                <select
                  value={form.targetType}
                  onChange={(e) => setForm({ ...form, targetType: e.target.value })}
                  className="rounded border border-border bg-background px-2 py-1 text-sm"
                >
                  <option value="local">local</option>
                  <option value="internet-gateway">internet-gateway</option>
                  <option value="nat-gateway">nat-gateway</option>
                  <option value="vpc-peering">vpc-peering</option>
                </select>
                <input
                  placeholder="Target ID"
                  value={form.targetId}
                  onChange={(e) => setForm({ ...form, targetId: e.target.value })}
                  className="rounded border border-border bg-background px-2 py-1 text-sm"
                />
                <Button type="submit" size="sm">
                  Add route
                </Button>
              </form>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function SecurityGroupsTab({
  vpcRef,
  vpcId,
  groups,
}: {
  vpcRef: string;
  vpcId: string;
  groups: { securityGroup: { id: string; name: string; description?: string; isDefault?: boolean }; rules: SecurityGroupRule[] }[];
}) {
  const create = useCreateSecurityGroup(vpcRef);
  const remove = useDeleteSecurityGroup(vpcRef);
  const addRule = useAddSGRule(vpcRef);
  const delRule = useDeleteSGRule(vpcRef);
  const [open, setOpen] = useState<string | null>(null);
  const [sgForm, setSgForm] = useState({ name: "", description: "" });
  const [ruleForm, setRuleForm] = useState({
    direction: "ingress",
    protocol: "tcp",
    fromPort: 80,
    toPort: 80,
    cidr: "0.0.0.0/0",
    action: "allow",
  });

  return (
    <div className="space-y-4">
      <Card>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              { vpcId, name: sgForm.name, description: sgForm.description },
              { onSuccess: () => setSgForm({ name: "", description: "" }) },
            );
          }}
        >
          <input
            placeholder="Group name"
            value={sgForm.name}
            onChange={(e) => setSgForm({ ...sgForm, name: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Description"
            value={sgForm.description}
            onChange={(e) => setSgForm({ ...sgForm, description: e.target.value })}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <Button type="submit" size="sm" disabled={create.isPending}>
            <Plus className="h-3 w-3" /> Create group
          </Button>
        </form>
      </Card>
      {groups.map(({ securityGroup: sg, rules }) => (
        <Card key={sg.id}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => setOpen(open === sg.id ? null : sg.id)}
            >
              {open === sg.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="font-medium">{sg.name}</span>
              {sg.isDefault && <span className="text-xs text-muted">(default)</span>}
            </button>
            {!sg.isDefault && (
              <button type="button" className="text-red-400" onClick={() => remove.mutate(sg.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          {sg.description && <p className="mt-1 text-xs text-muted">{sg.description}</p>}
          {open === sg.id && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between font-mono text-xs">
                  <span>
                    {r.direction} {r.protocol} {r.fromPort}-{r.toPort} {r.cidr || r.cidrIpv4} ({r.action || "allow"})
                  </span>
                  <button type="button" className="text-red-400" onClick={() => delRule.mutate(r.id)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <form
                className="flex flex-wrap gap-2 pt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addRule.mutate({ sgId: sg.id, ...ruleForm });
                }}
              >
                <select
                  value={ruleForm.direction}
                  onChange={(e) => setRuleForm({ ...ruleForm, direction: e.target.value })}
                  className="rounded border border-border bg-background px-2 py-1 text-sm"
                >
                  <option value="ingress">ingress</option>
                  <option value="egress">egress</option>
                </select>
                <input
                  value={ruleForm.protocol}
                  onChange={(e) => setRuleForm({ ...ruleForm, protocol: e.target.value })}
                  className="w-16 rounded border border-border bg-background px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  value={ruleForm.fromPort}
                  onChange={(e) => setRuleForm({ ...ruleForm, fromPort: Number(e.target.value) })}
                  className="w-16 rounded border border-border bg-background px-2 py-1 text-sm"
                />
                <input
                  value={ruleForm.cidr}
                  onChange={(e) => setRuleForm({ ...ruleForm, cidr: e.target.value })}
                  className="rounded border border-border bg-background px-2 py-1 text-sm font-mono"
                />
                <Button type="submit" size="sm">
                  Add rule
                </Button>
              </form>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function NACLsTab({
  vpcRef,
  acls,
}: {
  vpcRef: string;
  acls: { networkAcl: { id: string; name: string; isDefault?: boolean }; entries: NetworkACLEntry[] }[];
}) {
  const addEntry = useAddNetworkACLEntry(vpcRef);
  const delEntry = useDeleteNetworkACLEntry(vpcRef);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({
    ruleNumber: 100,
    direction: "ingress",
    action: "allow",
    protocol: "all",
    cidr: "0.0.0.0/0",
    fromPort: 0,
    toPort: 0,
  });

  return (
    <div className="space-y-3">
      {acls.map(({ networkAcl: acl, entries }) => (
        <Card key={acl.id}>
          <button
            type="button"
            className="flex items-center gap-2"
            onClick={() => setOpen(open === acl.id ? null : acl.id)}
          >
            {open === acl.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium">{acl.name}</span>
            {acl.isDefault && <span className="text-xs text-muted">(default)</span>}
          </button>
          {open === acl.id && (
            <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs font-mono">
              {entries.map((e) => (
                <div key={e.ruleNumber} className="flex justify-between">
                  <span>
                    #{e.ruleNumber} {e.direction} {e.action} {e.protocol} {e.cidr}
                  </span>
                  <button
                    type="button"
                    className="text-red-400"
                    onClick={() => delEntry.mutate({ aclId: acl.id, ruleNumber: e.ruleNumber })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <form
                className="flex flex-wrap gap-2 pt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addEntry.mutate({ aclId: acl.id, ...form });
                }}
              >
                <input
                  type="number"
                  value={form.ruleNumber}
                  onChange={(e) => setForm({ ...form, ruleNumber: Number(e.target.value) })}
                  className="w-20 rounded border border-border bg-background px-2 py-1"
                />
                <select
                  value={form.direction}
                  onChange={(e) => setForm({ ...form, direction: e.target.value })}
                  className="rounded border border-border bg-background px-2 py-1"
                >
                  <option value="ingress">ingress</option>
                  <option value="egress">egress</option>
                </select>
                <select
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value })}
                  className="rounded border border-border bg-background px-2 py-1"
                >
                  <option value="allow">allow</option>
                  <option value="deny">deny</option>
                </select>
                <input
                  value={form.cidr}
                  onChange={(e) => setForm({ ...form, cidr: e.target.value })}
                  className="rounded border border-border bg-background px-2 py-1"
                />
                <Button type="submit" size="sm">
                  Add entry
                </Button>
              </form>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function GatewaysTab({
  vpcRef,
  vpcId,
  igws,
  nats,
  subnets,
}: {
  vpcRef: string;
  vpcId: string;
  igws: { id: string; name: string; status?: string }[];
  nats: { id: string; name: string; subnetId: string; publicIp?: string; status?: string }[];
  subnets: Subnet[];
}) {
  const createIGW = useCreateIGW(vpcRef);
  const delIGW = useDeleteIGW(vpcRef);
  const createNAT = useCreateNATGateway(vpcRef);
  const delNAT = useDeleteNATGateway(vpcRef);
  const publicSubs = subnets.filter((s) => ["public", "edge"].includes(subnetKind(s)));
  const [natForm, setNatForm] = useState({ subnetId: "", name: "" });

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">Internet Gateways</h3>
          {igws.length === 0 && (
            <Button
              size="sm"
              onClick={() => createIGW.mutate({ vpcId, name: "igw" })}
              disabled={createIGW.isPending}
            >
              <Plus className="h-3 w-3" /> Create IGW
            </Button>
          )}
        </div>
        {igws.length === 0 ? (
          <p className="text-sm text-muted">No internet gateway attached.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {igws.map((igw) => (
              <li key={igw.id} className="flex items-center justify-between rounded border border-border px-3 py-2">
                <span className="font-mono text-xs">
                  {igw.name} ({igw.id})
                </span>
                <button type="button" className="text-red-400" onClick={() => delIGW.mutate({ igwId: igw.id, vpcId })}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <h3 className="mb-3 font-medium">NAT Gateways</h3>
        {nats.length > 0 && (
          <ul className="mb-4 space-y-2 text-sm">
            {nats.map((nat) => (
              <li key={nat.id} className="flex items-center justify-between rounded border border-border px-3 py-2">
                <span className="font-mono text-xs">
                  {nat.name} · subnet {nat.subnetId} {nat.publicIp ? `· ${nat.publicIp}` : ""}
                </span>
                <button type="button" className="text-red-400" onClick={() => delNAT.mutate(nat.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            createNAT.mutate({
              vpcId,
              subnetId: natForm.subnetId,
              name: natForm.name || "nat-gateway",
            });
          }}
        >
          <select
            value={natForm.subnetId}
            onChange={(e) => setNatForm({ ...natForm, subnetId: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Public subnet…</option>
            {publicSubs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.cidr})
              </option>
            ))}
          </select>
          <input
            placeholder="Name"
            value={natForm.name}
            onChange={(e) => setNatForm({ ...natForm, name: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <Button type="submit" size="sm" disabled={createNAT.isPending || !natForm.subnetId}>
            <Plus className="h-3 w-3" /> Add NAT
          </Button>
        </form>
      </Card>
    </div>
  );
}

function FlowLogsTab({
  vpcRef,
  vpc,
}: {
  vpcRef: string;
  vpc: { id: string; enableFlowLogs?: boolean };
}) {
  const patch = usePatchVPC(vpcRef);
  const createLog = useCreateFlowLog();
  const { data: logs } = useFlowLogs(vpc.id);

  return (
    <Card className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!vpc.enableFlowLogs}
          onChange={(e) => patch.mutate({ enableFlowLogs: e.target.checked })}
        />
        Enable flow logs on this VPC
      </label>
      {vpc.enableFlowLogs && (
        <Button
          size="sm"
          onClick={() =>
            createLog.mutate({ resourceType: "vpc", resourceId: vpc.id, destination: "stdout" })
          }
        >
          Create flow log collector
        </Button>
      )}
      {logs?.length ? (
        <ul className="text-xs font-mono text-muted">
          {logs.map((l: { id: string; destination?: string }) => (
            <li key={l.id}>
              {l.id} → {l.destination || "default"}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function ReachabilityTab() {
  const reachability = useReachabilityAnalyze();
  const [form, setForm] = useState({ sourceId: "", destId: "", port: "80" });

  return (
    <Card className="space-y-3">
      <div className="grid gap-2 md:grid-cols-3">
        <input
          placeholder="Source instance ID"
          value={form.sourceId}
          onChange={(e) => setForm((f) => ({ ...f, sourceId: e.target.value }))}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          placeholder="Destination ID"
          value={form.destId}
          onChange={(e) => setForm((f) => ({ ...f, destId: e.target.value }))}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          placeholder="Port"
          value={form.port}
          onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <Button
        size="sm"
        variant="primary"
        disabled={reachability.isPending}
        onClick={() =>
          reachability.mutate({
            sourceType: "instance",
            sourceId: form.sourceId,
            destinationType: "instance",
            destinationId: form.destId,
            protocol: "tcp",
            port: Number(form.port) || 80,
          })
        }
      >
        Analyze path
      </Button>
      {reachability.data != null && (
        <pre className="overflow-auto rounded bg-slate-900 p-3 text-xs">
          {JSON.stringify(reachability.data, null, 2)}
        </pre>
      )}
    </Card>
  );
}

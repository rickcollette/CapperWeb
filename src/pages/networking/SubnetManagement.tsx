import { useState } from "react";
import { useParams } from "react-router-dom";
import { useSubnet, useUpdateSubnet, useAssociateRouteTable, useDisassociateRouteTable } from "@/api/subnets";
import { useRouteTables } from "@/api/vpcnet";
import { PageHeader, Button, Card, StatusBadge } from "@/components/common/ui";

export function SubnetManagement() {
  const { subnetId = "" } = useParams();
  const { data: subnet, isLoading } = useSubnet(subnetId);
  const { data: routeTables } = useRouteTables(subnet?.vpcId || "");
  const updateMutation = useUpdateSubnet(subnetId);
  const associateRTMutation = useAssociateRouteTable(subnetId);
  const disassociateRTMutation = useDisassociateRouteTable(subnetId);
  const [editMode, setEditMode] = useState(false);
  const [showAssociateRT, setShowAssociateRT] = useState(false);
  const [selectedRTId, setSelectedRTId] = useState("");
  const [tags, setTags] = useState<Record<string, string>>({});
  const [mapPublicIp, setMapPublicIp] = useState(false);

  const handleEdit = () => {
    setTags(subnet?.tags || {});
    setMapPublicIp(subnet?.mapPublicIpOnLaunch || false);
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        tags,
        mapPublicIpOnLaunch: mapPublicIp,
      });
      setEditMode(false);
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  const handleAssociateRT = async () => {
    if (!selectedRTId) {
      alert("Please select a route table");
      return;
    }
    try {
      await associateRTMutation.mutateAsync(selectedRTId);
      setShowAssociateRT(false);
      setSelectedRTId("");
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  const handleDisassociateRT = async () => {
    if (!subnet?.routeTableId) return;
    if (confirm("Disassociate route table?")) {
      try {
        await disassociateRTMutation.mutateAsync();
      } catch (err) {
        alert(`Error: ${err}`);
      }
    }
  };

  if (isLoading) return <p className="text-muted">Loading...</p>;
  if (!subnet) return <p className="text-red-400">Subnet not found.</p>;

  const addTag = () => {
    setTags({ ...tags, "": "" });
  };

  const updateTag = (oldKey: string, newKey: string, value: string) => {
    const newTags = { ...tags };
    if (oldKey !== newKey) delete newTags[oldKey];
    newTags[newKey] = value;
    setTags(newTags);
  };

  const removeTag = (key: string) => {
    const newTags = { ...tags };
    delete newTags[key];
    setTags(newTags);
  };

  return (
    <div>
      <PageHeader
        title={`Subnet: ${subnetId}`}
        description={`${subnet.cidrBlock} in ${subnet.availabilityZone}`}
        actions={
          <div className="flex gap-2">
            {!editMode ? (
              <Button variant="primary" onClick={handleEdit}>
                Edit
              </Button>
            ) : (
              <>
                <Button variant="default" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={updateMutation.isPending}>
                  Save
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Overview */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold mb-3">Subnet Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-muted">Status</span>
            <div className="mt-1">
              <StatusBadge status={subnet.status === "available" ? "running" : "pending"} />
            </div>
          </div>
          <div>
            <span className="text-xs text-muted">CIDR Block</span>
            <div className="font-mono text-sm">{subnet.cidrBlock}</div>
          </div>
          <div>
            <span className="text-xs text-muted">VPC ID</span>
            <div className="font-mono text-xs">{subnet.vpcId}</div>
          </div>
          <div>
            <span className="text-xs text-muted">Availability Zone</span>
            <div className="text-sm">{subnet.availabilityZone}</div>
          </div>
          <div>
            <span className="text-xs text-muted">Available IPs</span>
            <div className="text-lg font-semibold">{subnet.availableIpAddressCount}</div>
          </div>
          <div>
            <span className="text-xs text-muted">Auto-assign Public IP</span>
            <div className="text-sm">{subnet.mapPublicIpOnLaunch ? "Enabled" : "Disabled"}</div>
          </div>
        </div>
      </Card>

      {/* Route Table Association */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Route Table Association</h3>
          {subnet.routeTableId && (
            <Button
              size="sm"
              variant="danger"
              onClick={handleDisassociateRT}
              disabled={disassociateRTMutation.isPending}
            >
              Disassociate
            </Button>
          )}
        </div>

        {showAssociateRT ? (
          <div className="space-y-3">
            <select
              value={selectedRTId}
              onChange={(e) => setSelectedRTId(e.target.value)}
              className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="">Select route table</option>
              {(routeTables || []).map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name || rt.id}
                </option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="default" onClick={() => setShowAssociateRT(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleAssociateRT}
                disabled={associateRTMutation.isPending}
              >
                Associate
              </Button>
            </div>
          </div>
        ) : subnet.routeTableId ? (
          <div className="text-sm">
            <span className="text-muted">Associated: </span>
            <span className="font-mono">{subnet.routeTableId}</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted mb-2">No route table associated.</p>
            <Button size="sm" onClick={() => setShowAssociateRT(true)}>
              Associate Route Table
            </Button>
          </>
        )}
      </Card>

      {/* Tags (Edit Mode) */}
      {editMode && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Tags</h3>
            <Button size="sm" onClick={addTag}>
              Add Tag
            </Button>
          </div>

          <div className="space-y-2">
            {Object.entries(tags).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={key}
                  onChange={(e) => updateTag(key, e.target.value, value)}
                  className="flex-1 rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={value}
                  onChange={(e) => updateTag(key, key, e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
                />
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => removeTag(key)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mapPublicIp}
                onChange={(e) => setMapPublicIp(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-muted">Auto-assign public IPv4 address on launch</span>
            </label>
          </div>
        </Card>
      )}

      {/* Tags (View Mode) */}
      {!editMode && subnet.tags && Object.keys(subnet.tags).length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold mb-3">Tags</h3>
          <div className="space-y-2">
            {Object.entries(subnet.tags).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm bg-slate-800 p-2 rounded">
                <span className="text-muted">{key}</span>
                <span className="font-mono">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

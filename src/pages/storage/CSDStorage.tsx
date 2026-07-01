import { useState } from "react";
import { useCSDVolumes, useCreateCSDVolume, useDeleteCSDVolume } from "@/api/csdstorage";
import { PageHeader, Button, Card, StatusBadge } from "@/components/common/ui";

export function CSDStorage() {
  const { data: volumes, isLoading } = useCSDVolumes();
  const createMutation = useCreateCSDVolume();
  const deleteMutation = useDeleteCSDVolume("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    size: 100,
    iops: 3000,
    encrypted: true,
  });

  const handleCreate = async () => {
    if (!form.name) {
      alert("Volume name required");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: form.name,
        size: form.size,
        iops: form.iops,
        encrypted: form.encrypted,
      });
      setShowCreateForm(false);
      setForm({ name: "", size: 100, iops: 3000, encrypted: true });
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete volume? Ensure it's detached from all instances.")) {
      try {
        const { mutateAsync } = useDeleteCSDVolume(id);
        await mutateAsync();
      } catch (err) {
        alert(`Error: ${err}`);
      }
    }
  };

  if (isLoading) return <p className="text-muted">Loading...</p>;

  return (
    <div>
      <PageHeader
        title="CSD Shared Storage"
        description="Manage clustered storage volumes"
        actions={
          <Button variant="primary" onClick={() => setShowCreateForm(true)}>
            Create Volume
          </Button>
        }
      />

      {showCreateForm && (
        <Card className="mb-4 p-4 space-y-4">
          <input
            type="text"
            placeholder="Volume name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted">Size (GB)</label>
              <input
                type="number"
                min="1"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted">IOPS</label>
              <input
                type="number"
                min="100"
                step="100"
                value={form.iops}
                onChange={(e) => setForm({ ...form, iops: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.encrypted}
              onChange={(e) => setForm({ ...form, encrypted: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-muted">Encrypt volume</span>
          </label>

          <div className="flex gap-2 justify-end">
            <Button variant="default" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={createMutation.isPending}>
              Create
            </Button>
          </div>
        </Card>
      )}

      {!volumes || volumes.length === 0 ? (
        <Card>
          <p className="text-muted">No CSD volumes.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-semibold">Name</th>
                <th className="px-4 py-2 text-left font-semibold">Size (GB)</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">IOPS</th>
                <th className="px-4 py-2 text-left font-semibold">Encrypted</th>
                <th className="px-4 py-2 text-left font-semibold">Attachments</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {volumes.map((vol) => (
                <tr key={vol.id} className="border-b border-border/50 hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-semibold">{vol.name}</td>
                  <td className="px-4 py-3 text-xs">{vol.size}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={vol.status === "available" ? "running" : vol.status === "in-use" ? "running" : "pending"}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{vol.iops || "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {vol.encrypted ? "🔒 Yes" : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">{vol.attachments?.length || 0}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(vol.id)}
                      disabled={deleteMutation.isPending || vol.status !== "available"}
                      title={vol.status !== "available" ? "Cannot delete while in use" : ""}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

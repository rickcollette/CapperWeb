import { useInstanceDiskCapacity } from "@/api/instances";

/**
 * Warns when no default storage pool is configured. CSD volumes, image
 * import/upload, and local backups are all refused by the API until an admin
 * registers a pool. Object-store buckets are exempt and never need a pool.
 */
export function StoragePoolWarning({ what }: { what: string }) {
  const { data, isLoading } = useInstanceDiskCapacity();
  if (isLoading || data?.poolConfigured) return null;
  return (
    <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
      Configure a default storage pool under Admin → Storage before {what}.
    </p>
  );
}

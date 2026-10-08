/** Capsule isolation backends supported by Capper (API runtimeMode). */
export const RUNTIME_MODES = [
  { value: "auto", label: "auto", description: "Prefer bubblewrap, fall back to chroot (never LXC/QEMU)." },
  { value: "bwrap", label: "bwrap", description: "Bubblewrap process isolation (default recommended)." },
  { value: "chroot", label: "chroot", description: "Chroot isolation (may require elevated privileges)." },
  { value: "crun", label: "crun", description: "OCI runtime via crun." },
  { value: "runc", label: "runc", description: "OCI runtime via runc." },
  { value: "lxc", label: "lxc", description: "LXC container over the capsule rootfs (requires lxc tools)." },
  { value: "qemu", label: "qemu", description: "QEMU VM from rootfs→qcow2 (requires qemu + virt-make-fs)." },
] as const;

export type RuntimeMode = (typeof RUNTIME_MODES)[number]["value"];

export const RUNTIME_MODE_VALUES: RuntimeMode[] = RUNTIME_MODES.map((m) => m.value);

export function runtimeModeLabel(mode?: string | null): string {
  if (!mode) return "auto";
  const found = RUNTIME_MODES.find((m) => m.value === mode);
  return found?.label ?? mode;
}

export function runtimeModeDescription(mode?: string | null): string {
  const found = RUNTIME_MODES.find((m) => m.value === (mode || "auto"));
  return found?.description ?? "";
}

export function isHeavyRuntime(mode?: string | null): boolean {
  return mode === "lxc" || mode === "qemu";
}

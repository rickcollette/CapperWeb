import { create } from "zustand";

export interface LaunchWizardState {
  step: number;
  image: string;
  name: string;
  instanceType: string;
  network: string;
  vpcId: string;
  subnetId: string;
  securityGroupIds: string[];
  keyName: string;
  publicIpBehavior: string;
  terminationProtection: boolean;
  tags: Record<string, string>;
  env: Record<string, string>;
  labels: Record<string, string>;
  volumeName: string;
  volumeMount: string;
  volumes: { name: string; mountPath: string }[];
  /** Root-disk size override in GiB ("" = use the capsule type's default). */
  diskGiB: string;
  capInitMode: "none" | "template" | "paste";
  capInitTemplate: string;
  capInitContent: string;
  setStep: (step: number) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
  update: (patch: Partial<Omit<LaunchWizardState, "setStep" | "next" | "back" | "reset" | "update">>) => void;
}

const initial = {
  step: 0,
  image: "",
  name: "",
  instanceType: "",
  network: "",
  vpcId: "",
  subnetId: "",
  securityGroupIds: [] as string[],
  keyName: "",
  publicIpBehavior: "none",
  terminationProtection: false,
  tags: {} as Record<string, string>,
  env: {} as Record<string, string>,
  labels: {} as Record<string, string>,
  volumeName: "",
  volumeMount: "/mnt/data",
  volumes: [] as { name: string; mountPath: string }[],
  diskGiB: "",
  capInitMode: "none" as const,
  capInitTemplate: "",
  capInitContent: "",
};

export const useLaunchWizard = create<LaunchWizardState>((set, get) => ({
  ...initial,
  setStep: (step) => set({ step }),
  next: () => set({ step: Math.min(get().step + 1, 8) }),
  back: () => set({ step: Math.max(get().step - 1, 0) }),
  reset: () => set(initial),
  update: (patch) => set(patch),
}));

export const WIZARD_STEPS = [
  "Name & Tags",
  "Image",
  "Instance Type",
  "Key Pair",
  "Network",
  "Security",
  "Storage",
  "Advanced",
  "Review",
] as const;

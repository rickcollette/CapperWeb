import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InstanceState } from "@/types/capper";

const transitionalStyle = "bg-amber-500/15 text-amber-400 border-amber-500/30";

const statusStyles: Record<string, string> = {
  running: "bg-green-500/15 text-green-400 border-green-500/30",
  ready: "bg-green-500/15 text-green-400 border-green-500/30",
  active: "bg-green-500/15 text-green-400 border-green-500/30",
  stopped: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
  created: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  starting: transitionalStyle,
  stopping: transitionalStyle,
  unknown: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

// transitionalStatuses are in-progress states: while a resource is in one of
// these, the badge shows a spinner so it's clear work is still happening
// server-side (start/stop/delete/create are not instantaneous).
const transitionalStatuses = new Set([
  "starting", "stopping", "restarting", "creating", "deleting", "terminating",
  "pending", "provisioning", "deploying", "draining", "updating", "attaching",
  "detaching", "configuring", "initializing",
]);

export function StatusBadge({ status }: { status: string }) {
  const key = (status ?? "").toLowerCase();
  const transitional = transitionalStatuses.has(key);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        statusStyles[key] ?? (transitional ? transitionalStyle : statusStyles.unknown),
      )}
    >
      {transitional && <Loader2 className="h-3 w-3 animate-spin" />}
      {status}
    </span>
  );
}

export function DaemonBadge({ online, status }: { online?: boolean; status?: string }) {
  const label = status ?? (online ? "online" : "offline");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        online
          ? "border-green-500/40 bg-green-500/10 text-green-400"
          : "border-slate-500/40 bg-slate-500/10 text-slate-400",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-green-400" : "bg-slate-500")} />
      {label}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-slate-900/30 py-16 text-center">
      <p className="text-lg font-medium text-slate-200">{title}</p>
      {description && <p className="mt-2 max-w-md text-sm text-muted">{description}</p>}
    </div>
  );
}

export function PageHeader({ title, description, actions }: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "default",
  size = "md",
  disabled,
  onClick,
  type = "button",
  title,
}: {
  children: React.ReactNode;
  variant?: "default" | "primary" | "danger" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  title?: string;
}) {
  const variants = {
    default: "border-border bg-card hover:bg-slate-800",
    primary: "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20",
    danger: "border-danger/50 bg-danger/10 text-red-400 hover:bg-danger/20",
    ghost: "border-transparent hover:bg-slate-800",
  };
  const sizes = { sm: "px-2 py-1 text-xs", md: "px-3 py-1.5 text-sm" };
  return (
    <button
      type={type}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border font-medium transition disabled:opacity-40",
        variants[variant],
        sizes[size],
      )}
    >
      {children}
    </button>
  );
}

export type { InstanceState };

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  /** When true the confirm action is in flight: show a spinner and lock the dialog. */
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} disabled={pending}>{cancelLabel}</Button>
          <Button variant={variant} onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(0);
  const total = Math.ceil(items.length / pageSize);
  const paginated = items.slice(page * pageSize, (page + 1) * pageSize);
  return { page, setPage, total, paginated };
}

export function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 px-3 py-2 text-sm">
      <button type="button" disabled={page === 0} onClick={() => onChange(page - 1)} className="rounded px-2 py-1 text-muted hover:text-foreground disabled:opacity-40">←</button>
      <span className="text-muted">{page + 1} / {total}</span>
      <button type="button" disabled={page >= total - 1} onClick={() => onChange(page + 1)} className="rounded px-2 py-1 text-muted hover:text-foreground disabled:opacity-40">→</button>
    </div>
  );
}

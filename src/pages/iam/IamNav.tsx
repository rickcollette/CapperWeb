import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  { to: "/iam/users", key: "users", label: "Users" },
  { to: "/iam/groups", key: "groups", label: "Groups" },
  { to: "/iam/roles", key: "roles", label: "Roles" },
  { to: "/iam/policies", key: "policies", label: "Policies" },
  { to: "/iam/simulate", key: "simulate", label: "Simulate" },
  { to: "/iam/tokens", key: "tokens", label: "API Keys" },
] as const;

export type IamNavKey = (typeof links)[number]["key"];

export function IamNav({ active }: { active?: IamNavKey }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-border pb-3 text-sm">
      {links.map((l) => (
        <Link
          key={l.key}
          to={l.to}
          className={cn(
            "rounded-lg px-3 py-1.5 transition",
            active === l.key
              ? "bg-primary/15 font-medium text-primary"
              : "text-muted hover:bg-slate-800 hover:text-foreground",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

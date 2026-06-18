import { Link } from "react-router-dom";

const links = [
  { to: "/iam/users", key: "users", label: "Users" },
  { to: "/iam/groups", key: "groups", label: "Groups" },
  { to: "/iam/roles", key: "roles", label: "Roles" },
  { to: "/iam/policies", key: "policies", label: "Policies" },
  { to: "/iam/simulate", key: "simulate", label: "Simulate" },
  { to: "/iam/tokens", key: "tokens", label: "API Keys" },
] as const;

export function IamNav({ active }: { active?: (typeof links)[number]["key"] }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 text-sm">
      {links.map((l) => (
        <Link
          key={l.key}
          to={l.to}
          className={active === l.key ? "text-primary" : "text-muted hover:text-primary"}
        >
          {' '}{l.label}
        </Link>
      ))}
    </div>
  );
}

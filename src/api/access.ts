import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

// RBAC user lifecycle (Google SSO). Mirrors the control-plane /api/v1/users
// endpoints added for approval-based access control.

export interface RBACUser {
  id: string;
  name: string;
  email?: string;
  status?: "active" | "pending" | "disabled";
  provider?: string;
  roles?: string[];
  mustChangePassword?: boolean;
  createdAt?: string;
}

export interface CurrentUser {
  user?: RBACUser;
  roles?: string[];
  isAdmin?: boolean;
  principalType?: string;
  principalId?: string;
}

export function useRBACUsers() {
  return useQuery({ queryKey: ["rbac-users"], queryFn: () => apiFetch<RBACUser[]>("/users") });
}

// useCurrentUser resolves the signed-in identity. retry:false so a pending-user
// 403 surfaces immediately to the session gate instead of being retried.
export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: () => apiFetch<CurrentUser>("/users/me"),
    retry: false,
  });
}

// Self-service account management.
export function useChangeOwnPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      apiFetch("/users/me/password", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["current-user"] }),
  });
}

export function useUpdateOwnProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string }) =>
      apiFetch("/users/me", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["current-user"] }),
  });
}

export function useApproveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiFetch(`/users/${id}/approve`, { method: "POST", body: JSON.stringify({ role }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac-users"] }),
  });
}

export function useDisableUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/users/${id}/disable`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac-users"] }),
  });
}

export function useGrantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiFetch(`/users/${id}/roles`, { method: "POST", body: JSON.stringify({ role }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac-users"] }),
  });
}

export function useRevokeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiFetch(`/users/${id}/roles/${role}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac-users"] }),
  });
}

// loginLocal authenticates with username/password and establishes a session
// cookie. Returns the CSRF token to seed the in-memory client.
export async function loginLocal(username: string, password: string) {
  return apiFetch<{ user: RBACUser; roles: string[]; csrfToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export interface CreateUserInput {
  name?: string;
  email?: string;
  provider: "local" | "google";
  password?: string;
  role?: string;
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserInput) =>
      apiFetch("/users", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac-users"] }),
  });
}

export function useSetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiFetch(`/users/${id}/password`, { method: "POST", body: JSON.stringify({ password }) }),
  });
}

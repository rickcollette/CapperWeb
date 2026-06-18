import { apiFetch } from "./client";

export interface Org {
  id: string;
  slug: string;
  name: string;
  status: string;
  plan: string;
  billingEmail: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  orgId: string;
  slug: string;
  name: string;
  email: string;
  status: string;
  accountType: string;
  parentOrgId: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrgRootUser {
  id: string;
  orgId: string;
  userId: string;
  email: string;
  status: string;
  mfaRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountRootUser {
  id: string;
  orgId: string;
  accountId: string;
  userId: string;
  email: string;
  status: string;
  mfaRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Guardrail {
  id: string;
  orgId: string;
  name: string;
  description: string;
  document: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- orgs -------------------------------------------------------------------

export async function listOrgs(): Promise<Org[]> {
  return apiFetch<Org[]>("/orgs");
}

export async function createOrg(body: { name: string; slug?: string; billingEmail?: string }): Promise<Org> {
  return apiFetch<Org>("/orgs", { method: "POST", body: JSON.stringify(body) });
}

export async function getOrg(orgId: string): Promise<Org> {
  return apiFetch<Org>(`/orgs/${orgId}`);
}

export async function patchOrg(orgId: string, updates: Record<string, string>): Promise<Org> {
  return apiFetch<Org>(`/orgs/${orgId}`, { method: "PATCH", body: JSON.stringify(updates) });
}

export async function deleteOrg(orgId: string): Promise<void> {
  return apiFetch<void>(`/orgs/${orgId}`, { method: "DELETE" });
}

// ---- accounts ---------------------------------------------------------------

export async function listOrgAccounts(orgId: string): Promise<Account[]> {
  return apiFetch<Account[]>(`/orgs/${orgId}/accounts`);
}

export async function createOrgAccount(
  orgId: string,
  body: { name: string; email?: string; accountType?: string },
): Promise<Account> {
  return apiFetch<Account>(`/orgs/${orgId}/accounts`, { method: "POST", body: JSON.stringify(body) });
}

export async function getOrgAccount(orgId: string, accountId: string): Promise<Account> {
  return apiFetch<Account>(`/orgs/${orgId}/accounts/${accountId}`);
}

export async function patchOrgAccount(
  orgId: string,
  accountId: string,
  updates: Record<string, string>,
): Promise<Account> {
  return apiFetch<Account>(`/orgs/${orgId}/accounts/${accountId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteOrgAccount(orgId: string, accountId: string): Promise<void> {
  return apiFetch<void>(`/orgs/${orgId}/accounts/${accountId}`, { method: "DELETE" });
}

export async function suspendAccount(orgId: string, accountId: string): Promise<Account> {
  return apiFetch<Account>(`/orgs/${orgId}/accounts/${accountId}/suspend`, { method: "POST" });
}

export async function reactivateAccount(orgId: string, accountId: string): Promise<Account> {
  return apiFetch<Account>(`/orgs/${orgId}/accounts/${accountId}/reactivate`, { method: "POST" });
}

// ---- org root users ---------------------------------------------------------

export async function listOrgRootUsers(orgId: string): Promise<OrgRootUser[]> {
  return apiFetch<OrgRootUser[]>(`/orgs/${orgId}/root-users`);
}

export async function addOrgRootUser(orgId: string, body: { userId: string; email?: string }): Promise<OrgRootUser> {
  return apiFetch<OrgRootUser>(`/orgs/${orgId}/root-users`, { method: "POST", body: JSON.stringify(body) });
}

export async function removeOrgRootUser(orgId: string, userId: string): Promise<void> {
  return apiFetch<void>(`/orgs/${orgId}/root-users/${userId}`, { method: "DELETE" });
}

// ---- account root users -----------------------------------------------------

export async function listAccountRootUsers(orgId: string, accountId: string): Promise<AccountRootUser[]> {
  return apiFetch<AccountRootUser[]>(`/orgs/${orgId}/accounts/${accountId}/root-users`);
}

export async function addAccountRootUser(
  orgId: string,
  accountId: string,
  body: { userId: string; email?: string },
): Promise<AccountRootUser> {
  return apiFetch<AccountRootUser>(`/orgs/${orgId}/accounts/${accountId}/root-users`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function removeAccountRootUser(orgId: string, accountId: string, userId: string): Promise<void> {
  return apiFetch<void>(`/orgs/${orgId}/accounts/${accountId}/root-users/${userId}`, { method: "DELETE" });
}

// ---- guardrails -------------------------------------------------------------

export async function listGuardrails(orgId: string): Promise<Guardrail[]> {
  return apiFetch<Guardrail[]>(`/orgs/${orgId}/guardrails`);
}

export async function createGuardrail(
  orgId: string,
  body: { name: string; description?: string; document?: string },
): Promise<Guardrail> {
  return apiFetch<Guardrail>(`/orgs/${orgId}/guardrails`, { method: "POST", body: JSON.stringify(body) });
}

export async function getGuardrail(orgId: string, id: string): Promise<Guardrail> {
  return apiFetch<Guardrail>(`/orgs/${orgId}/guardrails/${id}`);
}

export async function deleteGuardrail(orgId: string, id: string): Promise<void> {
  return apiFetch<void>(`/orgs/${orgId}/guardrails/${id}`, { method: "DELETE" });
}

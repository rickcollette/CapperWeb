import { apiFetch } from "./client";

// ---- Types ------------------------------------------------------------------

export interface IAMUser {
  id: string;
  name: string;
  email?: string;
  accountId?: string;
  localUser?: string;
  groups?: string[];
  createdAt: string;
}

export interface IAMGroup {
  id: string;
  name: string;
  description?: string;
  accountId?: string;
  members?: string[];
  createdAt: string;
}

export interface IAMRole {
  id: string;
  name: string;
  description?: string;
  accountId?: string;
  trustPolicy?: string;
  policies?: string[];
  createdAt: string;
}

export interface IAMServiceAccount {
  id: string;
  name: string;
  description?: string;
  accountId?: string;
  project?: string;
  roles?: string[];
  createdAt: string;
}

export interface IAMPolicy {
  id: string;
  accountId: string;
  name: string;
  description: string;
  document: string;
  managed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAMToken {
  id: string;
  name: string;
  principalType: string;
  principalId: string;
  expiresAt: string;
  createdAt: string;
}

export interface AssumeRoleCredentials {
  credentials: {
    accessToken: string;
    expiration: string;
  };
  assumedRoleUser: {
    roleArn?: string;
    roleId?: string;
    sessionName: string;
  };
}

export interface SimulateResult {
  action: string;
  allowed: boolean;
  decision: string;
}

// ---- Account IAM Users -------------------------------------------------------

export async function listAccountIAMUsers(accountId: string): Promise<IAMUser[]> {
  return apiFetch<IAMUser[]>(`/accounts/${accountId}/iam/users`);
}

export async function createAccountIAMUser(
  accountId: string,
  body: { name: string; email?: string; password?: string },
): Promise<IAMUser> {
  return apiFetch<IAMUser>(`/accounts/${accountId}/iam/users`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getAccountIAMUser(accountId: string, userId: string): Promise<IAMUser> {
  return apiFetch<IAMUser>(`/accounts/${accountId}/iam/users/${userId}`);
}

export async function patchAccountIAMUser(
  accountId: string,
  userId: string,
  updates: Record<string, string>,
): Promise<IAMUser> {
  return apiFetch<IAMUser>(`/accounts/${accountId}/iam/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteAccountIAMUser(accountId: string, userId: string): Promise<void> {
  return apiFetch<void>(`/accounts/${accountId}/iam/users/${userId}`, { method: "DELETE" });
}

// ---- Account IAM Groups -------------------------------------------------------

export async function listAccountIAMGroups(accountId: string): Promise<IAMGroup[]> {
  return apiFetch<IAMGroup[]>(`/accounts/${accountId}/iam/groups`);
}

export async function createAccountIAMGroup(
  accountId: string,
  body: { name: string; description?: string },
): Promise<IAMGroup> {
  return apiFetch<IAMGroup>(`/accounts/${accountId}/iam/groups`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getAccountIAMGroup(accountId: string, groupId: string): Promise<IAMGroup> {
  return apiFetch<IAMGroup>(`/accounts/${accountId}/iam/groups/${groupId}`);
}

export async function patchAccountIAMGroup(
  accountId: string,
  groupId: string,
  updates: Record<string, string>,
): Promise<IAMGroup> {
  return apiFetch<IAMGroup>(`/accounts/${accountId}/iam/groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteAccountIAMGroup(accountId: string, groupId: string): Promise<void> {
  return apiFetch<void>(`/accounts/${accountId}/iam/groups/${groupId}`, { method: "DELETE" });
}

export async function addAccountGroupMember(
  accountId: string,
  groupId: string,
  userId: string,
): Promise<void> {
  return apiFetch<void>(`/accounts/${accountId}/iam/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function removeAccountGroupMember(
  accountId: string,
  groupId: string,
  userId: string,
): Promise<void> {
  return apiFetch<void>(`/accounts/${accountId}/iam/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
  });
}

// ---- Account IAM Roles -------------------------------------------------------

export async function listAccountIAMRoles(accountId: string): Promise<IAMRole[]> {
  return apiFetch<IAMRole[]>(`/accounts/${accountId}/iam/roles`);
}

export async function createAccountIAMRole(
  accountId: string,
  body: { name: string; description?: string; trustPolicy?: string },
): Promise<IAMRole> {
  return apiFetch<IAMRole>(`/accounts/${accountId}/iam/roles`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getAccountIAMRole(accountId: string, roleId: string): Promise<IAMRole> {
  return apiFetch<IAMRole>(`/accounts/${accountId}/iam/roles/${roleId}`);
}

export async function patchAccountIAMRole(
  accountId: string,
  roleId: string,
  updates: Record<string, string>,
): Promise<IAMRole> {
  return apiFetch<IAMRole>(`/accounts/${accountId}/iam/roles/${roleId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteAccountIAMRole(accountId: string, roleId: string): Promise<void> {
  return apiFetch<void>(`/accounts/${accountId}/iam/roles/${roleId}`, { method: "DELETE" });
}

export async function accountAssumeRole(
  accountId: string,
  roleId: string,
  body: { sessionName?: string; durationSeconds?: number },
): Promise<AssumeRoleCredentials> {
  return apiFetch<AssumeRoleCredentials>(`/accounts/${accountId}/iam/roles/${roleId}/assume`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---- Account IAM Service Accounts -------------------------------------------

export async function listServiceAccounts(accountId: string): Promise<IAMServiceAccount[]> {
  return apiFetch<IAMServiceAccount[]>(`/accounts/${accountId}/iam/service-accounts`);
}

export async function createServiceAccount(
  accountId: string,
  body: { name: string; description?: string },
): Promise<IAMServiceAccount> {
  return apiFetch<IAMServiceAccount>(`/accounts/${accountId}/iam/service-accounts`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteServiceAccount(accountId: string, id: string): Promise<void> {
  return apiFetch<void>(`/accounts/${accountId}/iam/service-accounts/${id}`, { method: "DELETE" });
}

export async function issueServiceAccountToken(
  accountId: string,
  id: string,
): Promise<{ token: string; expiresAt: string }> {
  return apiFetch<{ token: string; expiresAt: string }>(
    `/accounts/${accountId}/iam/service-accounts/${id}/tokens`,
    { method: "POST" },
  );
}

// ---- Account IAM Policies ---------------------------------------------------

export async function listAccountIAMPolicies(accountId: string): Promise<IAMPolicy[]> {
  return apiFetch<IAMPolicy[]>(`/accounts/${accountId}/iam/policies`);
}

export async function createAccountIAMPolicy(
  accountId: string,
  body: { name: string; description?: string; document?: unknown },
): Promise<IAMPolicy> {
  return apiFetch<IAMPolicy>(`/accounts/${accountId}/iam/policies`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getAccountIAMPolicy(accountId: string, id: string): Promise<IAMPolicy> {
  return apiFetch<IAMPolicy>(`/accounts/${accountId}/iam/policies/${id}`);
}

export async function updateAccountIAMPolicy(
  accountId: string,
  id: string,
  document: unknown,
): Promise<IAMPolicy> {
  return apiFetch<IAMPolicy>(`/accounts/${accountId}/iam/policies/${id}`, {
    method: "PUT",
    body: JSON.stringify({ document }),
  });
}

export async function deleteAccountIAMPolicy(accountId: string, id: string): Promise<void> {
  return apiFetch<void>(`/accounts/${accountId}/iam/policies/${id}`, { method: "DELETE" });
}

export async function attachAccountPolicy(
  accountId: string,
  policyId: string,
  body: { principalType: string; principalId: string },
): Promise<void> {
  return apiFetch<void>(`/accounts/${accountId}/iam/policies/${policyId}/attach`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function detachAccountPolicy(
  accountId: string,
  policyId: string,
  body: { principalType: string; principalId: string },
): Promise<void> {
  return apiFetch<void>(`/accounts/${accountId}/iam/policies/${policyId}/detach`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---- IAM Simulate -----------------------------------------------------------

export async function simulateAccountIAM(
  accountId: string,
  body: {
    principalType: string;
    principalId: string;
    actions: string[];
    resourceCrn?: string;
  },
): Promise<SimulateResult[]> {
  return apiFetch<SimulateResult[]>(`/accounts/${accountId}/iam/simulate`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---- Global Assume Role (CRN-based) -----------------------------------------

export async function assumeRole(body: {
  roleArn: string;
  sessionName?: string;
  durationSeconds?: number;
}): Promise<AssumeRoleCredentials> {
  return apiFetch<AssumeRoleCredentials>("/iam/assume-role", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

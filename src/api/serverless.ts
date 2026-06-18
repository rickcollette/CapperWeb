import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

export interface FunctionDef {
  id: string;
  project: string;
  name: string;
  runtime: string;
  image?: string;
  command?: string[];
  status: string;
  createdAt: string;
}

export interface Invocation {
  id: string;
  functionId: string;
  status: string;
  durationMs: number;
  source?: string;
  error?: string;
  startedAt?: string;
}

export interface InvokeResult {
  invocationId: string;
  status: string;
  durationMs: number;
  output?: string;
  error?: string;
}

export interface MCPServer {
  id: string;
  project: string;
  name: string;
  runtime: string;
  approvalPolicy: string;
  status: string;
}

export interface MCPTool {
  id: string;
  name: string;
  description?: string;
  iamAction?: string;
  readOnly: boolean;
  dangerous: boolean;
  approvalRequired: boolean;
  enabled: boolean;
}

export interface MCPApproval {
  id: string;
  toolName: string;
  principal?: string;
  status: string;
  createdAt: string;
}

// ─── Functions ───────────────────────────────────────────────────────────────

export function useFunctions() {
  return useQuery({ queryKey: ["functions"], queryFn: () => apiFetch<FunctionDef[]>("/functions") });
}

export function useFunctionInvocations(id: string) {
  return useQuery({
    queryKey: ["functions", id, "invocations"],
    queryFn: () => apiFetch<Invocation[]>(`/functions/${id}/invocations`),
    enabled: !!id,
  });
}

export function useCreateFunction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<FunctionDef>) =>
      apiFetch<FunctionDef>("/functions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["functions"] }),
  });
}

export function useDeleteFunction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/functions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["functions"] }),
  });
}

export function useInvokeFunction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: string }) =>
      apiFetch<InvokeResult>(`/functions/${id}/invoke`, { method: "POST", body: payload }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["functions", v.id, "invocations"] }),
  });
}

// ─── MCP servers ─────────────────────────────────────────────────────────────

export function useMCPServers() {
  return useQuery({ queryKey: ["mcp-servers"], queryFn: () => apiFetch<MCPServer[]>("/mcp/servers") });
}

export function useMCPTools(serverId: string) {
  return useQuery({
    queryKey: ["mcp-servers", serverId, "tools"],
    queryFn: () => apiFetch<MCPTool[]>(`/mcp/servers/${serverId}/tools`),
    enabled: !!serverId,
  });
}

export function useCreateMCPServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<MCPServer>) =>
      apiFetch<MCPServer>("/mcp/servers", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mcp-servers"] }),
  });
}

export function useDeleteMCPServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/mcp/servers/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mcp-servers"] }),
  });
}

export function useMCPApprovals() {
  return useQuery({
    queryKey: ["mcp-approvals"],
    queryFn: () => apiFetch<MCPApproval[]>("/mcp/approvals"),
  });
}

export function useDecideMCPApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "deny" }) =>
      apiFetch(`/mcp/approvals/${id}/${decision}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mcp-approvals"] }),
  });
}

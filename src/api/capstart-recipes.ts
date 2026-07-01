import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Recipe {
  id: string;
  name: string;
  version: string;
  title: string;
  description: string;
  category: string;
  author: string;
  tags: string[];
  schema: Record<string, any>;
  content: Record<string, any>;
  checksum?: string;
  isBuiltin: boolean;
  isCommunity: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
  metadata: {
    cpuMin: number;
    cpuRecommended: number;
    memoryMin: number;
    memoryRecommended: number;
    diskMin: number;
    diskRecommended: number;
  };
}

interface CreateRecipeRequest {
  name: string;
  version: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  content: Record<string, any>;
}

interface CreateVMFromRecipeRequest {
  recipeID: string;
  config: Record<string, any>;
  vmName?: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: string;
}

const API_BASE = "/api/v1/capstart";

// List all recipes
export function useListRecipes(category?: string, isBuiltin?: boolean) {
  return useQuery({
    queryKey: ["capstart-recipes", category, isBuiltin],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (isBuiltin !== undefined) params.append("is_builtin", String(isBuiltin));

      const response = await axios.get<{ data: Recipe[] }>(
        `${API_BASE}/recipes?${params}`
      );
      return response.data.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get a specific recipe
export function useGetRecipe(recipeId: string) {
  return useQuery({
    queryKey: ["capstart-recipe", recipeId],
    queryFn: async () => {
      const response = await axios.get<{ data: Recipe }>(
        `${API_BASE}/recipes/${recipeId}`
      );
      return response.data.data;
    },
    enabled: !!recipeId,
    staleTime: 5 * 60 * 1000,
  });
}

// List built-in recipes
export function useListBuiltinRecipes() {
  return useQuery({
    queryKey: ["capstart-recipes-builtin"],
    queryFn: async () => {
      const response = await axios.get<{ data: Recipe[] }>(
        `${API_BASE}/recipes/builtin`
      );
      return response.data.data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Create a new recipe
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipe: CreateRecipeRequest) => {
      const response = await axios.post<{ data: Recipe }>(
        `${API_BASE}/recipes`,
        recipe
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capstart-recipes"] });
    },
  });
}

// Update a recipe
export function useUpdateRecipe(recipeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Recipe>) => {
      const response = await axios.put<{ data: Recipe }>(
        `${API_BASE}/recipes/${recipeId}`,
        updates
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capstart-recipe", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["capstart-recipes"] });
    },
  });
}

// Delete a recipe
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: string) => {
      await axios.delete(`${API_BASE}/recipes/${recipeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capstart-recipes"] });
    },
  });
}

// Validate a recipe
export function useValidateRecipe(recipeId: string) {
  return useQuery({
    queryKey: ["capstart-recipe-validation", recipeId],
    queryFn: async () => {
      const response = await axios.post<{ data: ValidationResult }>(
        `${API_BASE}/recipes/${recipeId}/validate`
      );
      return response.data.data;
    },
    enabled: !!recipeId,
  });
}

// Create VM from recipe
export function useCreateVMFromRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateVMFromRecipeRequest) => {
      const response = await axios.post(
        `${API_BASE}/recipes/${payload.recipeID}/create-vm`,
        {
          config: payload.config,
          vmName: payload.vmName,
          cpu: payload.cpu,
          memory: payload.memory,
          disk: payload.disk,
          network: payload.network,
        }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instances"] });
    },
  });
}

// Get recipe execution status
export function useGetRecipeExecution(executionId: string) {
  return useQuery({
    queryKey: ["capstart-execution", executionId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/executions/${executionId}`);
      return response.data.data;
    },
    enabled: !!executionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.status === "success" || data.status === "failed") {
        return false; // Stop polling when done
      }
      return 2000; // Poll every 2 seconds while running
    },
  });
}

// Streaming execution logs (would use WebSocket in production)
export function useExecutionLogs(executionId: string) {
  return useQuery({
    queryKey: ["capstart-execution-logs", executionId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE}/executions/${executionId}/logs`
      );
      return response.data.data;
    },
    enabled: !!executionId,
    refetchInterval: 2000, // Poll every 2 seconds
  });
}

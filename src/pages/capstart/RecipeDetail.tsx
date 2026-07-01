import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetRecipe, useValidateRecipe, useCreateVMFromRecipe } from "@/api/capstart-recipes";
import { PageHeader, Button, Card, StatusBadge, TextInput } from "@/components/common/ui";

interface ParameterInputs {
  [key: string]: any;
}

export function RecipeDetail() {
  const { recipeId = "" } = useParams();
  const navigate = useNavigate();
  const [paramValues, setParamValues] = useState<ParameterInputs>({});
  const [isCreating, setIsCreating] = useState(false);

  const { data: recipe, isLoading: isLoadingRecipe } = useGetRecipe(recipeId);
  const { data: validation } = useValidateRecipe(recipeId);
  const createVMMutation = useCreateVMFromRecipe();

  if (isLoadingRecipe) {
    return <div className="p-8 text-center">Loading recipe...</div>;
  }

  if (!recipe) {
    return <div className="p-8 text-center text-red-400">Recipe not found</div>;
  }

  const recipeContent = recipe.content as any;
  const parameters = recipeContent?.parameters || {};
  const requirements = recipeContent?.requirements || {};
  const vm = recipeContent?.vm || {};

  const handleParameterChange = (key: string, value: any) => {
    setParamValues({ ...paramValues, [key]: value });
  };

  const handleCreateVM = async () => {
    setIsCreating(true);
    try {
      await createVMMutation.mutateAsync({
        recipeID: recipe.id,
        config: paramValues,
        cpu: vm.cpu || 2,
        memory: vm.memory || 1024,
        disk: vm.disk_size || 20000,
      });
      // Success - redirect to instances
      navigate("/instances");
    } catch (error) {
      console.error("Failed to create VM:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const getParameterInput = (key: string, param: any) => {
    const baseProps = {
      value: paramValues[key] ?? param.default ?? "",
      onChange: (e: any) =>
        handleParameterChange(key, e.target.value),
      required: param.required,
      disabled: isCreating,
    };

    switch (param.type) {
      case "password":
        return (
          <input
            key={key}
            type="password"
            placeholder={param.label}
            className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
            {...baseProps}
          />
        );

      case "select":
        return (
          <select
            key={key}
            className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
            {...baseProps}
          >
            <option value="">Select {param.label}</option>
            {param.options?.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "boolean":
        return (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={paramValues[key] ?? param.default}
              onChange={(e) => handleParameterChange(key, e.target.checked)}
              disabled={isCreating}
            />
            <span className="text-sm">{param.label}</span>
          </label>
        );

      case "number":
        return (
          <input
            key={key}
            type="number"
            placeholder={param.label}
            min={param.minimum}
            max={param.maximum}
            step={param.step || 1}
            className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
            {...baseProps}
          />
        );

      case "text":
        return (
          <textarea
            key={key}
            placeholder={param.label}
            rows={4}
            className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
            {...baseProps}
          />
        );

      default:
        return (
          <TextInput
            key={key}
            placeholder={param.label}
            type="text"
            {...baseProps}
          />
        );
    }
  };

  return (
    <div>
      <PageHeader
        title={recipe.title}
        description={recipe.description}
        actions={
          <Button
            variant="default"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overview */}
          <Card>
            <h3 className="text-sm font-semibold mb-3">Overview</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted">Author:</span>{" "}
                <span className="ml-2">{recipe.author}</span>
              </div>
              <div>
                <span className="text-muted">Version:</span>{" "}
                <span className="ml-2">{recipe.version}</span>
              </div>
              <div>
                <span className="text-muted">Category:</span>{" "}
                <span className="ml-2">{recipe.category}</span>
              </div>
              {recipe.isBuiltin && (
                <div>
                  <StatusBadge status="running" text="Official Recipe" />
                </div>
              )}
            </div>
          </Card>

          {/* Parameters */}
          {Object.keys(parameters).length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold mb-4">Configuration</h3>
              <div className="space-y-3">
                {Object.entries(parameters).map(([key, param]: [string, any]) => (
                  <div key={key}>
                    <label className="text-sm font-medium mb-1 block">
                      {param.label}
                      {param.required && <span className="text-red-500">*</span>}
                    </label>
                    {param.description && (
                      <p className="text-xs text-muted mb-2">{param.description}</p>
                    )}
                    {getParameterInput(key, param)}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Validation */}
          {validation && !validation.valid && (
            <Card className="border-red-500/50 bg-red-500/10">
              <h3 className="text-sm font-semibold text-red-400 mb-2">
                Validation Errors
              </h3>
              <ul className="space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx} className="text-sm text-red-400">
                    • {error.field}: {error.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Requirements */}
          <Card>
            <h3 className="text-sm font-semibold mb-3">Requirements</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted">CPU:</span>
                <div className="ml-2">
                  {requirements.cpu_min || vm.cpu || "N/A"} cores (recommended:{" "}
                  {requirements.cpu_recommended || "N/A"})
                </div>
              </div>
              <div>
                <span className="text-muted">Memory:</span>
                <div className="ml-2">
                  {requirements.memory_min || vm.memory || "N/A"} MB (recommended:{" "}
                  {requirements.memory_recommended || "N/A"} MB)
                </div>
              </div>
              <div>
                <span className="text-muted">Disk:</span>
                <div className="ml-2">
                  {requirements.disk_min || vm.disk_size || "N/A"} MB
                </div>
              </div>
            </div>
          </Card>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-slate-700 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Action */}
          <Button
            variant="primary"
            className="w-full"
            onClick={handleCreateVM}
            disabled={isCreating}
          >
            {isCreating ? "Creating VM..." : "Create VM from Recipe"}
          </Button>
        </div>
      </div>
    </div>
  );
}

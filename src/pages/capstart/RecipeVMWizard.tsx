import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetRecipe, useCreateVMFromRecipe } from "@/api/capstart-recipes";
import { PageHeader, Button, Card, TextInput, Select } from "@/components/common/ui";

type WizardStep = "confirm" | "config" | "resources" | "network" | "review";

export function RecipeVMWizard() {
  const { recipeId = "" } = useParams();
  const navigate = useNavigate();
  const { data: recipe, isLoading } = useGetRecipe(recipeId);

  const [currentStep, setCurrentStep] = useState<WizardStep>("confirm");
  const [vmName, setVmName] = useState("");
  const [config, setConfig] = useState<Record<string, any>>({});
  const [resources, setResources] = useState({
    cpu: recipe?.content?.vm?.cpu || 2,
    memory: recipe?.content?.vm?.memory || 1024,
    disk: recipe?.content?.vm?.disk_size || 20000,
  });

  const createVMMutation = useCreateVMFromRecipe();

  if (isLoading) {
    return <div className="p-8 text-center">Loading recipe...</div>;
  }

  if (!recipe) {
    return <div className="p-8 text-center text-red-400">Recipe not found</div>;
  }

  const recipeContent = recipe.content as any;
  const parameters = recipeContent?.parameters || {};
  const requirements = recipeContent?.requirements || {};

  const steps: WizardStep[] = ["confirm", "config", "resources", "network", "review"];
  const stepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1]);
    }
  };

  const handleCreate = async () => {
    try {
      await createVMMutation.mutateAsync({
        recipeID: recipe.id,
        config,
        vmName: vmName || recipe.title,
        cpu: resources.cpu,
        memory: resources.memory,
        disk: resources.disk,
      });

      // Show success and redirect
      navigate("/instances");
    } catch (error) {
      console.error("Failed to create VM:", error);
    }
  };

  return (
    <div>
      <PageHeader
        title={`Deploy ${recipe.title}`}
        description="Configure and create a new VM from this recipe"
      />

      {/* Progress */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  idx <= stepIndex
                    ? "bg-accent text-white"
                    : "bg-slate-700 text-muted"
                }`}
              >
                {idx + 1}
              </div>
              <span className="text-xs ml-2 capitalize text-muted">{step}</span>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    idx < stepIndex ? "bg-accent" : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {currentStep === "confirm" && (
            <Card>
              <h3 className="text-base font-semibold mb-4">Confirm Recipe</h3>
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-xs text-muted">Recipe</p>
                  <p className="font-medium">{recipe.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Description</p>
                  <p className="text-sm">{recipe.description}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Version</p>
                  <p className="text-sm">{recipe.version}</p>
                </div>
              </div>
              <p className="text-sm text-muted mb-4">
                This will create a new virtual machine configured according to this recipe.
              </p>
              <Button onClick={handleNext} variant="primary" className="w-full">
                Continue to Configuration
              </Button>
            </Card>
          )}

          {currentStep === "config" && (
            <Card>
              <h3 className="text-base font-semibold mb-4">
                Configuration
              </h3>
              {Object.keys(parameters).length === 0 ? (
                <p className="text-sm text-muted mb-4">
                  No configuration options available
                </p>
              ) : (
                <div className="space-y-4 mb-6">
                  {Object.entries(parameters).map(([key, param]: [string, any]) => (
                    <div key={key}>
                      <label className="text-sm font-medium mb-2 block">
                        {param.label}
                        {param.required && <span className="text-red-500">*</span>}
                      </label>
                      {param.description && (
                        <p className="text-xs text-muted mb-2">
                          {param.description}
                        </p>
                      )}
                      {param.type === "select" ? (
                        <Select
                          value={config[key] || ""}
                          onChange={(e) =>
                            setConfig({ ...config, [key]: e.target.value })
                          }
                        >
                          <option value="">Select {param.label}</option>
                          {param.options?.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <TextInput
                          type={param.type === "password" ? "password" : "text"}
                          placeholder={param.label}
                          value={config[key] || ""}
                          onChange={(e) =>
                            setConfig({ ...config, [key]: e.target.value })
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={handlePrev}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </Card>
          )}

          {currentStep === "resources" && (
            <Card>
              <h3 className="text-base font-semibold mb-4">
                Resource Allocation
              </h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    CPU Cores
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="16"
                      value={resources.cpu}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          cpu: parseInt(e.target.value),
                        })
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">
                      {resources.cpu}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Min: {requirements.cpu_min || "1"}, Recommended:{" "}
                    {requirements.cpu_recommended || "2"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Memory (MB)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="256"
                      max="32768"
                      step="256"
                      value={resources.memory}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          memory: parseInt(e.target.value),
                        })
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-20">
                      {resources.memory} MB
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Min: {requirements.memory_min || "512"} MB, Recommended:{" "}
                    {requirements.memory_recommended || "1024"} MB
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Disk Size (MB)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5000"
                      max="500000"
                      step="5000"
                      value={resources.disk}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          disk: parseInt(e.target.value),
                        })
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-32">
                      {(resources.disk / 1024).toFixed(1)} GB
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Min: {(requirements.disk_min || 5000) / 1024} GB
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={handlePrev}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </Card>
          )}

          {currentStep === "network" && (
            <Card>
              <h3 className="text-base font-semibold mb-4">Network</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    VM Hostname
                  </label>
                  <TextInput
                    placeholder={`${recipe.title.toLowerCase()}-vm`}
                    value={vmName}
                    onChange={(e) => setVmName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Network
                  </label>
                  <p className="text-sm text-muted">
                    VM will be created in the default network
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={handlePrev}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </Card>
          )}

          {currentStep === "review" && (
            <Card>
              <h3 className="text-base font-semibold mb-4">Review & Deploy</h3>
              <div className="space-y-4 mb-6 bg-slate-800 p-4 rounded">
                <div>
                  <p className="text-xs text-muted">Recipe</p>
                  <p className="font-medium">{recipe.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">VM Name</p>
                  <p className="font-medium">
                    {vmName || `${recipe.title.toLowerCase()}-vm`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Resources</p>
                  <p className="font-medium">
                    {resources.cpu} CPU · {resources.memory} MB RAM ·{" "}
                    {(resources.disk / 1024).toFixed(1)} GB Disk
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted mb-4">
                Click "Deploy" to create the VM. This may take a few minutes.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={handlePrev}
                  className="flex-1"
                  disabled={createVMMutation.isPending}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreate}
                  className="flex-1"
                  disabled={createVMMutation.isPending}
                >
                  {createVMMutation.isPending ? "Deploying..." : "Deploy VM"}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <h3 className="text-sm font-semibold mb-3">Summary</h3>
            <div className="space-y-2 text-sm text-muted">
              <div>
                <span className="block">Recipe:</span>
                <span className="font-medium text-white">{recipe.title}</span>
              </div>
              <div>
                <span className="block">CPU:</span>
                <span className="font-medium text-white">{resources.cpu} cores</span>
              </div>
              <div>
                <span className="block">Memory:</span>
                <span className="font-medium text-white">
                  {resources.memory} MB
                </span>
              </div>
              <div>
                <span className="block">Disk:</span>
                <span className="font-medium text-white">
                  {(resources.disk / 1024).toFixed(1)} GB
                </span>
              </div>
              {vmName && (
                <div>
                  <span className="block">Hostname:</span>
                  <span className="font-medium text-white">{vmName}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

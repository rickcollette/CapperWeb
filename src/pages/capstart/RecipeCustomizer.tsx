import { useState } from "react";
import { useListRecipes, useCreateRecipe } from "@/api/capstart-recipes";
import { PageHeader, Button, Card, TextInput, Select } from "@/components/common/ui";

export function RecipeCustomizer() {
  const { data: baseRecipes = [] } = useListRecipes();
  const [selectedBaseRecipe, setSelectedBaseRecipe] = useState<string>("");
  const [recipeName, setRecipeName] = useState("");
  const [recipeVersion, setRecipeVersion] = useState("1.0.0");
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const createMutation = useCreateRecipe();

  const handleCustomizeRecipe = async () => {
    if (!selectedBaseRecipe || !recipeName) {
      alert("Please select a base recipe and enter a name");
      return;
    }

    const baseRecipe = baseRecipes.find((r) => r.id === selectedBaseRecipe);
    if (!baseRecipe) return;

    // Merge base recipe with customizations
    const mergedContent = {
      ...baseRecipe.content,
      ...customizations,
      parameters: {
        ...baseRecipe.content?.parameters,
        ...customizations.parameters,
      },
    };

    try {
      await createMutation.mutateAsync({
        name: recipeName.toLowerCase().replace(/\s+/g, "-"),
        version: recipeVersion,
        title: recipeName,
        description: `Customized version of ${baseRecipe.title}`,
        category: baseRecipe.category,
        tags: [...(baseRecipe.tags || []), "customized"],
        content: mergedContent,
      });
    } catch (error) {
      console.error("Failed to create customized recipe:", error);
    }
  };

  return (
    <div>
      <PageHeader
        title="Recipe Customizer"
        description="Create a custom recipe based on an existing one"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold mb-4">Select Base Recipe</h3>
          <Select
            value={selectedBaseRecipe}
            onChange={(e) => setSelectedBaseRecipe(e.target.value)}
          >
            <option value="">Choose a recipe to customize</option>
            {baseRecipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.title} (v{recipe.version})
              </option>
            ))}
          </Select>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-4">Recipe Details</h3>
          <div className="space-y-3">
            <TextInput
              placeholder="Recipe name"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
            />
            <TextInput
              placeholder="Version (e.g., 1.0.0)"
              value={recipeVersion}
              onChange={(e) => setRecipeVersion(e.target.value)}
            />
          </div>
        </Card>

        {selectedBaseRecipe && baseRecipes.find((r) => r.id === selectedBaseRecipe) && (
          <Card className="lg:col-span-2">
            <h3 className="text-sm font-semibold mb-4">Customizations</h3>
            <p className="text-sm text-muted mb-4">
              Modify specific aspects of the base recipe:
            </p>
            <div className="space-y-3">
              <label className="block">
                <input
                  type="checkbox"
                  className="mr-2"
                  onChange={(e) =>
                    setCustomizations({
                      ...customizations,
                      customizeResources: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Customize resource requirements</span>
              </label>
              <label className="block">
                <input
                  type="checkbox"
                  className="mr-2"
                  onChange={(e) =>
                    setCustomizations({
                      ...customizations,
                      addHooks: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Add custom installation hooks</span>
              </label>
              <label className="block">
                <input
                  type="checkbox"
                  className="mr-2"
                  onChange={(e) =>
                    setCustomizations({
                      ...customizations,
                      addParameters: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Add custom parameters</span>
              </label>
            </div>
          </Card>
        )}

        <div className="lg:col-span-2 flex gap-2">
          <Button variant="default" className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCustomizeRecipe}
            disabled={!selectedBaseRecipe || !recipeName}
            className="flex-1"
          >
            Create Customized Recipe
          </Button>
        </div>
      </div>
    </div>
  );
}

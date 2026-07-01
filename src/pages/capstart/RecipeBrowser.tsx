import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useListRecipes, useListBuiltinRecipes } from "@/api/capstart-recipes";
import {
  PageHeader,
  Button,
  Card,
  StatusBadge,
  TextInput,
  Select,
} from "@/components/common/ui";

export function RecipeBrowser() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [showBuiltin, setShowBuiltin] = useState(true);
  const [showCommunity, setShowCommunity] = useState(true);

  const { data: allRecipes = [], isLoading: isLoadingAll } = useListRecipes(
    category || undefined
  );
  const { data: builtinRecipes = [], isLoading: isLoadingBuiltin } =
    useListBuiltinRecipes();

  const recipes = showBuiltin
    ? allRecipes
    : allRecipes.filter((r) => !r.isBuiltin);

  const filtered = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(search.toLowerCase()) ||
    recipe.description.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = isLoadingAll || isLoadingBuiltin;

  const categories = Array.from(
    new Set(allRecipes.map((r) => r.category).filter(Boolean))
  );

  return (
    <div>
      <PageHeader
        title="Recipe Browser"
        description="Browse and deploy pre-configured recipes"
        actions={
          <Button
            variant="primary"
            onClick={() => navigate("/capstart/upload")}
          >
            Upload Custom Recipe
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextInput
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBuiltin}
                onChange={(e) => setShowBuiltin(e.target.checked)}
              />
              <span className="text-sm">Built-in</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCommunity}
                onChange={(e) => setShowCommunity(e.target.checked)}
              />
              <span className="text-sm">Community</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Recipe Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted">Loading recipes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-muted mb-4">No recipes found</p>
          <Button
            variant="default"
            onClick={() => {
              setSearch("");
              setCategory("");
            }}
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((recipe) => (
            <Card
              key={recipe.id}
              className="cursor-pointer hover:border-accent transition-colors"
              onClick={() => navigate(`/capstart/recipes/${recipe.id}`)}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-base">{recipe.title}</h3>
                  {recipe.isBuiltin && (
                    <StatusBadge status="running" text="Built-in" />
                  )}
                </div>
                <p className="text-xs text-muted">{recipe.category}</p>
              </div>

              <p className="text-sm text-muted mb-3 line-clamp-2">
                {recipe.description}
              </p>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block bg-slate-700 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {recipe.tags.length > 3 && (
                    <span className="text-xs text-muted">
                      +{recipe.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-xs text-muted">
                  v{recipe.version} · by {recipe.author}
                </div>
                <Button size="sm" variant="primary">
                  Deploy
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

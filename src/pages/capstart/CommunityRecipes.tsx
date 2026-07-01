import { useState } from "react";
import { useListRecipes } from "@/api/capstart-recipes";
import { PageHeader, Button, Card, TextInput, Select, StatusBadge } from "@/components/common/ui";

export function CommunityRecipes() {
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "rating">("newest");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const { data: recipes = [], isLoading } = useListRecipes(category || undefined);

  const communityRecipes = recipes.filter((r) => r.isCommunity);
  const filtered = communityRecipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "popular":
        return 0; // Would sort by download count
      case "rating":
        return 0; // Would sort by community rating
      default:
        return 0;
    }
  });

  const categories = Array.from(
    new Set(communityRecipes.map((r) => r.category).filter(Boolean))
  );

  return (
    <div>
      <PageHeader
        title="Community Recipes"
        description="Discover and use recipes created by the community"
        actions={
          <Button variant="primary">
            Share Your Recipe
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

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
          </Select>
        </div>
      </Card>

      {/* Recipe List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted">Loading recipes...</p>
        </div>
      ) : sorted.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-muted mb-4">No community recipes found</p>
          <Button variant="primary">Browse All Recipes</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((recipe) => (
            <Card
              key={recipe.id}
              className="cursor-pointer hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base mb-1">
                    {recipe.title}
                  </h3>
                  <p className="text-sm text-muted mb-2">
                    {recipe.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status="running" text="Community" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {recipe.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-slate-700 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>⭐ 4.5 (42 reviews)</span>
                  <span>📥 156 downloads</span>
                  <span>by {recipe.author}</span>
                </div>
                <Button size="sm" variant="primary">
                  Use Recipe
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

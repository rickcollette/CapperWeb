import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateRecipe } from "@/api/capstart-recipes";
import { PageHeader, Button, Card, TextInput } from "@/components/common/ui";

interface RecipeForm {
  name: string;
  version: string;
  title: string;
  description: string;
  category: string;
  tags: string;
  content: Record<string, any>;
}

export function RecipeUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [form, setForm] = useState<RecipeForm>({
    name: "",
    version: "1.0.0",
    title: "",
    description: "",
    category: "",
    tags: "",
    content: {},
  });

  const createMutation = useCreateRecipe();

  const handleFormChange = (field: keyof RecipeForm, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const content = JSON.parse(text);

      // Auto-populate form from recipe file
      setForm({
        name: content.name || form.name,
        version: content.version || form.version,
        title: content.title || form.title,
        description: content.description || form.description,
        category: content.category || form.category,
        tags: content.tags?.join(", ") || form.tags,
        content,
      });
    } catch (error) {
      alert("Failed to parse recipe file. Please ensure it's valid JSON.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.version || !form.title) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: form.name,
        version: form.version,
        title: form.title,
        description: form.description,
        category: form.category,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        content: form.content,
      });

      navigate("/capstart/recipes");
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div>
      <PageHeader
        title="Upload Custom Recipe"
        description="Create and upload your own recipe"
        actions={
          <Button variant="default" onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <h3 className="text-sm font-semibold mb-4">Recipe Metadata</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <TextInput
                    placeholder="e.g., my-webserver"
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Version <span className="text-red-500">*</span>
                    </label>
                    <TextInput
                      placeholder="e.g., 1.0.0"
                      value={form.version}
                      onChange={(e) =>
                        handleFormChange("version", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Category
                    </label>
                    <TextInput
                      placeholder="e.g., web, database"
                      value={form.category}
                      onChange={(e) =>
                        handleFormChange("category", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <TextInput
                    placeholder="e.g., My Custom Web Server"
                    value={form.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe what this recipe does"
                    value={form.description}
                    onChange={(e) =>
                      handleFormChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Tags
                  </label>
                  <TextInput
                    placeholder="e.g., web, nginx, ubuntu"
                    value={form.tags}
                    onChange={(e) => handleFormChange("tags", e.target.value)}
                  />
                  <p className="text-xs text-muted mt-1">
                    Separate tags with commas
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Upload Area */}
          <div>
            <Card
              className={`border-2 border-dashed transition-colors cursor-pointer mb-4 ${
                dragActive
                  ? "border-accent bg-accent/5"
                  : "border-border"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="text-center py-8">
                <div className="mb-2 text-3xl">📋</div>
                <p className="text-xs font-medium mb-2">
                  Drop recipe file here
                </p>
                <p className="text-xs text-muted mb-3">or click to select</p>
                <Button size="sm" variant="default">
                  Select File
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold mb-3">Instructions</h3>
              <ol className="text-xs text-muted space-y-2 list-decimal list-inside">
                <li>Prepare your recipe as a JSON file</li>
                <li>Fill in the metadata on the left</li>
                <li>Upload the recipe file</li>
                <li>Review and submit</li>
              </ol>
            </Card>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-2 mt-6">
          <Button variant="default" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Uploading..." : "Upload Recipe"}
          </Button>
        </div>
      </form>
    </div>
  );
}

import { useState } from "react";
import { useParams } from "react-router-dom";
import { useS3BucketPolicy, useUpdateS3BucketPolicy, useDeleteS3BucketPolicy } from "@/api/s3bucketpolicy";
import { PageHeader, Button, Card } from "@/components/common/ui";

const POLICY_TEMPLATES = {
  publicRead: {
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Principal: "*",
      Action: "s3:GetObject",
      Resource: "arn:aws:s3:::BUCKET_NAME/*"
    }]
  },
  allowiam: {
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Principal: { AWS: "arn:aws:iam::ACCOUNT_ID:root" },
      Action: "s3:*",
      Resource: ["arn:aws:s3:::BUCKET_NAME", "arn:aws:s3:::BUCKET_NAME/*"]
    }]
  },
};

export function BucketPolicy() {
  const { bucket = "" } = useParams();
  const { data, isLoading } = useS3BucketPolicy(bucket);
  const updateMutation = useUpdateS3BucketPolicy(bucket);
  const deleteMutation = useDeleteS3BucketPolicy(bucket);
  const [policyJson, setPolicyJson] = useState("");
  const [editMode, setEditMode] = useState(false);

  const handleEdit = () => {
    setPolicyJson(JSON.stringify(data?.policy || {}, null, 2));
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      const policy = JSON.parse(policyJson);
      await updateMutation.mutateAsync(policy);
      setEditMode(false);
    } catch (err) {
      alert(`Invalid JSON or error: ${err}`);
    }
  };

  const handleDelete = async () => {
    if (confirm("Delete bucket policy?")) {
      try {
        await deleteMutation.mutateAsync();
      } catch (err) {
        alert(`Error: ${err}`);
      }
    }
  };

  const applyTemplate = (templateKey: keyof typeof POLICY_TEMPLATES) => {
    const template = POLICY_TEMPLATES[templateKey];
    const templateJson = JSON.stringify(template, null, 2)
      .replace("BUCKET_NAME", bucket)
      .replace("ACCOUNT_ID", "123456789012");
    setPolicyJson(templateJson);
  };

  if (isLoading) return <p className="text-muted">Loading...</p>;

  return (
    <div>
      <PageHeader
        title={`Bucket Policy: ${bucket}`}
        description="Manage S3 bucket access policies"
        actions={
          <div className="flex gap-2">
            {!editMode ? (
              <>
                <Button variant="primary" onClick={handleEdit}>
                  Edit Policy
                </Button>
                {data?.policy && (
                  <Button variant="danger" onClick={handleDelete}>
                    Delete
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="default" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  Save Policy
                </Button>
              </>
            )}
          </div>
        }
      />

      {editMode ? (
        <>
          <Card className="mb-4">
            <div className="mb-3 space-y-2">
              <p className="text-sm font-semibold">Policy Templates:</p>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(POLICY_TEMPLATES).map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant="default"
                    onClick={() => applyTemplate(key as keyof typeof POLICY_TEMPLATES)}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <textarea
              value={policyJson}
              onChange={(e) => setPolicyJson(e.target.value)}
              className="w-full h-96 bg-slate-800 text-slate-100 p-3 rounded font-mono text-sm border border-border"
              placeholder="Paste policy JSON here..."
            />
          </Card>
        </>
      ) : (
        <Card>
          {data?.policy ? (
            <pre className="overflow-auto font-mono text-xs text-slate-300">
              {JSON.stringify(data.policy, null, 2)}
            </pre>
          ) : (
            <p className="text-muted">No policy configured.</p>
          )}
        </Card>
      )}
    </div>
  );
}

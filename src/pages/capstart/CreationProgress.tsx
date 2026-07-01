import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  useGetRecipeExecution,
  useExecutionLogs,
} from "@/api/capstart-recipes";
import { Card, Button, StatusBadge } from "@/components/common/ui";

export function CreationProgress() {
  const { executionId = "" } = useParams();
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { data: execution, isLoading: isLoadingExecution } =
    useGetRecipeExecution(executionId);
  const { data: logs = "" } = useExecutionLogs(executionId);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (isLoadingExecution) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!execution) {
    return <div className="p-8 text-center text-red-400">Execution not found</div>;
  }

  const isRunning = execution.status === "running" || execution.status === "pending";
  const isSuccess = execution.status === "success";
  const isFailed = execution.status === "failed";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "running":
        return "bg-blue-500/20 border-blue-500/50";
      case "success":
        return "bg-green-500/20 border-green-500/50";
      case "failed":
        return "bg-red-500/20 border-red-500/50";
      default:
        return "bg-slate-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Waiting to start";
      case "running":
        return "Creating VM...";
      case "success":
        return "VM created successfully";
      case "failed":
        return "Creation failed";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={getStatusColor(execution.status)}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">VM Creation Status</h3>
          <StatusBadge
            status={
              execution.status === "success"
                ? "running"
                : execution.status === "failed"
                ? "stopped"
                : "pending"
            }
          />
        </div>
        <p className="text-sm">{getStatusText(execution.status)}</p>

        {execution.errorMessage && (
          <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded text-sm text-red-300">
            {execution.errorMessage}
          </div>
        )}
      </Card>

      {/* Execution Details */}
      <Card>
        <h3 className="font-semibold mb-3">Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted mb-1">Execution ID</p>
            <p className="font-mono text-xs">{execution.id}</p>
          </div>
          <div>
            <p className="text-muted mb-1">VM ID</p>
            <p className="font-mono text-xs">{execution.vmID}</p>
          </div>
          {execution.startedAt && (
            <div>
              <p className="text-muted mb-1">Started</p>
              <p>
                {new Date(execution.startedAt).toLocaleTimeString()}
              </p>
            </div>
          )}
          {execution.completedAt && (
            <div>
              <p className="text-muted mb-1">Completed</p>
              <p>
                {new Date(execution.completedAt).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Logs */}
      <Card>
        <h3 className="font-semibold mb-3">Execution Logs</h3>
        <div className="bg-slate-900 rounded p-3 h-64 overflow-y-auto font-mono text-xs text-muted">
          {logs ? (
            <>
              {logs.split("\n").map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap break-words">
                  {line}
                </div>
              ))}
              <div ref={logsEndRef} />
            </>
          ) : (
            <p className="text-center py-12">Waiting for logs...</p>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        {isRunning && (
          <Button variant="danger" className="flex-1">
            Cancel Creation
          </Button>
        )}
        {isSuccess && (
          <>
            <Button variant="default" className="flex-1">
              View VM Details
            </Button>
            <Button variant="primary" className="flex-1">
              Back to Instances
            </Button>
          </>
        )}
        {isFailed && (
          <>
            <Button variant="default" className="flex-1">
              Retry
            </Button>
            <Button variant="default" className="flex-1">
              Go Back
            </Button>
          </>
        )}
      </div>

      {/* Auto-refresh Info */}
      {isRunning && (
        <p className="text-xs text-muted text-center">
          Updating every 2 seconds... You can safely close this page. The
          creation will continue in the background.
        </p>
      )}
    </div>
  );
}

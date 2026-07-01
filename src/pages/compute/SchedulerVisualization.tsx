import { useSchedulerState, useSchedulerMetrics, useSchedulingDecisions } from "@/api/scheduler";
import { PageHeader, Card, StatusBadge } from "@/components/common/ui";

export function SchedulerVisualization() {
  const { data: state, isLoading: stateLoading } = useSchedulerState();
  const { data: metrics } = useSchedulerMetrics();
  const { data: decisions } = useSchedulingDecisions();

  if (stateLoading) return <p className="text-muted">Loading scheduler state...</p>;

  const utilizationPercent = state
    ? Math.round((state.utilizedCapacity / (state.availableCapacity + state.utilizedCapacity)) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title="Scheduler Visualization"
        description="Monitor job scheduling state and capacity"
      />

      {/* Metrics Summary */}
      <div className="grid md:grid-cols-4 gap-4 mb-4">
        <Card>
          <div className="text-2xl font-bold text-primary">{state?.totalNodes || 0}</div>
          <div className="text-xs text-muted">Total Nodes</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-cyan-400">{state?.pendingJobs || 0}</div>
          <div className="text-xs text-muted">Pending Jobs</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-green-400">{state?.scheduledJobs || 0}</div>
          <div className="text-xs text-muted">Scheduled Jobs</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-orange-400">{utilizationPercent}%</div>
          <div className="text-xs text-muted">Utilization</div>
        </Card>
      </div>

      {/* Capacity Visualization */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold mb-3">Cluster Capacity</h3>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted">CPU</span>
              <span className="font-mono text-sm">
                {state?.utilizedCapacity || 0} / {(state?.availableCapacity || 0) + (state?.utilizedCapacity || 0)}
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-orange-500 h-full"
                style={{
                  width: `${utilizationPercent}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Metrics */}
      {metrics && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold mb-3">Performance Metrics</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <span className="text-muted text-xs">Scheduling Efficiency</span>
              <div className="text-lg font-semibold">{Math.round(metrics.efficiency * 100)}%</div>
            </div>
            <div>
              <span className="text-muted text-xs">Avg Wait Time</span>
              <div className="text-lg font-semibold">{metrics.avgWaitTime.toFixed(1)}s</div>
            </div>
            <div>
              <span className="text-muted text-xs">Success Rate</span>
              <div className="text-lg font-semibold text-green-400">
                {Math.round(metrics.successRate * 100)}%
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Decisions */}
      {decisions && decisions.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold mb-3">Recent Scheduling Decisions</h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {decisions.slice(0, 20).map((decision) => (
              <div
                key={decision.jobId}
                className="flex items-center justify-between text-xs p-2 bg-slate-800 rounded"
              >
                <div>
                  <span className="font-mono text-slate-400">{decision.jobId}</span>
                  {decision.targetNode && (
                    <span className="ml-2 text-muted">→ {decision.targetNode}</span>
                  )}
                </div>
                <StatusBadge
                  status={
                    decision.decision === "scheduled"
                      ? "running"
                      : decision.decision === "pending"
                        ? "pending"
                        : "stopped"
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

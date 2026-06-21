import React, { useState, useEffect } from 'react';
import { getDeletionAPI, type DeletionJob } from '../api/deletion';
import { ChevronDown } from 'lucide-react';

interface DeletionProgressModalProps {
  open: boolean;
  jobId: string;
  resourceType: string;
  resourceId: string;
  onClose: () => void;
  onComplete?: (job: DeletionJob) => void;
}

export const DeletionProgressModal: React.FC<DeletionProgressModalProps> = ({
  open,
  jobId,
  resourceType,
  resourceId,
  onClose,
  onComplete,
}) => {
  const [job, setJob] = useState<DeletionJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandErrors, setExpandErrors] = useState(false);

  // Poll job status
  useEffect(() => {
    if (!open || !jobId) return;

    setLoading(true);
    setError(null);

    const pollJob = async () => {
      try {
        const deletionAPI = getDeletionAPI();
        const result = await deletionAPI.pollUntilComplete(jobId, { interval: 1000 });
        setJob(result);
        setLoading(false);
        onComplete?.(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Polling error');
        setLoading(false);
      }
    };

    // Setup interval-based polling
    let interval: ReturnType<typeof setInterval> | undefined;
    const startPolling = async () => {
      const deletionAPI = getDeletionAPI();
      interval = setInterval(async () => {
        try {
          const status = await deletionAPI.getJobStatus(jobId);
          setJob(status);
          setLoading(false);

          if (status.status === 'completed' || status.status === 'failed') {
            if (interval) clearInterval(interval);
            onComplete?.(status);
          }
        } catch (err) {
          // Silent fail on individual polls
        }
      }, 2000);

      // Also kick off the main poll
      await pollJob();
    };

    startPolling();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, jobId, onComplete]);

  if (!open) return null;

  if (loading && !job) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold">Deletion in Progress</h2>
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const isCompleted = job.status === 'completed' || job.status === 'failed';
  const isFailed = job.status === 'failed';
  const hasErrors = job.errors && job.errors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-lg" data-testid="deletion-progress-modal">
        <div className="border-b border-border/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Deleting {resourceType} "{resourceId}"
            </h2>
            {isCompleted && (
              <span
                className={`rounded px-3 py-1 text-xs font-medium ${
                  isFailed
                    ? 'bg-red-900/30 text-red-200'
                    : 'bg-green-900/30 text-green-200'
                }`}
              >
                {isFailed ? 'Failed' : 'Complete'}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 p-6">
          {/* Progress bar */}
          <div>
            <div className="mb-2 flex justify-between text-xs">
              <span className="text-muted">Progress</span>
              <span className="text-muted" data-testid="deletion-progress-percent">{job.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-bg" data-testid="deletion-progress-bar">
              <div
                className={`h-full rounded-full transition-all ${
                  isFailed ? 'bg-red-600' : 'bg-primary'
                }`}
                style={{ width: `${job.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Current step */}
          {job.currentStep && !isCompleted && (
            <div className="rounded border border-blue-600/30 bg-blue-900/20 p-3" data-testid="deletion-current-step">
              <p className="text-xs text-blue-200">
                <strong>Current step:</strong> {job.currentStep}
              </p>
            </div>
          )}

          {/* Completed steps */}
          {job.completedSteps && job.completedSteps.length > 0 && (
            <div data-testid="deletion-completed-steps">
              <h3 className="mb-2 text-xs font-medium">
                Completed ({job.completedSteps.length})
              </h3>
              <div className="space-y-1">
                {job.completedSteps.map((step) => (
                  <div key={step} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 text-green-400">✓</span>
                    <span className="text-muted">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remaining steps */}
          {job.remainingSteps && job.remainingSteps.length > 0 && !isCompleted && (
            <div data-testid="deletion-remaining-steps">
              <h3 className="mb-2 text-xs font-medium">
                Remaining ({job.remainingSteps.length})
              </h3>
              <div className="space-y-1">
                {job.remainingSteps.map((step) => (
                  <div key={step} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 text-yellow-500">⏳</span>
                    <span className="text-muted">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {hasErrors && (
            <div className="rounded border border-red-600/30 bg-red-900/10" data-testid="deletion-errors-accordion">
              <button
                onClick={() => setExpandErrors(!expandErrors)}
                className="flex w-full items-center gap-2 p-3 text-left hover:bg-red-900/20"
              >
                <span className="text-red-400">❌</span>
                <span className="flex-1 text-sm font-medium">
                  Errors ({job.errors.length})
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandErrors ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandErrors && (
                <div className="border-t border-red-600/20 p-3" data-testid="deletion-error-recovery">
                  <div className="space-y-3">
                    {job.errors.map((err, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <p className="font-medium text-red-300">
                          {err.step}: {err.reason}
                        </p>
                        <p className="text-muted">
                          Resource: {err.resource} ({err.resourceId})
                        </p>
                        {err.recovery && (
                          <p className="text-green-400">✓ {err.recovery}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isCompleted && !isFailed && (
            <div className="rounded border border-green-600/30 bg-green-900/20 p-3 text-xs text-green-200" data-testid="deletion-success">
              ✓ Deletion completed successfully
            </div>
          )}

          {isFailed && (
            <div className="rounded border border-red-600/30 bg-red-900/20 p-3 text-xs text-red-200">
              ❌ Deletion failed. Check errors above for recovery steps.
            </div>
          )}

          {error && (
            <div className="rounded border border-red-600/30 bg-red-900/20 p-3 text-xs text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-border/50 p-4">
          {!isCompleted ? (
            <button
              onClick={onClose}
              className="w-full rounded border border-border bg-transparent px-3 py-2 text-sm font-medium hover:bg-bg"
            >
              Close
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

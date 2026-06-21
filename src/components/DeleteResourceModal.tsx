import React, { useState, useEffect } from 'react';
import { getDeletionAPI, type DeletionPreflight } from '../api/deletion';

interface DeleteResourceModalProps {
  open: boolean;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  onClose: () => void;
  onSuccess?: (jobId: string) => void;
}

type Step = 'preflight' | 'confirm' | 'loading';

export const DeleteResourceModal: React.FC<DeleteResourceModalProps> = ({
  open,
  resourceType,
  resourceId,
  resourceName,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('preflight');
  const [preflight, setPreflight] = useState<DeletionPreflight | null>(null);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load preflight on open
  useEffect(() => {
    if (!open) return;

    const loadPreflight = async () => {
      try {
        setLoading(true);
        setError(null);
        const deletionAPI = getDeletionAPI();
        const result = await deletionAPI.preflight(resourceType, resourceId);
        setPreflight(result);
        setStep('confirm');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deletion info');
        setStep('preflight');
      } finally {
        setLoading(false);
      }
    };

    loadPreflight();
  }, [open, resourceType, resourceId]);

  const handleConfirm = async () => {
    if (confirmationPhrase !== 'DELETE') {
      setError('Confirmation phrase must be exactly "DELETE" (uppercase)');
      return;
    }

    if (!preflight) {
      setError('Missing confirmation token');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const deletionAPI = getDeletionAPI();
      const result = await deletionAPI.confirm(
        resourceType,
        resourceId,
        preflight.confirmationToken
      );

      setStep('loading');
      onSuccess?.(result.jobId);

      // Optional: automatically close and show progress modal
      // setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm deletion');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const phraseMatches = confirmationPhrase === 'DELETE';
  const isReady = phraseMatches && !loading;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg" data-testid="deletion-preflight-modal">
        <h2 className="mb-4 text-lg font-semibold">
          Delete {resourceType} {resourceName ? `"${resourceName}"` : resourceId}
        </h2>

        <div className="mb-4">
          {loading && step === 'preflight' ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : step === 'confirm' && preflight ? (
            <div className="space-y-4">
              {/* Show what will be deleted */}
              {preflight.deleteOrder && preflight.deleteOrder.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Resources to be deleted (in order):
                  </p>
                  <div className="space-y-1">
                    {preflight.deleteOrder.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded border border-border/50 bg-bg/50 px-2 py-1 text-xs"
                      >
                        <span className="font-mono text-primary">{idx + 1}.</span> {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show blockers if any */}
              {preflight.blockedBy && Object.keys(preflight.blockedBy).length > 0 && (
                <div className="rounded border-l-4 border-l-yellow-600 bg-yellow-900/20 p-3" data-testid="deletion-blockers">
                  <p className="mb-2 text-sm font-medium text-yellow-200">
                    The following must be deleted first:
                  </p>
                  <ul className="space-y-1">
                    {Object.entries(preflight.blockedBy).map(([resource, count]) => (
                      <li key={resource} className="text-xs text-yellow-100">
                        {count} {resource}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confirmation phrase input */}
              <div>
                <label className="mb-2 block text-sm text-muted">
                  To confirm, type <strong>DELETE</strong> (uppercase):
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={confirmationPhrase}
                  onChange={(e) => {
                    setConfirmationPhrase(e.target.value);
                    if (error) setError(null);
                  }}
                  autoFocus
                  disabled={loading}
                  data-testid="confirmation-phrase-input"
                  className="w-full rounded border border-border bg-bg px-3 py-2 text-sm disabled:opacity-50"
                />
                {confirmationPhrase && !phraseMatches && (
                  <p className="mt-1 text-xs text-red-400">
                    ❌ Phrase does not match. Type exactly: DELETE
                  </p>
                )}
                {phraseMatches && (
                  <p className="mt-1 text-xs text-green-400">
                    ✓ Phrase matches
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded border border-red-600/50 bg-red-900/20 p-3 text-xs text-red-200">
                  {error}
                </div>
              )}
            </div>
          ) : step === 'loading' ? (
            <div className="flex flex-col items-center py-6">
              <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted">Starting deletion...</p>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            data-testid="deletion-close-button"
            className="flex-1 rounded border border-border bg-transparent px-3 py-2 text-sm font-medium hover:bg-bg disabled:opacity-50"
          >
            Cancel
          </button>
          {step === 'confirm' && (
            <button
              onClick={handleConfirm}
              disabled={!isReady}
              data-testid="deletion-confirm-button"
              className="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Confirm Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

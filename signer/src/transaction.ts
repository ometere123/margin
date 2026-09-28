export type FinalizationReceipt = {
  statusName?: string;
  txExecutionResultName?: string;
  txExecutionResult?: number;
  consensus_data?: {
    leader_receipt?: Array<{ execution_result?: string }>;
    validators?: Array<{ execution_result?: string }>;
  };
};

export type PendingTransaction = {
  id: string;
  label: 'Submission' | 'Resolution';
  claimKey: string;
  state?: 'submitted' | 'finalized' | 'failed' | 'tracking-interrupted';
  verdict?: string;
};

const SUCCESS_EXECUTION = new Set(['SUCCESS', 'FINISHED_WITH_RETURN']);

/**
 * genlayer-js 1.1.8's Studionet receipt carries execution results inside
 * consensus_data.*. It does not expose the older txExecutionResultName field
 * for this response shape. Consensus finality and GenVM execution are checked
 * independently here; a null application return is still a successful return.
 */
export function isSuccessfulFinalizedReceipt(receipt: FinalizationReceipt): boolean {
  if (String(receipt.statusName || '') !== 'FINALIZED') return false;

  const executionResults = [
    ...(receipt.consensus_data?.leader_receipt || []).map((item) => item.execution_result),
    ...(receipt.consensus_data?.validators || []).map((item) => item.execution_result),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  if (executionResults.length > 0) return executionResults.every((value) => SUCCESS_EXECUTION.has(value));
  return receipt.txExecutionResultName === 'FINISHED_WITH_RETURN' || receipt.txExecutionResult === 1;
}

export function executionSummary(receipt: FinalizationReceipt): string {
  const executionResults = [
    ...(receipt.consensus_data?.leader_receipt || []).map((item) => item.execution_result),
    ...(receipt.consensus_data?.validators || []).map((item) => item.execution_result),
  ].filter(Boolean);
  return executionResults.join(', ') || receipt.txExecutionResultName || (receipt.txExecutionResult !== undefined ? String(receipt.txExecutionResult) : 'unknown execution result');
}

export function trackingFailureMessage(label: string, txId: string): string {
  return `${label} submitted. Finalization status could not be confirmed yet. Transaction: ${txId}`;
}

export function pendingStorageKey(claimKey: string): string {
  return `margin.pendingTransaction.${claimKey}`;
}

export function transactionsStorageKey(claimKey: string): string {
  return `margin.transactions.${claimKey}`;
}

export function disconnectStorageKey(): string {
  return 'margin.explicitDisconnect';
}

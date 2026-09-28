export type FinalizationReceipt = {
  status?: string | number;
  statusName?: string;
  result?: number | string;
  resultName?: string;
  result_name?: string;
  txExecutionResultName?: string;
  txExecutionResult?: number;
  consensus_data?: {
    leader_receipt?: Array<{ execution_result?: string }>;
    validators?: Array<{ execution_result?: string; genvm_result?: { error_code?: string | null } }>;
  };
};

export type PendingTransaction = {
  id: string;
  label: 'Submission' | 'Resolution';
  claimKey: string;
  account?: string;
  submittedAt?: string;
  contractAddress?: string;
  network?: 'studionet';
  state?: 'submitted' | 'finalized' | 'failed' | 'tracking-interrupted';
  verdict?: string;
};

const SUCCESS_EXECUTION = new Set(['SUCCESS', 'FINISHED_WITH_RETURN']);
const ACCEPTED_CONSENSUS = new Set(['MAJORITY_AGREE', 'SUCCESS']);

/**
 * On Studionet, validators that are cancelled after quorum may be reported as
 * execution_result=ERROR even though the transaction finalized successfully.
 * The canonical result is the accepted consensus result plus the leader receipt;
 * validator receipts are diagnostic evidence, not an all-must-succeed quorum.
 */
export function isSuccessfulFinalizedReceipt(receipt: FinalizationReceipt): boolean {
  if (String(receipt.statusName || '') !== 'FINALIZED') return false;

  const consensusResult = String(receipt.resultName || receipt.result_name || '');
  const hasConsensusMetadata = Boolean(consensusResult) || receipt.result !== undefined || receipt.consensus_data !== undefined;
  const legacyExecutionSuccess = receipt.txExecutionResultName === 'FINISHED_WITH_RETURN' || receipt.txExecutionResult === 1;
  const accepted = ACCEPTED_CONSENSUS.has(consensusResult) || receipt.result === 6 || (!hasConsensusMetadata && legacyExecutionSuccess);
  if (!accepted) return false;

  const leaderResults = (receipt.consensus_data?.leader_receipt || [])
    .map((item) => item.execution_result)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
  if (leaderResults.length > 0) return leaderResults.every((value) => SUCCESS_EXECUTION.has(value));

  return legacyExecutionSuccess;
}

export function executionSummary(receipt: FinalizationReceipt): string {
  const leaderResults = [
    ...(receipt.consensus_data?.leader_receipt || []).map((item) => item.execution_result),
  ].filter(Boolean);
  const consensusResult = receipt.resultName || receipt.result_name;
  return leaderResults.join(', ') || receipt.txExecutionResultName || consensusResult || (receipt.txExecutionResult !== undefined ? String(receipt.txExecutionResult) : 'unknown execution result');
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

/** A recovered transaction must remain associated with the account that submitted it. */
export function pendingAccountMatches(expected: string | undefined, actual: string | null): boolean {
  if (!expected) return true;
  if (!actual) return false;
  return expected.toLowerCase() === actual.toLowerCase();
}

export type FinalizationReceipt = {
  status?: string | number;
  statusName?: string;
  result?: number | string;
  resultName?: string;
  result_name?: string;
  txExecutionResultName?: string;
  txExecutionResult?: number;
  consensus_data?: {
    leader_receipt?: Array<{ mode?: string; execution_result?: string }>;
    validators?: Array<{ execution_result?: string; genvm_result?: { error_code?: string | null } }>;
  };
  consensus_history?: {
    consensus_results?: Array<{
      consensus_round?: string;
      leader_result?: Array<{ mode?: string; execution_result?: string }>;
      validator_results?: Array<{ mode?: string; execution_result?: string }>;
    }>;
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

function latestConsensusRound(receipt: FinalizationReceipt) {
  const rounds = receipt.consensus_history?.consensus_results;
  return rounds && rounds.length ? rounds[rounds.length - 1] : undefined;
}

/**
 * The installed SDK exposes the canonical GenVM execution in the leader entry
 * of consensus_history. The remaining entries are validator diagnostics; they
 * can be ERROR when quorum has already been reached and are not an all-must-
 * succeed condition.
 */
function canonicalLeaderExecution(receipt: FinalizationReceipt): string | undefined {
  const round = latestConsensusRound(receipt);
  const leader = round?.leader_result?.find((entry) => entry.mode === 'leader');
  if (leader?.execution_result) return leader.execution_result;

  // Compatibility with the older normalized receipt shape. Only use an
  // unlabelled entry when it is unambiguously the sole leader receipt.
  const legacy = receipt.consensus_data?.leader_receipt;
  if (legacy?.length === 1 && legacy[0]?.execution_result) return legacy[0].execution_result;
  return undefined;
}

function consensusWasAccepted(receipt: FinalizationReceipt): boolean {
  const round = latestConsensusRound(receipt);
  if (round?.consensus_round) return round.consensus_round.toUpperCase() === 'ACCEPTED';
  const consensusResult = String(receipt.resultName || receipt.result_name || '');
  return ACCEPTED_CONSENSUS.has(consensusResult) || receipt.result === 6;
}

/**
 * On Studionet, validators that are cancelled after quorum may be reported as
 * execution_result=ERROR even though the transaction finalized successfully.
 * The canonical result is the accepted consensus result plus the leader receipt;
 * validator receipts are diagnostic evidence, not an all-must-succeed quorum.
 */
export function isSuccessfulFinalizedReceipt(receipt: FinalizationReceipt): boolean {
  if (String(receipt.statusName || '') !== 'FINALIZED') return false;

  const hasConsensusMetadata = Boolean(receipt.consensus_history || receipt.resultName || receipt.result_name) || receipt.result !== undefined || receipt.consensus_data !== undefined;
  const legacyExecutionSuccess = receipt.txExecutionResultName === 'FINISHED_WITH_RETURN' || receipt.txExecutionResult === 1;
  const accepted = consensusWasAccepted(receipt) || (!hasConsensusMetadata && legacyExecutionSuccess);
  if (!accepted) return false;

  const leaderExecution = canonicalLeaderExecution(receipt);
  if (leaderExecution) return SUCCESS_EXECUTION.has(leaderExecution);

  return legacyExecutionSuccess;
}

export function executionSummary(receipt: FinalizationReceipt): string {
  return canonicalLeaderExecution(receipt)
    || receipt.txExecutionResultName
    || receipt.resultName
    || receipt.result_name
    || (receipt.txExecutionResult !== undefined ? String(receipt.txExecutionResult) : 'unknown execution result');
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

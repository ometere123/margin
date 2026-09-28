import { describe, expect, it } from 'vitest';
import { executionSummary, isSuccessfulFinalizedReceipt, pendingAccountMatches, pendingStorageKey, trackingFailureMessage } from './transaction';

const successful = {
  statusName: 'FINALIZED',
  result: 6,
  result_name: 'MAJORITY_AGREE',
  consensus_data: {
    leader_receipt: [{ execution_result: 'SUCCESS' }],
    validators: [{ execution_result: 'SUCCESS' }],
  },
};

const realMixedValidatorReceipt = {
  status: 7,
  statusName: 'FINALIZED',
  result: 6,
  consensus_history: {
    consensus_results: [{
      consensus_round: 'Accepted',
      leader_result: [
        { mode: 'leader', execution_result: 'SUCCESS' },
        { mode: 'validator', execution_result: 'ERROR' },
      ],
      validator_results: [
        { mode: 'validator', execution_result: 'SUCCESS' },
        { mode: 'validator', execution_result: 'ERROR' },
      ],
    }],
  },
};

describe('transaction finality handling', () => {
  it('accepts finalized successful return with null application result and no legacy field', () => {
    expect(isSuccessfulFinalizedReceipt(successful)).toBe(true);
  });

  it('rejects finalized GenVM execution errors', () => {
    expect(isSuccessfulFinalizedReceipt({ statusName: 'FINALIZED', result_name: 'MAJORITY_AGREE', consensus_data: { leader_receipt: [{ execution_result: 'FINISHED_WITH_ERROR' }] } })).toBe(false);
    expect(executionSummary({ statusName: 'FINALIZED', result_name: 'MAJORITY_AGREE', consensus_data: { leader_receipt: [{ execution_result: 'FINISHED_WITH_ERROR' }] } })).toBe('FINISHED_WITH_ERROR');
  });

  it('accepts accepted consensus with mixed validator execution results', () => {
    expect(isSuccessfulFinalizedReceipt({
      statusName: 'FINALIZED', result_name: 'MAJORITY_AGREE', result: 6,
      consensus_data: {
        leader_receipt: [{ execution_result: 'SUCCESS' }],
        validators: [
          { execution_result: 'SUCCESS' },
          { execution_result: 'ERROR', genvm_result: { error_code: 'CONSENSUS_VALIDATOR_QUORUM_REACHED' } },
          { execution_result: 'SUCCESS' },
          { execution_result: 'ERROR', genvm_result: { error_code: 'CONSENSUS_VALIDATOR_QUORUM_REACHED' } },
        ],
      },
    })).toBe(true);
  });

  it('accepts the installed SDK receipt shape with mixed validator errors', () => {
    expect(isSuccessfulFinalizedReceipt(realMixedValidatorReceipt)).toBe(true);
    expect(executionSummary(realMixedValidatorReceipt)).toBe('SUCCESS');
  });

  it('rejects an accepted finalized transaction whose canonical leader execution failed', () => {
    expect(isSuccessfulFinalizedReceipt({
      ...realMixedValidatorReceipt,
      consensus_history: {
        consensus_results: [{
          consensus_round: 'Accepted',
          leader_result: [{ mode: 'leader', execution_result: 'FINISHED_WITH_ERROR' }],
          validator_results: [{ mode: 'validator', execution_result: 'SUCCESS' }],
        }],
      },
    })).toBe(false);
  });

  it('does not treat accepted as final success', () => {
    expect(isSuccessfulFinalizedReceipt({ ...successful, statusName: 'ACCEPTED' })).toBe(false);
  });

  it('preserves a submitted id when polling fails', () => {
    const id = '0xabc123';
    expect(trackingFailureMessage('Challenge', id)).toContain(id);
    expect(trackingFailureMessage('Challenge', id)).not.toContain('Submission failed');
    expect(pendingStorageKey('claim')).toBe('margin.pendingTransaction.claim');
  });

  it('does not resume a pending transaction under a different wallet account', () => {
    expect(pendingAccountMatches('0xAa00000000000000000000000000000000000001', '0xaa00000000000000000000000000000000000001')).toBe(true);
    expect(pendingAccountMatches('0xAa00000000000000000000000000000000000001', '0xbb00000000000000000000000000000000000002')).toBe(false);
    expect(pendingAccountMatches(undefined, null)).toBe(true);
  });

  it('supports the SDK legacy success fallback when available', () => {
    expect(isSuccessfulFinalizedReceipt({ statusName: 'FINALIZED', result_name: 'MAJORITY_AGREE', txExecutionResultName: 'FINISHED_WITH_RETURN' })).toBe(true);
    expect(isSuccessfulFinalizedReceipt({ statusName: 'FINALIZED', result: 6, txExecutionResult: 1 })).toBe(true);
  });

  it('rejects finalized disagreement even when one validator executed successfully', () => {
    expect(isSuccessfulFinalizedReceipt({ statusName: 'FINALIZED', result_name: 'MAJORITY_DISAGREE', result: 7, consensus_data: { leader_receipt: [{ execution_result: 'SUCCESS' }], validators: [{ execution_result: 'SUCCESS' }] } })).toBe(false);
  });
});

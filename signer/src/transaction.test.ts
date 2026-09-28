import { describe, expect, it } from 'vitest';
import { executionSummary, isSuccessfulFinalizedReceipt, pendingStorageKey, trackingFailureMessage } from './transaction';

const successful = {
  statusName: 'FINALIZED',
  result: 6,
  result_name: 'MAJORITY_AGREE',
  consensus_data: {
    leader_receipt: [{ execution_result: 'SUCCESS' }],
    validators: [{ execution_result: 'SUCCESS' }],
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

  it('does not treat accepted as final success', () => {
    expect(isSuccessfulFinalizedReceipt({ ...successful, statusName: 'ACCEPTED' })).toBe(false);
  });

  it('preserves a submitted id when polling fails', () => {
    const id = '0xabc123';
    expect(trackingFailureMessage('Challenge', id)).toContain(id);
    expect(trackingFailureMessage('Challenge', id)).not.toContain('Submission failed');
    expect(pendingStorageKey('claim')).toBe('margin.pendingTransaction.claim');
  });

  it('supports the SDK legacy success fallback when available', () => {
    expect(isSuccessfulFinalizedReceipt({ statusName: 'FINALIZED', result_name: 'MAJORITY_AGREE', txExecutionResultName: 'FINISHED_WITH_RETURN' })).toBe(true);
    expect(isSuccessfulFinalizedReceipt({ statusName: 'FINALIZED', result: 6, txExecutionResult: 1 })).toBe(true);
  });

  it('rejects finalized disagreement even when one validator executed successfully', () => {
    expect(isSuccessfulFinalizedReceipt({ statusName: 'FINALIZED', result_name: 'MAJORITY_DISAGREE', result: 7, consensus_data: { leader_receipt: [{ execution_result: 'SUCCESS' }], validators: [{ execution_result: 'SUCCESS' }] } })).toBe(false);
  });
});

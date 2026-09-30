import { describe, expect, it } from 'vitest';
import { consumerActivityRecord } from './activity';

describe('consumer activity provenance', () => {
  it('records consumer writes against the consumer contract', () => {
    expect(consumerActivityRecord({
      id: '0xtx', functionName: 'execute_release', claimKey: 'claim', account: '0xabc', submittedAt: '2026-01-01T00:00:00.000Z', consumerAddress: '0xconsumer',
    })).toMatchObject({ contractAddress: '0xconsumer', label: 'execute_release', state: 'submitted' });
  });
});

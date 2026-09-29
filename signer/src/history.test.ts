import { describe, expect, it } from 'vitest';
import { decisionHistoryHtml } from './history';

describe('decision history rendering', () => {
  it('renders revisions and expandable provenance without changing the data', () => {
    const html = decisionHistoryHtml([{ revision: 1, status: 'SUPPORTED', rationale: 'Verified', resolved_at: '2026-09-29T12:00:00Z', resolver: '0xabc', source_manifest_digest: 'digest-1', manifest: { source: 'page' } }]);
    expect(html).toContain('Decision history');
    expect(html).toContain('Revision 1');
    expect(html).toContain('digest-1');
    expect(html).toContain('Revision provenance');
  });
});

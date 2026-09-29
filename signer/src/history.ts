export type DecisionHistoryEntry = {
  revision?: number | bigint;
  status?: string;
  rationale?: string;
  resolved_at?: string;
  resolver?: string;
  source_manifest_digest?: string;
  manifest?: unknown;
};

function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]!));
}

export function decisionHistoryHtml(history: DecisionHistoryEntry[]): string {
  if (!history.length) return '<section class="decision-history"><div class="eyebrow">Decision history</div><p class="meta">No finalized decision history was returned.</p></section>';
  const rows = history.map((entry) => {
    const manifest = entry.manifest ? JSON.stringify(entry.manifest, null, 2) : '';
    return `<details class="history-entry"><summary><span>Revision ${esc(entry.revision)}</span><strong>${esc(entry.status || 'UNKNOWN')}</strong><span class="meta">${esc(entry.resolved_at || 'Not resolved')}</span></summary><div class="history-body"><div class="detail-grid"><span>Rationale</span><span>${esc(entry.rationale || 'No rationale recorded.')}</span><span>Resolved</span><span>${esc(entry.resolved_at || 'Not resolved')}</span><span>Resolver</span><code>${esc(entry.resolver || 'Not returned')}</code><span>Source manifest digest</span><code>${esc(entry.source_manifest_digest || 'Not returned')}</code></div>${manifest ? `<details><summary>Revision provenance</summary><pre>${esc(manifest)}</pre></details>` : ''}</div></details>`;
  }).join('');
  return `<section class="decision-history"><div class="eyebrow">Decision history</div><div class="history-list">${rows}</div></section>`;
}

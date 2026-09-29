import { CLAIM_CLASSES, MARGIN_CONTRACT_ADDRESS, MARGIN_EXPLORER_URL, MARGIN_SIGNER_URL, canonicalizeUrl, claimKeyFor, encodeDraft, pageKeyFor, type ClaimClass, type ClaimDraft, type MarginClaim } from '../../shared/protocol';

const app = document.querySelector<HTMLDivElement>('#app')!;

function esc(value: string): string {
  return value.replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!));
}

function shell(inner: string) {
  app.innerHTML = `<div class="shell"><div class="brand"><span class="brand-mark"><img src="icons/icon-32.png" alt=""><h1>MARGIN</h1></span><span class="network">Studionet · 61999</span></div>${inner}</div>`;
}

function claimView(claim: MarginClaim) {
  let evidence: string[] = [];
  try { const parsed = JSON.parse(claim.evidence_urls_json || '[]'); if (Array.isArray(parsed)) evidence = parsed.map(String); } catch {}
  const manifest = claim.latest_manifest ? JSON.stringify(claim.latest_manifest, null, 2) : 'No finalized source manifest returned.';
  shell(`<div class="card"><div class="status ${esc(claim.status)}">${esc(claim.status)} · FINALIZED</div><div class="quote">${esc(claim.quote)}</div><div class="muted">${esc(claim.rationale || 'No rationale recorded.')}</div></div><div class="card"><div class="label">Challenge</div><div class="muted">${esc(claim.challenge_statement)}</div><div class="label">Class · Revision · Resolved</div><div class="muted">${esc(claim.claim_class)} · ${esc(String(claim.revision))} · ${esc(claim.resolved_at || 'Not resolved')}</div><div class="label">Claim key</div><div class="code">${esc(claim.claim_key)}</div><div class="label">Evidence URLs</div><div class="muted">${evidence.length ? evidence.map((url) => `<a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(url)} ↗</a>`).join('<br>') : 'None recorded.'}</div><div class="label">Source manifest</div><details><summary>Advanced provenance</summary><pre class="code">${esc(manifest)}</pre></details><div class="muted"><a href="${MARGIN_EXPLORER_URL}/address/${MARGIN_CONTRACT_ADDRESS}" target="_blank" rel="noreferrer">MARGIN contract in Studionet Explorer ↗</a></div></div><div class="row"><a class="button secondary" href="${MARGIN_SIGNER_URL}claim/${esc(claim.claim_key)}" target="_blank">View full provenance</a><a class="button secondary" href="${MARGIN_SIGNER_URL}claim/${esc(claim.claim_key)}/assurance" target="_blank">View assurance</a></div><button id="refresh" class="secondary">Refresh page annotations</button>`);
  document.querySelector('#refresh')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await chrome.tabs.sendMessage(tab.id, { type: 'REFRESH_ANNOTATIONS' });
  });
}

async function draftView(seed: any) {
  const pageKey = await pageKeyFor(seed.canonicalUrl);
  shell(`<div class="card"><div class="muted">Highlighted on ${esc(seed.pageTitle || seed.canonicalUrl)}</div><div class="quote">${esc(seed.anchor.exact)}</div></div><div class="card"><label class="label">Claim class</label><select id="class">${CLAIM_CLASSES.map((x) => `<option>${x}</option>`).join('')}</select><label class="label">What exactly is wrong with this claim?</label><textarea id="statement" maxlength="1600" placeholder="State one precise, falsifiable objection. Do not ask validators to rate the whole site."></textarea><label class="label">Evidence URLs <span class="muted">(up to 3, one per line)</span></label><textarea id="evidence" placeholder="https://docs.example.com/...\nhttps://github.com/..." ></textarea><label class="label">Archive URL <span class="muted">(optional)</span></label><input id="archive" placeholder="https://web.archive.org/..."><div id="formError" style="margin-top:10px"></div></div><button id="continue" class="primary">Continue to wallet signer</button><p class="muted">The signer is a small web surface because injected wallets are not reliably available inside Chrome extension pages. The claim is still read directly from Studionet after signing.</p>`);

  document.querySelector('#continue')?.addEventListener('click', async () => {
    const statement = (document.querySelector<HTMLTextAreaElement>('#statement')!.value || '').trim();
    const claimClass = document.querySelector<HTMLSelectElement>('#class')!.value as ClaimClass;
    const archiveUrl = document.querySelector<HTMLInputElement>('#archive')!.value.trim();
    const evidenceUrls = document.querySelector<HTMLTextAreaElement>('#evidence')!.value.split(/\n+/).map((x) => x.trim()).filter(Boolean);
    const err = document.querySelector<HTMLDivElement>('#formError')!;
    err.innerHTML = '';
    if (statement.length < 12) { err.innerHTML = '<div class="error">Make the objection more precise.</div>'; return; }
    if (evidenceUrls.length > 3) { err.innerHTML = '<div class="error">Use at most three evidence URLs.</div>'; return; }
    try {
      for (const u of [...evidenceUrls, ...(archiveUrl ? [archiveUrl] : [])]) {
        const parsed = new URL(u); if (!/^https?:$/.test(parsed.protocol)) throw new Error('Evidence must use http(s).');
      }
      const normalizedEvidence = [...new Set(evidenceUrls.map(canonicalizeUrl))].sort();
      if (normalizedEvidence.length > 3) throw new Error('Use at most three distinct evidence URLs.');
      const normalizedArchive = archiveUrl ? canonicalizeUrl(archiveUrl) : '';
      const withoutKey: Omit<ClaimDraft, 'claimKey'> = {
        canonicalUrl: seed.canonicalUrl, pageTitle: seed.pageTitle || '', pageKey,
        anchor: seed.anchor, pageDigest: seed.pageDigest, claimClass, challengeStatement: statement,
        evidenceUrls: normalizedEvidence, archiveUrl: normalizedArchive, capturedAt: new Date().toISOString(),
      };
      const draft: ClaimDraft = { ...withoutKey, claimKey: await claimKeyFor(withoutKey) };
      await chrome.storage.session.set({ pendingDraft: draft });
      const target = new URL(MARGIN_SIGNER_URL);
      target.searchParams.set('draft', encodeDraft(draft));
      await chrome.tabs.create({ url: target.toString() });
    } catch (error) {
      err.innerHTML = `<div class="error">${esc(String((error as Error).message || error))}</div>`;
    }
  });
}

async function main() {
  const state = await chrome.runtime.sendMessage({ type: 'GET_PANEL_STATE' });
  if (state?.selectedClaim) return claimView(state.selectedClaim as MarginClaim);
  if (state?.pendingDraft?.canonicalUrl) return draftView(state.pendingDraft);
  if (state?.panelError) return shell(`<div class="error">${esc(state.panelError)}</div>`);
  shell(`<div class="card"><div class="claim-title">Challenge a web claim</div><p class="muted">Highlight a narrow factual statement on a public webpage, right-click, then choose <strong>Challenge with MARGIN</strong>.</p></div><div class="card"><div class="claim-title">What MARGIN is for</div><p class="muted">Technical, licence, compatibility, pricing and documentation claims with independently inspectable public evidence. It is intentionally not a general-purpose truth score.</p></div>`);
}

void main();

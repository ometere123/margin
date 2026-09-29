import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { canonicalizeUrl, claimKeyFor, decodeDraft, MARGIN_CHAIN_ID, MARGIN_CONSUMER_ADDRESS, MARGIN_CONTRACT_ADDRESS, MARGIN_EXPLORER_URL, MARGIN_NETWORK_NAME, MARGIN_RPC_URL, pageKeyFor, type ClaimDraft, type MarginClaim } from '../../shared/protocol';
import { disconnectStorageKey, executionSummary, isSuccessfulFinalizedReceipt, pendingAccountMatches, trackingFailureMessage, transactionsStorageKey, type PendingTransaction } from './transaction';
import { createProviderBackedClient } from './wallet';
import { accountFromProvider, accountRequestMethod, isStudionetChainHex, shouldAutoRestore, walletHeaderState } from './session';
import { assuredActions, assuredDisplay, type AssuredClaimView, type AssuredAction } from './assured';
import { parseRoute, type Route } from './router';
import { decisionHistoryHtml, type DecisionHistoryEntry } from './history';
import { consumerErrorMessage, mergeProtectedReleases, prioritizeProtectedReleases, type ProtectedReleaseView } from './consumer';
import './style.css';

declare global {
  interface Window { ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<any>; on?: (event: string, listener: (...args: any[]) => void) => void; removeListener?: (event: string, listener: (...args: any[]) => void) => void } }
}

const app = document.querySelector<HTMLDivElement>('#app')!;
const params = new URLSearchParams(location.search);
const encoded = params.get('draft') || '';
const route: Route = parseRoute(location.pathname, location.search);
const configuredAddress = String(import.meta.env.VITE_MARGIN_CONTRACT_ADDRESS || '').trim();
let draft: ClaimDraft | null = null;
try { if (encoded) draft = decodeDraft(encoded); } catch {}

let account: `0x${string}` | null = null;
const contractAddress = configuredAddress;
let draftVerified = false;
let contractVerified = false;
let draftError = '';
let contractError = '';
let transactions: PendingTransaction[] = [];
let chainCorrect = false;
let statusMessage = '';
let listenersBound = false;
let assuredClaim: AssuredClaimView | null = null;
let assuredError = '';
let consumerExecuted: boolean | null = null;
let protectedReleases: ProtectedReleaseView[] = [];
let selectedReleaseId = '';
let consumerError = '';
let protectedReleaseOffset = 0;
let protectedReleaseHasMore = false;
let directClaim: MarginClaim | null = null;
let decisionHistory: DecisionHistoryEntry[] = [];

function esc(v: string) { return v.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!)); }
function validAddress(v: string): v is `0x${string}` { return /^0x[0-9a-fA-F]{40}$/.test(v); }

function explorerUrl(txId: string) { return `https://explorer-studio.genlayer.com/tx/${encodeURIComponent(txId)}`; }
function shortTx(txId: string) { return `${txId.slice(0, 10)}…${txId.slice(-8)}`; }
function isConnected() { return Boolean(account && chainCorrect); }
function txLink(txId: string) { return `<a href="${explorerUrl(txId)}" target="_blank" rel="noreferrer">${esc(shortTx(txId))} · View on Explorer ↗</a>`; }
function txLabel(label: PendingTransaction['label']) { return label === 'Submission' ? 'Challenge submission' : 'Resolution'; }
function transactionCards() {
  return transactions.map((tx) => {
    const state = tx.state === 'finalized' ? 'Finalized ✓' : tx.state === 'failed' ? 'Execution failed' : tx.state === 'tracking-interrupted' ? 'Tracking interrupted' : 'Waiting for finalization…';
    const resume = tx.state === 'submitted' || tx.state === 'tracking-interrupted' ? `<br><button class="dark" data-resume="${esc(tx.id)}">Resume tracking</button>` : '';
    return `<div class="tx-row"><strong>${esc(txLabel(tx.label))}</strong><span>${esc(state)}</span><div>${txLink(tx.id)}</div>${tx.verdict ? `<div class="meta">Verdict: ${esc(tx.verdict)}</div>` : ''}${resume}</div>`;
  }).join('');
}

function contractLink(address: string) { return `<a href="${MARGIN_EXPLORER_URL}/address/${encodeURIComponent(address)}" target="_blank" rel="noreferrer">View contract in Explorer ↗</a>`; }

function headerHtml() {
  const walletState = walletHeaderState(account, chainCorrect);
  const wallet = walletState.connected ? `<span class="wallet-chip" title="${esc(account!)}">${esc(account!.slice(0, 8))}…${esc(account!.slice(-6))}</span><button id="header-disconnect" class="header-action">Disconnect</button>` : '<button id="header-connect" class="header-action">Connect wallet</button>';
  const networkLabel = walletState.networkActive ? `Studionet · ${MARGIN_CHAIN_ID}` : account ? 'Wallet not on Studionet' : `Studionet · ${MARGIN_CHAIN_ID}`;
  return `<header><a class="brand" href="/"><img src="/assets/margin-logo.svg" alt="MARGIN"><span><span class="wordmark">MARGIN</span><span class="sub">Consensus-backed web claims</span></span></a><nav><a class="nav-item" href="/activity">Activity</a>${wallet}<span class="pill ${walletState.networkActive ? 'ok' : 'warn'}">${networkLabel}</span></nav></header>`;
}

function evidenceRows(claim: MarginClaim) {
  try {
    const urls = JSON.parse(claim.evidence_urls_json || '[]');
    if (Array.isArray(urls) && urls.length) return urls.map((url, index) => `<a class="evidence-row" href="${esc(String(url))}" target="_blank" rel="noreferrer"><strong>${index + 1}</strong><span>${esc(String(url))}</span><span>↗</span></a>`).join('');
  } catch {}
  return '<p class="meta">No supplemental evidence URLs recorded.</p>';
}

function directClaimView() {
  if (!directClaim) return `<section class="empty-state"><h1>Claim unavailable</h1><p>That claim key is malformed, unavailable, or not finalized on Studionet.</p><a class="button dark" href="/">Back to MARGIN</a></section>`;
  const c = directClaim;
  const manifest = c.latest_manifest ? JSON.stringify(c.latest_manifest, null, 2) : '';
  return `<section class="result-card"><div class="eyebrow">Final result</div><div class="result-line"><span class="status-badge ${esc(c.status)}">${esc(c.status)}</span><span class="final-chip">FINALIZED ✓</span><span class="meta">Revision ${esc(String(c.revision))}</span></div><blockquote>${esc(c.quote)}</blockquote><p class="meta">${esc(c.canonical_url)}</p></section><section><div class="eyebrow">Challenge</div><p>${esc(c.challenge_statement)}</p><div class="detail-grid"><span>Claim class</span><strong>${esc(c.claim_class)}</strong><span>Challenger</span><code>${esc(c.challenger)}</code><span>Created</span><span>${esc(c.created_at)}</span><span>Resolved</span><span>${esc(c.resolved_at || 'Not resolved')}</span></div></section><section><div class="eyebrow">Resolution</div><p>${esc(c.rationale || 'No rationale recorded.')}</p></section>${decisionHistoryHtml(decisionHistory)}<section><div class="eyebrow">Evidence</div><div class="evidence-list">${evidenceRows(c)}</div></section><section><div class="eyebrow">Provenance</div><div class="detail-grid"><span>Claim key</span><code>${esc(c.claim_key)}</code><span>Source manifest digest</span><code>${esc(c.source_manifest_digest || 'Not returned')}</code><span>Source-set digest</span><code>${esc(c.source_set_digest || 'Not returned')}</code></div>${manifest ? `<details><summary>Advanced provenance</summary><pre>${esc(manifest)}</pre></details>` : ''}<p class="route-links"><a class="button secondary" href="${esc(c.canonical_url)}" target="_blank" rel="noreferrer">Back to source ↗</a><a class="button secondary" href="/claim/${esc(c.claim_key)}/assurance">View assurance</a><a class="button secondary" href="${MARGIN_EXPLORER_URL}/address/${MARGIN_CONTRACT_ADDRESS}" target="_blank" rel="noreferrer">MARGIN Explorer ↗</a></p></section>`;
}

function activityView() {
  const records: PendingTransaction[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || '';
    if (!key.startsWith('margin.transactions.')) continue;
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(value)) records.push(...value); } catch {}
  }
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || '';
    if (!key.startsWith('margin.assured.transactions.')) continue;
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(value)) records.push(...value as PendingTransaction[]); } catch {}
  }
  return `<section><div class="eyebrow">Local activity</div><h1>Transaction provenance</h1><p class="meta">Stored only in this browser. MARGIN has no activity backend.</p>${records.length ? records.sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt))).map((tx) => `<div class="activity-row"><strong>${esc(tx.label)}</strong><span>${esc(tx.state || 'submitted')}</span><code>${esc(tx.claimKey)}</code><span>${esc(tx.account || 'wallet unavailable')}</span><span>${esc(tx.submittedAt || '')}</span><span>${tx.id ? txLink(tx.id) : ''}</span></div>`).join('') : '<p class="empty-state">No local transactions recorded yet.</p>'}</section>`;
}

function renderNonChallenge(message = '') {
  const body = route.kind === 'home' ? `<section class="hero"><div class="eyebrow">Browser-native protocol workspace</div><h1>Consensus-backed footnotes for the public web.</h1><p>Install or open the MARGIN extension, highlight a public claim, then choose <strong>Challenge with MARGIN</strong>.</p><div class="flow-strip" aria-label="MARGIN flow"><span>Highlight</span><i aria-hidden="true">→</i><span>Challenge</span><i aria-hidden="true">→</i><span>Consensus</span></div></section><details class="deployment-card"><summary><span>Deployment</span><span class="meta">Studionet · ${MARGIN_CHAIN_ID}</span></summary><div class="detail-grid"><span>Network</span><strong>Studionet · ${MARGIN_CHAIN_ID}</strong><span>Contract</span><code>${esc(contractAddress)}</code></div><p>${contractLink(contractAddress)}</p></details>` : route.kind === 'activity' ? activityView() : route.kind === 'claim' ? directClaimView() : route.kind === 'assurance' ? `<section><div class="eyebrow">Assurance</div><h1>Assured Claim</h1><p class="meta">Canonical claim: <code>${esc(route.claimKey)}</code></p>${directClaimView()}</section>${assuredPanel()}` : `<section class="empty-state"><h1>Page not found</h1><a class="button dark" href="/">Back to MARGIN</a></section>`;
  const visibleMessage = /^(Wallet connected to Studionet 61999\.|Wallet is on Studionet 61999\.|Wallet disconnected from MARGIN\.)$/.test(message) ? '' : message;
  app.innerHTML = `<main>${headerHtml()}${visibleMessage ? `<div class="notice">${esc(visibleMessage)}</div>` : ''}${contractError ? `<div class="notice">${esc(contractError)}</div>` : ''}${body}</main>`;
  bind();
}

function assuredPanel() {
  const assuredKey = draft?.claimKey || (route.kind === 'assurance' ? route.claimKey : '');
  if (!assuredKey) return '';
  const actions = assuredActions(assuredClaim, account);
  const state = assuredClaim ? String(assuredClaim.state || 'UNKNOWN') : 'NOT REGISTERED';
  const rows = assuredClaim ? `<div class="assured-grid"><span>Publisher</span><code>${esc(assuredDisplay(assuredClaim.publisher))}</code><span>Challenger</span><code>${esc(assuredDisplay(assuredClaim.challenger))}</code><span>Publisher bond</span><code>${esc(assuredDisplay(assuredClaim.publisher_bond))}</code><span>Challenge bond</span><code>${esc(assuredDisplay(assuredClaim.challenge_bond))}</code><span>Domain proof</span><span>${assuredClaim.domain_proof_url ? `<a href="${esc(assuredClaim.domain_proof_url)}" target="_blank" rel="noreferrer">${esc(assuredClaim.domain_proof_url)} ↗</a>` : '—'}</span><span>Proof expiry</span><code>${esc(assuredDisplay(assuredClaim.proof_expires_at))}</code><span>Proof digest</span><code>${esc(assuredDisplay(assuredClaim.proof_digest))}</code><span>Final status</span><strong>${esc(assuredDisplay(assuredClaim.final_status))}</strong><span>Appeal deadline</span><code>${esc(assuredDisplay(assuredClaim.appeal_deadline))}</code><span>Appeal count</span><code>${esc(assuredDisplay(assuredClaim.appeal_count))}</code><span>Appeal reason</span><span>${esc(assuredDisplay(assuredClaim.appeal_reason))}</span><span>Appeal bond</span><code>${esc(assuredDisplay(assuredClaim.appeal_bond))}</code><span>Publisher credit</span><code>${esc(assuredDisplay(assuredClaim.publisher_credit))}</code><span>Challenger credit</span><code>${esc(assuredDisplay(assuredClaim.challenger_credit))}</code><span>Settled</span><strong>${assuredClaim.settled ? 'Yes' : 'No'}</strong></div>` : '<p class="meta">No Assured Claim is registered for this claim key yet.</p>';
  const action = (name: AssuredAction, label: string) => actions.includes(name) ? `<button class="dark" data-assured-action="${name}">${label}</button>` : '';
  const protectedRelease = protectedReleases.find((release) => release.release_id === selectedReleaseId) || protectedReleases[0] || null;
  const deadline = assuredClaim?.appeal_deadline ? String(assuredClaim.appeal_deadline) : '';
  const deadlineMs = deadline ? Date.parse(deadline) : NaN;
  const appealWindow = Number.isFinite(deadlineMs) ? (Date.now() <= deadlineMs ? `Open until ${new Date(deadlineMs).toLocaleString()}` : `Closed ${new Date(deadlineMs).toLocaleString()}`) : 'No valid appeal deadline returned';
  const releaseEligible = state === 'SETTLED' && String(assuredClaim?.final_status || '').toUpperCase() === 'SUPPORTED';
  const releaseActions = protectedRelease ? `${releaseEligible && !protectedRelease.executed && !protectedRelease.refunded ? '<button class="dark" data-consumer-action="execute">Execute protected release</button>' : ''}${!protectedRelease.executed && !protectedRelease.refunded && (state === 'CANCELLED' || state === 'ABORTED' || (protectedRelease.expiry && Date.parse(protectedRelease.expiry) <= Date.now())) ? '<button class="quiet" data-consumer-action="refund">Refund release</button>' : ''}${(Number(protectedRelease.beneficiary_credit || 0) > 0 || Number(protectedRelease.creator_credit || 0) > 0) ? '<button class="quiet" data-consumer-action="withdraw">Withdraw release credit</button>' : ''}` : '';
  const releaseList = protectedReleases.length ? `<div class="release-list"><div class="eyebrow">Protected releases (${protectedReleases.length}${protectedReleaseHasMore ? '+' : ''})</div>${protectedReleases.map((release) => `<button class="quiet release-picker ${release.release_id === protectedRelease?.release_id ? 'selected' : ''}" data-select-release="${esc(String(release.release_id))}">${esc(String(release.release_id))} · ${release.executed ? 'Executed' : release.refunded ? 'Refunded' : 'Open'} · ${esc(assuredDisplay(release.amount))}</button>`).join('')}${protectedReleaseHasMore ? '<button class="quiet" id="load-more-releases">Load more releases</button>' : ''}</div>` : '<p class="meta">No protected release exists for this claim.</p>';
  const releaseRows = protectedRelease ? `<div class="detail-grid"><span>Selected release</span><code>${esc(assuredDisplay(protectedRelease.release_id))}</code><span>Creator</span><code>${esc(assuredDisplay(protectedRelease.creator))}</code><span>Beneficiary</span><code>${esc(assuredDisplay(protectedRelease.beneficiary))}</code><span>Amount</span><code>${esc(assuredDisplay(protectedRelease.amount))}</code><span>Expiry</span><span>${esc(assuredDisplay(protectedRelease.expiry))}</span><span>Executed</span><strong>${protectedRelease.executed ? 'Yes' : 'No'}</strong><span>Refunded</span><strong>${protectedRelease.refunded ? 'Yes' : 'No'}</strong><span>Beneficiary credit</span><code>${esc(assuredDisplay(protectedRelease.beneficiary_credit))}</code><span>Creator credit</span><code>${esc(assuredDisplay(protectedRelease.creator_credit))}</code></div>` : '';
  const canCreateRelease = ['REGISTERED', 'CHALLENGED', 'RESOLVED', 'APPEALED'].includes(state);
  const releaseCreate = canCreateRelease ? '<label for="release-beneficiary">Protected release beneficiary</label><input id="release-beneficiary" placeholder="0x…"><label for="release-amount">GEN amount (smallest units)</label><input id="release-amount" inputmode="numeric" placeholder="1000000000000000000"><label for="release-expiry">Release expiry (ISO datetime)</label><input id="release-expiry" placeholder="2026-10-01T00:00:00+00:00"><button class="dark" data-consumer-action="create">Create protected release</button>' : '';
  return `<section><div class="eyebrow">Assured Claim</div><div class="row"><strong>${esc(state)}</strong><span class="meta">Optional bonded lifecycle</span></div>${rows}${state === 'NOT REGISTERED' ? '<label for="proof-url">HTTPS domain proof URL</label><input id="proof-url" value="" placeholder="https://example.com/.well-known/margin.json"><label for="proof-nonce">Proof nonce</label><input id="proof-nonce" value="" placeholder="Publisher nonce"><label for="proof-expiry">Proof expiry (ISO datetime)</label><input id="proof-expiry" value="" placeholder="2026-10-01T00:00:00+00:00">' : ''}${assuredClaim ? `<p class="meta">Appeal window: ${esc(appealWindow)}</p>` : ''}<label for="appeal-reason">Appeal reason</label><textarea id="appeal-reason" maxlength="800" placeholder="Bounded new evidence or adjudication issue"></textarea><div class="row assured-actions">${action('register','Register Assured Claim')}${action('challenge','Challenge Assured Claim')}${action('resolve','Resolve Assured Claim')}${action('cancel','Cancel Assured Claim')}${action('abort','Abort stalled lifecycle')}${action('appeal','Appeal Assured Claim')}${action('resolveAppeal','Resolve Assured Appeal')}${action('settle','Settle Assured Claim')}${action('withdraw','Withdraw Assured Credit')}</div><p class="meta">${assuredError ? esc(assuredError) : 'Bonds, deadlines and credits are read from the canonical MARGIN contract.'}</p><p class="meta">${contractLink(contractAddress)}</p><div class="consumer-proof"><div class="eyebrow">Downstream use</div><p class="meta">Bound reference consumer: ${esc(MARGIN_CONSUMER_ADDRESS)}</p><p>The consumer permits protected execution only for a SETTLED + SUPPORTED Assured Claim.</p><p>${releaseEligible ? 'Eligible ✓' : 'Not eligible until the claim is SETTLED + SUPPORTED'} · ${consumerExecuted === true ? 'Legacy execution: Yes ✓' : consumerExecuted === false ? 'Legacy execution: No' : 'Legacy execution: not read'}</p>${releaseList}${releaseRows}${releaseCreate}${releaseActions}${consumerError ? `<p class="bad">${esc(consumerError)}</p>` : ''}<button id="refresh-assured" class="quiet">Refresh Assured state</button></div></section>`;
}

function render(message = '') {
  if (route.kind !== 'challenge') { renderNonChallenge(message); return; }
  const ready = draftVerified && contractVerified && isConnected();
  const visibleMessage = /^(Wallet connected to Studionet 61999\.|Wallet is on Studionet 61999\.|Wallet disconnected from MARGIN\.)$/.test(message) ? '' : message;
  app.innerHTML = `<main>${headerHtml()}${visibleMessage ? `<div class="notice">${esc(visibleMessage)}</div>` : ''}${contractError ? `<div class="notice">${esc(contractError)}</div>` : ''}${draftError ? `<div class="notice">${esc(draftError)}</div>` : ''}<details class="deployment-card"><summary><span>Deployment</span><span class="meta">${contractVerified ? 'Verified ✓' : 'Verifying…'} · Studionet · ${MARGIN_CHAIN_ID}</span></summary><div class="row"><strong>Contract</strong><span class="hash">${validAddress(contractAddress) ? `${esc(contractAddress.slice(0,8))}…${esc(contractAddress.slice(-6))}` : 'missing configuration'}</span></div><small>Studionet · ${MARGIN_CHAIN_ID} · ${MARGIN_RPC_URL}</small></details>${draft ? `<section><div class="eyebrow">Highlighted claim</div><blockquote>${esc(draft.anchor.exact)}</blockquote><div class="meta">${esc(draft.claimClass)} · ${esc(draft.canonicalUrl)}</div><h3>Challenge</h3><p>${esc(draft.challengeStatement)}</p><div class="eyebrow">Public evidence</div><p>${draft.evidenceUrls.length ? draft.evidenceUrls.map((url) => esc(url)).join('<br>') : 'No additional evidence URLs supplied.'}</p>${draft.archiveUrl ? `<div class="eyebrow">Archive</div><p>${esc(draft.archiveUrl)}</p>` : ''}<div class="eyebrow">Claim key</div><div class="hash">${esc(draft.claimKey)}</div></section>` : `<section><h3>No challenge draft</h3><p>Start from the MARGIN extension by highlighting a public claim.</p></section>`}${assuredPanel()}<section><div class="row">${draft ? `<button id="submit" class="accent" ${ready ? '' : 'disabled'}>Submit challenge</button><button id="resolve" ${ready ? '' : 'disabled'}>Resolve</button>` : ''}</div><div id="status">${statusMessage}</div></section>${transactions.length ? `<section><div class="eyebrow">Transaction provenance</div>${transactionCards()}</section>` : ''}</main>`;
  bind();
}

function setStatus(html: string) { statusMessage = html; const el = document.querySelector<HTMLDivElement>('#status'); if (el) el.innerHTML = html; }


async function verifyDraft(): Promise<void> {
  if (!draft) return;
  try {
    if (canonicalizeUrl(draft.canonicalUrl) !== draft.canonicalUrl) throw new Error('Draft canonical URL is not canonical.');
    if (draft.evidenceUrls.length > 3) throw new Error('Draft contains too many evidence URLs.');
    if (new Set(draft.evidenceUrls).size !== draft.evidenceUrls.length) throw new Error('Draft contains duplicate evidence URLs.');
    for (const url of draft.evidenceUrls) if (canonicalizeUrl(url) !== url) throw new Error('Draft evidence URL is not canonical.');
    if (draft.archiveUrl && canonicalizeUrl(draft.archiveUrl) !== draft.archiveUrl) throw new Error('Draft archive URL is not canonical.');
    const expectedPageKey = await pageKeyFor(draft.canonicalUrl);
    if (expectedPageKey !== draft.pageKey.toLowerCase()) throw new Error('Draft page key does not match its URL.');
    const { claimKey: _ignored, ...withoutKey } = draft;
    const expectedClaimKey = await claimKeyFor(withoutKey);
    if (expectedClaimKey !== draft.claimKey.toLowerCase()) throw new Error('Draft claim key does not match its payload.');
    draftVerified = true;
    draftError = '';
  } catch (error) {
    draftVerified = false;
    draftError = `Draft integrity check failed: ${String((error as Error).message || error)}`;
  }
}

async function verifyContractTarget(address: `0x${string}`): Promise<void> {
  const readClient = createClient({ chain: studionet });
  const network = await readClient.readContract({
    address, functionName: 'network', args: [],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  }) as any;
  if (Number(network?.chain_id) !== MARGIN_CHAIN_ID || String(network?.network) !== MARGIN_NETWORK_NAME || String(network?.rpc || '') !== MARGIN_RPC_URL) {
    throw new Error('Configured contract did not identify itself as the MARGIN Studionet contract.');
  }
}

async function updateChainState(): Promise<boolean> {
  if (!window.ethereum) { chainCorrect = false; return false; }
  const chainHex = await window.ethereum.request({ method: 'eth_chainId' });
  chainCorrect = isStudionetChainHex(chainHex);
  return chainCorrect;
}

async function connect(explicit = true) {
  if (!window.ethereum) throw new Error('No injected EIP-1193 wallet found in this browser tab.');
  if (explicit) localStorage.removeItem(disconnectStorageKey());
  const accounts = await window.ethereum.request({ method: accountRequestMethod(explicit) });
  account = accountFromProvider(accounts);
  if (!account) { chainCorrect = false; render(); return false; }
  const onCorrectChain = await updateChainState();
  if (explicit && !onCorrectChain) {
    await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{
      chainId: `0x${MARGIN_CHAIN_ID.toString(16)}`,
      chainName: 'GenLayer Studionet',
      nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
      rpcUrls: [MARGIN_RPC_URL],
      blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
    }] });
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${MARGIN_CHAIN_ID.toString(16)}` }] });
    await updateChainState();
  }
  render(chainCorrect ? 'Wallet connected to Studionet 61999.' : 'Wallet connected, but switch to Studionet 61999 before writing.');
  void resumeAssuredTransactions();
  return chainCorrect;
}

function disconnect() {
  localStorage.setItem(disconnectStorageKey(), '1');
  account = null;
  chainCorrect = false;
  statusMessage = '';
  render('Wallet disconnected from MARGIN.');
}

function bindProviderListeners() {
  if (listenersBound || !window.ethereum?.on) return;
  listenersBound = true;
  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    account = accountFromProvider(accounts);
    void updateChainState().finally(() => render(account ? 'Wallet account changed.' : 'Wallet disconnected.'));
  });
  window.ethereum.on('chainChanged', (chainHex: string) => {
    chainCorrect = isStudionetChainHex(chainHex);
    render(chainCorrect ? 'Wallet is on Studionet 61999.' : 'Wallet left Studionet 61999. Writes are disabled.');
  });
  window.ethereum.on('disconnect', () => {
    account = null;
    chainCorrect = false;
    statusMessage = '';
    render('Wallet provider disconnected. Connect again before writing.');
  });
}

async function walletClient() {
  if (!account) await connect(true);
  if (!account || !window.ethereum) throw new Error('Wallet is not connected.');
  if (!(await updateChainState())) throw new Error('Wallet must be on Studionet 61999 before writing.');
  return createProviderBackedClient(account, window.ethereum);
}

async function waitForFinalizedSuccess(client: any, txId: string, label: string) {
  const tx = await client.waitForTransactionReceipt({
    hash: txId,
    status: 'FINALIZED',
    fullTransaction: true,
  });
  if (!isSuccessfulFinalizedReceipt(tx)) {
    throw new Error(`${label} failed: ${tx.statusName || tx.status} / ${executionSummary(tx)}`);
  }
  return tx;
}

function persistTransactions() {
  if (draft) localStorage.setItem(transactionsStorageKey(draft.claimKey), JSON.stringify(transactions));
}

function saveTransaction(label: PendingTransaction['label'], txId: string) {
  const tx: PendingTransaction = { id: txId, label, claimKey: draft!.claimKey, state: 'submitted', account: account || undefined, submittedAt: new Date().toISOString(), contractAddress, network: 'studionet' };
  transactions = [...transactions.filter((item) => item.label !== label), tx];
  persistTransactions();
  render();
  return tx;
}

function updateTransaction(txId: string, patch: Partial<PendingTransaction>) {
  transactions = transactions.map((item) => item.id === txId ? { ...item, ...patch } : item);
  persistTransactions();
  render();
}

async function trackTransaction(tracked: PendingTransaction): Promise<any | null> {
  if (!pendingAccountMatches(tracked.account, account)) {
    updateTransaction(tracked.id, { state: 'tracking-interrupted' });
    setStatus(`<div class="bad">Switch back to the submitting wallet account to resume tracking.<br>${txLink(tracked.id)}</div>`);
    return null;
  }
  if (!account || !chainCorrect) {
    setStatus(`<div class="bad">Connect the wallet on Studionet 61999 to resume tracking.<br>${txLink(tracked.id)}</div>`);
    return null;
  }
  let client: any;
  try {
    client = await walletClient();
  } catch {
    updateTransaction(tracked.id, { state: 'tracking-interrupted' });
    setStatus(`<div class="bad">${esc(trackingFailureMessage(tracked.label, tracked.id))}<br>${txLink(tracked.id)}</div>`);
    return null;
  }
  setStatus(`<div class="pending">Waiting for ${esc(tracked.label.toLowerCase())} finalization…<br>${txLink(tracked.id)}</div>`);
  try {
    const receipt = await waitForFinalizedSuccess(client, tracked.id, tracked.label);
    updateTransaction(tracked.id, { state: 'finalized' });
    return receipt;
  } catch (error) {
    const message = String((error as Error).message || error);
    if (message.includes(' failed:')) {
      updateTransaction(tracked.id, { state: 'failed' });
      throw error;
    }
    updateTransaction(tracked.id, { state: 'tracking-interrupted' });
    setStatus(`<div class="bad">${esc(trackingFailureMessage(tracked.label, tracked.id))}<br>${txLink(tracked.id)}</div>`);
    return null;
  }
}

async function resumeTransaction(txId: string) {
  const tracked = transactions.find((item) => item.id === txId);
  if (!tracked) return;
  const receipt = await trackTransaction(tracked);
  if (!receipt || !draft) return;
  if (tracked.label === 'Resolution') {
    const readClient = createClient({ chain: studionet });
    const resolved = await readClient.readContract({ address: contractAddress as `0x${string}`, functionName: 'get_claim', args: [draft.claimKey], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }) as unknown as MarginClaim;
    updateTransaction(txId, { verdict: String(resolved.status) });
    setStatus(`<div class="ok"><strong>Resolution finalized ✓</strong><br>${esc(String(resolved.status))}<br>${txLink(txId)}</div>`);
  } else {
    setStatus(`<div class="ok"><strong>Challenge finalized ✓</strong><br>${txLink(txId)}</div>`);
  }
}

async function submitClaim() {
  if (!draft) throw new Error('Missing challenge draft.');
  if (!draftVerified) throw new Error(draftError || 'Draft integrity has not been verified.');
  if (!contractVerified || !validAddress(contractAddress)) throw new Error('The canonical MARGIN deployment is not verified.');
  await verifyContractTarget(contractAddress);
  const client = await walletClient();
  const call = {
    address: contractAddress,
    functionName: 'submit_claim',
    args: [
      draft.claimKey, draft.pageKey, draft.canonicalUrl, draft.anchor.exact, draft.anchor.prefix, draft.anchor.suffix,
      draft.pageDigest, draft.claimClass, draft.challengeStatement, JSON.stringify(draft.evidenceUrls), draft.archiveUrl,
    ],
  } as const;
  setStatus('<div class="pending">Confirm the transaction in your wallet…</div>');
  const txId = await client.writeContract({ ...call, value: 0n } as any);
  const tracked = saveTransaction('Submission', txId);
  const receipt = await trackTransaction(tracked);
  if (receipt) setStatus(`<div class="ok"><strong>Challenge finalized ✓</strong><br>${txLink(txId)}</div>`);
}

async function resolveClaim() {
  if (!draft) throw new Error('Missing challenge draft.');
  if (!draftVerified) throw new Error(draftError || 'Draft integrity has not been verified.');
  if (!contractVerified || !validAddress(contractAddress)) throw new Error('The canonical MARGIN deployment is not verified.');
  await verifyContractTarget(contractAddress);
  const readClient = createClient({ chain: studionet });
  const existing = await readClient.readContract({ address: contractAddress, functionName: 'get_claim', args: [draft.claimKey], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }) as unknown as MarginClaim;
  if (!existing || !(existing as any).claim_key) throw new Error('Submit the claim before resolving it.');
  const client = await walletClient();
  const call = { address: contractAddress, functionName: 'resolve_claim', args: [draft.claimKey] } as const;
  setStatus('<div class="pending">Confirm resolution transaction…</div>');
  const txId = await client.writeContract({ ...call, value: 0n } as any);
  const tracked = saveTransaction('Resolution', txId);
  const receipt = await trackTransaction(tracked);
  if (!receipt) return;
  const resolved = await readClient.readContract({ address: contractAddress, functionName: 'get_claim', args: [draft.claimKey], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }) as unknown as MarginClaim;
  updateTransaction(txId, { verdict: String(resolved.status) });
  setStatus(`<div class="ok"><strong>Resolution finalized ✓</strong><br>${esc(String(resolved.status))}<br>${esc(String(resolved.rationale || ''))}<br>${txLink(txId)}</div>`);
}

async function readAssuredState(redraw = true) {
  const assuredKey = draft?.claimKey || (route.kind === 'assurance' ? route.claimKey : '');
  if (!assuredKey || !validAddress(contractAddress) || !contractVerified) return;
  try {
    const readClient = createClient({ chain: studionet });
    const value = await readClient.readContract({ address: contractAddress, functionName: 'get_assured_claim', args: [assuredKey], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }) as AssuredClaimView;
    assuredClaim = value && Object.keys(value as object).length ? value : null;
    consumerExecuted = null;
    protectedReleases = [];
    selectedReleaseId = '';
    protectedReleaseOffset = 0;
    protectedReleaseHasMore = false;
    if (assuredClaim && String(assuredClaim.state).toUpperCase() === 'SETTLED' && String(assuredClaim.final_status).toUpperCase() === 'SUPPORTED') {
      consumerExecuted = Boolean(await readClient.readContract({ address: MARGIN_CONSUMER_ADDRESS, functionName: 'has_executed', args: [assuredKey], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }));
    }
    try {
      const [claimPage, creatorPage] = await Promise.all([
        readClient.readContract({ address: MARGIN_CONSUMER_ADDRESS, functionName: 'get_releases_for_claim_page', args: [assuredKey, 0, 25], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }) as Promise<ProtectedReleaseView[]>,
        account ? readClient.readContract({ address: MARGIN_CONSUMER_ADDRESS, functionName: 'get_releases_for_creator_claim', args: [assuredKey, account, 0, 25], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }) as Promise<ProtectedReleaseView[]> : Promise.resolve([]),
      ]);
      const releases = Array.isArray(claimPage) ? claimPage : [];
      protectedReleaseOffset = releases.length;
      protectedReleaseHasMore = releases.length === 25;
      protectedReleases = mergeProtectedReleases([], [...releases, ...(Array.isArray(creatorPage) ? creatorPage : [])], account);
      if (protectedReleases.length) selectedReleaseId = protectedReleases.some((release) => release.release_id === selectedReleaseId) ? selectedReleaseId : String(protectedReleases[0].release_id || '');
    } catch { protectedReleases = []; selectedReleaseId = ''; protectedReleaseOffset = 0; protectedReleaseHasMore = false; }
    assuredError = '';
  } catch (error) {
    assuredError = `Assured state read unavailable: ${String((error as Error).message || error)}`;
  }
  if (redraw) render();
}

async function loadMoreReleases() {
  const assuredKey = draft?.claimKey || (route.kind === 'assurance' ? route.claimKey : '');
  if (!assuredKey || !protectedReleaseHasMore) return;
  const readClient = createClient({ chain: studionet });
  const page = await readClient.readContract({ address: MARGIN_CONSUMER_ADDRESS, functionName: 'get_releases_for_claim_page', args: [assuredKey, protectedReleaseOffset, 25], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }) as ProtectedReleaseView[];
  const incoming = Array.isArray(page) ? page.filter((release) => release && Object.keys(release).length) : [];
  protectedReleases = mergeProtectedReleases(protectedReleases, incoming, account);
  protectedReleaseOffset += incoming.length;
  protectedReleaseHasMore = incoming.length === 25;
  render();
}

async function loadRouteData() {
  if ((route.kind !== 'claim' && route.kind !== 'assurance') || !contractVerified) return;
  const claimKey = route.claimKey;
  try {
    const readClient = createClient({ chain: studionet });
    directClaim = await readClient.readContract({ address: contractAddress as `0x${string}`, functionName: 'get_claim', args: [claimKey], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }) as unknown as MarginClaim;
    if (!directClaim || directClaim.claim_key?.toLowerCase() !== claimKey) directClaim = null;
    decisionHistory = directClaim ? await readClient.readContract({ address: contractAddress as `0x${string}`, functionName: 'get_decision_history', args: [claimKey], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }) as DecisionHistoryEntry[] : [];
  } catch {
    directClaim = null;
    decisionHistory = [];
  }
  if (route.kind === 'assurance') await readAssuredState(false);
}

async function runAssuredAction(action: AssuredAction) {
  const assuredKey = draft?.claimKey || (route.kind === 'assurance' ? route.claimKey : '');
  if (!assuredKey) throw new Error('Missing claim key.');
  if (!isConnected()) throw new Error('Connect the wallet on Studionet 61999 first.');
  if (!assuredActions(assuredClaim, account).includes(action)) throw new Error('This Assured Claim action is not valid for the current state or wallet.');
  const client = await walletClient();
  const proofUrl = (document.querySelector<HTMLInputElement>('#proof-url')?.value || '').trim();
  const proofNonce = (document.querySelector<HTMLInputElement>('#proof-nonce')?.value || '').trim();
  const proofExpiry = (document.querySelector<HTMLInputElement>('#proof-expiry')?.value || '').trim();
  const appealReason = (document.querySelector<HTMLTextAreaElement>('#appeal-reason')?.value || '').trim();
  if (action === 'register' && (!proofUrl || !proofNonce || !proofExpiry)) throw new Error('Provide the HTTPS domain proof URL, nonce and expiry.');
  if (action === 'register' && !/^https:\/\//i.test(proofUrl)) throw new Error('Domain proof must use HTTPS.');
  if (action === 'register' && !Number.isFinite(Date.parse(proofExpiry))) throw new Error('Proof expiry must be a valid ISO datetime.');
  if (action === 'appeal' && appealReason.length < 12) throw new Error('Provide a precise bounded appeal reason.');
  const definitions: Record<AssuredAction, { functionName: string; args: unknown[]; value: bigint }> = {
    register: { functionName: 'register_assured_claim', args: [assuredKey, proofUrl, proofNonce, proofExpiry], value: 1n },
    challenge: { functionName: 'challenge_assured_claim', args: [assuredKey], value: 1n },
    resolve: { functionName: 'resolve_assured_claim', args: [assuredKey], value: 0n },
    appeal: { functionName: 'appeal_assured_claim', args: [assuredKey, appealReason], value: 1n },
    resolveAppeal: { functionName: 'resolve_assured_appeal', args: [assuredKey], value: 0n },
    settle: { functionName: 'settle_assured_claim', args: [assuredKey], value: 0n },
    withdraw: { functionName: 'withdraw_assured_credit', args: [assuredKey], value: 0n },
    cancel: { functionName: 'cancel_assured_claim', args: [assuredKey], value: 0n },
    abort: { functionName: 'abort_stalled', args: [assuredKey], value: 0n },
  };
  const definition = definitions[action];
  setStatus('<div class="pending">Confirm the Assured Claim transaction in your wallet…</div>');
  const txId = await client.writeContract({ address: contractAddress, functionName: definition.functionName, args: definition.args, value: definition.value } as any);
  const activityKey = `margin.assured.transactions.${assuredKey}`;
  const activity = JSON.parse(localStorage.getItem(activityKey) || '[]') as Array<Record<string, unknown>>;
  activity.push({ id: txId, label: definition.functionName, claimKey: assuredKey, state: 'submitted', account, submittedAt: new Date().toISOString(), contractAddress, network: 'studionet' });
  localStorage.setItem(activityKey, JSON.stringify(activity));
  setStatus(`<div class="pending">${esc(definition.functionName)} submitted. Waiting for finalization…<br>${txLink(txId)}</div>`);
  try {
    await waitForFinalizedSuccess(client, txId, definition.functionName);
    activity[activity.length - 1].state = 'finalized';
  } catch (error) {
    const text = String((error as Error).message || error);
    activity[activity.length - 1].state = text.includes(' failed:') ? 'failed' : 'tracking-interrupted';
    localStorage.setItem(activityKey, JSON.stringify(activity));
    throw error;
  }
  localStorage.setItem(activityKey, JSON.stringify(activity));
  setStatus(`<div class="ok"><strong>${esc(definition.functionName)} finalized ✓</strong><br>${txLink(txId)}</div>`);
  await readAssuredState(false);
  render();
}

async function runConsumerAction(action: 'create' | 'execute' | 'refund' | 'withdraw', releaseId = '') {
  const assuredKey = draft?.claimKey || (route.kind === 'assurance' ? route.claimKey : '');
  if (!assuredKey) throw new Error('Missing claim key.');
  if (!isConnected()) throw new Error('Connect the wallet on Studionet 61999 first.');
  const client = await walletClient();
  const beneficiary = (document.querySelector<HTMLInputElement>('#release-beneficiary')?.value || '').trim();
  const amount = (document.querySelector<HTMLInputElement>('#release-amount')?.value || '').trim();
  const expiry = (document.querySelector<HTMLInputElement>('#release-expiry')?.value || '').trim();
  if (action === 'create') {
    if (!validAddress(beneficiary)) throw new Error('Enter a valid beneficiary address.');
    if (!amount || !/^\d+$/.test(amount) || BigInt(amount) <= 0n) throw new Error('Enter a positive GEN amount in smallest units.');
    if (!Number.isFinite(Date.parse(expiry))) throw new Error('Release expiry must be a valid ISO datetime.');
  }
  const selectedRelease = protectedReleases.find((release) => release.release_id === releaseId) || protectedReleases.find((release) => release.release_id === selectedReleaseId) || protectedReleases[0];
  if ((action === 'execute' || action === 'refund' || action === 'withdraw') && !selectedRelease?.release_id) throw new Error('No protected release is available.');
  const definition = action === 'create'
    ? { functionName: 'create_protected_release', args: [assuredKey, beneficiary, expiry], value: BigInt(amount) }
    : action === 'execute'
      ? { functionName: 'execute_release', args: [selectedRelease!.release_id], value: 0n }
      : action === 'refund'
        ? { functionName: 'refund_release', args: [selectedRelease!.release_id], value: 0n }
        : { functionName: 'withdraw_release_credit', args: [selectedRelease!.release_id], value: 0n };
  setStatus('<div class="pending">Confirm the downstream consumer transaction in your wallet…</div>');
  const txId = await client.writeContract({ address: MARGIN_CONSUMER_ADDRESS, functionName: definition.functionName, args: definition.args, value: definition.value } as any);
  const activityKey = `margin.assured.transactions.${assuredKey}`;
  const activity = JSON.parse(localStorage.getItem(activityKey) || '[]') as Array<Record<string, unknown>>;
  activity.push({ id: txId, label: definition.functionName, claimKey: assuredKey, state: 'submitted', account, submittedAt: new Date().toISOString(), contractAddress: MARGIN_CONTRACT_ADDRESS, network: 'studionet' });
  localStorage.setItem(activityKey, JSON.stringify(activity));
  setStatus(`<div class="pending">${esc(definition.functionName)} submitted. Waiting for finalization…<br>${txLink(txId)}</div>`);
  try {
    await waitForFinalizedSuccess(client, txId, definition.functionName);
    activity[activity.length - 1].state = 'finalized';
  } catch (error) {
    const text = String((error as Error).message || error);
    activity[activity.length - 1].state = text.includes(' failed:') ? 'failed' : 'tracking-interrupted';
    localStorage.setItem(activityKey, JSON.stringify(activity));
    throw error;
  }
  localStorage.setItem(activityKey, JSON.stringify(activity));
  await readAssuredState(false);
  setStatus(`<div class="ok"><strong>${esc(definition.functionName)} finalized ✓</strong><br>${txLink(txId)}</div>`);
  render();
}

type AssuredTransactionRecord = PendingTransaction & { functionName?: string };

function assuredTransactionRecords(): Array<{ key: string; records: AssuredTransactionRecord[] }> {
  const result: Array<{ key: string; records: AssuredTransactionRecord[] }> = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || '';
    if (!key.startsWith('margin.assured.transactions.')) continue;
    try {
      const records = JSON.parse(localStorage.getItem(key) || '[]') as AssuredTransactionRecord[];
      if (Array.isArray(records)) result.push({ key, records });
    } catch { /* malformed local journal is not protocol state */ }
  }
  return result;
}

async function resumeAssuredTransactions() {
  if (!account || !chainCorrect) return;
  for (const group of assuredTransactionRecords()) {
    let changed = false;
    for (const record of group.records) {
      if (!record.id || !['submitted', 'tracking-interrupted'].includes(String(record.state))) continue;
      if (!pendingAccountMatches(record.account, account)) continue;
      try {
        const client = await walletClient();
        setStatus(`<div class="pending">Resuming ${esc(record.label)} finalization…<br>${txLink(record.id)}</div>`);
        await waitForFinalizedSuccess(client, record.id, record.label);
        record.state = 'finalized';
      } catch (error) {
        const text = String((error as Error).message || error);
        record.state = text.includes(' failed:') ? 'failed' : 'tracking-interrupted';
      }
      changed = true;
    }
    if (changed) localStorage.setItem(group.key, JSON.stringify(group.records));
  }
}

function bind() {
  document.querySelector('#header-connect')?.addEventListener('click', () => connect(true).catch(e => render(String(e.message || e))));
  document.querySelector('#header-disconnect')?.addEventListener('click', disconnect);
  document.querySelector('#connect')?.addEventListener('click', () => connect(true).catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`)));
  document.querySelector('#disconnect')?.addEventListener('click', disconnect);
  document.querySelector('#submit')?.addEventListener('click', () => submitClaim().catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`)));
  document.querySelector('#resolve')?.addEventListener('click', () => resolveClaim().catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`)));
  document.querySelector('#refresh-assured')?.addEventListener('click', () => readAssuredState().catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`)));
  document.querySelectorAll<HTMLElement>('[data-assured-action]').forEach((button) => button.addEventListener('click', () => runAssuredAction(button.dataset.assuredAction as AssuredAction).catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`))));
  document.querySelectorAll<HTMLElement>('[data-select-release]').forEach((button) => button.addEventListener('click', () => { selectedReleaseId = button.dataset.selectRelease || ''; render(); }));
  document.querySelector('#load-more-releases')?.addEventListener('click', () => loadMoreReleases().catch(e => { consumerError = consumerErrorMessage(e); render(); }));
  document.querySelectorAll<HTMLElement>('[data-consumer-action]').forEach((button) => button.addEventListener('click', () => runConsumerAction(button.dataset.consumerAction as 'create' | 'execute' | 'refund' | 'withdraw', button.dataset.releaseId || '').catch(e => { consumerError = consumerErrorMessage(e); setStatus(`<div class="bad">${esc(consumerError)}</div>`); })));
  document.querySelectorAll<HTMLElement>('[data-resume]').forEach((button) => button.addEventListener('click', () => resumeTransaction(button.dataset.resume!).catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`))));
}

async function initialize() {
  if (!validAddress(contractAddress)) {
    contractError = 'Signer deployment is missing VITE_MARGIN_CONTRACT_ADDRESS; writes are disabled.';
  } else {
    try { await verifyContractTarget(contractAddress); contractVerified = true; }
    catch (error) { contractError = `Canonical deployment verification failed: ${String((error as Error).message || error)}`; }
  }
  await verifyDraft();
  if (draft) {
    try {
      const stored = localStorage.getItem(transactionsStorageKey(draft.claimKey));
      if (stored) transactions = JSON.parse(stored) as PendingTransaction[];
    } catch { transactions = []; }
  }
  await loadRouteData();
  await readAssuredState(false);
  bindProviderListeners();
  if (window.ethereum && shouldAutoRestore(localStorage.getItem(disconnectStorageKey()))) {
    try { await connect(false); } catch { chainCorrect = false; }
  } else {
    await updateChainState().catch(() => undefined);
    render();
  }
  for (const tx of transactions.filter((item) => item.state === 'submitted' || item.state === 'tracking-interrupted')) {
    void resumeTransaction(tx.id);
  }
  void resumeAssuredTransactions();
}
void initialize();

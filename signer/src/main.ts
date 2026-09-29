import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { canonicalizeUrl, claimKeyFor, decodeDraft, MARGIN_CHAIN_ID, MARGIN_CONSUMER_ADDRESS, MARGIN_EXPLORER_URL, MARGIN_NETWORK_NAME, MARGIN_RPC_URL, pageKeyFor, type ClaimDraft, type MarginClaim } from '../../shared/protocol';
import { disconnectStorageKey, executionSummary, isSuccessfulFinalizedReceipt, pendingAccountMatches, trackingFailureMessage, transactionsStorageKey, type PendingTransaction } from './transaction';
import { createProviderBackedClient } from './wallet';
import { accountFromProvider, accountRequestMethod, isStudionetChainHex, shouldAutoRestore } from './session';
import { assuredActions, assuredDisplay, type AssuredClaimView, type AssuredAction } from './assured';
import './style.css';

declare global {
  interface Window { ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<any>; on?: (event: string, listener: (...args: any[]) => void) => void; removeListener?: (event: string, listener: (...args: any[]) => void) => void } }
}

const app = document.querySelector<HTMLDivElement>('#app')!;
const params = new URLSearchParams(location.search);
const encoded = params.get('draft') || '';
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

function assuredPanel() {
  if (!draft) return '';
  const actions = assuredActions(assuredClaim, account);
  const state = assuredClaim ? String(assuredClaim.state || 'UNKNOWN') : 'NOT REGISTERED';
  const rows = assuredClaim ? `<div class="assured-grid"><span>Publisher</span><code>${esc(assuredDisplay(assuredClaim.publisher))}</code><span>Challenger</span><code>${esc(assuredDisplay(assuredClaim.challenger))}</code><span>Publisher bond</span><code>${esc(assuredDisplay(assuredClaim.publisher_bond))}</code><span>Challenge bond</span><code>${esc(assuredDisplay(assuredClaim.challenge_bond))}</code><span>Final status</span><strong>${esc(assuredDisplay(assuredClaim.final_status))}</strong><span>Appeal deadline</span><code>${esc(assuredDisplay(assuredClaim.appeal_deadline))}</code><span>Appeal count</span><code>${esc(assuredDisplay(assuredClaim.appeal_count))}</code><span>Publisher credit</span><code>${esc(assuredDisplay(assuredClaim.publisher_credit))}</code><span>Challenger credit</span><code>${esc(assuredDisplay(assuredClaim.challenger_credit))}</code><span>Settled</span><strong>${assuredClaim.settled ? 'Yes' : 'No'}</strong></div>` : '<p class="meta">No Assured Claim is registered for this claim key yet.</p>';
  const action = (name: AssuredAction, label: string) => actions.includes(name) ? `<button class="dark" data-assured-action="${name}">${label}</button>` : '';
  return `<section><div class="eyebrow">Assured Claim</div><div class="row"><strong>${esc(state)}</strong><span class="meta">Optional bonded lifecycle</span></div>${rows}${state === 'NOT REGISTERED' ? '<label for="proof-url">Domain proof URL</label><input id="proof-url" value="" placeholder="https://example.com/.well-known/margin.json"><label for="proof-nonce">Proof nonce</label><input id="proof-nonce" value="" placeholder="Publisher nonce"><label for="proof-expiry">Proof expiry (Unix seconds)</label><input id="proof-expiry" value="" placeholder="e.g. 1790000000">' : ''}<label for="appeal-reason">Appeal reason</label><textarea id="appeal-reason" maxlength="800" placeholder="Bounded new evidence or adjudication issue"></textarea><div class="row assured-actions">${action('register','Register Assured Claim')}${action('challenge','Challenge Assured Claim')}${action('resolve','Resolve Assured Claim')}${action('appeal','Appeal Assured Claim')}${action('resolveAppeal','Resolve Assured Appeal')}${action('settle','Settle Assured Claim')}${action('withdraw','Withdraw Assured Credit')}</div><p class="meta">${assuredError ? esc(assuredError) : 'Bonds, deadlines and credits are read from the canonical MARGIN contract.'}</p><p class="meta">${contractLink(contractAddress)}</p><div class="consumer-proof"><div class="eyebrow">Reference consumer proof</div><p class="meta">Bound consumer: ${esc(MARGIN_CONSUMER_ADDRESS)}</p><p>${consumerExecuted === true ? 'Settled SUPPORTED claim: downstream execution permitted and recorded ✓' : consumerExecuted === false ? 'Downstream execution has not been recorded for this claim.' : 'Consumer read unavailable until this claim is settled SUPPORTED.'}</p><button id="refresh-assured" class="quiet">Refresh Assured state</button></div></section>`;
}

function render(message = '') {
  const ready = draftVerified && contractVerified && isConnected();
  const walletButton = account ? `<span class="hash">${esc(account.slice(0,8)+'…'+account.slice(-6))}</span><button id="disconnect" class="quiet">Disconnect</button>` : '<button id="connect" class="dark">Connect wallet</button>';
  app.innerHTML = `<main><header><div><div class="wordmark">MARGIN</div><div class="sub">wallet signer</div></div><span class="pill">${chainCorrect ? `Studionet · ${MARGIN_CHAIN_ID}` : 'Wallet not on Studionet'}</span></header>${message ? `<div class="notice">${esc(message)}</div>` : ''}${contractError ? `<div class="notice">${esc(contractError)}</div>` : ''}${draftError ? `<div class="notice">${esc(draftError)}</div>` : ''}<section><div class="eyebrow">Deployment</div><div class="row"><strong>Contract</strong><span class="hash">${validAddress(contractAddress) ? `${esc(contractAddress.slice(0,8))}…${esc(contractAddress.slice(-6))}` : 'missing configuration'}</span><span class="meta">${contractVerified ? 'Verified ✓' : 'Verifying…'}</span></div><small>Studionet · ${MARGIN_CHAIN_ID} · ${MARGIN_RPC_URL}</small></section>${draft ? `<section><div class="eyebrow">Highlighted claim</div><blockquote>${esc(draft.anchor.exact)}</blockquote><div class="meta">${esc(draft.claimClass)} · ${esc(draft.canonicalUrl)}</div><h3>Challenge</h3><p>${esc(draft.challengeStatement)}</p><div class="eyebrow">Public evidence</div><p>${draft.evidenceUrls.length ? draft.evidenceUrls.map((url) => esc(url)).join('<br>') : 'No additional evidence URLs supplied.'}</p>${draft.archiveUrl ? `<div class="eyebrow">Archive</div><p>${esc(draft.archiveUrl)}</p>` : ''}<div class="eyebrow">Claim key</div><div class="hash">${esc(draft.claimKey)}</div></section>` : `<section><h3>No challenge draft</h3><p>Start from the MARGIN extension by highlighting a public claim.</p></section>`}${assuredPanel()}<section><div class="row">${walletButton}${draft ? `<button id="submit" class="accent" ${ready ? '' : 'disabled'}>Submit challenge</button><button id="resolve" ${ready ? '' : 'disabled'}>Resolve</button>` : ''}</div><div id="status">${statusMessage}</div></section>${transactions.length ? `<section><div class="eyebrow">Transaction provenance</div>${transactionCards()}</section>` : ''}</main>`;
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
  if (!draft || !validAddress(contractAddress) || !contractVerified) return;
  try {
    const readClient = createClient({ chain: studionet });
    const value = await readClient.readContract({ address: contractAddress, functionName: 'get_assured_claim', args: [draft.claimKey], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }) as AssuredClaimView;
    assuredClaim = value && Object.keys(value as object).length ? value : null;
    consumerExecuted = null;
    if (assuredClaim && String(assuredClaim.state).toUpperCase() === 'SETTLED' && String(assuredClaim.final_status).toUpperCase() === 'SUPPORTED') {
      consumerExecuted = Boolean(await readClient.readContract({ address: MARGIN_CONSUMER_ADDRESS, functionName: 'has_executed', args: [draft.claimKey], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }));
    }
    assuredError = '';
  } catch (error) {
    assuredError = `Assured state read unavailable: ${String((error as Error).message || error)}`;
  }
  if (redraw) render();
}

async function runAssuredAction(action: AssuredAction) {
  if (!draft) throw new Error('Missing challenge draft.');
  if (!isConnected()) throw new Error('Connect the wallet on Studionet 61999 first.');
  if (!assuredActions(assuredClaim, account).includes(action)) throw new Error('This Assured Claim action is not valid for the current state or wallet.');
  const client = await walletClient();
  const proofUrl = (document.querySelector<HTMLInputElement>('#proof-url')?.value || '').trim();
  const proofNonce = (document.querySelector<HTMLInputElement>('#proof-nonce')?.value || '').trim();
  const proofExpiry = (document.querySelector<HTMLInputElement>('#proof-expiry')?.value || '').trim();
  const appealReason = (document.querySelector<HTMLTextAreaElement>('#appeal-reason')?.value || '').trim();
  if (action === 'register' && (!proofUrl || !proofNonce || !proofExpiry)) throw new Error('Provide the HTTPS domain proof URL, nonce and expiry.');
  if (action === 'register' && !/^https:\/\//i.test(proofUrl)) throw new Error('Domain proof must use HTTPS.');
  if (action === 'appeal' && appealReason.length < 12) throw new Error('Provide a precise bounded appeal reason.');
  const definitions: Record<AssuredAction, { functionName: string; args: unknown[]; value: bigint }> = {
    register: { functionName: 'register_assured_claim', args: [draft.claimKey, proofUrl, proofNonce, proofExpiry], value: 1n },
    challenge: { functionName: 'challenge_assured_claim', args: [draft.claimKey], value: 1n },
    resolve: { functionName: 'resolve_assured_claim', args: [draft.claimKey], value: 0n },
    appeal: { functionName: 'appeal_assured_claim', args: [draft.claimKey, appealReason], value: 1n },
    resolveAppeal: { functionName: 'resolve_assured_appeal', args: [draft.claimKey], value: 0n },
    settle: { functionName: 'settle_assured_claim', args: [draft.claimKey], value: 0n },
    withdraw: { functionName: 'withdraw_assured_credit', args: [draft.claimKey], value: 0n },
  };
  const definition = definitions[action];
  setStatus('<div class="pending">Confirm the Assured Claim transaction in your wallet…</div>');
  const txId = await client.writeContract({ address: contractAddress, functionName: definition.functionName, args: definition.args, value: definition.value } as any);
  setStatus(`<div class="pending">${esc(definition.functionName)} submitted. Waiting for finalization…<br>${txLink(txId)}</div>`);
  await waitForFinalizedSuccess(client, txId, definition.functionName);
  setStatus(`<div class="ok"><strong>${esc(definition.functionName)} finalized ✓</strong><br>${txLink(txId)}</div>`);
  await readAssuredState(false);
  render();
}

function bind() {
  document.querySelector('#connect')?.addEventListener('click', () => connect(true).catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`)));
  document.querySelector('#disconnect')?.addEventListener('click', disconnect);
  document.querySelector('#submit')?.addEventListener('click', () => submitClaim().catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`)));
  document.querySelector('#resolve')?.addEventListener('click', () => resolveClaim().catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`)));
  document.querySelector('#refresh-assured')?.addEventListener('click', () => readAssuredState().catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`)));
  document.querySelectorAll<HTMLElement>('[data-assured-action]').forEach((button) => button.addEventListener('click', () => runAssuredAction(button.dataset.assuredAction as AssuredAction).catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`))));
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
}
void initialize();

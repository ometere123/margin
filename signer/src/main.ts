import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { canonicalizeUrl, claimKeyFor, decodeDraft, MARGIN_CHAIN_ID, MARGIN_RPC_URL, pageKeyFor, type ClaimDraft, type MarginClaim } from '../../shared/protocol';
import './style.css';

declare global {
  interface Window { ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<any> } }
}

const app = document.querySelector<HTMLDivElement>('#app')!;
const params = new URLSearchParams(location.search);
const encoded = params.get('draft') || '';
const storedAddress = (localStorage.getItem('marginContract') || '').trim();
const queryAddress = (params.get('contract') || '').trim();
const configuredAddress = (storedAddress || queryAddress).trim();
let draft: ClaimDraft | null = null;
try { if (encoded) draft = decodeDraft(encoded); } catch {}

let account: `0x${string}` | null = null;
let contractAddress = configuredAddress;
let lastTx = '';
let draftVerified = false;
let draftError = '';
let contractWarning = storedAddress && queryAddress && storedAddress.toLowerCase() !== queryAddress.toLowerCase()
  ? 'Ignored a different contract address supplied by the incoming link; the locally saved contract remains active.'
  : '';


function esc(v: string) { return v.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!)); }
function validAddress(v: string): v is `0x${string}` { return /^0x[0-9a-fA-F]{40}$/.test(v); }

function render(message = '') {
  app.innerHTML = `<main><header><div><div class="wordmark">MARGIN</div><div class="sub">wallet signer</div></div><span class="pill">Studionet · ${MARGIN_CHAIN_ID}</span></header>${message ? `<div class="notice">${esc(message)}</div>` : ''}${contractWarning ? `<div class="notice">${esc(contractWarning)}</div>` : ''}${draftError ? `<div class="notice">${esc(draftError)}</div>` : ''}<section><label>Contract address</label><div class="row"><input id="contract" value="${esc(contractAddress)}" placeholder="0x…"><button id="save">Save</button></div><small>Fixed RPC: ${MARGIN_RPC_URL}</small></section>${draft ? `<section><div class="eyebrow">Highlighted claim</div><blockquote>${esc(draft.anchor.exact)}</blockquote><div class="meta">${esc(draft.claimClass)} · ${esc(draft.canonicalUrl)}</div><h3>Challenge</h3><p>${esc(draft.challengeStatement)}</p><div class="eyebrow">Public evidence</div><p>${draft.evidenceUrls.length ? draft.evidenceUrls.map((url) => esc(url)).join('<br>') : 'No additional evidence URLs supplied.'}</p>${draft.archiveUrl ? `<div class="eyebrow">Archive</div><p>${esc(draft.archiveUrl)}</p>` : ''}<div class="eyebrow">Claim key</div><div class="hash">${esc(draft.claimKey)}</div></section>` : `<section><h3>No challenge draft</h3><p>Start from the MARGIN extension by highlighting a public claim.</p></section>`}<section><div class="row"><button id="connect" class="dark">${account ? esc(account.slice(0,8)+'…'+account.slice(-6)) : 'Connect wallet'}</button>${draft ? `<button id="submit" class="accent" ${draftVerified ? '' : 'disabled'}>Submit challenge</button><button id="resolve" ${draftVerified ? '' : 'disabled'}>Resolve</button>` : ''}</div><div id="status"></div></section>${lastTx ? `<section><div class="eyebrow">Latest transaction</div><div class="hash">${esc(lastTx)}</div></section>` : ''}</main>`;
  bind();
}

function setStatus(html: string) { const el = document.querySelector<HTMLDivElement>('#status'); if (el) el.innerHTML = html; }


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
  if (Number(network?.chain_id) !== MARGIN_CHAIN_ID || String(network?.network) !== 'studionet') {
    throw new Error('Configured contract did not identify itself as the MARGIN Studionet contract.');
  }
}

async function connect() {
  if (!window.ethereum) throw new Error('No injected EIP-1193 wallet found in this browser tab.');
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts?.[0]) throw new Error('Wallet returned no account.');
  account = accounts[0] as `0x${string}`;
  const chainHex = await window.ethereum.request({ method: 'eth_chainId' });
  if (Number.parseInt(chainHex, 16) !== MARGIN_CHAIN_ID) {
    await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{
      chainId: `0x${MARGIN_CHAIN_ID.toString(16)}`,
      chainName: 'GenLayer Studionet',
      nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
      rpcUrls: [MARGIN_RPC_URL],
      blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
    }] });
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${MARGIN_CHAIN_ID.toString(16)}` }] });
  }
  render('Wallet connected to Studionet 61999.');
}

async function walletClient() {
  if (!account) await connect();
  if (!account || !window.ethereum) throw new Error('Wallet is not connected.');
  const client = createClient({ chain: studionet, account, provider: window.ethereum as any });
  await client.connect('studionet');
  return client;
}

async function waitForFinalizedSuccess(client: any, txId: string, label: string) {
  const tx = await client.waitForTransactionReceipt({
    hash: txId,
    status: 'FINALIZED',
    fullTransaction: true,
  });
  if (String(tx.txExecutionResultName || '') !== 'FINISHED_WITH_RETURN') {
    throw new Error(`${label} failed: ${tx.statusName || tx.status} / ${tx.txExecutionResultName || tx.txExecutionResult}`);
  }
  return tx;
}

async function submitClaim() {
  if (!draft) throw new Error('Missing challenge draft.');
  if (!draftVerified) throw new Error(draftError || 'Draft integrity has not been verified.');
  if (!validAddress(contractAddress)) throw new Error('Set the deployed MARGIN contract address first.');
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
  lastTx = txId;
  setStatus('<div class="pending">Waiting for finalization…</div>');
  await waitForFinalizedSuccess(client, txId, 'Submission');
  setStatus('<div class="ok">Challenge stored. You can now resolve it or return to the page and refresh annotations.</div>');
}

async function resolveClaim() {
  if (!draft) throw new Error('Missing challenge draft.');
  if (!draftVerified) throw new Error(draftError || 'Draft integrity has not been verified.');
  if (!validAddress(contractAddress)) throw new Error('Set the deployed MARGIN contract address first.');
  await verifyContractTarget(contractAddress);
  const readClient = createClient({ chain: studionet });
  const existing = await readClient.readContract({ address: contractAddress, functionName: 'get_claim', args: [draft.claimKey], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }) as unknown as MarginClaim;
  if (!existing || !(existing as any).claim_key) throw new Error('Submit the claim before resolving it.');
  const client = await walletClient();
  const call = { address: contractAddress, functionName: 'resolve_claim', args: [draft.claimKey] } as const;
  setStatus('<div class="pending">Confirm resolution transaction…</div>');
  const txId = await client.writeContract({ ...call, value: 0n } as any);
  lastTx = txId;
  setStatus('<div class="pending">Validators are resolving the claim. Waiting for finalization…</div>');
  await waitForFinalizedSuccess(client, txId, 'Resolution');
  const resolved = await readClient.readContract({ address: contractAddress, functionName: 'get_claim', args: [draft.claimKey], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }) as unknown as MarginClaim;
  setStatus(`<div class="ok"><strong>${esc(String(resolved.status))}</strong><br>${esc(String(resolved.rationale || ''))}</div>`);
}

function bind() {
  document.querySelector('#save')?.addEventListener('click', () => {
    const v = (document.querySelector<HTMLInputElement>('#contract')!.value || '').trim();
    if (!validAddress(v)) return setStatus('<div class="bad">Invalid contract address.</div>');
    contractAddress = v; localStorage.setItem('marginContract', v); contractWarning = ''; render('Contract address saved locally.');
  });
  document.querySelector('#connect')?.addEventListener('click', () => connect().catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`)));
  document.querySelector('#submit')?.addEventListener('click', () => submitClaim().catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`)));
  document.querySelector('#resolve')?.addEventListener('click', () => resolveClaim().catch(e => setStatus(`<div class="bad">${esc(String(e.message || e))}</div>`)));
}

void verifyDraft().then(() => render());

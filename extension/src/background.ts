import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { canonicalizeUrl, pageKeyFor, MARGIN_CHAIN_ID, MARGIN_CONTRACT_ADDRESS, MARGIN_SIGNER_URL, type MarginClaim } from '../../shared/protocol';
import { createPageClaimsReader } from './pageClaims';

const readClient = createClient({ chain: studionet });

async function settings() {
  return { contractAddress: MARGIN_CONTRACT_ADDRESS, signerUrl: MARGIN_SIGNER_URL };
}

async function fetchPageClaims(canonical: string): Promise<MarginClaim[]> {
  const { contractAddress } = await settings();
  if (!/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) return [];
  const pageKey = await pageKeyFor(canonical);
  const result = await readClient.readContract({
    address: contractAddress as `0x${string}`,
    functionName: 'get_page_claims',
    args: [pageKey],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  const claims = Array.isArray(result) ? result as unknown as MarginClaim[] : [];
  return claims.filter((claim) => claim.canonical_url === canonical);
}

const readPageClaims = createPageClaimsReader(fetchPageClaims);

const contentRecovery = new Map<number, Promise<boolean>>();

async function ensureContentScript(tabId: number): Promise<boolean> {
  const existing = contentRecovery.get(tabId);
  if (existing) return existing;
  const task = (async () => {
    let tab: chrome.tabs.Tab;
    try { tab = await chrome.tabs.get(tabId); } catch { return false; }
    if (!tab.url || !/^https?:$/.test(new URL(tab.url).protocol)) return false;
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: 'MARGIN_PING' }, { frameId: 0 });
      if (response?.ok) return true;
    } catch {
      // No receiver means the unpacked extension was reloaded while the tab
      // remained open, or the static content script was not present yet.
    }
    try {
      await chrome.scripting.insertCSS({ target: { tabId, frameIds: [0] }, files: ['content.css'] });
      await chrome.scripting.executeScript({ target: { tabId, frameIds: [0] }, files: ['content.js'] });
      return true;
    } catch {
      return false;
    }
  })().finally(() => contentRecovery.delete(tabId));
  contentRecovery.set(tabId, task);
  return task;
}

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: 'margin-challenge', title: 'Challenge with MARGIN', contexts: ['selection'] });
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'margin-challenge' || !tab?.id) return;
  // Start this before any await so Chrome preserves the context-menu gesture.
  const panelOpen = chrome.sidePanel.open({ tabId: tab.id });
  try {
    await panelOpen;
    await ensureContentScript(tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_SELECTION' });
    if (!response?.ok) throw new Error(response?.error || 'Could not capture selection');
    await chrome.storage.session.set({ pendingDraft: response.payload, selectedClaim: null, panelError: '' });
  } catch (error) {
    await chrome.storage.session.set({ panelError: String((error as Error).message || error) });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'GET_PAGE_CLAIMS') {
    readPageClaims(canonicalizeUrl(message.url)).then((result) => sendResponse(result)).catch((error) => sendResponse({ ok: false, claims: [], error: String(error) }));
    return true;
  }
  if (message?.type === 'OPEN_CLAIM') {
    // A content-script click is delivered to the service worker as a message,
    // not as a sidePanel user gesture. Calling sidePanel.open() here therefore
    // rejects in Chrome. Store the selected claim and let the user open the
    // panel with the extension action; context-menu launches still open it in
    // their gesture-backed handler above.
    if (sender.tab?.id !== undefined) void chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => undefined);
    chrome.storage.session.set({ selectedClaim: message.claim, pendingDraft: null, panelError: '' }).then(async () => {
      try {
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: String((error as Error).message || error) });
      }
    });
    return true;
  }
  if (message?.type === 'GET_PANEL_STATE') {
    Promise.all([chrome.storage.session.get(['pendingDraft','selectedClaim','panelError']), settings()]).then(([state, config]) => {
      sendResponse({ ...state, config, chainId: MARGIN_CHAIN_ID });
    });
    return true;
  }
  return false;
});

chrome.tabs.onActivated.addListener(({ tabId }) => { void ensureContentScript(tabId); });
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') void ensureContentScript(tabId);
});

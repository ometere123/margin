import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { canonicalizeUrl, pageKeyFor, MARGIN_CHAIN_ID, type MarginClaim } from '../../shared/protocol';

const readClient = createClient({ chain: studionet });

async function settings() {
  const values = await chrome.storage.local.get({ contractAddress: '', signerUrl: 'http://localhost:5174/' });
  return values as { contractAddress: string; signerUrl: string };
}

async function getPageClaims(url: string): Promise<MarginClaim[]> {
  const { contractAddress } = await settings();
  if (!/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) return [];
  const canonical = canonicalizeUrl(url);
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

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: 'margin-challenge', title: 'Challenge with MARGIN', contexts: ['selection'] });
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'margin-challenge' || !tab?.id) return;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_SELECTION' });
    if (!response?.ok) throw new Error(response?.error || 'Could not capture selection');
    await chrome.storage.session.set({ pendingDraft: response.payload, selectedClaim: null, panelError: '' });
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    await chrome.storage.session.set({ panelError: String((error as Error).message || error) });
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'GET_PAGE_CLAIMS') {
    getPageClaims(message.url).then((claims) => sendResponse({ claims })).catch((error) => sendResponse({ claims: [], error: String(error) }));
    return true;
  }
  if (message?.type === 'OPEN_CLAIM') {
    chrome.storage.session.set({ selectedClaim: message.claim, pendingDraft: null, panelError: '' }).then(async () => {
      if (sender.tab?.id) await chrome.sidePanel.open({ tabId: sender.tab.id });
      sendResponse({ ok: true });
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

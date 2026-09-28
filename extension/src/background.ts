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

async function getPageClaims(url: string): Promise<MarginClaim[]> {
  return readPageClaims(canonicalizeUrl(url));
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
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_SELECTION' });
    if (!response?.ok) throw new Error(response?.error || 'Could not capture selection');
    await chrome.storage.session.set({ pendingDraft: response.payload, selectedClaim: null, panelError: '' });
  } catch (error) {
    await chrome.storage.session.set({ panelError: String((error as Error).message || error) });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'GET_PAGE_CLAIMS') {
    getPageClaims(message.url).then((claims) => sendResponse({ claims })).catch((error) => sendResponse({ claims: [], error: String(error) }));
    return true;
  }
  if (message?.type === 'OPEN_CLAIM') {
    // Start opening before the storage await so a badge click retains its
    // user-gesture eligibility in Chrome.
    const panelOpen = sender.tab?.id ? chrome.sidePanel.open({ tabId: sender.tab.id }) : Promise.resolve();
    chrome.storage.session.set({ selectedClaim: message.claim, pendingDraft: null, panelError: '' }).then(async () => {
      try {
        await panelOpen;
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

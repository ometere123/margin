import { canonicalizeUrl, normalizeText, pageKeyFor, sha256Hex, type MarginClaim, type TextAnchor } from '../../shared/protocol';
import { findRangeDetailed } from './anchor';

const marginContentGlobal = globalThis as typeof globalThis & { __MARGIN_CONTENT_ACTIVE__?: boolean };
if (!marginContentGlobal.__MARGIN_CONTENT_ACTIVE__) {
  marginContentGlobal.__MARGIN_CONTENT_ACTIVE__ = true;
  bootstrapMarginContent();
}

function bootstrapMarginContent() {

// Reloading an unpacked MV3 extension invalidates content-script contexts in
// already-open tabs. Chrome rejects any promise that was still crossing the
// runtime boundary at that moment. This is an expected lifecycle event, not a
// page or protocol failure; suppress only this exact browser error.
window.addEventListener('unhandledrejection', (event) => {
  if (String(event.reason?.message || event.reason || '').includes('Extension context invalidated')) {
    event.preventDefault();
  }
});

function extensionContextIsAlive(): boolean {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

async function sendRuntimeMessage<T = any>(message: unknown): Promise<T | null> {
  if (!extensionContextIsAlive()) return null;
  try {
    return await chrome.runtime.sendMessage(message) as T;
  } catch (error) {
    // Reloading an unpacked MV3 extension invalidates content scripts that are
    // still attached to open pages. Do not turn that normal teardown into a
    // page-level error or an unhandled promise rejection.
    if (String((error as Error)?.message || error).includes('Extension context invalidated')) return null;
    throw error;
  }
}

function preferredCanonicalUrl(): string {
  const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"][href]');
  try {
    if (link?.href) {
      const proposed = new URL(link.href, location.href);
      if (proposed.origin === location.origin && /^https?:$/.test(proposed.protocol)) return canonicalizeUrl(proposed.href);
    }
  } catch {}
  return canonicalizeUrl(location.href);
}

function selectionAnchor(): TextAnchor | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const exact = normalizeText(selection.toString());
  if (exact.length < 8 || exact.length > 1200) return null;
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer as Element
    : range.commonAncestorContainer.parentElement;
  const local = normalizeText(container?.textContent || exact);
  const pos = local.indexOf(exact);
  const prefix = pos >= 0 ? local.slice(Math.max(0, pos - 220), pos) : '';
  const suffix = pos >= 0 ? local.slice(pos + exact.length, pos + exact.length + 220) : '';
  return { exact, prefix, suffix };
}

async function captureSelection() {
  const anchor = selectionAnchor();
  if (!anchor) throw new Error('Select between 8 and 1,200 characters of visible text first.');
  const canonicalUrl = preferredCanonicalUrl();
  const pageText = normalizeText(document.body?.innerText || document.documentElement.innerText || '');
  return {
    canonicalUrl,
    pageTitle: document.title.slice(0, 300),
    anchor,
    pageDigest: await sha256Hex(pageText.slice(0, 250_000)),
  };
}

const badges = new Map<string, HTMLButtonElement>();
let activeHighlight: any = null;
let lastDiagnostics: Record<string, unknown> = {};
const debugEnabled = new URLSearchParams(location.search).get('margin_debug') === '1';

function debug(event: string, details: Record<string, unknown> = {}) {
  lastDiagnostics = { event, ...details };
  if (debugEnabled) console.debug('[MARGIN annotation]', lastDiagnostics);
}

function clearAnnotations() {
  for (const badge of badges.values()) badge.remove();
  badges.clear();
  const cssHighlights = (globalThis as any).CSS?.highlights;
  cssHighlights?.delete('margin-claims');
  activeHighlight = null;
}

function annotate(claim: MarginClaim, ranges: Range[], aggregateCount = 1) {
  const canonical = preferredCanonicalUrl();
  if (claim.canonical_url !== canonical) {
    debug('canonical-filter', { claimKey: claim.claim_key, canonical, claimCanonical: claim.canonical_url });
    return;
  }
  const match = findRangeDetailed(document, claim.quote, claim.prefix, claim.suffix);
  debug('anchor-match', {
    claimKey: claim.claim_key,
    matchCount: match.matchCount,
    winnerScore: match.winnerScore,
    found: Boolean(match.range),
    normalizedRangeText: match.normalizedRangeText,
  });
  const range = match.range;
  if (!range) return;
  ranges.push(range);
  const rect = range.getBoundingClientRect();
  if (!rect.width && !rect.height) {
    debug('anchor-zero-rect', { claimKey: claim.claim_key, width: rect.width, height: rect.height });
    return;
  }
  const badge = document.createElement('button');
  badge.className = 'margin-badge';
  badge.dataset.marginClaim = claim.claim_key;
  badge.dataset.status = claim.status;
  badge.textContent = aggregateCount > 1 ? `M · ${claim.status} · ${aggregateCount} claims` : `M · ${claim.status}`;
  badge.setAttribute('aria-label', aggregateCount > 1 ? `MARGIN ${claim.status}, ${aggregateCount} claims` : `MARGIN ${claim.status}`);
  badge.title = aggregateCount > 1 ? `${aggregateCount} MARGIN claims on this text. ${claim.rationale || ''}` : (claim.rationale || 'Open MARGIN claim');
  badge.style.top = `${Math.max(0, rect.bottom + window.scrollY + 3)}px`;
  badge.style.left = `${Math.max(4, Math.min(document.documentElement.scrollWidth - 120, rect.left + window.scrollX))}px`;
  badge.addEventListener('click', (event) => {
    event.preventDefault(); event.stopPropagation();
    void sendRuntimeMessage({ type: 'OPEN_CLAIM', claim }).catch(() => {
      // The extension may have been reloaded while this page stayed open.
    });
  });
  document.documentElement.appendChild(badge);
  badges.set(claim.claim_key, badge);
  debug('badge-added', { claimKey: claim.claim_key, badgeCount: badges.size, width: rect.width, height: rect.height });
}

let cachedClaims: MarginClaim[] = [];
let lastCanonical = '';
let reanchorTimer: number | undefined;
let emptyReadRetryTimer: number | undefined;
let emptyReadRetries = 0;
const MAX_EMPTY_READ_RETRIES = 2;

function scheduleEmptyReadRetry() {
  if (emptyReadRetryTimer !== undefined || emptyReadRetries >= MAX_EMPTY_READ_RETRIES) return;
  // pageClaims suppresses a cold-cache retry for the gateway cooldown. Retry
  // once after that window so a transient 429/HTML response cannot permanently
  // hide a finalized annotation on an otherwise unchanged page.
  emptyReadRetryTimer = window.setTimeout(() => {
    emptyReadRetryTimer = undefined;
    emptyReadRetries += 1;
    void refresh();
  }, 16_000);
}

function renderClaims(claims: MarginClaim[]) {
  clearAnnotations();
  const ranges: Range[] = [];
  const grouped = new Map<string, MarginClaim[]>();
  for (const claim of claims) {
    const key = `${claim.quote}\u0000${claim.prefix}\u0000${claim.suffix}`;
    const list = grouped.get(key) || [];
    list.push(claim);
    grouped.set(key, list);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => String(b.resolved_at || b.created_at).localeCompare(String(a.resolved_at || a.created_at)));
    annotate(list[0], ranges, list.length);
  }
  const HighlightCtor = (globalThis as any).Highlight;
  const cssHighlights = (globalThis as any).CSS?.highlights;
  if (ranges.length && HighlightCtor && cssHighlights) {
    try {
      activeHighlight = new HighlightCtor(...ranges);
      cssHighlights.set('margin-claims', activeHighlight);
    } catch {
      // CSS highlight state can be invalidated during extension/page teardown.
      activeHighlight = null;
    }
  }
}

function scheduleReanchor() {
  if (reanchorTimer !== undefined) window.clearTimeout(reanchorTimer);
  reanchorTimer = window.setTimeout(() => {
    try { renderClaims(cachedClaims); } catch { /* page is tearing down */ }
  }, 350);
}

async function refresh() {
  if (!/^https?:$/.test(location.protocol)) return;
  if (!extensionContextIsAlive()) return;
  try {
    const canonical = preferredCanonicalUrl();
    const derivedPageKey = await pageKeyFor(canonical);
    const response = await sendRuntimeMessage<{ ok?: boolean; claims?: MarginClaim[]; error?: string }>({ type: 'GET_PAGE_CLAIMS', url: canonical });
    if (!response) return;
    cachedClaims = (response?.claims || []) as MarginClaim[];
    lastCanonical = canonical;
    debug('page-read', {
      canonicalUrl: canonical,
      pageKey: derivedPageKey,
      ok: response.ok !== false,
      error: response.error || '',
      claimCount: cachedClaims.length,
      claimKeys: cachedClaims.map((claim) => claim.claim_key),
    });
    renderClaims(cachedClaims);
    if (response.ok === false || cachedClaims.length === 0) scheduleEmptyReadRetry();
    else if (emptyReadRetryTimer !== undefined) {
      window.clearTimeout(emptyReadRetryTimer);
      emptyReadRetryTimer = undefined;
      emptyReadRetries = 0;
    }
  } catch {
    // A transient gateway/rate-limit failure must not create an unhandled
    // background error or erase the last finalized annotation.
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'MARGIN_PING') {
    try { sendResponse({ ok: true }); } catch {}
    return false;
  }
  if (message?.type === 'MARGIN_DIAGNOSTICS') {
    try { sendResponse({ ok: true, ...lastDiagnostics, canonicalUrl: preferredCanonicalUrl() }); } catch {}
    return false;
  }
  if (message?.type === 'CAPTURE_SELECTION') {
    captureSelection().then((payload) => {
      try { sendResponse({ ok: true, payload }); } catch {}
    }).catch((error) => {
      try { sendResponse({ ok: false, error: String(error.message || error) }); } catch {}
    });
    return true;
  }
  if (message?.type === 'REFRESH_ANNOTATIONS') {
    emptyReadRetries = 0;
    refresh().then(() => {
      try { sendResponse({ ok: true }); } catch {}
    }).catch(() => {
      try { sendResponse({ ok: false }); } catch {}
    }); return true;
  }
  return false;
});

void pageKeyFor(preferredCanonicalUrl()); // warm WebCrypto and keep shared derivation exercised.
void refresh();
window.addEventListener('pageshow', () => void refresh());
window.addEventListener('resize', scheduleReanchor, { passive: true });

const domObserver = new MutationObserver((mutations) => {
  const relevant = mutations.some((mutation) => {
    if (mutation.type === 'characterData') return true;
    return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
      if (node instanceof Element && (node.classList.contains('margin-badge') || node.closest('.margin-badge'))) return false;
      return true;
    });
  });
  if (relevant && cachedClaims.length) scheduleReanchor();
});
domObserver.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

// Content scripts run in an isolated world, so polling the canonical URL is more reliable
// than monkey-patching a site's History API for SPA navigation.
window.setInterval(() => {
  if (!extensionContextIsAlive()) return;
  const canonical = preferredCanonicalUrl();
  if (canonical !== lastCanonical) {
    emptyReadRetries = 0;
    void refresh();
  }
}, 3000);
}

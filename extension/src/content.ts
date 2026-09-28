import { canonicalizeUrl, normalizeText, pageKeyFor, sha256Hex, type MarginClaim, type TextAnchor } from '../../shared/protocol';

// Reloading an unpacked MV3 extension invalidates content-script contexts in
// already-open tabs. Chrome rejects any promise that was still crossing the
// runtime boundary at that moment. This is an expected lifecycle event, not a
// page or protocol failure; suppress only this exact browser error.
window.addEventListener('unhandledrejection', (event) => {
  if (String(event.reason?.message || event.reason || '').includes('Extension context invalidated')) {
    event.preventDefault();
  }
});

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

function textNodes(): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      if (!parent || ['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','INPUT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  let node: Node | null;
  while ((node = walker.nextNode())) out.push(node as Text);
  return out;
}

function findRange(exact: string, prefix: string, suffix: string): Range | null {
  const nodes = textNodes();
  type Point = { node: Text; offset: number };
  const points: Point[] = [];
  let normalized = '';
  let previousWasSpace = true;

  for (const node of nodes) {
    const raw = node.textContent || '';
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (/\s/.test(ch)) {
        if (!previousWasSpace) {
          normalized += ' ';
          points.push({ node, offset: i });
          previousWasSpace = true;
        }
      } else {
        normalized += ch;
        points.push({ node, offset: i });
        previousWasSpace = false;
      }
    }
    if (!previousWasSpace) {
      normalized += ' ';
      points.push({ node, offset: raw.length });
      previousWasSpace = true;
    }
  }

  normalized = normalized.trimEnd();
  points.length = normalized.length;
  const needle = normalizeText(exact);
  const pre = normalizeText(prefix).slice(-180);
  const post = normalizeText(suffix).slice(0, 180);
  if (!needle || normalized.length < needle.length) return null;

  const matches: Array<{ start: number; score: number }> = [];
  let from = 0;
  while (from <= normalized.length - needle.length) {
    const idx = normalized.indexOf(needle, from);
    if (idx < 0) break;
    const before = normalized.slice(Math.max(0, idx - pre.length), idx);
    const after = normalized.slice(idx + needle.length, idx + needle.length + post.length);
    let score = 0;
    if (pre && before.endsWith(pre)) score += 2;
    if (post && after.startsWith(post)) score += 2;
    if (!pre && !post) score += 1;
    matches.push({ start: idx, score });
    from = idx + Math.max(1, needle.length);
  }
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.score - a.score);
  if (matches.length > 1 && matches[0].score === matches[1].score) return null;

  const winner = matches[0];
  const first = points[winner.start];
  const last = points[winner.start + needle.length - 1];
  if (!first || !last) return null;
  const range = document.createRange();
  range.setStart(first.node, Math.min(first.offset, first.node.length));
  range.setEnd(last.node, Math.min(last.offset + 1, last.node.length));
  return range;
}

const badges = new Map<string, HTMLButtonElement>();
let activeHighlight: any = null;

function clearAnnotations() {
  for (const badge of badges.values()) badge.remove();
  badges.clear();
  const cssHighlights = (globalThis as any).CSS?.highlights;
  cssHighlights?.delete('margin-claims');
  activeHighlight = null;
}

function annotate(claim: MarginClaim, ranges: Range[], aggregateCount = 1) {
  if (claim.canonical_url !== preferredCanonicalUrl()) return;
  const range = findRange(claim.quote, claim.prefix, claim.suffix);
  if (!range) return;
  ranges.push(range);
  const rect = range.getBoundingClientRect();
  if (!rect.width && !rect.height) return;
  const badge = document.createElement('button');
  badge.className = 'margin-badge';
  badge.dataset.status = claim.status;
  badge.textContent = aggregateCount > 1 ? `M · ${claim.status} · ${aggregateCount} claims` : `M · ${claim.status}`;
  badge.setAttribute('aria-label', aggregateCount > 1 ? `MARGIN ${claim.status}, ${aggregateCount} claims` : `MARGIN ${claim.status}`);
  badge.title = aggregateCount > 1 ? `${aggregateCount} MARGIN claims on this text. ${claim.rationale || ''}` : (claim.rationale || 'Open MARGIN claim');
  badge.style.top = `${Math.max(0, rect.bottom + window.scrollY + 3)}px`;
  badge.style.left = `${Math.max(4, Math.min(document.documentElement.scrollWidth - 120, rect.left + window.scrollX))}px`;
  badge.addEventListener('click', (event) => {
    event.preventDefault(); event.stopPropagation();
    void chrome.runtime.sendMessage({ type: 'OPEN_CLAIM', claim }).catch(() => {
      // The extension may have been reloaded while this page stayed open.
    });
  });
  document.documentElement.appendChild(badge);
  badges.set(claim.claim_key, badge);
}

let cachedClaims: MarginClaim[] = [];
let lastCanonical = '';
let reanchorTimer: number | undefined;

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
  try {
    const canonical = preferredCanonicalUrl();
    const response = await chrome.runtime.sendMessage({ type: 'GET_PAGE_CLAIMS', url: canonical });
    cachedClaims = (response?.claims || []) as MarginClaim[];
    lastCanonical = canonical;
    renderClaims(cachedClaims);
  } catch {
    // A transient gateway/rate-limit failure must not create an unhandled
    // background error or erase the last finalized annotation.
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'CAPTURE_SELECTION') {
    captureSelection().then((payload) => sendResponse({ ok: true, payload })).catch((error) => sendResponse({ ok: false, error: String(error.message || error) }));
    return true;
  }
  if (message?.type === 'REFRESH_ANNOTATIONS') {
    refresh().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false })); return true;
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
  const canonical = preferredCanonicalUrl();
  if (canonical !== lastCanonical) void refresh();
}, 3000);

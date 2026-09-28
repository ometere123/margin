export type AnchorPoint = { node: Text; offset: number } | null;

export type AnchorMatch = {
  range: Range | null;
  matchCount: number;
  winnerScore: number | null;
  normalizedRangeText: string;
};

const NON_TEXT_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION']);
const BLOCK_TAGS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DD', 'DIV', 'DL', 'DT', 'FIELDSET',
  'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'HEADER', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION', 'TABLE', 'TD',
  'TH', 'TR', 'UL',
]);

function hidden(element: Element): boolean {
  if (element.closest('[hidden], [aria-hidden="true"], script, style, noscript, template, textarea, input, select, option')) return true;
  try {
    const style = element.ownerDocument.defaultView?.getComputedStyle(element);
    return style?.display === 'none' || style?.visibility === 'hidden';
  } catch {
    return false;
  }
}

function appendSpace(chars: string[], points: AnchorPoint[]) {
  if (chars[chars.length - 1] !== ' ') {
    chars.push(' ');
    points.push(null);
  }
}

/**
 * Build the rendered text stream without treating DOM text-node boundaries as
 * whitespace. In particular, <wbr> is a zero-width boundary and contributes
 * no character. The point map only contains real text-node characters; a
 * structural separator has no point but still lets a Range span a <br> or a
 * block boundary.
 */
function renderedText(document: Document): { text: string; points: AnchorPoint[] } {
  const chars: string[] = [];
  const points: AnchorPoint[] = [];

  const appendText = (node: Text) => {
    const raw = node.data;
    let whitespacePending = false;
    for (let i = 0; i < raw.length; i += 1) {
      if (/\s/.test(raw[i])) {
        whitespacePending = true;
        continue;
      }
      if (whitespacePending && chars.length) appendSpace(chars, points);
      whitespacePending = false;
      chars.push(raw[i]);
      points.push({ node, offset: i });
    }
    if (whitespacePending && chars.length) appendSpace(chars, points);
  };

  const visit = (node: Node) => {
    if (node.nodeType === 3) {
      const parent = (node as Text).parentElement;
      if (parent && !hidden(parent)) appendText(node as Text);
      return;
    }
    if (node.nodeType !== 1) return;
    const element = node as Element;
    if (hidden(element)) return;
    if (element.tagName === 'BR') {
      appendSpace(chars, points);
      return;
    }
    for (const child of [...element.childNodes]) visit(child);
    if (BLOCK_TAGS.has(element.tagName)) appendSpace(chars, points);
  };

  visit(document.body || document.documentElement);
  while (chars[0] === ' ') { chars.shift(); points.shift(); }
  while (chars[chars.length - 1] === ' ') { chars.pop(); points.pop(); }
  return { text: chars.join(''), points };
}

export function findRangeDetailed(document: Document, exact: string, prefix: string, suffix: string): AnchorMatch {
  const stream = renderedText(document);
  const needle = exact.replace(/\s+/g, ' ').trim();
  const pre = prefix.replace(/\s+/g, ' ').trim().slice(-180);
  const post = suffix.replace(/\s+/g, ' ').trim().slice(0, 180);
  if (!needle || stream.text.length < needle.length) return { range: null, matchCount: 0, winnerScore: null, normalizedRangeText: '' };

  const matches: Array<{ start: number; score: number }> = [];
  let from = 0;
  while (from <= stream.text.length - needle.length) {
    const idx = stream.text.indexOf(needle, from);
    if (idx < 0) break;
    const before = stream.text.slice(Math.max(0, idx - pre.length), idx);
    const after = stream.text.slice(idx + needle.length, idx + needle.length + post.length);
    let score = 0;
    if (pre && before.endsWith(pre)) score += 2;
    if (post && after.startsWith(post)) score += 2;
    if (!pre && !post) score += 1;
    matches.push({ start: idx, score });
    from = idx + Math.max(1, needle.length);
  }
  if (!matches.length) return { range: null, matchCount: 0, winnerScore: null, normalizedRangeText: '' };
  matches.sort((a, b) => b.score - a.score);
  if (matches.length > 1 && matches[0].score === matches[1].score) {
    return { range: null, matchCount: matches.length, winnerScore: matches[0].score, normalizedRangeText: '' };
  }

  const winner = matches[0];
  const first = stream.points[winner.start];
  const last = stream.points[winner.start + needle.length - 1];
  if (!first || !last) return { range: null, matchCount: matches.length, winnerScore: winner.score, normalizedRangeText: '' };
  const range = document.createRange();
  range.setStart(first.node, Math.min(first.offset, first.node.length));
  range.setEnd(last.node, Math.min(last.offset + 1, last.node.length));
  return {
    range,
    matchCount: matches.length,
    winnerScore: winner.score,
    normalizedRangeText: (range.toString() || '').replace(/\s+/g, ' ').trim(),
  };
}

export function findRange(document: Document, exact: string, prefix: string, suffix: string): Range | null {
  return findRangeDetailed(document, exact, prefix, suffix).range;
}

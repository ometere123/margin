import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { findRangeDetailed } from './anchor';

const quote = 'The Hypertext Transfer Protocol (HTTP) is a stateless application-level protocol for distributed, collaborative, hypertext information systems.';

function dom(body: string): Document {
  return new JSDOM(`<!doctype html><body>${body}</body>`).window.document;
}

describe('rendered DOM text anchoring', () => {
  it('matches the RFC claim across a zero-width wbr split', () => {
    const document = dom('<p>The Hypertext Transfer Protocol (HTTP) is a stateless applicatio<wbr>n-level protocol for distributed, collaborative, hypertext information systems. This document describes the overall architecture of HTTP.</p>');
    const match = findRangeDetailed(document, quote, '', '');
    expect(match.range).not.toBeNull();
    expect(match.normalizedRangeText).toBe(quote);
  });

  it('matches a word split by an empty inline element without inventing a space', () => {
    const document = dom('<p>application-<span></span>level</p>');
    const match = findRangeDetailed(document, 'application-level', '', '');
    expect(match.range).not.toBeNull();
    expect(match.normalizedRangeText).toBe('application-level');
  });

  it('matches the RFC word when an inline element splits the middle of it', () => {
    const document = dom('<p>applicatio<span></span>n-level</p>');
    const match = findRangeDetailed(document, 'application-level', '', '');
    expect(match.range).not.toBeNull();
    expect(match.normalizedRangeText).toBe('application-level');
  });

  it('preserves real whitespace and explicit br separation', () => {
    const spaced = findRangeDetailed(dom('<p>application- <span>level</span></p>'), 'application- level', '', '');
    expect(spaced.range).not.toBeNull();
    expect(spaced.normalizedRangeText).toBe('application- level');

    const broken = findRangeDetailed(dom('<p>first<br>second</p>'), 'first second', '', '');
    expect(broken.range).not.toBeNull();
  });

  it('fails closed for genuinely identical visible occurrences', () => {
    const document = dom('<p>same visible claim</p><p>same visible claim</p>');
    const match = findRangeDetailed(document, 'same visible claim', '', '');
    expect(match.range).toBeNull();
    expect(match.matchCount).toBe(2);
  });

  it('does not count hidden duplicate text as a visible ambiguous anchor', () => {
    const document = dom('<p hidden>same visible claim</p><p>same visible claim</p>');
    const match = findRangeDetailed(document, 'same visible claim', '', '');
    expect(match.range).not.toBeNull();
    expect(match.matchCount).toBe(1);
  });
});

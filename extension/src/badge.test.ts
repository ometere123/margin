import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { applyBadgePosition, badgePosition } from './badge';

describe('annotation badge placement', () => {
  it('keeps a multiline badge in the viewport beside the visible line', () => {
    expect(badgePosition({ left: 40, right: 280, top: 740, bottom: 770 }, { width: 800, height: 800 }, { width: 120, height: 24 })).toEqual({ left: 286, top: 740 });
  });
  it('flips to the left when a sticky/right edge would clip it', () => {
    const result = badgePosition({ left: 730, right: 790, top: 60, bottom: 90 }, { width: 800, height: 600 }, { width: 120, height: 24 });
    expect(result.left).toBe(604);
    expect(result.top).toBe(60);
  });
  it('clamps responsive placements to the viewport', () => {
    const result = badgePosition({ left: -50, right: 10, top: -20, bottom: 5 }, { width: 320, height: 240 }, { width: 120, height: 24 });
    expect(result.left).toBe(16);
    expect(result.top).toBe(6);
  });
  it('applies calculated coordinates with important priority over isolated badge CSS', () => {
    const { window } = new JSDOM('<button></button>');
    const badge = window.document.querySelector('button') as unknown as HTMLElement;
    badge.style.cssText = 'all: initial !important; left: 0px !important; top: 0px !important;';

    applyBadgePosition(badge, { left: 286, top: 740 });

    expect(badge.style.left).toBe('286px');
    expect(badge.style.top).toBe('740px');
    expect(badge.style.getPropertyPriority('left')).toBe('important');
    expect(badge.style.getPropertyPriority('top')).toBe('important');
  });
});

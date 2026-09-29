import { describe, expect, it } from 'vitest';
import { badgePosition } from './badge';

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
});

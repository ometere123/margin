export function badgePosition(rect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>, viewport: { width: number; height: number }, badgeSize: { width: number; height: number }, gap = 6) {
  const margin = 6;
  let left = rect.right + gap;
  if (left + badgeSize.width > viewport.width - margin) left = rect.left - badgeSize.width - gap;
  left = Math.max(margin, Math.min(left, viewport.width - badgeSize.width - margin));
  let top = rect.top;
  if (top + badgeSize.height > viewport.height - margin) top = rect.bottom - badgeSize.height;
  top = Math.max(margin, Math.min(top, viewport.height - badgeSize.height - margin));
  return { left, top };
}

export function applyBadgePosition(badge: HTMLElement, placement: { left: number; top: number }) {
  badge.style.setProperty('left', `${placement.left}px`, 'important');
  badge.style.setProperty('top', `${placement.top}px`, 'important');
}

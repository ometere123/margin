import type { ClaimDraft, MarginClaim, TextAnchor } from '../../shared/protocol';

export type ExtensionMessage =
  | { type: 'CAPTURE_SELECTION' }
  | { type: 'SELECTION_CAPTURED'; payload: { canonicalUrl: string; pageTitle: string; anchor: TextAnchor; pageDigest: string } }
  | { type: 'GET_PAGE_CLAIMS'; url: string }
  | { type: 'PAGE_CLAIMS'; claims: MarginClaim[] }
  | { type: 'OPEN_CLAIM'; claim: MarginClaim }
  | { type: 'REFRESH_ANNOTATIONS' }
  | { type: 'GET_PANEL_STATE' }
  | { type: 'PANEL_STATE'; pendingDraft?: Partial<ClaimDraft>; selectedClaim?: MarginClaim; error?: string };

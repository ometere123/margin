export type Route =
  | { kind: 'home' }
  | { kind: 'challenge'; draft: string }
  | { kind: 'activity' }
  | { kind: 'claim'; claimKey: string }
  | { kind: 'assurance'; claimKey: string }
  | { kind: 'not-found' };

export function parseRoute(pathname: string, search = ''): Route {
  const path = pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  const draft = new URLSearchParams(search).get('draft');
  if (path === '/' && draft) return { kind: 'challenge', draft };
  if (path === '/') return { kind: 'home' };
  if (path === '/challenge') return draft ? { kind: 'challenge', draft } : { kind: 'not-found' };
  if (path === '/activity') return { kind: 'activity' };
  const assurance = path.match(/^\/claim\/([0-9a-fA-F]{64})\/assurance$/);
  if (assurance) return { kind: 'assurance', claimKey: assurance[1].toLowerCase() };
  const claim = path.match(/^\/claim\/([0-9a-fA-F]{64})$/);
  if (claim) return { kind: 'claim', claimKey: claim[1].toLowerCase() };
  return { kind: 'not-found' };
}

import { MARGIN_CHAIN_ID, MARGIN_RPC_URL } from '../../shared/protocol';

const app = document.querySelector<HTMLDivElement>('#app')!;

async function render() {
  const values = await chrome.storage.local.get({ contractAddress: '', signerUrl: 'http://localhost:5174/' });
  app.innerHTML = `<div class="brand"><h1>MARGIN settings</h1><span class="network">Studionet · ${MARGIN_CHAIN_ID}</span></div><div class="card"><label class="label">Deployed MARGIN contract</label><input id="contract" value="${values.contractAddress || ''}" placeholder="0x…"><div class="muted">RPC is fixed to ${MARGIN_RPC_URL}. Only the fixed Studionet configuration is supported.</div><label class="label">Wallet signer URL</label><input id="signer" value="${values.signerUrl || 'http://localhost:5174/'}"><div id="status" style="margin-top:10px"></div></div><button id="save" class="primary">Save</button>`;
  document.querySelector('#save')?.addEventListener('click', async () => {
    const contractAddress = (document.querySelector<HTMLInputElement>('#contract')!.value || '').trim();
    const signerUrl = (document.querySelector<HTMLInputElement>('#signer')!.value || '').trim();
    const status = document.querySelector<HTMLDivElement>('#status')!;
    if (contractAddress && !/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) { status.innerHTML = '<div class="error">Contract address is invalid.</div>'; return; }
    try { new URL(signerUrl); } catch { status.innerHTML = '<div class="error">Signer URL is invalid.</div>'; return; }
    await chrome.storage.local.set({ contractAddress, signerUrl });
    status.innerHTML = '<div class="success">Saved.</div>';
  });
}
void render();

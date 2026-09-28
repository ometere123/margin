import { MARGIN_CHAIN_ID, MARGIN_CONTRACT_ADDRESS, MARGIN_EXPLORER_URL, MARGIN_RPC_URL, MARGIN_SIGNER_URL } from '../../shared/protocol';

const app = document.querySelector<HTMLDivElement>('#app')!;

async function render() {
  app.innerHTML = `<div class="brand"><h1>MARGIN</h1><span class="network">Studionet · ${MARGIN_CHAIN_ID}</span></div><div class="card"><div class="label">Production configuration</div><p class="muted">MARGIN is preconfigured for the canonical Studionet deployment. Normal browsing does not require infrastructure setup.</p><div class="label">Contract</div><div class="code">${MARGIN_CONTRACT_ADDRESS}</div><div class="label">Signer</div><div class="code">${MARGIN_SIGNER_URL}</div><div class="muted">RPC: ${MARGIN_RPC_URL}<br>Explorer: ${MARGIN_EXPLORER_URL}</div></div>`;
}
void render();

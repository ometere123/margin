import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const baseUrl = 'http://127.0.0.1:4173';
const accountA = '0x1111111111111111111111111111111111111111';
const accountB = '0x2222222222222222222222222222222222222222';
const claimKey = 'browser-fixture-claim';
const quote = 'MARGIN browser persistence fixture: independent validators inspect public evidence.';
const server = spawn(process.execPath, ['tests/browser/serve.mjs'], { stdio: 'inherit' });

function assert(condition, message) { if (!condition) throw new Error(message); }
async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(`${baseUrl}/fixture.html`)).ok) return; } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error('Browser fixture server did not start.');
}

async function installWallet(page, { accounts = [], chainId = '0xf22f', rejectRequests = false } = {}) {
  await page.addInitScript(({ initialAccounts, initialChainId, reject }) => {
    const listeners = new Map();
    const state = { accounts: initialAccounts, chainId: initialChainId, reject };
    const calls = [];
    if (reject && !sessionStorage.getItem('margin.e2e.seeded')) {
      localStorage.setItem('margin.explicitDisconnect', '1');
      sessionStorage.setItem('margin.e2e.seeded', '1');
    }
    const emit = (event, value) => (listeners.get(event) || []).forEach((listener) => listener(value));
    window.__marginWallet = {
      calls,
      setAccounts(next) { state.accounts = next; emit('accountsChanged', next); },
      setChain(next) { state.chainId = next; emit('chainChanged', next); },
      reject(next) { state.reject = next; },
    };
    window.ethereum = {
      request({ method }) {
        calls.push(method);
        if (method === 'eth_accounts') return Promise.resolve(state.accounts);
        if (method === 'eth_chainId') return Promise.resolve(state.chainId);
        if (method === 'eth_requestAccounts') return state.reject ? Promise.reject(new Error('User rejected the request.')) : Promise.resolve(state.accounts);
        if (method === 'wallet_addEthereumChain' || method === 'wallet_switchEthereumChain') { state.chainId = '0xf22f'; return Promise.resolve(null); }
        return Promise.resolve(null);
      },
      on(event, listener) { listeners.set(event, [...(listeners.get(event) || []), listener]); },
      removeListener() {},
    };
  }, { initialAccounts: accounts, initialChainId: chainId, reject: rejectRequests });
}

async function rejectRpc(page) {
  await page.route('https://studio.genlayer.com/api', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'test RPC unavailable' } }) });
  });
}

async function run() {
  await waitForServer();
  const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ headless: true, ...(process.env.MARGIN_E2E_BROWSER ? { executablePath: process.env.MARGIN_E2E_BROWSER } : existsSync(systemChrome) ? { executablePath: systemChrome } : {}) });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await installWallet(page, { accounts: [accountA], rejectRequests: true });
    await rejectRpc(page);
    await page.goto(`${baseUrl}/`);
    assert(await page.locator('#header-connect').textContent() === 'Connect wallet', 'fresh profile should start disconnected');
    await page.locator('#header-connect').click();
    await page.getByText('User rejected the request.').waitFor();
    assert((await page.getByText('User rejected the request.').textContent()).includes('User rejected'), 'wallet rejection should be visible');
    await page.evaluate(() => window.__marginWallet.reject(false));
    await page.locator('#header-connect').click();
    await page.waitForTimeout(500);
    await page.locator('.wallet-chip').waitFor();
    assert((await page.locator('.wallet-chip').textContent()).includes('0x111111'), 'connected wallet should be shown');
    await page.evaluate((next) => window.__marginWallet.setAccounts([next]), accountB);
    assert((await page.locator('.wallet-chip').textContent()).includes('0x222222'), 'account switch should update the header');
    await page.evaluate(() => window.__marginWallet.setChain('0x1'));
    assert((await page.locator('.pill.warn').textContent()).includes('Wallet not on Studionet'), 'wrong network should be visible');
    await page.evaluate(() => window.__marginWallet.setChain('0xf22f'));
    await page.reload();
    await page.locator('.wallet-chip').waitFor();
    const calls = await page.evaluate(() => window.__marginWallet.calls);
    assert(calls.includes('eth_accounts'), 'refresh recovery must query eth_accounts');
    assert(!calls.includes('eth_requestAccounts'), 'refresh recovery must not request accounts');
    await context.close();

    const annotationContext = await browser.newContext();
    const annotationPage = await annotationContext.newPage();
    const claim = { claim_key: claimKey, canonical_url: `${baseUrl}/fixture.html`, quote, prefix: '', suffix: '', status: 'SUPPORTED', claim_class: 'TECHNICAL', challenge_statement: 'fixture', rationale: 'fixture', revision: 1, evidence_urls_json: '[]' };
    await annotationPage.addInitScript((fixtureClaim) => {
      window.chrome = { runtime: { id: 'browser-test', sendMessage(message) { if (message?.type === 'GET_PAGE_CLAIMS') return Promise.resolve({ ok: true, claims: [fixtureClaim] }); return Promise.resolve({ ok: true }); }, onMessage: { addListener() {} } } };
    }, claim);
    const contentScript = resolve('extension/dist/content.js');
    const contentCss = resolve('extension/dist/content.css');
    const loadExtension = async () => {
      await annotationPage.addStyleTag({ path: contentCss });
      await annotationPage.addScriptTag({ path: contentScript });
      await annotationPage.locator(`[data-margin-claim="${claimKey}"]`).waitFor();
    };
    await annotationPage.goto(`${baseUrl}/fixture.html`);
    await loadExtension();
    await annotationPage.reload();
    await loadExtension();
    assert(await annotationPage.locator(`[data-margin-claim="${claimKey}"]`).isVisible(), 'annotation badge should persist after refresh');
    await annotationContext.close();

    const hostileContext = await browser.newContext();
    const hostilePage = await hostileContext.newPage();
    const hostileClaim = { ...claim, claim_key: 'hostile-fixture-claim', canonical_url: `${baseUrl}/hostile.html`, quote: 'MARGIN hostile-page fixture: validators treat page text as untrusted evidence.' };
    await hostilePage.addInitScript((fixtureClaim) => {
      window.chrome = { runtime: { id: 'browser-test', sendMessage(message) { if (message?.type === 'GET_PAGE_CLAIMS') return Promise.resolve({ ok: true, claims: [fixtureClaim] }); return Promise.resolve({ ok: true }); }, onMessage: { addListener() {} } } };
    }, hostileClaim);
    await hostilePage.goto(`${baseUrl}/hostile.html`);
    await hostilePage.addStyleTag({ path: contentCss });
    await hostilePage.addScriptTag({ path: contentScript });
    await hostilePage.locator('[data-margin-claim="hostile-fixture-claim"]').waitFor();
    assert(await hostilePage.locator('[data-margin-claim="hostile-fixture-claim"]').count() === 1, 'hidden duplicate text must not create a second hostile-page badge');
    await hostileContext.close();
  } finally {
    await browser.close();
    server.kill();
  }
}

run().catch((error) => { console.error(error); server.kill(); process.exitCode = 1; });

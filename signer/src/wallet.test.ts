import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProviderBackedClient } from './wallet';

describe('provider-backed signer wallet', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('uses ordinary EIP-1193 methods and never requests MetaMask Snaps', async () => {
    const methods: string[] = [];
    vi.stubGlobal('fetch', async (_input: unknown, init?: { body?: string }) => {
      const method = JSON.parse(init?.body || '{}').method;
      methods.push(`rpc:${method}`);
      const result = method === 'eth_getTransactionCount' ? '0x0' : method === 'eth_estimateGas' ? '0x5208' : method === 'eth_gasPrice' ? '0x1' : '0x0';
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const provider = {
      request: async ({ method }: { method: string; params?: unknown[] }) => {
        methods.push(method);
        if (method === 'eth_getTransactionCount') return '0x0';
        if (method === 'eth_estimateGas') return '0x5208';
        if (method === 'eth_gasPrice') return '0x1';
        if (method === 'eth_sendTransaction') return `0x${'11'.repeat(32)}`;
        throw new Error(`Unexpected provider method in mock: ${method}`);
      },
    };
    const client = createProviderBackedClient('0x1111111111111111111111111111111111111111', provider);
    const txHash = await client.writeContract({
      address: '0x6525B4a5d9CEd32f440D47b0Bf966C2D25d1Fcb0',
      functionName: 'submit_claim',
      args: ['claim', 'page', 'https://example.com/', 'quote', 'prefix', 'suffix', 'digest', 'TECHNICAL', 'objection', '[]', ''],
      value: 0n,
    } as any);

    expect(txHash).toBe(`0x${'11'.repeat(32)}`);
    expect(methods).toContain('eth_sendTransaction');
    expect(methods.some((method) => method.toLowerCase().includes('snap'))).toBe(false);
  }, 15000);
});

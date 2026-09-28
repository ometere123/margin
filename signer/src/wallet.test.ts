import { describe, expect, it } from 'vitest';
import { createProviderBackedClient } from './wallet';

describe('provider-backed signer wallet', () => {
  it('uses ordinary EIP-1193 methods and never requests MetaMask Snaps', async () => {
    const methods: string[] = [];
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
      address: '0x8F2BC217E27F2A8a72A62BaA3Ec67dF8940E408b',
      functionName: 'submit_claim',
      args: ['claim', 'page', 'https://example.com/', 'quote', 'prefix', 'suffix', 'digest', 'TECHNICAL', 'objection', '[]', ''],
      value: 0n,
    } as any);

    expect(txHash).toBe(`0x${'11'.repeat(32)}`);
    expect(methods).toContain('eth_sendTransaction');
    expect(methods.some((method) => method.toLowerCase().includes('snap'))).toBe(false);
  });
});

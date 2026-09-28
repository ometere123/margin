import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

/**
 * Build the provider-backed client without GenLayerJS's legacy wallet connect
 * helper. That helper is Snap-oriented in genlayer-js 1.1.8; MARGIN uses the
 * ordinary injected EIP-1193 provider after the caller has verified 61999.
 */
export function createProviderBackedClient(account: `0x${string}`, provider: Eip1193Provider) {
  return createClient({ chain: studionet, account, provider: provider as any });
}

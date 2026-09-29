import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import deployment from '../deployment.json' with { type: 'json' };

const claimKey = process.argv.find((value) => value.startsWith('--claim='))?.slice('--claim='.length);
const client = createClient({ chain: studionet });
const finalRead = { transactionHashVariant: TransactionHashVariant.LATEST_FINAL };

async function read(address, functionName, args = []) {
  return client.readContract({ address, functionName, args, ...finalRead });
}

const network = await read(deployment.contractAddress, 'network');
if (
  Number(network?.chain_id) !== deployment.chainId ||
  String(network?.network) !== deployment.network ||
  String(network?.rpc) !== deployment.rpc
) {
  throw new Error(`Canonical network identity mismatch: ${JSON.stringify(network)}`);
}

const result = {
  network,
  margin: deployment.contractAddress,
  consumer: deployment.liveEvidence.consumerDeployment.contractAddress,
};

try {
  result.consumerBoundMargin = await read(
    deployment.liveEvidence.consumerDeployment.contractAddress,
    'canonical_margin_address',
  );
} catch (error) {
  result.consumerBoundMarginReadError = String(error?.message || error);
}

if (claimKey) {
  if (!/^[0-9a-f]{64}$/i.test(claimKey)) throw new Error('--claim must be a 64-character hexadecimal claim key');
  result.claim = await read(deployment.contractAddress, 'get_claim', [claimKey]);
}

console.log(JSON.stringify(result, null, 2));

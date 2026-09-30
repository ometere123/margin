export interface ConsumerActivityInput {
  id: string;
  functionName: string;
  claimKey: string;
  account: string | null;
  submittedAt: string;
  consumerAddress: string;
}

export function consumerActivityRecord(input: ConsumerActivityInput) {
  return {
    id: input.id,
    label: input.functionName,
    claimKey: input.claimKey,
    state: 'submitted',
    account: input.account,
    submittedAt: input.submittedAt,
    contractAddress: input.consumerAddress,
    network: 'studionet',
  };
}

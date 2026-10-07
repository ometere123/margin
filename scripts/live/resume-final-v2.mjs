#!/usr/bin/env node
import { spawn } from 'node:child_process';

const deadline = process.env.MARGIN_V2_APPEAL_DEADLINE ?? '2026-10-07T13:25:50.027299+00:00';
const statePath = process.env.MARGIN_V2_STATE_PATH ?? 'scripts/live/evidence/final-v2-economic-contradicted.json';
const args = ['scripts/live/run-v2-covered.mjs'];
const env = {
  ...process.env,
  MARGIN_V2_STATE_PATH: statePath,
  MARGIN_V2_MARGIN: '0x4E0a75B63D913FC2d39A75F61905CA5973c77491',
  MARGIN_V2_CONSUMER: '0x11B5E8457C4Bf77B5F5dc19210FEdBBb7c3fB91F',
  MARGIN_V2_CLAIM_KEY: '006e13f4fee1713961c4a45148e7e196fb5e35204c9ab97c5831da2fe7c87880',
  MARGIN_V2_PAGE_KEY: '69f48c422dc222ebc89ddf685adc97f7e2696fb69e7394b4f22ea3b982e2b23a',
  MARGIN_V2_PAGE_URL: 'https://a-murex-one.vercel.app/v2-contradicted-strong.html',
  MARGIN_V2_QUOTE: 'A Covered Claim can protect value without publisher collateral.',
  MARGIN_V2_PREFIX: 'Strong contradiction fixture: ',
  MARGIN_V2_SUFFIX: ' This proposition is challenged by the committed policy evidence.',
  MARGIN_V2_PAGE_DIGEST: '94b8877970bd3c53db8adb014a6ad052a7e61a6df57bf3dc5ecb7bac95bf3164',
  MARGIN_V2_CHALLENGE: 'Determine whether the committed policy evidence directly contradicts the highlighted proposition about protecting value without publisher collateral.',
  MARGIN_V2_EVIDENCE_URL: 'https://a-murex-one.vercel.app/v2-contradicted-strong-evidence.txt',
  MARGIN_V2_NONCE: 'margin-v2-contradicted-strong-20261007',
};

while (Date.now() < Date.parse(deadline)) {
  await new Promise((resolve) => setTimeout(resolve, Math.min(30_000, Date.parse(deadline) - Date.now())));
}

const child = spawn(process.execPath, args, { env, stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 1));

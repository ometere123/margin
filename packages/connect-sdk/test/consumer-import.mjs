const esm = await import('@converts/margin-connect');
if (typeof esm.createMarginConnect !== 'function' || esm.MARGIN_CHAIN_ID !== 61999) {
  throw new Error('ESM package consumer check failed');
}
console.log('MARGIN Connect ESM consumer exports verified');

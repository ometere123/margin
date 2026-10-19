const cjs = require('@converts/margin-connect');
if (typeof cjs.createMarginConnect !== 'function' || cjs.MARGIN_CHAIN_ID !== 61999) {
  throw new Error('CJS package consumer check failed');
}
console.log('MARGIN Connect CJS consumer exports verified');

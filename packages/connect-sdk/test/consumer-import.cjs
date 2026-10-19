const cjs = require('@margin-connect/sdk');
if (typeof cjs.createMarginConnect !== 'function' || cjs.MARGIN_CHAIN_ID !== 61999) {
  throw new Error('CJS package consumer check failed');
}
console.log('MARGIN Connect CJS consumer exports verified');

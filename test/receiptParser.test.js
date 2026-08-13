import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReceipt, sanitizeText } from '../src/services/receiptParser.js';

test('parses a common receipt total, merchant, and date', () => {
  const result = parseReceipt(`BIG MART\nDate: 14/08/2026\nRice 250.00\nGrand Total: Rs. 1,250.00`);
  assert.equal(result.merchant, 'Big Mart');
  assert.equal(result.amount, 1250);
  assert.equal(result.date, '2026-08-14');
});

test('falls back safely for empty OCR text', () => {
  const result = parseReceipt('');
  assert.equal(result.merchant, '');
  assert.equal(result.amount, null);
  assert.match(result.date, /^\d{4}-\d{2}-\d{2}$/);
});

test('sanitizes markup and control characters', () => {
  assert.equal(sanitizeText('<script>alert(1)</script> Shop\u0000'), 'alert(1) Shop');
});

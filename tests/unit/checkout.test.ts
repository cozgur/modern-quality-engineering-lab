import { describe, expect, test } from 'vitest';
import { MAX_QUANTITY, validateCheckout } from '../../src/checkout.js';

describe('validateCheckout', () => {
  test('accepts a valid request and normalises the product id', () => {
    expect(validateCheckout({ productId: '  quality-lab ', quantity: 2 })).toEqual({
      ok: true,
      value: { productId: 'quality-lab', quantity: 2 },
    });
  });

  test('defaults quantity to 1 when omitted', () => {
    expect(validateCheckout({ productId: 'quality-lab' })).toEqual({
      ok: true,
      value: { productId: 'quality-lab', quantity: 1 },
    });
  });

  test.each([
    [1, true],
    [MAX_QUANTITY, true],
    [0, false],
    [MAX_QUANTITY + 1, false],
    [-1, false],
  ])('quantity boundary %i -> valid: %s', (quantity, expected) => {
    expect(validateCheckout({ productId: 'p', quantity }).ok).toBe(expected);
  });

  test.each([
    [
      'quantity below range',
      { productId: 'p', quantity: 0 },
      `quantity must be between 1 and ${MAX_QUANTITY}`,
    ],
    [
      'quantity above range',
      { productId: 'p', quantity: MAX_QUANTITY + 1 },
      `quantity must be between 1 and ${MAX_QUANTITY}`,
    ],
    ['null body', null, 'body must be a JSON object'],
    ['array body', [], 'body must be a JSON object'],
    ['string body', 'productId=1', 'body must be a JSON object'],
    ['missing productId', {}, 'productId must be a non-empty string'],
    ['blank productId', { productId: '   ' }, 'productId must be a non-empty string'],
    ['numeric productId', { productId: 42 }, 'productId must be a non-empty string'],
    ['string quantity', { productId: 'p', quantity: '2' }, 'quantity must be an integer'],
    ['fractional quantity', { productId: 'p', quantity: 1.5 }, 'quantity must be an integer'],
    ['NaN quantity', { productId: 'p', quantity: Number.NaN }, 'quantity must be an integer'],
  ])('rejects %s', (_label, input, reason) => {
    expect(validateCheckout(input)).toEqual({ ok: false, reason });
  });
});

/**
 * Pure checkout validation. Kept free of HTTP concerns so it can be unit tested
 * exhaustively without starting a server.
 */
export const MAX_QUANTITY = 100;

export type CheckoutRequest = {
  productId: string;
  quantity: number;
};

export type CheckoutValidation = { ok: true; value: CheckoutRequest } | { ok: false; reason: string };

function invalid(reason: string): CheckoutValidation {
  return { ok: false, reason };
}

export function validateCheckout(input: unknown): CheckoutValidation {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return invalid('body must be a JSON object');
  }

  const { productId, quantity = 1 } = input as Record<string, unknown>;

  if (typeof productId !== 'string' || productId.trim() === '') {
    return invalid('productId must be a non-empty string');
  }

  if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
    return invalid('quantity must be an integer');
  }

  if (quantity < 1 || quantity > MAX_QUANTITY) {
    return invalid(`quantity must be between 1 and ${MAX_QUANTITY}`);
  }

  return { ok: true, value: { productId: productId.trim(), quantity } };
}

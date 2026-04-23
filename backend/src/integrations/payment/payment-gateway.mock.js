const crypto = require("crypto");

/**
 * Primitive mock payment gateway integration for development.
 * Preserves payment lifecycle in DB without external provider dependency.
 */
async function charge({ amount, paymentMethod, cardToken }) {
  // Simulate a deterministic failure when card token starts with "fail_".
  if (paymentMethod === "card" && cardToken && cardToken.startsWith("fail_")) {
    return {
      ok: false,
      status: "failed",
      errorCode: "card_declined",
      message: "Mock gateway declined the card",
      transactionId: crypto.randomUUID(),
    };
  }

  return {
    ok: true,
    status: "success",
    transactionId: crypto.randomUUID(),
    processedAt: new Date(),
    amount,
    paymentMethod,
  };
}

module.exports = { charge };

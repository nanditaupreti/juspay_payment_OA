import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { validateWith, validateParam } from "./middleware/validate.js";
import {
  createPaymentSchema,
  createCustomerSchema,
  capturePaymentSchema,
  refundSchema,
  paymentIdSchema,
  customerIdSchema,
} from "./validators.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const HS_BASE_URL = process.env.HS_BASE_URL;
const HS_API_KEY = process.env.HS_API_KEY;
const HS_PUBLISHABLE_KEY = process.env.HS_PUBLISHABLE_KEY;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// ── Hyperswitch helper ────────────────────────────────────────────────────────

async function hsRequest(path, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": HS_API_KEY,
    },
  };
  if (body) options.body = JSON.stringify(body);
  const url = `${HS_BASE_URL}${path}`;
  const res = await fetch(url, options);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/config", (req, res) => {
  res.json({ publishableKey: HS_PUBLISHABLE_KEY });
});

app.post(
  "/create-or-get-customer",
  validateWith(createCustomerSchema),
  async (req, res) => {
    try {
      const { email, name, phone } = req.validated;
      const customer = await hsRequest("/customers", "POST", { email, name, phone });
      res.json({ customerId: customer.customer_id });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.get(
  "/saved-cards/:customerId",
  validateParam("customerId", customerIdSchema),
  async (req, res) => {
    try {
      const data = await hsRequest(
        `/customers/${req.params.customerId}/payment_methods?limit=5`
      );
      const cards = (data.customer_payment_methods ?? []).map((pm) => ({
        id: pm.payment_token,
        last4: pm.card?.last4_digits,
        brand: pm.card?.card_network,
        expiry: `${pm.card?.expiry_month}/${pm.card?.expiry_year}`,
      }));
      res.json({ cards });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.post(
  "/create-payment",
  validateWith(createPaymentSchema),
  async (req, res) => {
    try {
      const { amount, currency, booking, customer, customerId } = req.validated;
      const payment = await hsRequest("/payments", "POST", {
        amount,
        currency: currency || "USD",
        capture_method: "manual",
        confirm: false,
        customer_id: customerId,
        setup_future_usage: "off_session",
        email: customer.email,
        description: `SkyPay: ${booking?.route}`,
        return_url: `${process.env.CLIENT_URL}/payment-status`,
        metadata: { booking_id: booking?.id, route: booking?.route },
      });
      res.json({ clientSecret: payment.client_secret, paymentId: payment.payment_id });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.post(
  "/capture-payment",
  validateWith(capturePaymentSchema),
  async (req, res) => {
    try {
      const { paymentId } = req.validated;
      const captured = await hsRequest(`/payments/${paymentId}/capture`, "POST");
      res.json({ status: captured.status });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.get(
  "/payment-status/:paymentId",
  validateParam("paymentId", paymentIdSchema),
  async (req, res) => {
    try {
      const payment = await hsRequest(
        `/payments/${req.params.paymentId}?force_sync=true`
      );
      res.json({
        status: payment.status,
        amount: payment.amount,
        paymentId: payment.payment_id,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.post(
  "/refund",
  validateWith(refundSchema),
  async (req, res) => {
    try {
      const { paymentId, amount } = req.validated;
      const refund = await hsRequest("/refunds", "POST", {
        payment_id: paymentId,
        ...(amount ? { amount } : {}),
      });
      res.json({ refundId: refund.refund_id, status: refund.status });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.post("/webhook", (req, res) => {
  const event = req.body;

  switch (event.event_type) {
    case "payment_succeeded":
      console.log(`[webhook] payment_succeeded ${event.content?.object?.payment_id} → send confirmation email, issue e-ticket`);
      break;
    case "payment_failed":
      console.log(`[webhook] payment_failed ${event.content?.object?.payment_id} → release inventory, notify user`);
      break;
    case "payment_captured":
      console.log(`[webhook] payment_captured ${event.content?.object?.payment_id} → confirm seat with airline`);
      break;
    case "refund_succeeded":
      console.log(`[webhook] refund_succeeded ${event.content?.object?.refund_id} → send refund email, cancel booking`);
      break;
    default:
      console.log(`[webhook] unhandled event_type: ${event.event_type}`);
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Key: ${HS_API_KEY ? "✅" : "❌ MISSING"}`);
});

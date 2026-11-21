import { Router } from "express";
import Stripe from "stripe";
import { col } from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import { PLANS } from "../constants.js";
import { h } from "../utils.js";

const router = Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw Object.assign(new Error("Stripe is not configured on the server."), { status: 500 });
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Saves the payment and upgrades the user. Safe to call many times:
// the webhook and the success page can both call it for the same session.
async function fulfillSession(session) {
  if (session.payment_status !== "paid") return null;

  const email = session.metadata?.userEmail;
  if (!email) return null;

  const existing = await col.payments().findOne({ stripeSessionId: session.id });
  if (existing) return existing;

  const payment = {
    userEmail: email,
    userName: session.metadata?.userName || "",
    userRole: session.metadata?.userRole || "",
    planName: session.metadata?.planName || "Pro Plan",
    amount: (session.amount_total || 0) / 100,
    currency: session.currency || "usd",
    transactionId: String(session.payment_intent || session.id),
    stripeSessionId: session.id,
    paymentStatus: "paid",
    paidAt: new Date(),
  };

  try {
    await col.payments().insertOne(payment);
  } catch (error) {
    if (error.code === 11000) {
      return col.payments().findOne({ stripeSessionId: session.id });
    }
    throw error;
  }

  await col.users().updateOne(
    { email },
    { $set: { plan: "pro", proSince: new Date(), updatedAt: new Date() } }
  );
  return payment;
}

// POST /payments/checkout  -> returns the Stripe Checkout URL
router.post("/checkout", verifyToken, h(async (req, res) => {
  const plan = PLANS[req.user.role];
  if (!plan) {
    return res.status(400).json({ message: "Only students and tutors can buy a Pro plan." });
  }
  if (req.user.plan === "pro") {
    return res.status(400).json({ message: "You are already on the Pro plan." });
  }

  const stripe = getStripe();
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").split(",")[0].trim();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: req.user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.amount * 100,
          product_data: {
            name: `MentorLagbe ${plan.name}`,
            description:
              req.user.role === "tutor"
                ? "Unlimited tuition posts and a verified badge"
                : "Priority booking and early access to new batches",
          },
        },
      },
    ],
    metadata: {
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      planName: plan.name,
    },
    success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/payment/cancel`,
  });

  res.json({ url: session.url, id: session.id });
}));

// POST /payments/verify  -> called by /payment/success
router.post("/verify", verifyToken, h(async (req, res) => {
  const sessionId = String(req.body?.sessionId || "");
  if (!sessionId.startsWith("cs_")) {
    return res.status(400).json({ message: "Invalid checkout session." });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.metadata?.userEmail !== req.user.email) {
    return res.status(403).json({ message: "This payment belongs to another account." });
  }

  const payment = await fulfillSession(session);
  if (!payment) {
    return res.status(402).json({ message: "Payment has not been completed yet." });
  }
  res.json({ ok: true, payment });
}));

// POST /payments/webhook  -> Stripe calls this. Needs the RAW body (see index.js)
export async function stripeWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(400).send("Webhook secret is not configured.");

  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, req.headers["stripe-signature"], secret);
  } catch (error) {
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      await fulfillSession(event.data.object);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook handling failed:", error);
    res.status(500).send("Webhook handler failed.");
  }
}

export default router;

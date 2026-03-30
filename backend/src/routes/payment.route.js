import { Router } from "express";
// TODO(stripe): uncomment when Stripe is needed again.
// import { protectRoute } from "../middleware/auth.middleware.js";
// import { createPaymentIntent, handleWebhook } from "../controllers/payment.controller.js";

const router = Router();

// TODO(stripe): remove temporary disabled handlers and restore real Stripe handlers.
router.post("/create-intent", (req, res) => {
  res.status(503).json({ error: "Stripe payments are temporarily disabled" });
});
router.post("/webhook", (req, res) => {
  res.status(503).json({ error: "Stripe webhook is temporarily disabled" });
});

export default router;

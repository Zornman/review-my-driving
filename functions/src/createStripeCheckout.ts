import * as functions from "firebase-functions/v2";
import Stripe from "stripe";
import cors from 'cors';
import { environment } from "./environments/environment.js";

const corsHandler = cors({ origin: true });

// ✅ Load secret using `runWith({ secrets: [...] })`
export const createStripeCheckout = functions
  .https.onRequest({ secrets: ["STRIPE_SECRET_KEY"] }, async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        // ✅ Retrieve the secret from Firebase Secrets
        const stripeSecretKey = environment.stripeSecretKey;
        if (!stripeSecretKey) {
          throw new Error("Stripe secret key is missing");
        }
  
        // ✅ Initialize Stripe with the secret key
        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-02-24.acacia" });
  
        const { items } = JSON.parse(req.body);
  
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: items.map((item: { productName: string; price: number; quantity: number }) => ({
            price_data: {
              currency: "usd",
              product_data: { name: item.productName },
              unit_amount: item.price,
            },
            quantity: item.quantity,
          })),
          shipping_address_collection: { allowed_countries: ["US", "CA"] },
          shipping_options: [{ shipping_rate: "shr_12345" }],
          success_url: 'orderConfirmation' + "?id={CHECKOUT_SESSION_ID}",
          cancel_url: 'orderCancel',
        });
  
        res.status(200).json({ sessionId: session.id });
      } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ error: (error as Error).message });
      }
    });
  });

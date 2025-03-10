import * as functions from "firebase-functions/v2";
import Stripe from "stripe";
import cors from 'cors';
import { environment } from "./environments/environment.js";

const corsHandler = cors({ origin: true });

export const createStripePaymentIntent = functions.https.onRequest({ secrets: ["STRIPE_SECRET_KEY"] }, async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const stripeSecretKey = environment.stripeSecretKey;
        if (!stripeSecretKey) {
          throw new Error("Stripe secret key is missing");
        }

        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-02-24.acacia" });

        const { amount } = JSON.parse(req.body || '{}');

        if (!amount) {
          res.status(400).json({ error: 'Amount is required' });
          return;
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          automatic_payment_methods: { enabled: true },
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ error: (error as Error).message });
      }
    });
  });
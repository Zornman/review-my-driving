import * as functions from "firebase-functions/v2";
import Stripe from "stripe";
import cors from 'cors';
import { environment } from "../../src/environments/environment";
const corsHandler = cors({ origin: true });
// ✅ Load secret using `runWith({ secrets: [...] })`
export const stripePaymentIntent = functions
    .https.onRequest({ secrets: ["STRIPE_SECRET_KEY"] }, async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            // ✅ Retrieve the secret from Firebase Secrets
            const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
            if (!stripeSecretKey) {
                throw new Error("Stripe secret key is missing");
            }
            // Initialize Stripe with the correct API version
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
        }
        catch (error) {
            console.error("Stripe Checkout Error:", error);
            res.status(500).json({ error: error.message });
        }
    });
});

import * as functions from "firebase-functions/v2";
import Stripe from "stripe";
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const cancelStripePaymentIntent = functions.https.onRequest({ secrets: ["STRIPE_SECRET_KEY"] }, async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
            if (!stripeSecretKey) {
                throw new Error("Stripe secret key is missing");
            }

            const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-02-24.acacia" });

            const { paymentIntentId } = req.body;

            if (!paymentIntentId) {
                res.status(400).json({ error: 'PaymentIntent ID is required' });
                return;
            }

            // ✅ Cancel the payment
            const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

            res.status(200).json({ success: true, message: "Payment canceled successfully", paymentIntent });
        } catch (error) {
            console.error("Error canceling payment:", error);
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    });
});

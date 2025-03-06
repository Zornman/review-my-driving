import * as functions from "firebase-functions";
import Stripe from "stripe";
import * as dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(functions.config().stripe.secret.key as string, {
  apiVersion: "2025-01-27.acacia",
});

export const createStripeCheckout = functions.https.onRequest(async (req, res) => {
  try {
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
      shipping_options: [
        { shipping_rate: "shr_12345" },
      ],
      success_url: 'orderConfirmation' + "?id={CHECKOUT_SESSION_ID}",
      cancel_url: 'orderCancel',
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

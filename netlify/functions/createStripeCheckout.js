const Stripe = require("stripe");
require("dotenv").config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const { items } = JSON.parse(event.body);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map(item => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.productName },
          unit_amount: item.price
        },
        quantity: item.quantity
      })),
      shipping_address_collection: { allowed_countries: ["US", "CA"] }, // Collect shipping
      shipping_options: [
        { shipping_rate: "shr_12345" }, // Predefined shipping rate in Stripe Dashboard
      ],
      success_url: 'orderConfirmation' + "?id={CHECKOUT_SESSION_ID}",
      cancel_url: 'orderCancel'
    });

    return { statusCode: 200, body: JSON.stringify({ sessionId: session.id }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
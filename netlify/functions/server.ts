import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

// Initialize Stripe with environment variable
const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] as string);

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    const { amount } = JSON.parse(event.body || '{}');

    if (!amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Amount is required' }),
      };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };
  } catch (error) {
    console.error('Stripe Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};

export { handler };

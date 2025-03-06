import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

const api_token = functions.config().printify.api_token;
const shop_id = functions.config().printify.store_id;
const PRINTIFY_SHOP_URL = functions.config().printify.url;

export const getPrintifyOrderDetails = functions.https.onRequest(async (req, res) => {
  // Check if the product ID is provided as a query parameter
  const orderId = req.query.id as string;

  if (!orderId) {
    res.status(400).json({ error: 'order ID is required' });
    return;
  }

  const orders_url = `${PRINTIFY_SHOP_URL}/shops/${shop_id}/orders/${orderId}.json`;

  try {
    const response = await fetch(orders_url, {
      headers: {
        Authorization: `Bearer ${api_token}`, // Use your API token
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }

    const order = await response.json();

    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

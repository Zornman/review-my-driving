const fetch = require('node-fetch');

const api_token = process.env.PRINTIFY_API_KEY;
const shop_id = process.env.PRINTIFY_STORE_ID;
const PRINTIFY_SHOP_URL = process.env.PRINTIFY_URL;

exports.handler = async (event) => {
  // Check if the product ID is provided as a query parameter
  const orderId = event.queryStringParameters?.id;

  if (!orderId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'order ID is required' }),
    };
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

    return {
      statusCode: 200,
      body: JSON.stringify(order),
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch order' }),
    };
  }
};
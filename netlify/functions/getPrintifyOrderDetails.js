const fetch = require('node-fetch');

const api_token = process.env.PRINTIFY_API_KEY;
const shop_id = process.env.PRINTIFY_STORE_ID;

exports.handler = async (event) => {
  // Check if the product ID is provided as a query parameter
  const orderId = event.queryStringParameters?.id;

  if (!orderId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'order ID is required' }),
    };
  }

  const orders_url = `https://api.printify.com/v1/shops/${shop_id}/orders/${orderId}.json`;

  try {
    const response = await fetch(orders_url, {
      headers: {
        Authorization: `Bearer ${api_token}`, // Use your API token
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const orders = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(orders),
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch orders' }),
    };
  }
};
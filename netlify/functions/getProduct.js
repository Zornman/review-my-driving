const fetch = require('node-fetch');

const api_token = process.env.PRINTIFY_API_KEY;
const shop_id = process.env.PRINTIFY_STORE_ID;

exports.handler = async (event) => {
  // Check if the product ID is provided as a query parameter
  const productId = event.queryStringParameters?.id;

  if (!productId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Product ID is required' }),
    };
  }

  const product_url = `https://api.printify.com/v1/shops/${shop_id}/products/${productId}.json`;

  try {
    const response = await fetch(product_url, {
      headers: {
        Authorization: `Bearer ${api_token}`, // Use your API token
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const product = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch product' }),
    };
  }
};
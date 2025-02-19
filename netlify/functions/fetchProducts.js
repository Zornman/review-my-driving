const fetch = require('node-fetch');

const shop_id = process.env.PRINTIFY_STORE_ID;
const products_url = `https://api.printify.com/v1/shops/${shop_id}/products.json`;
const api_token = process.env.PRINTIFY_API_KEY;

exports.handler = async (event) => {
  try {
    const response = await fetch(products_url, {
      headers: {
        Authorization: `Bearer ${api_token}`,
      },
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Allow specific headers
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Allow specific methods
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*', // Ensure headers are also returned on errors
      },
      body: JSON.stringify({ error: 'Failed to fetch products' }),
    };
  }
};
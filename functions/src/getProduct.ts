import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

const api_token = functions.config().printify.api_token;
const shop_id = functions.config().printify.store_id;
const PRINTIFY_SHOP_URL = functions.config().printify.url;

export const getProduct = functions.https.onRequest(async (req, res) => {
  // Check if the product ID is provided as a query parameter
  const productId = req.query.id as string;

  if (!productId) {
    res.status(400).json({ error: 'Product ID is required' });
    return;
  }

  const product_url = `${PRINTIFY_SHOP_URL}/shops/${shop_id}/products/${productId}.json`;

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

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

import fetch from 'node-fetch';
import * as functions from 'firebase-functions';

const shop_id = functions.config().printify.store_id;
const PRINTIFY_SHOP_URL = functions.config().printify.url;
const products_url = `${PRINTIFY_SHOP_URL}/shops/${shop_id}/products.json`;
const api_token = functions.config().printify.api_token;

export const fetchProducts = functions.https.onRequest(async (req, res) => {
  try {
    const response = await fetch(products_url, {
      headers: {
        Authorization: `Bearer ${api_token}`,
      },
    });

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

import fetch from 'node-fetch';
import * as functions from 'firebase-functions/v2';

export const fetchProducts = functions
.https.onRequest({ secrets: ["PRINTIFY_STORE_ID", "PRINTIFY_URL", "PRINTIFY_API_KEY"]}, async (req, res) => {
  try {
    const shop_id = process.env.PRINTIFY_STORE_ID;
    const PRINTIFY_SHOP_URL = process.env.PRINTIFY_URL;
    const products_url = `${PRINTIFY_SHOP_URL}/shops/${shop_id}/products.json`;
    const api_token = process.env.PRINTIFY_API_KEY;

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

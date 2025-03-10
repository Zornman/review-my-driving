import * as functions from 'firebase-functions/v2';
import fetch from 'node-fetch';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const getProduct = functions.https.onRequest(
  {
    secrets: ["PRINTIFY_API_KEY", "PRINTIFY_STORE_ID", "PRINTIFY_URL"]
  },
  async (req, res) => {
    corsHandler(req, res, async () => {
      const api_token = process.env['PRINTIFY_API_KEY'];
      const shop_id = process.env['PRINTIFY_STORE_ID'];
      const PRINTIFY_SHOP_URL = process.env['PRINTIFY_URL'];

      // Check if the product ID is provided as a query parameter
      const productId = req.query['id'] as string;

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
  }
);

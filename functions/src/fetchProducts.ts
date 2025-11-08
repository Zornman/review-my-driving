import fetch from 'node-fetch';
import * as functions from 'firebase-functions/v2';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const fetchProducts = functions
.https.onRequest({ secrets: ["PRINTIFY_STORE_ID", "PRINTIFY_URL", "PRINTIFY_API_KEY"]}, async (req, res) => {
  corsHandler(req, res, async () => { 
    try {
      const shop_id = process.env['PRINTIFY_STORE_ID'];
      const PRINTIFY_SHOP_URL = process.env['PRINTIFY_URL'];
      const api_token = process.env['PRINTIFY_API_KEY'];
      
      const rmd_sticker_url = `${PRINTIFY_SHOP_URL}/shops/${shop_id}/products/678d24e8a3cc78bff80c096d.json`;
      const rmc_sticker_url = `${PRINTIFY_SHOP_URL}/shops/${shop_id}/products/678d28f33e2b154aaa0d2d76.json`;
      const rmd_magnet_url = `${PRINTIFY_SHOP_URL}/shops/${shop_id}/products/678d20878fe0f3ab411076f0.json`;
      const rmc_magnet_url = `${PRINTIFY_SHOP_URL}/shops/${shop_id}/products/678d28122fed338b130cc124.json`;
      const all_product_urls = [rmd_sticker_url, rmc_sticker_url, rmd_magnet_url, rmc_magnet_url];
  
      // Fetch all product data concurrently
      const productFetchPromises = all_product_urls.map((url) =>
        fetch(url, {
          headers: {
            Authorization: `Bearer ${api_token}`,
          },
        }).then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch product from ${url}: ${response.statusText}`);
          }
          return response.json();
        })
      );

      // Wait for all fetches to complete
      const allProducts = await Promise.all(productFetchPromises);

      res.status(200).json(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });
});

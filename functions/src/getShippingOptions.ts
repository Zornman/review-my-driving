import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

const api_token = functions.config().printify.api_token;

export const getShippingOptions = functions.https.onRequest(async (req, res) => {
  // Check if the product ID is provided as a query parameter
  const blueprint_id = req.query.blueprint_id as string;
  const print_provider_id = req.query.print_provider_id as string;

  if (!blueprint_id) {
    res.status(400).json({ error: 'Blueprint ID is required' });
    return;
  }

  if (!print_provider_id) {
    res.status(400).json({ error: 'Print Provider ID is required' });
    return;
  }

  const shipping_rates_url = `https://api.printify.com/v2/catalog/blueprints/${blueprint_id}/print_providers/${print_provider_id}/shipping.json`;

  try {
    const response = await fetch(shipping_rates_url, {
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

import * as functions from 'firebase-functions/v2';
import fetch from 'node-fetch';
import cors from 'cors';
const corsHandler = cors({ origin: true });
export const getShippingOptions = functions
    .https.onRequest({ secrets: ["PRINTIFY_API_KEY"] }, async (req, res) => {
    corsHandler(req, res, async () => {
        const api_token = process.env['PRINTIFY_API_KEY'];
        // Check if the product ID is provided as a query parameter
        const blueprint_id = req.query['blueprint_id'];
        const print_provider_id = req.query['print_provider_id'];
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
        }
        catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    });
});

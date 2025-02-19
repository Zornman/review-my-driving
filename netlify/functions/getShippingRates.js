const fetch = require('node-fetch');

const api_token = process.env.PRINTIFY_API_KEY;

exports.handler = async (event) => {
    // Check if the product ID is provided as a query parameter
    const blueprint_id = event.queryStringParameters?.blueprint_id;
    const print_provider_id = event.queryStringParameters?.print_provider_id;
    const type = event.queryStringParameters?.shipping_type;

    if (!blueprint_id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Blueprint ID is required' }),
        };
    }

    if (!print_provider_id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Print Provider ID is required' }),
        };
    }

    const shipping_rates_url = `https://api.printify.com/v2/catalog/blueprints/${blueprint_id}/print_providers/${print_provider_id}/shipping/${type}.json`;

    try {
        const response = await fetch(shipping_rates_url, {
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
          body: JSON.stringify({ type, shipping_info: data }),
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
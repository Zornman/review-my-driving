const fetch = require('node-fetch');

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const PRINTIFY_STORE_ID = process.env.PRINTIFY_STORE_ID;
const PRINTIFY_SHOP_URL = process.env.PRINTIFY_URL;

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    const { stripeTransactionId, customerInfo, products, shippingMethod } = JSON.parse(event.body || '{}');

    if (!stripeTransactionId || !customerInfo || !products || !shippingMethod) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

    // ✅ Step 1: Format the Order Data for Printify API
    const printifyOrder = {
      external_id: stripeTransactionId, // Use Stripe transaction ID as unique order identifier
      line_items: products.map((product) => ({
        product_id: product.printifyId,
        variant_id: product.variantId,
        quantity: product.quantity
      })),
      shipping_method: shippingMethod, // Pass shipping method from frontend
      is_printify_express: false,
      is_economy_shipping: false,
      send_shipping_notification: true,
      address_to: {
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        country: customerInfo.country,
        region: customerInfo.region,
        address1: customerInfo.address1,
        address2: customerInfo.address2 || '',
        city: customerInfo.city,
        zip: customerInfo.zip
      }
    };

    const response = await fetch(`${PRINTIFY_SHOP_URL}/shops/${PRINTIFY_STORE_ID}/orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PRINTIFY_API_KEY}`,
      },
      body: JSON.stringify(printifyOrder),
    });

    const orderData = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify(orderData) };
    }

    // ✅ Step 2: Send Order to Production
    // const productionResponse = await fetch(
    //   `https://api.printify.com/v1/shops/${PRINTIFY_STORE_ID}/orders/${orderData.id}/send_to_production.json`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: `Bearer ${PRINTIFY_API_KEY}`,
    //     },
    //   }
    // );

    // const productionData = await productionResponse.json();

    // if (!productionResponse.ok) {
    //   return { statusCode: productionResponse.status, body: JSON.stringify(productionData) };
    // }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, orderId: orderData.id, productionStatus: orderData })
    };
  } catch (error) {
    console.error('Printify Order Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message, order: printifyOrder }),
    };
  }
};
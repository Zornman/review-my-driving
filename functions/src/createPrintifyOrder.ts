import * as functions from 'firebase-functions/v2';
import fetch from 'node-fetch';
import cors from 'cors';

const corsHandler = cors({ origin: true });

interface CustomerInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
}

interface Product {
  printifyId: string;
  variantId: string;
  quantity: number;
}

interface PrintifyOrder {
  external_id: string;
  line_items: Array<{ product_id: string; variant_id: string; quantity: number }>;
  shipping_method: string;
  is_printify_express: boolean;
  is_economy_shipping: boolean;
  send_shipping_notification: boolean;
  address_to: CustomerInfo;
}

export const createPrintifyOrder = functions.https.onRequest({secrets: ["PRINTIFY_API_KEY", "PRINTIFY_STORE_ID", "PRINTIFY_URL"]}, async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.status(405).send({ error: 'Method Not Allowed' });
        return;
      }
  
      const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
      const PRINTIFY_STORE_ID = process.env.PRINTIFY_STORE_ID;
      const PRINTIFY_SHOP_URL = process.env.PRINTIFY_URL;
      const { stripeTransactionId, customerInfo, products, shippingMethod } = req.body;
  
      if (!stripeTransactionId || !customerInfo || !products || !shippingMethod) {
        res.status(400).send({ error: 'Missing required parameters' });
        return;
      }
  
      // ✅ Step 1: Format the Order Data for Printify API
      const printifyOrder: PrintifyOrder = {
        external_id: stripeTransactionId, // Use Stripe transaction ID as unique order identifier
        line_items: products.map((product: Product) => ({
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
          Authorization: `Bearer ${PRINTIFY_API_KEY}`, // Use your API token
        },
        body: JSON.stringify(printifyOrder),
      });
  
      const orderData = await response.json();
  
      if (!response.ok) {
        res.status(response.status).send(orderData);
        return;
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
      //   res.status(productionResponse.status).send(productionData);
      //   return;
      // }
  
      res.status(200).send({ success: true, orderId: orderData.id, productionStatus: orderData });
    } catch (error: any) {
      console.error('Printify Order Error:', error);
      res.status(500).send({ error: error.message });
    }
  });
});

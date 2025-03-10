import * as functions from "firebase-functions/v2";
import fetch from 'node-fetch';
import cors from 'cors';

const corsHandler = cors({ origin: true });

interface RequestBody {
    base64QRCode: string;
    originalProductId: string;
    userID: string;
}

export const createCustomProduct =  functions
.https.onRequest({ secrets: ["PRINTIFY_API_KEY", "PRINTIFY_STORE_ID", "PRINTIFY_URL"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    try {
      const api_token = process.env['PRINTIFY_API_KEY'];
      const shop_id = process.env['PRINTIFY_STORE_ID'];
      const PRINTIFY_SHOP_URL = process.env['PRINTIFY_URL'];
        const { base64QRCode, originalProductId, userID } = req.body as RequestBody;
    
        if (!base64QRCode || !originalProductId || !userID) {
          res.status(400).json({ error: 'Missing required fields' });
        }
    
        // Step 1: Upload the QR Code Image
        const uploadResponse = await fetch(`${PRINTIFY_SHOP_URL}/uploads/images.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${api_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_name: `${userID}_QR_Code.png`,
            contents: base64QRCode,
          }),
        });
    
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Image upload failed: ${errorText}`);
        }
    
        const uploadResult = await uploadResponse.json();
        const imageId = uploadResult.id;

        // Step 2: Fetch the Uploaded Image by ID
        const imageResponse = await fetch(`${PRINTIFY_SHOP_URL}/uploads/${imageId}.json`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${api_token}`,
          },
        });

        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          throw new Error(`Failed to fetch image details: ${errorText}`);
        }

        const uploadedImage = await imageResponse.json();

        // Step 3: Retrieve Original Product Details
        const productResponse = await fetch(
          `${PRINTIFY_SHOP_URL}/shops/${shop_id}/products/${originalProductId}.json`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${api_token}`,
            },
          }
        );

        if (!productResponse.ok) {
          const errorText = await productResponse.text();
          throw new Error(`Failed to fetch original product: ${errorText}`);
        }

        const originalProduct = await productResponse.json();

        const updatePrintAreaList = (originalPrintAreas: any[], uploadedImage: any, userID: string) => {
          // Clone the original array to avoid mutating the original object
          const newPrintAreaList = originalPrintAreas.map((area) => {
            // Check if the area contains a placeholder with the image you want to replace
            area.placeholders.forEach((placeholder: any) => {
              placeholder.images.forEach((image: any) => {
                if (image.type === 'image/png' && image.name.includes('QR_Code.png')) {
                  // Update the image details
                  image.id = uploadedImage.id; // New uploaded image ID
                  image.src = uploadedImage.preview_url; // New uploaded image URL
                  image.name = `${userID}_QR_Code.png`; // New name
                }
              });
            });
            return area; // Return the updated area
          });
        
          return newPrintAreaList;
        };
        
        // Usage
        const newPrintAreaList = updatePrintAreaList(originalProduct.print_areas, uploadedImage, userID);

        // Step 5: Create a New Product with Updated QR Code
        const newProductPayload = {
          title: `${originalProduct.title} - ${userID}`,
          description: originalProduct.description,
          tags: originalProduct.tags,
          options: originalProduct.options,
          variants: originalProduct.variants, // Copy variants as-is
          blueprint_id: originalProduct.blueprint_id,
          print_provider_id: originalProduct.print_provider_id,
          print_areas: newPrintAreaList, // Updated print areas,
          visible: false
        };

        const createResponse = await fetch(`${PRINTIFY_SHOP_URL}/shops/${shop_id}/products.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${api_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newProductPayload),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          throw new Error(`Failed to create new product: ${errorText}`);
        }

        const createdProduct = await createResponse.json();
    
        res.status(200).json({
          success: true,
          message: 'New product created with updated QR code.',
          product: createdProduct,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
  });
});
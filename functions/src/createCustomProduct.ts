import * as functions from "firebase-functions/v2";
import fetch from 'node-fetch';
import cors from 'cors';

const corsHandler = cors({ origin: true });

interface RequestBody {
    base64QRCode: string;
    originalProductId: string;
    userID: string;
}

function stripDataUrl(base64: string) {
  const match = base64.match(/^data:.*;base64,(.*)$/);
  return match ? match[1] : base64;
}

function looksLikeQrImage(image: any) {
  const name = (image?.name ?? "").toString().toLowerCase();
  return name.includes("qr") || name.includes("qrcode") || name.includes("qr_code") || name.includes("qr-code");
}

function collectPrintAreaImageIds(printAreas: any[]) {
  const ids: Array<string | number> = [];
  for (const area of printAreas ?? []) {
    for (const placeholder of area?.placeholders ?? []) {
      for (const image of placeholder?.images ?? []) {
        if (image?.id !== undefined && image?.id !== null && image?.id !== "") {
          ids.push(image.id);
        }
      }
    }
  }
  return Array.from(new Set(ids));
}

async function findMissingUploadImageIds(
  printifyShopUrl: string,
  apiToken: string | undefined,
  imageIds: Array<string | number>
) {
  const missing: Array<string | number> = [];
  const unique = Array.from(new Set(imageIds)).filter((id) => id !== null && id !== undefined && id !== "");

  for (const id of unique) {
    const resp = await fetch(`${printifyShopUrl}/uploads/${id}.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (!resp.ok) {
      missing.push(id);
    }
  }

  return missing;
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

        if (!api_token || !shop_id || !PRINTIFY_SHOP_URL) {
          res.status(500).json({ error: 'Missing Printify configuration (PRINTIFY_API_KEY/PRINTIFY_STORE_ID/PRINTIFY_URL).' });
          return;
        }
    
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
            contents: stripDataUrl(base64QRCode),
          }),
        });
    
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Image upload failed: ${errorText}`);
        }
    
        const uploadResult = await uploadResponse.json() as any;
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

        const uploadedImage = (await imageResponse.json()) as any;

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

        const originalProduct = await productResponse.json() as any;

        const updatePrintAreaList = (originalPrintAreas: any[], uploadedImage: any, userID: string) => {
          const newPrintAreaList = JSON.parse(JSON.stringify(originalPrintAreas ?? []));

          const originalImageIds = collectPrintAreaImageIds(newPrintAreaList);

          let totalImages = 0;
          let firstImageRef: any | null = null;

          let replacedCount = 0;
          for (const area of newPrintAreaList) {
            for (const placeholder of area?.placeholders ?? []) {
              for (const image of placeholder?.images ?? []) {
                totalImages++;
                if (!firstImageRef) firstImageRef = image;

                // Only replace images that are clearly intended to be the QR placeholder.
                // This prevents us from accidentally overwriting logo/text layers.
                if (looksLikeQrImage(image)) {
                  image.id = uploadedImage.id;
                  image.src = uploadedImage.preview_url;
                  image.name = `${userID}_QR_Code.png`;
                  replacedCount++;
                }
              }
            }
          }

          if (replacedCount === 0) {
            // Safe fallback: only for templates that have a single image total.
            // If there are multiple images and we can't identify the QR layer, we must not guess.
            if (totalImages === 1 && firstImageRef) {
              firstImageRef.id = uploadedImage.id;
              firstImageRef.src = uploadedImage.preview_url;
              firstImageRef.name = `${userID}_QR_Code.png`;
              replacedCount++;
            } else {
              throw new Error(
                "Could not identify the QR image layer in this template. " +
                "Please ensure the QR placeholder image filename contains 'qr' or 'QR_Code' in Printify."
              );
            }
          }

          functions.logger.info("createCustomProduct: updated print areas", {
            originalProductId,
            uploadedImageId: uploadedImage?.id,
            originalImageIdsCount: originalImageIds.length,
            replacedCount,
          });

          return newPrintAreaList;
        };
        
        // Usage
        const newPrintAreaList = updatePrintAreaList(originalProduct.print_areas, uploadedImage, userID);

        const referencedImageIdsBefore = collectPrintAreaImageIds(newPrintAreaList);
        const missingImageIds = await findMissingUploadImageIds(
          PRINTIFY_SHOP_URL,
          api_token,
          referencedImageIdsBefore
        );

        if (missingImageIds.length > 0) {
          functions.logger.error("createCustomProduct: template references missing upload images", {
            originalProductId,
            uploadedImageId: uploadedImage?.id,
            referencedImageIdsCount: referencedImageIdsBefore.length,
            missingImageIdsCount: missingImageIds.length,
            missingImageIdsSample: missingImageIds.slice(0, 10),
          });

          throw new Error(
            `Template references missing upload images (ids sample: ${missingImageIds.slice(0, 10).join(", ")}). ` +
            "Re-upload/re-attach those images in Printify so the text/art layers are preserved."
          );
        }

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
          const referencedImageIds = collectPrintAreaImageIds(newPrintAreaList);
          functions.logger.error("createCustomProduct: Printify create failed", {
            originalProductId,
            uploadedImageId: uploadedImage?.id,
            referencedImageIdsCount: referencedImageIds.length,
            referencedImageIdsSample: referencedImageIds.slice(0, 10),
            errorText,
          });
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
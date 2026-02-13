import * as functions from "firebase-functions/v2";
import fetch from "node-fetch";
import cors from "cors";
import sharp from "sharp";

const corsHandler = cors({ origin: true });

interface RequestBody {
  base64QRCode: string;
  originalProductId: string;
  userID: string;
  assetId: string;
}

function stripDataUrl(base64: string) {
  const match = base64.match(/^data:.*;base64,(.*)$/);
  return match ? match[1] : base64;
}

function escapeForSvg(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function addUserIdLabelToPngBase64(qrPngBase64: string, assetId: string) {
    const qrBuf = Buffer.from(stripDataUrl(qrPngBase64), "base64");
  
    const meta = await sharp(qrBuf).metadata();
    const width = meta.width ?? 1024;
    const height = meta.height ?? 1024;
  
    // Tighter label bar (less padding)
    const labelHeight = Math.max(10, Math.round(height * 0.10)); // was 0.18 + min 64
    const fontSize = Math.max(14, Math.round(labelHeight * 0.55)); // bigger relative to bar
  
    const safeText = escapeForSvg(assetId);
  
    // Keep the text centered but the bar is shorter so it sits closer to the QR
    const svg = `
      <svg width="${width}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${width}" height="${labelHeight}" fill="#FFFFFF"/>
        <text x="50%" y="50%"
              dominant-baseline="middle"
              text-anchor="middle"
              font-family="Arial, Helvetica, sans-serif"
              font-size="${fontSize}"
              font-weight="700"
              fill="#000000">${safeText}</text>
      </svg>
    `;
  
    const out = await sharp({
      create: {
        width,
        height: height + labelHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
    .composite([
        { input: qrBuf, top: 0, left: 0 },
        { input: Buffer.from(svg), top: height, left: 0 },
    ])
    .png()
    .toBuffer();
  
    return out.toString("base64");
}

export const createCustomBusinessProduct = functions.https.onRequest(
  { secrets: ["PRINTIFY_API_KEY", "PRINTIFY_STORE_ID", "PRINTIFY_URL"] },
  async (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
      }

      try {
        const api_token = process.env["PRINTIFY_API_KEY"];
        const shop_id = process.env["PRINTIFY_STORE_ID"];
        const PRINTIFY_SHOP_URL = process.env["PRINTIFY_URL"];

        const { base64QRCode, originalProductId, userID, assetId } = req.body as RequestBody;

        if (!base64QRCode || !originalProductId || !userID || !assetId ) {
          res.status(400).json({ error: "Missing required fields" });
          return;
        }

        // NEW: build an image that has the QR + userID label at the bottom
        const labeledBase64QRCode = await addUserIdLabelToPngBase64(base64QRCode, assetId);

        // Step 1: Upload the QR Code Image (now labeled)
        const uploadResponse = await fetch(`${PRINTIFY_SHOP_URL}/uploads/images.json`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${api_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_name: `${userID}_QR_Code.png`,
            contents: labeledBase64QRCode,
          }),
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Image upload failed: ${errorText}`);
        }

        const uploadResult = (await uploadResponse.json()) as any;
        const imageId = uploadResult.id;

        // Step 2: Fetch the Uploaded Image by ID
        const imageResponse = await fetch(`${PRINTIFY_SHOP_URL}/uploads/${imageId}.json`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${api_token}`,
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
            method: "GET",
            headers: {
              Authorization: `Bearer ${api_token}`,
            },
          }
        );

        if (!productResponse.ok) {
          const errorText = await productResponse.text();
          throw new Error(`Failed to fetch original product: ${errorText}`);
        }

        const originalProduct = (await productResponse.json()) as any;

        const updatePrintAreaList = (originalPrintAreas: any[], uploadedImage: any, userID: string) => {
          const newPrintAreaList = originalPrintAreas.map((area) => {
            area.placeholders.forEach((placeholder: any) => {
              placeholder.images.forEach((image: any) => {
                if (image.type === "image/png" && image.name.includes("QR_Code.png")) {
                  image.id = uploadedImage.id;
                  image.src = uploadedImage.preview_url;
                  image.name = `${userID}_QR_Code.png`;
                }
              });
            });
            return area;
          });

          return newPrintAreaList;
        };

        const newPrintAreaList = updatePrintAreaList(originalProduct.print_areas, uploadedImage, userID);

        // Step 5: Create a New Product with Updated QR Code
        const newProductPayload = {
          title: `${originalProduct.title} - ${userID}`,
          description: originalProduct.description,
          tags: originalProduct.tags,
          options: originalProduct.options,
          variants: originalProduct.variants,
          blueprint_id: originalProduct.blueprint_id,
          print_provider_id: originalProduct.print_provider_id,
          print_areas: newPrintAreaList,
          visible: false,
        };

        const createResponse = await fetch(`${PRINTIFY_SHOP_URL}/shops/${shop_id}/products.json`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${api_token}`,
            "Content-Type": "application/json",
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
          message: "New product created with updated QR code.",
          product: createdProduct,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  }
);
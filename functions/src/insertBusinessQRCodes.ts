import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import cors from "cors";

const corsHandler = cors({ origin: true });

export const insertBusinessQRCodes = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ message: "Method Not Allowed" });
      return;
    }

    const uri = process.env["MONGO_URI"] as string;
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db("review_my_driving");
      const collection = db.collection("business_QRCodes");

      // Handle both wrapped and unwrapped array formats
      let businessQRCodes = req.body.businessQRCodes || req.body;

      // Ensure it's an array
      if (!Array.isArray(businessQRCodes)) {
        businessQRCodes = [businessQRCodes];
      }

      // Validate input
      if (businessQRCodes.length === 0) {
        res.status(400).json({ message: "Invalid input: businessQRCodes must be a non-empty array" });
        return;
      }

      // Validate required fields
      businessQRCodes.forEach((qrCode: any) => {
        if (!qrCode.assetId || !qrCode.businessId) {
          throw new Error("Each QR code must have assetId and businessId");
        }
      });

      // Prepare documents for insertion
      const docsToInsert = businessQRCodes.map((qrCode: any) => ({
        assetId: qrCode.assetId,
        businessId: qrCode.businessId || null,
        status: qrCode.status || "unassigned",
        createdAt: qrCode.createdAt || new Date(),
        updatedAt: qrCode.updatedAt || new Date(),
        assignedAt: qrCode.assignedAt || null,
        truckId: qrCode.truckId || null,
        metadata: qrCode.metadata || {},
      }));

      // Insert all documents
      const result = await collection.insertMany(docsToInsert);
      const insertedIds = Object.values(result.insertedIds).map((id) => id.toString());

      await client.close();
      res.status(200).json({
        success: true,
        message: `Successfully inserted ${insertedIds.length} business QR codes`,
        insertedCount: insertedIds.length,
        insertedIds: insertedIds
      });
    } catch (error: any) {
      console.error("Error inserting business QR codes:", error);
      res.status(500).json({ message: "Error inserting business QR codes", error: error.message });
    }
  });
});
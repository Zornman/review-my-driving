import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import cors from "cors";
import { isValidObjectIdString, toObjectId } from "./_shared/http.js";

const corsHandler = cors({ origin: true });

type BusinessQrDoc = {
  uniqueId?: string;
  assetId?: string;
  businessId?: string;
  businessName?: string;
  status?: string;
  truckId?: string | null;
  metadata?: any;
};

export const getBusinessQrContext = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET") {
      res.status(405).json({ message: "Method Not Allowed" });
      return;
    }

    const businessId = (req.query.businessId as string | undefined)?.trim();
    const assetId = (req.query.assetId as string | undefined)?.trim();

    if (!businessId || !assetId) {
      res.status(400).json({ message: "Missing required query params: businessId and assetId" });
      return;
    }

    const uri = process.env["MONGO_URI"] as string;
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db("review_my_driving");
      const collection = db.collection<BusinessQrDoc>("business_QRCodes");

      const businessIdCandidates: Array<string | any> = [businessId];
      if (isValidObjectIdString(businessId)) {
        businessIdCandidates.push(toObjectId(businessId, "businessId"));
      }

      // We support a few historical shapes:
      // - businessId stored at root
      // - businessName used as business identifier
      // - metadata.businessId stored
      console.log("getBusinessQrContext lookup", { businessId, assetId });

      const doc = await collection.findOne({
        $and: [
          {
            $or: [{ assetId }, { uniqueId: assetId }],
          },
          {
            $or: [
              ...businessIdCandidates.map((id) => ({ businessId: id })),
              { businessName: businessId },
              { "metadata.businessId": businessId },
            ],
          },
        ],
      });

      const exists = !!doc;
      const truckId = (doc?.truckId ?? null) as string | null;
      const assigned = !!truckId || doc?.status === "assigned";

      await client.close();

      res.status(200).json({
        result: {
          exists,
          assigned,
          truckId,
          status: doc?.status ?? null,
          assetId,
          businessId,
        },
      });
    } catch (error: any) {
      console.error("Error getting business QR context:", error);
      try {
        await client.close();
      } catch {
        // ignore
      }
      res.status(500).json({ message: "Error getting business QR context", error: error?.message ?? String(error) });
    }
  });
});

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
  createdAt?: any;
  updatedAt?: any;
  assignedAt?: any;
  metadata?: any;
};

type StatusFilter = "all" | "assigned" | "unassigned";

export const getBusinessQRCodesByBusiness = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
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
    const status = ((req.query.status as string | undefined)?.trim().toLowerCase() as StatusFilter) || "all";

    if (!businessId) {
      res.status(400).json({ message: "Missing required query param: businessId" });
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

      const businessMatch = {
        $or: [
          ...businessIdCandidates.map((id) => ({ businessId: id })),
          { businessName: businessId },
          { "metadata.businessId": businessId },
        ],
      };

      const statusMatch: any =
        status === "assigned" ? { status: "assigned" } : status === "unassigned" ? { status: "unassigned" } : {};

      const docs = await collection
        .find({ ...businessMatch, ...statusMatch })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(2000)
        .toArray();

      await client.close();

      // Normalize response so frontend can always use `assetId`
      const qrCodes = docs.map((d: any) => ({
        ...d,
        assetId: d?.assetId ?? d?.uniqueId ?? null,
      }));

      res.status(200).json({
        result: {
          businessId,
          count: qrCodes.length,
          qrCodes,
        },
      });
    } catch (error: any) {
      console.error("Error listing business QR codes:", error);
      try {
        await client.close();
      } catch {
        // ignore
      }
      res.status(500).json({ message: "Error listing business QR codes", error: error?.message ?? String(error) });
    }
  });
});

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

type BusinessUserDoc = {
  _id: import("mongodb").ObjectId;
  userId?: string;
  businessName?: string;
  contactEmail?: string;
  phoneNumber?: string;
  role?: string;
  status?: string;
  settings?: {
    notifyOnNewReview?: boolean;
    dailySummaryEmail?: boolean;
    dailyReportsEnabled?: boolean;
    timezone?: string;
    dailyReportEndWindow?: string;
    dailyReportStartWindow?: string;
  };
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
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

    // Keep existing contract (expects both), while adding business_users integration.
    if (!businessId || !assetId) {
      res.status(400).json({ message: "Missing required query params: businessId and assetId" });
      return;
    }

    const uri = process.env["MONGO_URI"] as string;
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db("review_my_driving");

      // --- Existing QR lookup logic (unchanged) ---
      const qrCollection = db.collection<BusinessQrDoc>("business_QRCodes");

      const businessIdCandidates: Array<string | any> = [businessId];
      if (isValidObjectIdString(businessId)) {
        businessIdCandidates.push(toObjectId(businessId, "businessId"));
      }

      console.log("getBusinessQrContext lookup business_QRCodes", { businessId, assetId });

      const qrDoc = await qrCollection.findOne({
        $and: [
          { $or: [{ assetId }, { uniqueId: assetId }] },
          {
            $or: [
              ...businessIdCandidates.map((id) => ({ businessId: id })),
              { businessName: businessId },
              { "metadata.businessId": businessId },
            ],
          },
        ],
      });

      const exists = !!qrDoc;
      const truckId = (qrDoc?.truckId ?? null) as string | null;
      const assigned = !!truckId || qrDoc?.status === "assigned";

      // --- New business_users lookup (by _id == businessId) ---
      // Only attempt if businessId is a valid ObjectId string.
      const businessUsersCollection = db.collection<BusinessUserDoc>("business_users");

      let businessUser: BusinessUserDoc | null = null;
      if (isValidObjectIdString(businessId)) {
        const _id = toObjectId(businessId, "businessId");
        console.log("getBusinessQrContext lookup business_users", { businessId, _id: String(_id) });
        businessUser = await businessUsersCollection.findOne({ _id });
      }

      await client.close();

      res.status(200).json({
        result: {
          // Existing fields
          exists,
          assigned,
          truckId,
          status: qrDoc?.status ?? null,
          assetId,
          businessId,
          // New field: whole business_users record (or null if not found / not ObjectId)
          businessUser,
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

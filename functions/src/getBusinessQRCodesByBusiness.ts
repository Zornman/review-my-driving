import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import cors from "cors";
import { isValidObjectIdString, toObjectId } from "./_shared/http.js";

const corsHandler = cors({ origin: true });

type TruckDoc = {
  _id?: any;
  businessId?: any;
  truckId?: string;
  licensePlate?: string;
  state?: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  registrationExpiration?: any;
  odometer?: { value?: number; unit?: string };
  status?: string;
  assignment?: any;
  audit?: any;
};

type BusinessQrDoc = {
  uniqueId?: string;
  assetId?: string;
  businessId?: string;
  businessName?: string;
  status?: string;
  truckId?: string | null;
  truck?: TruckDoc | null; // <-- populated from trucks collection using truckId
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
      const trucksCollection = db.collection<TruckDoc>("trucks");

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

      // Fetch all trucks referenced by these QR docs (by truck _id stored in qr.truckId), build a lookup map
      const truckObjectIdStrings = Array.from(
        new Set(
          docs
            .map((d) => d?.truckId)
            .filter((t): t is string => typeof t === "string" && t.trim() !== "")
        )
      );

      const validTruckObjectIds = truckObjectIdStrings
        .filter((id) => isValidObjectIdString(id))
        .map((id) => toObjectId(id, "_id"));

      const trucks = validTruckObjectIds.length
        ? await trucksCollection.find({ _id: { $in: validTruckObjectIds } }).toArray()
        : [];

      const trucksById = new Map<string, TruckDoc>();
      for (const t of trucks) {
        if (t?._id) trucksById.set(String(t._id), t);
      }

      await client.close();

      // Normalize response so frontend can always use `assetId`, and include nested `truck`
      const qrCodes = docs.map((d: any) => {
        const resolvedTruckId: string | null = d?.truckId ?? null; // this is the truck document _id (string)
        return {
          ...d,
          assetId: d?.assetId ?? d?.uniqueId ?? null,
          truck: resolvedTruckId ? (trucksById.get(String(resolvedTruckId)) ?? null) : null,
        };
      });

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

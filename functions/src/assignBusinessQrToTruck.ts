import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import cors from "cors";
import { isValidObjectIdString, toObjectId } from "./_shared/http.js";

const corsHandler = cors({ origin: true });

type AssignBody = {
  businessId: string;
  assetId: string;
  truckId: string | null;
  unassign?: boolean;
  actor?: { userId?: string; name?: string };
};

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

export const assignBusinessQrToTruck = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ message: "Method Not Allowed" });
      return;
    }

    const body = (req.body ?? {}) as AssignBody;

    const businessId = (body.businessId ?? "").trim();
    const assetId = (body.assetId ?? "").trim();
    const unassign = body.unassign === true;

    if (!businessId || !assetId) {
      res.status(400).json({ message: "Missing required fields: businessId, assetId" });
      return;
    }

    if (!unassign) {
      const truckId = (body.truckId ?? "").toString().trim();
      if (!truckId) {
        res.status(400).json({ message: "Missing required field: truckId" });
        return;
      }
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

      const filter: any = {
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
      };

      const now = new Date();
      const update: any = {
        $set: {
          updatedAt: now,
          status: unassign ? "unassigned" : "assigned",
          truckId: unassign ? null : body.truckId,
          assignedAt: unassign ? null : now,
        },
      };

      if (body.actor?.userId || body.actor?.name) {
        update.$set["metadata.lastAssignedBy"] = {
          userId: body.actor?.userId ?? null,
          name: body.actor?.name ?? null,
          at: now,
          action: unassign ? "unassign" : "assign",
        };
      }

      const result = await collection.updateOne(filter, update);

      if (result.matchedCount === 0) {
        await client.close();
        res.status(404).json({ message: "QR code not found for businessId/assetId" });
        return;
      }

      await client.close();
      res.status(200).json({
        result: {
          ok: true,
          modifiedCount: result.modifiedCount,
          businessId,
          assetId,
          truckId: unassign ? null : body.truckId,
          status: unassign ? "unassigned" : "assigned",
        },
      });
    } catch (error: any) {
      console.error("Error assigning business QR to truck:", error);
      try {
        await client.close();
      } catch {
        // ignore
      }
      res.status(500).json({ message: "Error assigning business QR to truck", error: error?.message ?? String(error) });
    }
  });
});

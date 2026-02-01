import * as functions from "firebase-functions/v2";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import { getActor, normalizeBusinessId, parseJsonBody, toObjectId } from "./_shared/http.js";
import { writeAuditEvent } from "./_shared/audit.js";

const corsHandler = cors({ origin: true });

export const deleteTruck = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "DELETE") {
      res.status(405).json({ message: "Method Not Allowed" });
      return;
    }

    const uri = process.env["MONGO_URI"] as string;
    const client = new MongoClient(uri);

    try {
      const body = parseJsonBody<any>(req);
      const actor = getActor(body);
      const businessId = normalizeBusinessId(body.businessId, body.businessIdAsObjectId);

      const truckObjectId: ObjectId | null = body.truckObjectId ? toObjectId(body.truckObjectId, "truckObjectId") : null;
      const truckId: string | null = typeof body.truckId === "string" ? body.truckId : null;

      if (!truckObjectId && !truckId) {
        res.status(400).json({ message: "Provide truckObjectId or truckId" });
        return;
      }

      await client.connect();
      const db = client.db("review_my_driving");
      const trucks = db.collection("trucks");

      const filter: any = { businessId, "audit.deletedAt": null };
      if (truckObjectId) filter._id = truckObjectId;
      if (truckId) filter.truckId = truckId;

      const existing = await trucks.findOne(filter);
      if (!existing) {
        await client.close();
        res.status(404).json({ message: "Truck not found" });
        return;
      }

      const now = new Date();

      const result = await trucks.updateOne(
        { _id: existing._id },
        {
          $set: {
            "audit.deletedAt": now,
            "audit.deletedBy": actor,
            "audit.updatedAt": now,
            "audit.updatedBy": actor,
          },
          $inc: { "audit.version": 1 },
        }
      );

      await writeAuditEvent({
        db,
        businessId,
        entityType: "truck",
        entityId: existing._id,
        entityKey: existing.truckId,
        action: "delete",
        actor,
        changes: [{ path: "audit.deletedAt", from: null, to: now }],
        requestId: body.requestId,
      });

      await client.close();
      res.status(200).json({ message: "Truck deleted (soft) successfully!", result });
    } catch (error: any) {
      console.error("Error deleting truck:", error);
      res.status(500).json({ message: "Error deleting truck", error: error.message });
    }
  });
});

import * as functions from "firebase-functions/v2";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import { getActor, normalizeBusinessId, parseJsonBody, toObjectId } from "./_shared/http.js";
import { writeAuditEvent } from "./_shared/audit.js";

const corsHandler = cors({ origin: true });

export const deleteDriver = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
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

      const driverObjectId: ObjectId | null = body.driverObjectId ? toObjectId(body.driverObjectId, "driverObjectId") : null;
      const driverId: string | null = typeof body.driverId === "string" ? body.driverId : null;

      if (!driverObjectId && !driverId) {
        res.status(400).json({ message: "Provide driverObjectId or driverId" });
        return;
      }

      await client.connect();
      const db = client.db("review_my_driving");
      const drivers = db.collection("drivers");

      const filter: any = { businessId, "audit.deletedAt": null };
      if (driverObjectId) filter._id = driverObjectId;
      if (driverId) filter.driverId = driverId;

      const existing = await drivers.findOne(filter);
      if (!existing) {
        await client.close();
        res.status(404).json({ message: "Driver not found" });
        return;
      }

      const now = new Date();

      const result = await drivers.updateOne(
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
        entityType: "driver",
        entityId: existing._id,
        entityKey: existing.driverId,
        action: "delete",
        actor,
        changes: [{ path: "audit.deletedAt", from: null, to: now }],
        requestId: body.requestId,
      });

      await client.close();
      res.status(200).json({ message: "Driver deleted (soft) successfully!", result });
    } catch (error: any) {
      console.error("Error deleting driver:", error);
      res.status(500).json({ message: "Error deleting driver", error: error.message });
    }
  });
});

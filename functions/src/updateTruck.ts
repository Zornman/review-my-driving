import * as functions from "firebase-functions/v2";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import { getActor, getDeep, normalizeBusinessId, parseJsonBody, toObjectId } from "./_shared/http.js";
import { writeAuditEvent, type AuditChange } from "./_shared/audit.js";

const corsHandler = cors({ origin: true });

function buildSetOps(update: any): Record<string, any> {
  const setOps: Record<string, any> = {};

  if (update.truckId !== undefined) setOps.truckId = update.truckId;
  if (update.licensePlate !== undefined) setOps.licensePlate = update.licensePlate;
  if (update.state !== undefined) setOps.state = update.state;
  if (update.make !== undefined) setOps.make = update.make;
  if (update.model !== undefined) setOps.model = update.model;
  if (update.year !== undefined) setOps.year = update.year;
  if (update.vin !== undefined) setOps.vin = update.vin;
  if (update.registrationExpiration !== undefined) {
    setOps.registrationExpiration = update.registrationExpiration ? new Date(update.registrationExpiration) : null;
  }
  if (update.status !== undefined) setOps.status = update.status;

  if (update.odometer?.value !== undefined) setOps["odometer.value"] = update.odometer.value;
  if (update.odometer?.unit !== undefined) setOps["odometer.unit"] = update.odometer.unit;

  // Allow explicit nested assignment patching if provided
  if (update.assignment?.assignedDriverId !== undefined) {
    setOps["assignment.assignedDriverId"] = update.assignment.assignedDriverId;
  }

  return setOps;
}

function toAuditChanges(existing: any, setOps: Record<string, any>): AuditChange[] {
  return Object.entries(setOps).map(([path, to]) => ({
    path,
    from: getDeep(existing, path),
    to,
  }));
}

export const updateTruck = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "PATCH" && req.method !== "PUT") {
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

      const update = body.update ?? {};
      const setOps = buildSetOps(update);

      if (Object.keys(setOps).length === 0) {
        res.status(400).json({ message: "No updatable fields provided" });
        return;
      }

      const now = new Date();
      setOps["audit.updatedAt"] = now;
      setOps["audit.updatedBy"] = actor;

      // If odometer updated, stamp who/when
      if (update.odometer?.value !== undefined || update.odometer?.unit !== undefined) {
        setOps["odometer.updatedAt"] = now;
        setOps["odometer.updatedBy"] = actor;
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

      const changes = toAuditChanges(existing, setOps);

      const result = await trucks.updateOne(
        { _id: existing._id },
        {
          $set: setOps,
          $inc: { "audit.version": 1 },
        }
      );

      await writeAuditEvent({
        db,
        businessId,
        entityType: "truck",
        entityId: existing._id,
        entityKey: existing.truckId,
        action: "update",
        actor,
        changes,
        requestId: body.requestId,
      });

      await client.close();
      res.status(200).json({ message: "Truck updated successfully!", result });
    } catch (error: any) {
      console.error("Error updating truck:", error);
      res.status(500).json({ message: "Error updating truck", error: error.message });
    }
  });
});

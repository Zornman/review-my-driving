import * as functions from "firebase-functions/v2";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import { getActor, getDeep, normalizeBusinessId, parseJsonBody, toObjectId } from "./_shared/http.js";
import { writeAuditEvent, type AuditChange } from "./_shared/audit.js";

const corsHandler = cors({ origin: true });

function normalizeLicenseArray(license: any): any {
  if (!Array.isArray(license)) return license;
  return license.map((l: any) => ({
    ...l,
    expiration: l?.expiration ? new Date(l.expiration) : l?.expiration,
  }));
}

function buildSetOps(update: any): Record<string, any> {
  const setOps: Record<string, any> = {};

  if (update.driverId !== undefined) setOps.driverId = update.driverId;
  if (update.name !== undefined) setOps.name = update.name;
  if (update.phone !== undefined) setOps.phone = update.phone;
  if (update.email !== undefined) setOps.email = update.email;
  if (update.status !== undefined) setOps.status = update.status;

  // Replace arrays in full (simpler + matches UI shapes)
  if (update.license !== undefined) setOps.license = normalizeLicenseArray(update.license);
  if (update.address !== undefined) setOps.address = update.address;

  return setOps;
}

function toAuditChanges(existing: any, setOps: Record<string, any>): AuditChange[] {
  return Object.entries(setOps).map(([path, to]) => ({
    path,
    from: getDeep(existing, path),
    to,
  }));
}

export const updateDriver = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
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

      const driverObjectId: ObjectId | null = body.driverObjectId ? toObjectId(body.driverObjectId, "driverObjectId") : null;
      const driverId: string | null = typeof body.driverId === "string" ? body.driverId : null;

      if (!driverObjectId && !driverId) {
        res.status(400).json({ message: "Provide driverObjectId or driverId" });
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

      const changes = toAuditChanges(existing, setOps);

      const result = await drivers.updateOne(
        { _id: existing._id },
        {
          $set: setOps,
          $inc: { "audit.version": 1 },
        }
      );

      await writeAuditEvent({
        db,
        businessId,
        entityType: "driver",
        entityId: existing._id,
        entityKey: existing.driverId,
        action: "update",
        actor,
        changes,
        requestId: body.requestId,
      });

      await client.close();
      res.status(200).json({ message: "Driver updated successfully!", result });
    } catch (error: any) {
      console.error("Error updating driver:", error);
      res.status(500).json({ message: "Error updating driver", error: error.message });
    }
  });
});

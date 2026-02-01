import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import cors from "cors";
import { getActor, normalizeBusinessId, parseJsonBody } from "./_shared/http.js";
import { writeAuditEvent } from "./_shared/audit.js";

const corsHandler = cors({ origin: true });

export const insertDriver = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
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
      const body = parseJsonBody<any>(req);
      const actor = getActor(body);
      const businessId = normalizeBusinessId(body.businessId, body.businessIdAsObjectId);

      const now = new Date();

      const license = Array.isArray(body.license)
        ? body.license.map((l: any) => ({
            ...l,
            expiration: l?.expiration ? new Date(l.expiration) : l?.expiration,
          }))
        : [];

      const address = Array.isArray(body.address) ? body.address : [];

      const driver = {
        businessId,
        driverId: body.driverId,
        name: body.name,
        phone: body.phone,
        email: body.email ?? null,
        status: body.status ?? "active",
        license,
        address,
        audit: {
          createdAt: now,
          createdBy: actor,
          updatedAt: now,
          updatedBy: actor,
          version: 1,
          deletedAt: null,
          deletedBy: null,
        },
      };

      if (!driver.driverId || typeof driver.driverId !== "string") {
        res.status(400).json({ message: "driverId is required" });
        return;
      }

      await client.connect();
      const db = client.db("review_my_driving");

      const result = await db.collection("drivers").insertOne(driver);

      await writeAuditEvent({
        db,
        businessId,
        entityType: "driver",
        entityId: result.insertedId,
        entityKey: driver.driverId,
        action: "create",
        actor,
        changes: [],
        requestId: body.requestId,
      });

      await client.close();
      res.status(200).json({ message: "Driver inserted successfully!", result });
    } catch (error: any) {
      console.error("Error inserting driver:", error);
      res.status(500).json({ message: "Error inserting driver", error: error.message });
    }
  });
});

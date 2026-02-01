import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import cors from "cors";
import { getActor, normalizeBusinessId, parseJsonBody } from "./_shared/http.js";
import { writeAuditEvent } from "./_shared/audit.js";

const corsHandler = cors({ origin: true });

export const insertTruck = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
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

      const odometerInput = body.odometer;
      const odometer =
        typeof odometerInput === "number"
          ? {
              value: odometerInput,
              unit: "mi",
              updatedAt: now,
              updatedBy: actor,
            }
          : odometerInput ?? {
              value: 0,
              unit: "mi",
              updatedAt: now,
              updatedBy: actor,
            };

      const truck = {
        businessId,
        truckId: body.truckId,
        licensePlate: body.licensePlate,
        state: body.state,
        make: body.make,
        model: body.model,
        year: body.year,
        vin: body.vin,
        registrationExpiration: body.registrationExpiration ? new Date(body.registrationExpiration) : null,
        odometer,
        status: body.status ?? "active",
        assignment: body.assignment ?? {
          assignedDriverId: null,
          assignedAt: null,
          assignedBy: null,
        },
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

      if (!truck.truckId || typeof truck.truckId !== "string") {
        res.status(400).json({ message: "truckId is required" });
        return;
      }

      await client.connect();
      const db = client.db("review_my_driving");

      const result = await db.collection("trucks").insertOne(truck);

      await writeAuditEvent({
        db,
        businessId,
        entityType: "truck",
        entityId: result.insertedId,
        entityKey: truck.truckId,
        action: "create",
        actor,
        changes: [],
        requestId: body.requestId,
      });

      await client.close();
      res.status(200).json({ message: "Truck inserted successfully!", result });
    } catch (error: any) {
      console.error("Error inserting truck:", error);
      res.status(500).json({ message: "Error inserting truck", error: error.message });
    }
  });
});

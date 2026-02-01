import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import cors from "cors";
import { normalizeBusinessId } from "./_shared/http.js";

const corsHandler = cors({ origin: true });

export const getDriversByBusiness = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET") {
      res.status(405).json({ message: "Method Not Allowed" });
      return;
    }

    const uri = process.env["MONGO_URI"] as string;
    const client = new MongoClient(uri);

    try {
      const businessIdRaw = req.query.businessId;
      const businessIdAsObjectId = req.query.businessIdAsObjectId === "true";
      const businessId = normalizeBusinessId(businessIdRaw, businessIdAsObjectId);

      await client.connect();
      const db = client.db("review_my_driving");

      const drivers = await db
        .collection("drivers")
        .find({ businessId, "audit.deletedAt": null })
        .sort({ driverId: 1 })
        .toArray();

      await client.close();
      res.status(200).json({ message: "Drivers retrieved successfully!", drivers });
    } catch (error: any) {
      console.error("Error getting drivers:", error);
      res.status(500).json({ message: "Error getting drivers", error: error.message });
    }
  });
});

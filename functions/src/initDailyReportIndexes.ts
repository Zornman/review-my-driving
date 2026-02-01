import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import cors from "cors";

const corsHandler = cors({ origin: true });

export const initDailyReportIndexes = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
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
      await client.connect();
      const db = client.db("review_my_driving");

      await db.collection("daily_report_tokens").createIndex({ tokenHash: 1 }, { unique: true });
      await db.collection("daily_report_tokens").createIndex({ expiresAt: 1 });
      await db.collection("daily_report_tokens").createIndex({ businessId: 1, truckId: 1, reportDateLocal: 1 });
      await db.collection("daily_report_tokens").createIndex({ businessId: 1, truckId: 1, reportDateLocal: 1, kind: 1 });
      await db
        .collection("daily_report_tokens")
        .createIndex(
          { businessId: 1, truckId: 1, reportDateLocal: 1, kind: 1 },
          { unique: true, partialFilterExpression: { kind: { $exists: true } } }
        );

      await db
        .collection("daily_reports")
        .createIndex({ businessId: 1, truckId: 1, reportDateLocal: 1 }, { unique: true });
      await db.collection("daily_reports").createIndex({ businessId: 1, reportDateLocal: 1, status: 1 });

      await client.close();
      res.status(200).json({ message: "Daily report indexes ensured." });
    } catch (error: any) {
      console.error("Error creating indexes:", error);
      res.status(500).json({ message: "Error creating indexes", error: error.message });
    }
  });
});

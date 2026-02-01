import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import cors from "cors";
import { sha256Hex } from "./_shared/dailyReports.js";

const corsHandler = cors({ origin: true });

export const getDailyReportContextByToken = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET") {
      res.status(405).json({ message: "Method Not Allowed" });
      return;
    }

    const token = typeof req.query.token === "string" ? req.query.token : null;
    if (!token) {
      res.status(400).json({ message: "Missing token" });
      return;
    }

    const tokenHash = sha256Hex(token);

    const uri = process.env["MONGO_URI"] as string;
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db("review_my_driving");

      const tokenDoc: any = await db.collection("daily_report_tokens").findOne({ tokenHash });
      if (!tokenDoc) {
        await client.close();
        res.status(401).json({ message: "Invalid token" });
        return;
      }

      const now = new Date();
      if (tokenDoc.revokedAt) {
        await client.close();
        res.status(401).json({ message: "Token revoked" });
        return;
      }

      if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt) < now) {
        await client.close();
        res.status(401).json({ message: "Token expired" });
        return;
      }

      const truck = await db.collection("trucks").findOne({ _id: tokenDoc.truckObjectId, businessId: tokenDoc.businessId });

      const existingReport = await db.collection("daily_reports").findOne({
        businessId: tokenDoc.businessId,
        truckId: tokenDoc.truckId,
        reportDateLocal: tokenDoc.reportDateLocal,
      });

      await client.close();
      res.status(200).json({
        message: "OK",
        context: {
          businessId: tokenDoc.businessId,
          truckId: tokenDoc.truckId,
          reportDateLocal: tokenDoc.reportDateLocal,
          expiresAt: tokenDoc.expiresAt,
          alreadySubmitted: !!existingReport?.submittedAt,
          truck: truck
            ? {
                truckId: (truck as any).truckId,
                licensePlate: (truck as any).licensePlate,
                state: (truck as any).state,
                make: (truck as any).make,
                model: (truck as any).model,
                year: (truck as any).year,
              }
            : null,
        },
      });
    } catch (error: any) {
      console.error("Error getting daily report context:", error);
      res.status(500).json({ message: "Error getting daily report context", error: error.message });
    }
  });
});

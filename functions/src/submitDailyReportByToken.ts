import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import cors from "cors";
import { parseJsonBody } from "./_shared/http.js";
import { DAILY_REPORT_PHOTO_SLOTS, sha256Hex } from "./_shared/dailyReports.js";

// Allow both www + apex, and local dev if needed.
const allowedOrigins = new Set([
  "https://reviewmydriving.co",
  "https://www.reviewmydriving.co",
]);

const corsHandler = cors({
  origin(origin, callback) {
    // Non-browser / server-to-server calls might have no Origin header.
    if (!origin) return callback(null, true);
    return callback(null, allowedOrigins.has(origin));
  },
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
});

type SubmitDailyReportBody = {
  token: string;
  odometer: number;
  issues?: string;
  issuesSummary?: string;
  // In MVP we don't upload binaries here; later these can be storage paths.
  photos?: Array<{ slot: string; storagePath?: string; url?: string; mongoFileId?: string; fileName?: string; contentType?: string; size?: number }>;
};

export const submitDailyReportByToken = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") {
      // Handle preflight request
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
      const body = parseJsonBody<SubmitDailyReportBody>(req);
      if (!body?.token || typeof body.token !== "string") {
        res.status(400).json({ message: "Missing token" });
        return;
      }

      const odometer = Number(body.odometer);
      if (!Number.isFinite(odometer) || odometer < 0) {
        res.status(400).json({ message: "Invalid odometer" });
        return;
      }

      await client.connect();
      const db = client.db("review_my_driving");

      const tokenHash = sha256Hex(body.token);
      const tokenDoc: any = await db.collection("daily_report_tokens").findOne({ tokenHash });
      if (!tokenDoc) {
        res.status(401).json({ message: "Invalid token" });
        return;
      }

      const now = new Date();
      if (tokenDoc.revokedAt) {
        res.status(401).json({ message: "Token revoked" });
        return;
      }

      if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt) < now) {
        res.status(401).json({ message: "Token expired" });
        return;
      }

      const issues = typeof body.issues === "string" ? body.issues.trim() : "";
      const issuesSummary = typeof body.issuesSummary === "string" ? body.issuesSummary.trim() : "";

      const photos = Array.isArray(body.photos) ? body.photos : [];
      const normalizedPhotos = photos
        .filter(p => p && typeof p.slot === "string")
        .map(p => ({
          slot: p.slot,
          storagePath: typeof p.storagePath === "string" ? p.storagePath : null,
          url: typeof p.url === "string" ? p.url : null,
          mongoFileId: typeof p.mongoFileId === "string" ? p.mongoFileId : null,
          fileName: typeof p.fileName === "string" ? p.fileName : null,
          contentType: typeof p.contentType === "string" ? p.contentType : null,
          size: typeof p.size === "number" ? p.size : null,
        }));

      // Enforce that the report expects 4 slots.
      const slotsProvided = new Set(normalizedPhotos.map(p => p.slot));
      const missingSlots = DAILY_REPORT_PHOTO_SLOTS.filter(s => !slotsProvided.has(s));

      const reportKey = {
        businessId: tokenDoc.businessId,
        truckId: tokenDoc.truckId,
        reportDateLocal: tokenDoc.reportDateLocal,
      };

      const existing = await db.collection("daily_reports").findOne(reportKey);
      if (existing?.submittedAt) {
        res.status(200).json({ message: "Already submitted", alreadySubmitted: true });
        return;
      }

      const reportDoc = {
        ...reportKey,
        driverObjectId: tokenDoc.driverObjectId ?? null,
        submittedAt: now,
        status: "submitted",
        odometer,
        issues,
        issuesSummary,
        photos: normalizedPhotos,
        missingPhotoSlots: missingSlots,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      await db.collection("daily_reports").updateOne(reportKey, { $set: reportDoc }, { upsert: true });
      await db.collection("daily_report_tokens").updateOne({ _id: tokenDoc._id }, { $set: { usedAt: now } });

      await client.close();
      res.status(200).json({ message: "Submitted", submittedAt: now });
    } catch (error: any) {
      console.error("Error submitting daily report:", error);
      res.status(500).json({ message: "Error submitting daily report", error: error.message });
    } finally {
      await client.close().catch(() => {});
    }
  });
});

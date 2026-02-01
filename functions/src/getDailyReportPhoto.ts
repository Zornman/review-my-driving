import * as functions from "firebase-functions/v2";
import { MongoClient, ObjectId, GridFSBucket } from "mongodb";
import cors from "cors";

const corsHandler = cors({ origin: true });

export const getDailyReportPhoto = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET") {
      res.status(405).json({ message: "Method Not Allowed" });
      return;
    }

    const fileIdRaw = typeof req.query["fileId"] === "string" ? (req.query["fileId"] as string) : null;
    if (!fileIdRaw || !/^[a-fA-F0-9]{24}$/.test(fileIdRaw)) {
      res.status(400).json({ message: "Missing or invalid fileId" });
      return;
    }

    const uri = process.env["MONGO_URI"] as string;
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db("review_my_driving");

      const bucketName = "daily_report_photos";
      const fileId = new ObjectId(fileIdRaw);

      const fileDoc: any = await db.collection(`${bucketName}.files`).findOne({ _id: fileId });
      if (!fileDoc) {
        await client.close();
        res.status(404).json({ message: "Not found" });
        return;
      }

      const contentType = typeof fileDoc?.contentType === "string" ? fileDoc.contentType : (typeof fileDoc?.metadata?.contentType === "string" ? fileDoc.metadata.contentType : "application/octet-stream");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

      const bucket = new GridFSBucket(db, { bucketName });
      const downloadStream = bucket.openDownloadStream(fileId);

      downloadStream.on("error", async () => {
        try {
          await client.close();
        } catch {
          // ignore
        }
        if (!res.headersSent) res.status(404).json({ message: "Not found" });
      });

      downloadStream.on("end", async () => {
        try {
          await client.close();
        } catch {
          // ignore
        }
      });

      downloadStream.pipe(res);
    } catch (error: any) {
      console.error("Error getting daily report photo:", error);
      try {
        await client.close();
      } catch {
        // ignore
      }
      if (!res.headersSent) {
        res.status(500).json({ message: "Error getting daily report photo", error: error.message });
      }
    }
  });
});

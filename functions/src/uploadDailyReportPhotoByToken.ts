import * as functions from "firebase-functions/v2";
import { MongoClient, GridFSBucket } from "mongodb";
import cors from "cors";
import Busboy from "busboy";
import { sha256Hex, DAILY_REPORT_PHOTO_SLOTS } from "./_shared/dailyReports.js";

const corsHandler = cors({ origin: true });

type UploadResult = {
  message: string;
  photo: {
    slot: string;
    mongoFileId: string;
    fileName: string | null;
    contentType: string | null;
    size: number;
  };
};

export const uploadDailyReportPhotoByToken = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ message: "Method Not Allowed" });
      return;
    }

    const contentTypeHeader = req.headers["content-type"];
    if (typeof contentTypeHeader !== "string" || !contentTypeHeader.startsWith("multipart/form-data")) {
      res.status(400).json({ message: "Expected multipart/form-data" });
      return;
    }

    const uri = process.env["MONGO_URI"] as string;
    const client = new MongoClient(uri);

    try {
      const maxBytes = 8 * 1024 * 1024;

      const fields: Record<string, string> = {};
      let fileBuffer: Buffer | null = null;
      let fileName: string | null = null;
      let fileMime = "";
      let fileSize = 0;

      const busboy = Busboy({
        headers: req.headers,
        limits: {
          files: 1,
          fileSize: maxBytes,
          fields: 10,
        },
      });

      busboy.on("field", (name: string, value: string) => {
        fields[name] = value;
      });

      busboy.on("file", (_name: string, fileStream: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
        fileName = info?.filename ?? null;
        fileMime = info?.mimeType ?? "";

        const chunks: Buffer[] = [];
        fileStream.on("data", (d: Buffer) => {
          fileSize += d.length;
          chunks.push(d);
        });
        fileStream.on("limit", () => {
          // busboy will continue but we can fail after finish
        });
        fileStream.on("end", () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      const finished = new Promise<void>((resolve, reject) => {
        busboy.on("finish", () => resolve());
        busboy.on("error", (err: any) => reject(err));
      });

      // In Firebase Functions, the request stream can be consumed by middleware.
      // Using rawBody is the most reliable way to parse multipart data.
      const rawBody: any = (req as any).rawBody;
      if (!rawBody) {
        res.status(400).json({ message: "Missing raw request body" });
        return;
      }

      busboy.end(rawBody);
      await finished;

      const token = typeof fields["token"] === "string" ? fields["token"] : null;
      const slot = typeof fields["slot"] === "string" ? fields["slot"] : null;

      if (!token) {
        res.status(400).json({ message: "Missing token" });
        return;
      }

      if (!slot || !DAILY_REPORT_PHOTO_SLOTS.includes(slot as any)) {
        res.status(400).json({ message: "Invalid slot" });
        return;
      }

      if (!fileBuffer || fileSize <= 0) {
        res.status(400).json({ message: "Missing file" });
        return;
      }

      if (fileSize > maxBytes) {
        res.status(400).json({ message: "File too large" });
        return;
      }

      if (!fileMime || !fileMime.startsWith("image/")) {
        res.status(400).json({ message: "Only image uploads are allowed" });
        return;
      }

      await client.connect();
      const db = client.db("review_my_driving");

      const tokenHash = sha256Hex(token);
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

      const bucket = new GridFSBucket(db, { bucketName: "daily_report_photos" });

      const uploadStream = bucket.openUploadStream(`daily-report-${tokenDoc.reportDateLocal}-${tokenDoc.truckId}-${slot}`, {
        contentType: fileMime,
        metadata: {
          businessId: tokenDoc.businessId,
          truckId: tokenDoc.truckId,
          reportDateLocal: tokenDoc.reportDateLocal,
          driverObjectId: tokenDoc.driverObjectId ?? null,
          slot,
          originalFileName: fileName,
          uploadedAt: now,
          size: fileSize,
        },
      });

      await new Promise<void>((resolve, reject) => {
        uploadStream.on("error", reject);
        uploadStream.on("finish", () => resolve());
        uploadStream.end(fileBuffer);
      });

      const mongoFileId = String(uploadStream.id);

      await client.close();

      const out: UploadResult = {
        message: "Uploaded",
        photo: {
          slot,
          mongoFileId,
          fileName,
          contentType: fileMime,
          size: fileSize,
        },
      };

      res.status(200).json(out);
    } catch (error: any) {
      console.error("Error uploading daily report photo:", error);
      try {
        await client.close();
      } catch {
        // ignore
      }
      res.status(500).json({ message: "Error uploading daily report photo", error: error.message });
    }
  });
});

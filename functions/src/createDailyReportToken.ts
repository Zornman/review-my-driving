import * as functions from "firebase-functions/v2";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import nodemailer from "nodemailer";
import { normalizeBusinessId, parseJsonBody, toObjectId } from "./_shared/http.js";
import { generateOpaqueToken, isValidReportDateLocal, sha256Hex } from "./_shared/dailyReports.js";

const corsHandler = cors({ origin: true });

type CreateDailyReportTokenBody = {
  businessId: any;
  businessIdAsObjectId?: boolean;

  // identify truck
  truckObjectId?: string;
  truckId?: string;

  // required
  reportDateLocal: string; // YYYY-MM-DD in business timezone

  // optional
  expiresInHours?: number; // default 48
  sendEmail?: boolean; // default true
  emailToOverride?: string; // for testing
  kind?: "manual" | "scheduled";
};

export const createDailyReportToken = functions.https.onRequest(
  { secrets: ["MONGO_URI", "EMAIL_USER", "EMAIL_PASS", "APP_BASE_URL"] },
  async (req, res) => {
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
        const body = parseJsonBody<CreateDailyReportTokenBody>(req);
        const businessId = normalizeBusinessId(body.businessId, body.businessIdAsObjectId);

        if (!isValidReportDateLocal(body.reportDateLocal)) {
          res.status(400).json({ message: "reportDateLocal must be YYYY-MM-DD" });
          return;
        }

        const truckObjectId: ObjectId | null = body.truckObjectId ? toObjectId(body.truckObjectId, "truckObjectId") : null;
        const truckId: string | null = typeof body.truckId === "string" ? body.truckId : null;

        if (!truckObjectId && !truckId) {
          res.status(400).json({ message: "Provide truckObjectId or truckId" });
          return;
        }

        const expiresInHours = typeof body.expiresInHours === "number" && body.expiresInHours > 0 ? body.expiresInHours : 48;
        const sendEmail = body.sendEmail !== false;
        const kind = body.kind === "scheduled" ? "scheduled" : "manual";

        await client.connect();
        const db = client.db("review_my_driving");

        // Ensure indexes exist (safe to call repeatedly; Mongo is smart about it)
        await db.collection("daily_report_tokens").createIndex({ tokenHash: 1 }, { unique: true });
        await db
          .collection("daily_reports")
          .createIndex({ businessId: 1, truckId: 1, reportDateLocal: 1 }, { unique: true });

        const trucks = db.collection("trucks");
        const drivers = db.collection("drivers");

        const truckFilter: any = { businessId, "audit.deletedAt": null };
        if (truckObjectId) truckFilter._id = truckObjectId;
        if (truckId) truckFilter.truckId = truckId;

        const truck = await trucks.findOne(truckFilter);
        if (!truck) {
          await client.close();
          res.status(404).json({ message: "Truck not found" });
          return;
        }

        const assignedDriverIdRaw = truck?.assignment?.assignedDriverId;
        const assignedDriverObjectId = assignedDriverIdRaw instanceof ObjectId ? assignedDriverIdRaw : null;

        if (!assignedDriverObjectId) {
          await client.close();
          res.status(409).json({ message: "Truck has no assigned driver" });
          return;
        }

        const driver = await drivers.findOne({ _id: assignedDriverObjectId, businessId, "audit.deletedAt": null });
        if (!driver) {
          await client.close();
          res.status(404).json({ message: "Assigned driver not found" });
          return;
        }

        const emailTo = typeof body.emailToOverride === "string" ? body.emailToOverride : (driver as any).email;
        if (sendEmail && (!emailTo || typeof emailTo !== "string")) {
          await client.close();
          res.status(409).json({ message: "Assigned driver has no email" });
          return;
        }

        const token = generateOpaqueToken();
        const tokenHash = sha256Hex(token);

        const now = new Date();
        const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

        const truckIdResolved = (truck as any).truckId ?? truckId ?? null;

        const tokenDoc = {
          tokenHash,
          kind,
          businessId,
          truckId: truckIdResolved,
          truckObjectId: (truck as any)._id,
          reportDateLocal: body.reportDateLocal,
          driverObjectId: assignedDriverObjectId,
          sentTo: sendEmail ? emailTo : null,
          sentAt: sendEmail ? now : null,
          createdAt: now,
          expiresAt,
          usedAt: null,
          revokedAt: null,
        };

        await db.collection("daily_report_tokens").insertOne(tokenDoc);

        const appBaseUrl = (process.env["APP_BASE_URL"] as string | undefined)?.replace(/\/$/, "");
        if (!appBaseUrl) {
          await client.close();
          res.status(500).json({ message: "Missing APP_BASE_URL secret" });
          return;
        }

        const link = `${appBaseUrl}/daily-report?token=${encodeURIComponent(token)}`;

        if (sendEmail) {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env["EMAIL_USER"],
              pass: process.env["EMAIL_PASS"],
            },
          });

          const subject = `Daily Truck Report Required (${body.reportDateLocal})`;
          const html = `
            <div style="font-family: Arial, sans-serif;">
              <h2 style="margin:0 0 8px;">Daily Truck Report</h2>
              <p style="margin:0 0 10px;">Please submit your end-of-day report for:</p>
              <ul>
                <li><strong>Truck:</strong> ${(truck as any).truckId ?? ""} ${(truck as any).licensePlate ? `(${(truck as any).licensePlate})` : ""}</li>
                <li><strong>Date:</strong> ${body.reportDateLocal}</li>
              </ul>
              <p style="margin:14px 0;">
                <a href="${link}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#3f51b5;color:#fff;text-decoration:none;">Open Daily Report</a>
              </p>
              <p style="font-size:12px;color:#666;">This link expires in ${expiresInHours} hours.</p>
            </div>
          `;

          await transporter.sendMail({
            from: "donotreply@reviewmydriving.co",
            to: emailTo,
            subject,
            html,
          });
        }

        await client.close();
        res.status(200).json({ message: "Daily report link created", link, expiresAt });
      } catch (error: any) {
        console.error("Error creating daily report token:", error);
        res.status(500).json({ message: "Error creating daily report token", error: error.message });
      }
    });
  }
);

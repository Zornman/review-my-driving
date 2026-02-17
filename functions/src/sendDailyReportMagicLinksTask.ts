import { DateTime } from "luxon";
import nodemailer from "nodemailer";
import { MongoClient, ObjectId } from "mongodb";
import { generateOpaqueToken, sha256Hex } from "./_shared/dailyReports.js";

function isValidIanaTimezone(value: any): value is string {
  return typeof value === "string" && value.length > 0 && DateTime.local().setZone(value).isValid;
}

function isValidHHmm(value: any): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

function normalizeBusinessIdForRefs(raw: any): any {
  if (raw instanceof ObjectId) return raw;
  if (typeof raw === "string" && /^[a-fA-F0-9]{24}$/.test(raw)) return new ObjectId(raw);
  return raw;
}

export async function sendDailyReportMagicLinksTask(params: {
  MONGO_URI: string;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  APP_BASE_URL: string;
}): Promise<{ businessesProcessed: number; emailsSent: number; tokensCreated: number; skipped: number }>
{
  const { MONGO_URI, EMAIL_USER, EMAIL_PASS, APP_BASE_URL } = params;

  const appBaseUrl = APP_BASE_URL.replace(/\/$/, "");
  const client = new MongoClient(MONGO_URI);

  let emailsSent = 0;
  let tokensCreated = 0;
  let businessesProcessed = 0;
  let skipped = 0;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  try {
    await client.connect();
    const db = client.db("review_my_driving");

    const businesses = await db
      .collection("business_users")
      .find({ "settings.dailyReportsEnabled": true })
      .toArray();

    for (const business of businesses) {
      businessesProcessed += 1;

      const settings: any = (business as any).settings ?? {};
      const timezone = settings.timezone ?? (business as any).timezone;
      const windowStart = settings.dailyReportStartWindow ?? settings.dailyReportsStartTime;
      const windowEnd = settings.dailyReportEndWindow ?? settings.dailyReportsEndTime;

      if (!isValidIanaTimezone(timezone) || !isValidHHmm(windowStart) || !isValidHHmm(windowEnd)) {
        skipped += 1;
        continue;
      }

      const nowLocal = DateTime.now().setZone(timezone);
      const reportDateLocal = nowLocal.toISODate();
      if (!reportDateLocal) {
        skipped += 1;
        continue;
      }

      const startLocal = DateTime.fromISO(`${reportDateLocal}T${windowStart}`, { zone: timezone });
      let endLocal = DateTime.fromISO(`${reportDateLocal}T${windowEnd}`, { zone: timezone });
      if (endLocal <= startLocal) endLocal = endLocal.plus({ days: 1 });

      if (nowLocal < startLocal || nowLocal > endLocal) {
        continue;
      }

      const businessIdForRefs = normalizeBusinessIdForRefs((business as any).businessId ?? (business as any)._id);

      const trucks = await db
        .collection("trucks")
        .find({ businessId: businessIdForRefs, "audit.deletedAt": null, "assignment.assignedDriverId": { $ne: null } })
        .toArray();

      for (const truck of trucks) {
        const truckId = (truck as any).truckId;
        const driverObjectId = (truck as any)?.assignment?.assignedDriverId as ObjectId | null;

        if (!truckId || !(driverObjectId instanceof ObjectId)) {
          skipped += 1;
          continue;
        }

        const existingReport = await db.collection("daily_reports").findOne({
          businessId: businessIdForRefs,
          truckId,
          reportDateLocal,
          status: { $in: ["submitted", "waived"] },
        });

        if (existingReport) continue;

        const existingToken = await db.collection("daily_report_tokens").findOne(
          {
            businessId: businessIdForRefs,
            truckId,
            reportDateLocal,
            kind: "scheduled",
            revokedAt: null,
            usedAt: null,
            expiresAt: { $gt: new Date() },
          },
          { sort: { createdAt: -1 } }
        );

        if (existingToken) continue;

        const driver: any = await db.collection("drivers").findOne({ _id: driverObjectId, businessId: businessIdForRefs, "audit.deletedAt": null });
        const emailTo = driver?.email;
        if (!emailTo || typeof emailTo !== "string") {
          skipped += 1;
          continue;
        }

        const token = generateOpaqueToken();
        const tokenHash = sha256Hex(token);

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        await db.collection("daily_report_tokens").insertOne({
          tokenHash,
          kind: "scheduled",
          businessId: businessIdForRefs,
          truckId,
          truckObjectId: (truck as any)._id,
          reportDateLocal,
          driverObjectId,
          sentTo: emailTo,
          sentAt: now,
          createdAt: now,
          expiresAt,
          usedAt: null,
          revokedAt: null,
        });

        tokensCreated += 1;

        const link = `${appBaseUrl}/daily-report?token=${encodeURIComponent(token)}`;

        const subject = `Daily Truck Report Required (${reportDateLocal})`;
        const html = `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="margin:0 0 8px;">Daily Truck Report</h2>
            <p style="margin:0 0 10px;">Please submit your end-of-day report for:</p>
            <ul>
              <li><strong>Truck:</strong> ${(truck as any).truckId ?? ""} ${(truck as any).licensePlate ? `(${(truck as any).licensePlate})` : ""}</li>
              <li><strong>Date:</strong> ${reportDateLocal}</li>
            </ul>
            <p style="margin:14px 0;">
              <a href="${link}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#3f51b5;color:#fff;text-decoration:none;">Open Daily Report</a>
            </p>
            <p style="font-size:12px;color:#666;">This link expires in 48 hours.</p>
          </div>
        `;

        await transporter.sendMail({
          from: EMAIL_USER,
          to: emailTo,
          subject,
          html,
        });

        emailsSent += 1;
      }
    }

    return { businessesProcessed, emailsSent, tokensCreated, skipped };
  } finally {
    await client.close();
  }
}

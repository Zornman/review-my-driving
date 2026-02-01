import * as functions from "firebase-functions/v2";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import { normalizeBusinessId } from "./_shared/http.js";
import { isValidReportDateLocal } from "./_shared/dailyReports.js";

const corsHandler = cors({ origin: true });

function parseBoolean(value: any): boolean {
  return value === true || value === "true" || value === "1" || value === 1;
}

function parseDateLocalToUtcMidnight(dateLocal: string): Date {
  // dateLocal is YYYY-MM-DD. Treat it as a logical date and step by 1 day in UTC.
  return new Date(`${dateLocal}T00:00:00.000Z`);
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function formatUtcDateToDateLocal(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type DailyReportsSummaryRow = {
  reportDateLocal: string;
  truckId: string | null;
  truckObjectId: any;
  driverObjectId: any;
  driverName: string | null;
  driverEmail: string | null;
  truckLabel: string | null;

  status: "submitted" | "waived" | "pending" | "missing";

  token?: {
    kind: string;
    sentAt: any;
    expiresAt: any;
    usedAt: any;
  } | null;

  report?: {
    submittedAt: any;
    odometer: number | null;
    issues: string | null;
    issuesSummary: string | null;
    photos: Array<{ slot: string; url?: string | null; storagePath?: string | null; fileName?: string | null; contentType?: string | null; size?: number | null }>;
    missingPhotoSlots?: string[];
  } | null;
};

type DailyReportsSummaryDay = {
  reportDateLocal: string;
  totals: {
    expected: number;
    submitted: number;
    waived: number;
    pending: number;
    missing: number;
  };
  rows: DailyReportsSummaryRow[];
};

export const getDailyReportsSummary = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET") {
      res.status(405).json({ message: "Method Not Allowed" });
      return;
    }

    const businessIdRaw = (req.query["businessId"] as any) ?? null;
    const businessIdAsObjectId = parseBoolean(req.query["businessIdAsObjectId"]);

    const startDateLocal = typeof req.query["startDateLocal"] === "string" ? (req.query["startDateLocal"] as string) : null;
    const endDateLocal = typeof req.query["endDateLocal"] === "string" ? (req.query["endDateLocal"] as string) : null;

    if (!startDateLocal || !endDateLocal || !isValidReportDateLocal(startDateLocal) || !isValidReportDateLocal(endDateLocal)) {
      res.status(400).json({ message: "startDateLocal and endDateLocal are required (YYYY-MM-DD)" });
      return;
    }

    let businessId: string | ObjectId;
    try {
      businessId = normalizeBusinessId(businessIdRaw, businessIdAsObjectId);
    } catch (e: any) {
      res.status(400).json({ message: e?.message ?? "Invalid businessId" });
      return;
    }

    const startUtc = parseDateLocalToUtcMidnight(startDateLocal);
    const endUtc = parseDateLocalToUtcMidnight(endDateLocal);

    if (endUtc < startUtc) {
      res.status(400).json({ message: "endDateLocal must be >= startDateLocal" });
      return;
    }

    const dayCount = Math.floor((endUtc.getTime() - startUtc.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    if (dayCount > 31) {
      res.status(400).json({ message: "Date range too large (max 31 days)" });
      return;
    }

    const uri = process.env["MONGO_URI"] as string;
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db("review_my_driving");

      const trucks = await db
        .collection("trucks")
        .find({ businessId, "audit.deletedAt": null, "assignment.assignedDriverId": { $ne: null } })
        .project({ truckId: 1, licensePlate: 1, assignment: 1 })
        .toArray();

      const driverIds = Array.from(
        new Set(
          trucks
            .map((t: any) => t?.assignment?.assignedDriverId)
            .filter((id: any) => id instanceof ObjectId)
            .map((id: any) => String(id))
        )
      ).map((s: string) => new ObjectId(s));

      const drivers = driverIds.length
        ? await db
            .collection("drivers")
            .find({ businessId, "audit.deletedAt": null, _id: { $in: driverIds } })
            .project({ firstName: 1, lastName: 1, email: 1 })
            .toArray()
        : [];

      const driversById = new Map<string, any>();
      for (const d of drivers as any[]) driversById.set(String(d._id), d);

      const reports = await db
        .collection("daily_reports")
        .find({ businessId, reportDateLocal: { $gte: startDateLocal, $lte: endDateLocal } })
        .project({ reportDateLocal: 1, truckId: 1, status: 1, submittedAt: 1, odometer: 1, issues: 1, issuesSummary: 1, photos: 1, missingPhotoSlots: 1 })
        .toArray();

      const reportsByKey = new Map<string, any>();
      for (const r of reports as any[]) {
        const key = `${r.reportDateLocal}|${r.truckId}`;
        reportsByKey.set(key, r);
      }

      const tokens = await db
        .collection("daily_report_tokens")
        .find({ businessId, reportDateLocal: { $gte: startDateLocal, $lte: endDateLocal }, revokedAt: null })
        .project({ reportDateLocal: 1, truckId: 1, kind: 1, sentAt: 1, expiresAt: 1, usedAt: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .toArray();

      const tokensByKey = new Map<string, any>();
      for (const t of tokens as any[]) {
        const key = `${t.reportDateLocal}|${t.truckId}`;
        if (!tokensByKey.has(key)) tokensByKey.set(key, t);
      }

      const days: DailyReportsSummaryDay[] = [];

      for (let i = 0; i < dayCount; i += 1) {
        const dateLocal = formatUtcDateToDateLocal(addDaysUtc(startUtc, i));

        const rows: DailyReportsSummaryRow[] = trucks.map((t: any) => {
          const truckId = typeof t.truckId === "string" ? t.truckId : null;
          const driverObjectId = t?.assignment?.assignedDriverId ?? null;

          const driver = driverObjectId instanceof ObjectId ? driversById.get(String(driverObjectId)) : null;
          const driverName = driver ? `${driver.firstName ?? ""} ${driver.lastName ?? ""}`.trim() : null;
          const driverEmail = driver?.email ?? null;

          const truckLabel = truckId
            ? `${truckId}${t.licensePlate ? ` (${t.licensePlate})` : ""}`
            : (t.licensePlate ? `(${t.licensePlate})` : null);

          const key = `${dateLocal}|${truckId}`;
          const report = truckId ? reportsByKey.get(key) : null;
          const token = truckId ? tokensByKey.get(key) : null;

          let status: DailyReportsSummaryRow["status"] = "missing";
          if (report?.status === "waived") status = "waived";
          else if (report?.status === "submitted" || report?.submittedAt) status = "submitted";
          else if (token && !token.usedAt && (!token.expiresAt || new Date(token.expiresAt) > new Date())) status = "pending";

          return {
            reportDateLocal: dateLocal,
            truckId,
            truckObjectId: t._id,
            driverObjectId,
            driverName,
            driverEmail,
            truckLabel,
            status,
            token: token
              ? {
                  kind: token.kind,
                  sentAt: token.sentAt ?? null,
                  expiresAt: token.expiresAt ?? null,
                  usedAt: token.usedAt ?? null,
                }
              : null,
            report: report
              ? {
                  submittedAt: report.submittedAt ?? null,
                  odometer: typeof report.odometer === "number" ? report.odometer : null,
                  issues: typeof report.issues === "string" ? report.issues : null,
                  issuesSummary: typeof report.issuesSummary === "string" ? report.issuesSummary : null,
                  photos: Array.isArray(report.photos) ? report.photos : [],
                  missingPhotoSlots: Array.isArray(report.missingPhotoSlots) ? report.missingPhotoSlots : [],
                }
              : null,
          };
        });

        const totals = {
          expected: rows.length,
          submitted: rows.filter(r => r.status === "submitted").length,
          waived: rows.filter(r => r.status === "waived").length,
          pending: rows.filter(r => r.status === "pending").length,
          missing: rows.filter(r => r.status === "missing").length,
        };

        days.push({ reportDateLocal: dateLocal, totals, rows });
      }

      await client.close();
      res.status(200).json({ message: "OK", result: { businessId, startDateLocal, endDateLocal, days } });
    } catch (error: any) {
      console.error("Error getting daily reports summary:", error);
      try {
        await client.close();
      } catch {
        // ignore
      }
      res.status(500).json({ message: "Error getting daily reports summary", error: error.message });
    }
  });
});

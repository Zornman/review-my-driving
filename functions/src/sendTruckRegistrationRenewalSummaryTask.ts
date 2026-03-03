import nodemailer from "nodemailer";
import { MongoClient, ObjectId } from "mongodb";
import { DateTime } from "luxon";

function normalizeBusinessIdForRefs(raw: any): any {
  if (raw instanceof ObjectId) return raw;
  if (typeof raw === "string" && /^[a-fA-F0-9]{24}$/.test(raw)) return new ObjectId(raw);
  return raw;
}

function isValidEmail(value: any): value is string {
  return typeof value === "string" && value.includes("@") && value.length <= 320;
}

function formatTruckLabel(truck: any): string {
  const id = truck?.truckId ? String(truck.truckId) : String(truck?._id ?? "");
  const plate = truck?.licensePlate ? String(truck.licensePlate) : "";
  const state = truck?.state ? String(truck.state) : "";
  const platePart = plate ? `${plate}${state ? ` (${state})` : ""}` : "";
  return platePart ? `${id} - ${platePart}` : id;
}

function monthKeyUtc(dt: any): string {
  return dt.toFormat("yyyy-LL");
}

function compareMonthKey(a: string, b: string): number {
  return a.localeCompare(b);
}

function renderHtml(params: {
  businessName: string;
  windowDays: number;
  overdue: Array<{ label: string; expiryMonth: string; monthsPastDue: number }>;
  dueSoon: Array<{ label: string; expiryMonth: string; monthsUntilDue: number }>;
  dueThisMonth: Array<{ label: string; expiryMonth: string }>;
}): string {
  const { businessName, windowDays, overdue, dueSoon, dueThisMonth } = params;

  const section = (title: string, items: Array<{ line: string }>) => {
    if (items.length === 0) return "";
    return `
      <h3 style="margin:16px 0 8px;">${title} (${items.length})</h3>
      <ul style="margin:0;padding-left:18px;">
        ${items.map((x) => `<li style="margin:4px 0;">${x.line}</li>`).join("")}
      </ul>
    `;
  };

  const overdueItems = overdue.map((t) => ({
    line: `<strong>${t.label}</strong> — expired <strong>${t.expiryMonth}</strong> (${t.monthsPastDue} month${t.monthsPastDue === 1 ? "" : "s"} ago)`,
  }));

  const dueThisMonthItems = dueThisMonth.map((t) => ({
    line: `<strong>${t.label}</strong> — due in <strong>${t.expiryMonth}</strong>`,
  }));

  const dueSoonItems = dueSoon.map((t) => ({
    line: `<strong>${t.label}</strong> — due <strong>${t.expiryMonth}</strong> (in ${t.monthsUntilDue} month${t.monthsUntilDue === 1 ? "" : "s"})`,
  }));

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.35;">
      <h2 style="margin:0 0 8px;">Truck Registration Renewal Summary</h2>
      <p style="margin:0 0 10px;">
        Business: <strong>${businessName}</strong><br/>
        Window: next <strong>${windowDays}</strong> days (month-based, includes overdue)
      </p>

      ${section("Overdue", overdueItems)}
      ${section("Due this month", dueThisMonthItems)}
      ${section("Due soon", dueSoonItems)}

      ${overdue.length === 0 && dueThisMonth.length === 0 && dueSoon.length === 0
        ? `<p style="margin:14px 0 0;color:#2e7d32;"><strong>No registrations due.</strong></p>`
        : ""}

      <p style="margin:18px 0 0;font-size:12px;color:#666;">
        This is an automated daily reminder.
      </p>
    </div>
  `;
}

export async function sendTruckRegistrationRenewalSummaryTask(params: {
  MONGO_URI: string;
  EMAIL_USER: string;
  EMAIL_PASS: string;

  // Required until we confirm where to pull per-business email from:
  DEFAULT_TO_EMAIL?: string;

  // Behavior
  DUE_WITHIN_DAYS?: number; // default 30
}): Promise<{
  businessesProcessed: number;
  emailsSent: number;
  businessesSkippedNoEmail: number;
  trucksDueCount: number;
  trucksOverdueCount: number;
}> {
  const {
    MONGO_URI,
    EMAIL_USER,
    EMAIL_PASS,
    DEFAULT_TO_EMAIL,
    DUE_WITHIN_DAYS,
  } = params;

  const dueWithinDays = Number.isFinite(DUE_WITHIN_DAYS as any) ? Number(DUE_WITHIN_DAYS) : 30;

  const client = new MongoClient(MONGO_URI);

  let businessesProcessed = 0;
  let emailsSent = 0;
  let businessesSkippedNoEmail = 0;
  let trucksDueCount = 0;
  let trucksOverdueCount = 0;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  try {
    await client.connect();
    const db = client.db("review_my_driving");

    const businesses = await db.collection("business_users").find({}).toArray();

    const now = new Date();

    const nowMonthUtc = DateTime.fromJSDate(now, { zone: "utc" }).startOf("month");
    const nowMonthKey = monthKeyUtc(nowMonthUtc);

    const dueCutoffMonthUtc = DateTime.fromJSDate(now, { zone: "utc" })
      .plus({ days: dueWithinDays })
      .startOf("month");

    const dueCutoffMonthKey = monthKeyUtc(dueCutoffMonthUtc);

    for (const business of businesses) {
      businessesProcessed += 1;

      const businessIdForRefs = normalizeBusinessIdForRefs((business as any).businessId ?? (business as any)._id);

      const businessEmailCandidate =
        (business as any)?.contactEmail ??
        DEFAULT_TO_EMAIL;

      if (!isValidEmail(businessEmailCandidate)) {
        businessesSkippedNoEmail += 1;
        continue;
      }

      const businessName =
        (business as any)?.businessName ??
        (business as any)?.name ??
        String((business as any)?._id ?? "Business");

      const trucks = await db
        .collection("trucks")
        .find({
          businessId: businessIdForRefs,
          "audit.deletedAt": null,
          registrationExpiration: { $type: "date" },
        })
        .toArray();

      const overdue: Array<{ label: string; expiryMonth: string; monthsPastDue: number }> = [];
      const dueThisMonth: Array<{ label: string; expiryMonth: string }> = [];
      const dueSoon: Array<{ label: string; expiryMonth: string; monthsUntilDue: number }> = [];

      for (const truck of trucks) {
        const exp: Date | undefined = (truck as any).registrationExpiration;
        if (!(exp instanceof Date)) continue;

        const expMonthUtc = DateTime.fromJSDate(exp, { zone: "utc" }).startOf("month");
        const expMonthKey = monthKeyUtc(expMonthUtc);

        if (compareMonthKey(expMonthKey, dueCutoffMonthKey) > 0) continue;

        const label = formatTruckLabel(truck);

        if (compareMonthKey(expMonthKey, nowMonthKey) < 0) {
          const monthsPastDue = Math.max(0, Math.round(nowMonthUtc.diff(expMonthUtc, "months").months));
          overdue.push({ label, expiryMonth: expMonthKey, monthsPastDue });
        } else if (expMonthKey === nowMonthKey) {
          dueThisMonth.push({ label, expiryMonth: expMonthKey });
        } else {
          const monthsUntilDue = Math.max(0, Math.round(expMonthUtc.diff(nowMonthUtc, "months").months));
          dueSoon.push({ label, expiryMonth: expMonthKey, monthsUntilDue });
        }
      }

      overdue.sort((a, b) => b.monthsPastDue - a.monthsPastDue);
      dueThisMonth.sort((a, b) => a.label.localeCompare(b.label));
      dueSoon.sort((a, b) => a.monthsUntilDue - b.monthsUntilDue);

      trucksOverdueCount += overdue.length;
      trucksDueCount += (dueThisMonth.length + dueSoon.length);

      if (overdue.length === 0 && dueThisMonth.length === 0 && dueSoon.length === 0) {
        continue;
      }

      const subject = `Truck registrations due (month-based) — ${businessName}`;
      const html = renderHtml({
        businessName,
        windowDays: dueWithinDays,
        overdue,
        dueThisMonth,
        dueSoon,
      });

      await transporter.sendMail({
        from: "no-reply@reviewmydriving.co",
        to: businessEmailCandidate,
        subject,
        html,
      });

      emailsSent += 1;
    }

    return {
      businessesProcessed,
      emailsSent,
      businessesSkippedNoEmail,
      trucksDueCount,
      trucksOverdueCount,
    };
  } finally {
    await client.close();
  }
}
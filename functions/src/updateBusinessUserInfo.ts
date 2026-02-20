import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import cors from "cors";
import { parseJsonBody } from "./_shared/http.js";
import { DateTime } from "luxon";

const corsHandler = cors({ origin: true });

type UpdateBusinessUserInfoBody = {
	userId?: string;
	update?: {
		businessName?: string;
		contactEmail?: string;
		phoneNumber?: string;
		settings?: {
			notifyOnNewReview?: boolean;
			dailySummaryEmail?: boolean;
			dailyReportsEnabled?: boolean;
			dailyReportStartWindow?: string | null;
			dailyReportEndWindow?: string | null;
			timezone?: string;
			operatingDays?: number[];
			holidays?: {
				mode?: "none" | "custom";
				dates?: string[];
			};
		};
	};
};

function isNonEmptyString(value: any): value is string {
	return typeof value === "string" && value.trim() !== "";
}

function isIsoDate(value: any): value is string {
	if (typeof value !== "string") return false;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	return DateTime.fromISO(value).isValid;
}

function normalizeOperatingDays(value: any): number[] | null {
	if (value === undefined) return null;
	if (!Array.isArray(value)) return null;

	const nums = value
		.map((v) => Number(v))
		.filter((n) => Number.isInteger(n) && n >= 1 && n <= 7);

	const unique = Array.from(new Set(nums)).sort((a, b) => a - b);
	return unique.length ? unique : [1, 2, 3, 4, 5, 6, 7];
}

function normalizeHolidays(value: any): { mode: "none" | "custom"; dates?: string[] } | null {
	if (value === undefined) return null;
	if (value === null) return { mode: "none" };
	if (typeof value !== "object") return null;

	const mode: any = (value as any).mode;
	const normalizedMode: "none" | "custom" = mode === "custom" ? "custom" : "none";
	if (normalizedMode === "none") return { mode: "none" };

	const datesRaw = (value as any).dates;
	if (datesRaw === undefined) return { mode: "custom", dates: [] };
	if (!Array.isArray(datesRaw)) return null;

	const dates = datesRaw.map((d) => (typeof d === "string" ? d.trim() : String(d))).filter((d) => d.length > 0);
	const invalid = dates.find((d) => !isIsoDate(d));
	if (invalid) return null;

	const unique = Array.from(new Set(dates)).sort();
	return { mode: "custom", dates: unique };
}

export const updateBusinessUserInfo = functions.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
	corsHandler(req, res, async () => {
		if (req.method === "OPTIONS") {
			res.status(204).send("");
			return;
		}

		if (req.method !== "PATCH" && req.method !== "PUT" && req.method !== "POST") {
			res.status(405).json({ message: "Method Not Allowed" });
			return;
		}

		const uri = process.env["MONGO_URI"] as string;
		const client = new MongoClient(uri);

		try {
			const body = parseJsonBody<UpdateBusinessUserInfoBody>(req);
			const userId = body?.userId;
			if (!isNonEmptyString(userId)) {
				res.status(400).json({ message: "Missing or invalid userId" });
				return;
			}

			const update = body.update ?? {};
			const setOps: Record<string, any> = {};
			const unsetOps: Record<string, any> = {};

			if (update.businessName !== undefined) setOps.businessName = update.businessName;
			if (update.contactEmail !== undefined) setOps.contactEmail = update.contactEmail;
			if (update.phoneNumber !== undefined) setOps.phoneNumber = update.phoneNumber;

			const settings = update.settings ?? {};
			if (settings.notifyOnNewReview !== undefined) setOps["settings.notifyOnNewReview"] = settings.notifyOnNewReview;
			if (settings.dailySummaryEmail !== undefined) setOps["settings.dailySummaryEmail"] = settings.dailySummaryEmail;
			if (settings.timezone !== undefined) setOps["settings.timezone"] = settings.timezone;

			const operatingDays = normalizeOperatingDays(settings.operatingDays);
			if (operatingDays) setOps["settings.operatingDays"] = operatingDays;

			const holidays = normalizeHolidays(settings.holidays);
			if (holidays) setOps["settings.holidays"] = holidays;

			if (settings.dailyReportsEnabled !== undefined) {
				setOps["settings.dailyReportsEnabled"] = settings.dailyReportsEnabled;
				if (settings.dailyReportsEnabled === true) {
					if (!isNonEmptyString(settings.dailyReportStartWindow) || !isNonEmptyString(settings.dailyReportEndWindow)) {
						res.status(400).json({ message: "dailyReportStartWindow and dailyReportEndWindow are required when dailyReportsEnabled is true" });
						return;
					}
					if (!isNonEmptyString(settings.timezone)) {
						res.status(400).json({ message: "timezone is required when dailyReportsEnabled is true" });
						return;
					}
					setOps["settings.dailyReportStartWindow"] = settings.dailyReportStartWindow;
					setOps["settings.dailyReportEndWindow"] = settings.dailyReportEndWindow;
					setOps["settings.timezone"] = settings.timezone;
				} else {
					// Keep timezone if provided, but clear the report windows when disabled.
					unsetOps["settings.dailyReportStartWindow"] = "";
					unsetOps["settings.dailyReportEndWindow"] = "";
				}
			}

			// If the client sent schedule fields but they were invalid, fail fast with a clear message.
			if (settings.operatingDays !== undefined && !operatingDays) {
				res.status(400).json({ message: "Invalid operatingDays. Use an array of numbers 1-7 (Mon-Sun)." });
				return;
			}
			if (settings.holidays !== undefined && !holidays) {
				res.status(400).json({ message: "Invalid holidays. Expected { mode: 'none' | 'custom', dates?: ['YYYY-MM-DD'] }." });
				return;
			}

			if (Object.keys(setOps).length === 0 && Object.keys(unsetOps).length === 0) {
				res.status(400).json({ message: "No updatable fields provided" });
				return;
			}

			setOps.updatedAt = new Date();

			await client.connect();
			const db = client.db("review_my_driving");
			const businessUsers = db.collection("business_users");

			const updateDoc: any = { $set: setOps };
			if (Object.keys(unsetOps).length > 0) updateDoc.$unset = unsetOps;

			const result = await businessUsers.updateOne({ userId }, updateDoc);
			if (result.matchedCount === 0) {
				await client.close();
				res.status(404).json({ message: "Business user not found" });
				return;
			}

			const updated = await businessUsers.findOne({ userId });
			await client.close();
			res.status(200).json({ message: "Business user updated successfully!", result, updated });
		} catch (error: any) {
			console.error("Error updating business user:", error);
			res.status(500).json({ message: "Error updating business user", error: error.message });
		}
	});
});

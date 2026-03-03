import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { sendTruckRegistrationRenewalSummaryTask } from "./sendTruckRegistrationRenewalSummaryTask.js";

const MONGO_URI = defineSecret("MONGO_URI");
const EMAIL_USER = defineSecret("EMAIL_USER");
const EMAIL_PASS = defineSecret("EMAIL_PASS");
const DEFAULT_TO_EMAIL = defineSecret("DEFAULT_TO_EMAIL");

export const runTruckRegistrationRenewalSummaryOnce = onCall(
  {
    secrets: [MONGO_URI, EMAIL_USER, EMAIL_PASS, DEFAULT_TO_EMAIL],
  },
  async (request) => {
    // Optional: add auth/role checking here if you have admin claims
    // if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");

    const dueWithinDays =
      typeof request.data?.dueWithinDays === "number" ? request.data.dueWithinDays : 45;

    const result = await sendTruckRegistrationRenewalSummaryTask({
      MONGO_URI: MONGO_URI.value(),
      EMAIL_USER: EMAIL_USER.value(),
      EMAIL_PASS: EMAIL_PASS.value(),
      DEFAULT_TO_EMAIL: DEFAULT_TO_EMAIL.value(),
      DUE_WITHIN_DAYS: dueWithinDays,
    });

    return { ok: true, result };
  }
);
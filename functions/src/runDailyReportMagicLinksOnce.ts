import * as functions from "firebase-functions/v2";
import cors from "cors";
import { sendDailyReportMagicLinksTask } from "./sendDailyReportMagicLinksTask.js";

const corsHandler = cors({ origin: true });

export const runDailyReportMagicLinksOnce = functions.https.onRequest(
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

      try {
        const result = await sendDailyReportMagicLinksTask({
          MONGO_URI: process.env["MONGO_URI"] as string,
          EMAIL_USER: process.env["EMAIL_USER"] as string,
          EMAIL_PASS: process.env["EMAIL_PASS"] as string,
          APP_BASE_URL: process.env["APP_BASE_URL"] as string,
        });

        res.status(200).json({ message: "OK", result });
      } catch (error: any) {
        console.error("Error running daily report scheduler once:", error);
        res.status(500).json({ message: "Error", error: error.message });
      }
    });
  }
);

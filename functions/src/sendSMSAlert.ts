import * as functions from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import twilio from "twilio";
import cors from "cors";

const corsHandler = cors({ origin: true });

export const sendSMSAlert = functions.onRequest(
  { secrets: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"] },
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID!,
          process.env.TWILIO_AUTH_TOKEN!
        );

        const phoneNumber = req.query["phoneNumber"] || req.body["phoneNumber"]; // "+14805551234"
        const body = (req.query["message"] || req.body["message"]) || "Test message from Firebase 🚀";

        if (!phoneNumber) {
          res.status(400).json({ error: "Missing phone number" });
          return;
        }

        const message = await client.messages.create({
          body,
          from: process.env.TWILIO_PHONE_NUMBER!,
          to: phoneNumber,
        });

        res.status(200).json({ success: true, sid: message.sid });
      } catch (err: any) {
        logger.error("Error sending SMS:", err);
        res.status(500).json({ error: err.message });
      }
    });
  }
);

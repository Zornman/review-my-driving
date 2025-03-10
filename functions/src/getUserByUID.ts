import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import cors from 'cors';
import { environment } from "./environments/environment.js";

const corsHandler = cors({ origin: true });

// ✅ Load secrets with the new names
export const getUserByUID = functions.https.onRequest({ secrets: ["FB_CLIENT_EMAIL"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      // ✅ Retrieve secrets from Firebase Secrets
      const privateKey = environment.firebase.privateKey.trim();
      const clientEmail = process.env['FB_CLIENT_EMAIL'];
  
      if (!privateKey || !clientEmail) {
        throw new Error("Missing Firebase Admin credentials.");
      }
      
      // ✅ Initialize Firebase Admin SDK (Only Once)
      if (!admin.apps?.length) {
        initializeApp({
          credential: cert({
            privateKey: privateKey,
            clientEmail: clientEmail,
            projectId: "review-my-driving",
          }),
        });
      }
  
      // ✅ Get UID from query params (?uid=...)
      const uid = req.query['uid'] as string;
      if (!uid) {
        res.status(400).json({ error: "UID parameter is required" });
        return;
      }
  
      // ✅ Fetch user from Firebase Authentication
      const userRecord = await getAuth().getUser(uid);
      res.status(200).json(userRecord); // ✅ Ensure response is returned
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: error.message }); // ✅ Ensure response is returned
    }
  });
});

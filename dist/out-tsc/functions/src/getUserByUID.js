import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import cors from 'cors';
import { environment } from "./environments/environment";
const corsHandler = cors({ origin: true });
// ✅ Load secrets with the new names
export const getUserByUID = functions.https.onRequest({ secrets: ["FB_CLIENT_EMAIL"] }, async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            // ✅ Retrieve secrets from Firebase Secrets
            const privateKey = JSON.stringify(environment.firebase.privateKey);
            const clientEmail = process.env['FB_CLIENT_EMAIL'];
            if (!privateKey || !clientEmail) {
                throw new Error("Missing Firebase Admin credentials.");
            }
            console.log("Private Key:", privateKey);
            // ✅ Initialize Firebase Admin SDK (Only Once)
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        privateKey: privateKey,
                        clientEmail: clientEmail,
                        projectId: "review-my-driving",
                    }),
                });
            }
            // ✅ Get UID from query params (?uid=...)
            const uid = req.query['uid'];
            if (!uid) {
                res.status(400).json({ error: "UID parameter is required" });
                return;
            }
            // ✅ Fetch user from Firebase Authentication
            const userRecord = await admin.auth().getUser(uid);
            res.status(200).json(userRecord); // ✅ Ensure response is returned
        }
        catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({ error: error.message }); // ✅ Ensure response is returned
        }
    });
});

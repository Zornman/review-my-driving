import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Parse JSON from Firebase environment variable
const serviceAccount = JSON.parse(`{
  "type": "service_account",
  "project_id": "review-my-driving",
  "private_key_id": "${functions.config().rmd.firebase.private_key_id}",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n${functions.config().rmd.firebase.private_key}\\n-----END PRIVATE KEY-----\\n",
  "client_email": "firebase-adminsdk-9ltlf@review-my-driving.iam.gserviceaccount.com",
  "client_id": "117338358802601525313",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-9ltlf%40review-my-driving.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}`);

// Fix private key formatting (convert `\\n` to real `\n`)
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const getUserByUID = functions.https.onRequest(async (req, res) => {
  try {
    // Get UID from query params (?uid=...)
    const uid = req.query.uid as string;
    if (!uid) {
      res.status(400).json({ error: "UID parameter is required" });
      return;
    }

    // Fetch user from Firebase Authentication
    const userRecord = await admin.auth().getUser(uid);

    res.status(200).json(userRecord);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

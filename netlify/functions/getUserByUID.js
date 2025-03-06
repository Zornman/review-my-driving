const admin = require("firebase-admin");

// Parse JSON from Netlify environment variable
const serviceAccount = JSON.parse({ "type": "service_account", "project_id": "review-my-driving", "private_key_id": process.env.FIREBASE_SERVICE_PRIVATE_KEY_ID, "private_key": "-----BEGIN PRIVATE KEY-----\\n" + process.env.FIREBASE_SERVICE_ACCOUNT_KEY + "\\n-----END PRIVATE KEY-----\\n", "client_email": "firebase-adminsdk-9ltlf@review-my-driving.iam.gserviceaccount.com", "client_id": "117338358802601525313", "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token", "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-9ltlf%40review-my-driving.iam.gserviceaccount.com", "universe_domain": "googleapis.com" });



// Fix private key formatting (convert `\\n` to real `\n`)
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.handler = async (event) => {
  try {
    // Get UID from query params (?uid=...)
    const uid = event.queryStringParameters.uid;
    if (!uid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "UID parameter is required" }),
      };
    }

    // Fetch user from Firebase Authentication
    const userRecord = await admin.auth().getUser(uid);

    return {
      statusCode: 200,
      body: JSON.stringify(userRecord),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
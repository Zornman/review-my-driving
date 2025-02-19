const admin = require("firebase-admin");

// Parse JSON from Netlify environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

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
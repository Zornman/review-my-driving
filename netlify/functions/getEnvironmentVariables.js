exports.handler = async () => {
    return {
      statusCode: 200,
      body: JSON.stringify({
        EMAIL_PASS: process.env.EMAIL_PASS,
        EMAIL_USER: process.env.EMAIL_USER,
        FIREBASE_CONFIG: process.env.FIREBASE_CONFIG,
        FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
        MONGO_URI: process.env.MONGO_URI,
        PRINTIFY_API_KEY: process.env.PRINTIFY_API_KEY,
        PRINTIFY_STORE_ID: process.env.PRINTIFY_STORE_ID,
        PRINTIFY_URL: process.env.PRINTIFY_URL,
        STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      }),
    };
};
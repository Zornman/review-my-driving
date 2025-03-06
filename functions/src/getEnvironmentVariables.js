exports.handler = async () => {
    return {
      statusCode: 200,
      body: JSON.stringify({
        ADMIN_USER_ID: process.env.ADMIN_USER_ID,
        EMAIL_PASS: process.env.EMAIL_PASS,
        EMAIL_USER: process.env.EMAIL_USER,
        FIREBASE_CONFIG: process.env.FIREBASE_CONFIG,
        FIREBASE_SERVICE_PRIVATE_KEY_ID: process.env.FIREBASE_SERVICE_PRIVATE_KEY_ID,
        FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        MONGO_URI: process.env.MONGO_URI,
        PRINTIFY_API_KEY: process.env.PRINTIFY_API_KEY,
        PRINTIFY_STORE_ID: process.env.PRINTIFY_STORE_ID,
        PRINTIFY_URL: process.env.PRINTIFY_URL,
        STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      }),
    };
};
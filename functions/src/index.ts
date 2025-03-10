/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

export { createCustomProduct } from "./createCustomProduct.js";
export { createPrintifyOrder } from "./createPrintifyOrder.js";
export { createStripeCheckout } from "./createStripeCheckout.js";
export { createStripePaymentIntent } from "./createStripePaymentIntent.js";
export { fetchProducts } from "./fetchProducts.js";
export { getPrintifyOrderDetails } from "./getPrintifyOrderDetails.js";
// export { getPrintifyOrders } from "./getPrintifyOrders";

export { getProduct } from "./getProduct.js";
export { getShippingOptions } from "./getShippingOptions.js";
export { getShippingRates } from "./getShippingRates.js";
export { getSubmissionsByUser } from "./getSubmissionsByUser.js";
export { getUserByUID } from "./getUserByUID.js";
export { getUserOrderHistory } from "./getUserOrderHistory.js";
export { getUserSettings } from "./getUserSettings.js";
export { getUserShipping } from "./getUserShipping.js";

export { insertSubmission } from "./insertSubmission.js";
export { insertUserOrder } from "./insertUserOrder.js";
export { insertUserSettings } from "./insertUserSettings.js";
export { insertUserShipping } from "./insertUserShipping.js";

export { logError } from "./logError.js";
export { sendContactEmail } from "./sendContactEmail.js";
export { sendEmail } from "./sendEmail.js";
export { sendOrderConfirmationEmail } from "./sendOrderConfirmationEmail.js";

export { updateOrderStatus } from "./updateOrderStatus.js";


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

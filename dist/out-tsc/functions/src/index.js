/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
export { createCustomProduct } from "./createCustomProduct";
export { createPrintifyOrder } from "./createPrintifyOrder";
export { createStripeCheckout } from "./createStripeCheckout";
export { createStripePaymentIntent } from "./createStripePaymentIntent";
export { fetchProducts } from "./fetchProducts";
export { getPrintifyOrderDetails } from "./getPrintifyOrderDetails";
// export { getPrintifyOrders } from "./getPrintifyOrders";
export { getProduct } from "./getProduct";
export { getSampleBatches } from "./getSampleBatches";
export { getShippingOptions } from "./getShippingOptions";
export { getShippingRates } from "./getShippingRates";
export { getSubmissionsByUser } from "./getSubmissionsByUser";
export { getBusinessUserInfo } from "./getBusinessUserInfo";
export { getUserByUID } from "./getUserByUID";
export { getUserByUniqueId } from "./getUserByUniqueId";
export { getUserOrderHistory } from "./getUserOrderHistory";
export { getUserSettings } from "./getUserSettings";
export { getUserShipping } from "./getUserShipping";
export { insertSampleMapper } from "./insertSampleMapper";
export { insertSampleBatch } from "./insertSampleBatch";
export { insertSubmission } from "./insertSubmission";
export { insertUserOrder } from "./insertUserOrder";
export { insertUserSettings } from "./insertUserSettings";
export { insertUserShipping } from "./insertUserShipping";
export { logError } from "./logError";
export { sendSMSAlert } from "./sendSMSAlert";
export { sendContactEmail } from "./sendContactEmail";
export { sendEmail } from "./sendEmail";
export { sendOrderConfirmationEmail } from "./sendOrderConfirmationEmail";
export { updateSampleMapper } from "./updateSampleMapper";
export { updateOrderStatus } from "./updateOrderStatus";
// Start writing functions
// https://firebase.google.com/docs/functions/typescript
// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

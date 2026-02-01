/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";

// ✅ Define Secrets for Scheduled Function
const PRINTIFY_STORE_ID = defineSecret("PRINTIFY_STORE_ID");
const PRINTIFY_URL = defineSecret("PRINTIFY_URL");
const PRINTIFY_API_KEY = defineSecret("PRINTIFY_API_KEY");
const MONGO_URI = defineSecret("MONGO_URI");
const EMAIL_USER = defineSecret("EMAIL_USER");
const EMAIL_PASS = defineSecret("EMAIL_PASS");
const APP_BASE_URL = defineSecret("APP_BASE_URL");

export { createCustomProduct } from "./createCustomProduct.js";
export { createPrintifyOrder } from "./createPrintifyOrder.js";
export { createStripeCheckout } from "./createStripeCheckout.js";
export { createStripePaymentIntent } from "./createStripePaymentIntent.js";
export { captureStripePaymentIntent } from "./captureStripePaymentIntent.js";
export { cancelStripePaymentIntent } from "./cancelStripePaymentIntent.js";
export { fetchProducts } from "./fetchProducts.js";
export { getPrintifyOrderDetails } from "./getPrintifyOrderDetails.js";
// export { getPrintifyOrders } from "./getPrintifyOrders";

export { getProduct } from "./getProduct.js";
export { getShippingOptions } from "./getShippingOptions.js";
export { getShippingRates } from "./getShippingRates.js";
export { getSubmissionsByUser } from "./getSubmissionsByUser.js";
export { getBusinessUserInfo } from "./getBusinessUserInfo.js";
export { updateBusinessUserInfo } from "./updateBusinessUserInfo.js";
export { getUserByUID } from "./getUserByUID.js";
export { getUserByUniqueId } from "./getUserByUniqueId.js";
export { getUserOrderHistory } from "./getUserOrderHistory.js";
export { getUserSettings } from "./getUserSettings.js";
export { getUserShipping } from "./getUserShipping.js";
export { getSampleBatches } from "./getSampleBatches.js";

export { insertSampleBatch } from "./insertSampleBatch.js";
export { insertSampleMapper } from "./insertSampleMapper.js";
export { insertSubmission } from "./insertSubmission.js";
export { insertUserOrder } from "./insertUserOrder.js";
export { insertUserSettings } from "./insertUserSettings.js";
export { insertUserShipping } from "./insertUserShipping.js";

// Trucks & Drivers
export { insertTruck } from "./insertTruck.js";
export { getTrucksByBusiness } from "./getTrucksByBusiness.js";
export { updateTruck } from "./updateTruck.js";
export { deleteTruck } from "./deleteTruck.js";
export { assignDriverToTruck } from "./assignDriverToTruck.js";

export { insertDriver } from "./insertDriver.js";
export { getDriversByBusiness } from "./getDriversByBusiness.js";
export { updateDriver } from "./updateDriver.js";
export { deleteDriver } from "./deleteDriver.js";

// Daily Reports (magic-link)
export { initDailyReportIndexes } from "./initDailyReportIndexes.js";
export { createDailyReportToken } from "./createDailyReportToken.js";
export { getDailyReportContextByToken } from "./getDailyReportContextByToken.js";
export { submitDailyReportByToken } from "./submitDailyReportByToken.js";
export { runDailyReportMagicLinksOnce } from "./runDailyReportMagicLinksOnce.js";
export { getDailyReportsSummary } from "./getDailyReportsSummary.js";
export { uploadDailyReportPhotoByToken } from "./uploadDailyReportPhotoByToken.js";
export { getDailyReportPhoto } from "./getDailyReportPhoto.js";

export { logError } from "./logError.js";
export { sendSMSAlert } from "./sendSMSAlert.js";
export { sendContactEmail } from "./sendContactEmail.js";
export { sendEmail } from "./sendEmail.js";
export { sendOrderConfirmationEmail } from "./sendOrderConfirmationEmail.js";

export { updateSampleMapper } from "./updateSampleMapper.js";
export { updateOrderStatus } from "./updateOrderStatus.js";
import { updateOrderStatusTask } from "./updateOrderStatusTask.js";
import { sendDailyReportMagicLinksTask } from "./sendDailyReportMagicLinksTask.js";

export const updateOrderStatusTaskSchedule = onSchedule({schedule: "every hour", secrets: [
    PRINTIFY_STORE_ID,
    PRINTIFY_URL,
    PRINTIFY_API_KEY,
    MONGO_URI,
    EMAIL_USER,
    EMAIL_PASS
]}, async (event: any) => {
    console.log("Running UpdateOrderStatus task...");

    try {
        // Call your existing logic here
        await updateOrderStatusTask({
            PRINTIFY_STORE_ID: PRINTIFY_STORE_ID.value(),
            PRINTIFY_URL: PRINTIFY_URL.value(),
            PRINTIFY_API_KEY: PRINTIFY_API_KEY.value(),
            MONGO_URI: MONGO_URI.value(),
            EMAIL_USER: EMAIL_USER.value(),
            EMAIL_PASS: EMAIL_PASS.value(),
          }); // ✅ Replace this with your function logic
        console.log("Running UpdateOrderStatus task - completed successfully.");
    } catch (error) {
    console.error("Error running scheduled function:", error);
    }
});

export const sendDailyReportMagicLinksSchedule = onSchedule(
    {
        schedule: "every 15 minutes",
        secrets: [MONGO_URI, EMAIL_USER, EMAIL_PASS, APP_BASE_URL],
    },
    async () => {
        console.log("Running Daily Report magic-link scheduler...");

        try {
            const result = await sendDailyReportMagicLinksTask({
                MONGO_URI: MONGO_URI.value(),
                EMAIL_USER: EMAIL_USER.value(),
                EMAIL_PASS: EMAIL_PASS.value(),
                APP_BASE_URL: APP_BASE_URL.value(),
            });

            console.log("Daily Report scheduler completed:", result);
        } catch (error) {
            console.error("Error running Daily Report scheduler:", error);
        }
    }
);
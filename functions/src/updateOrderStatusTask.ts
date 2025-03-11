import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import fetch from "node-fetch";
import nodemailer from "nodemailer";

// ✅ Load secrets dynamically
export async function updateOrderStatusTask(secrets?: {
  PRINTIFY_STORE_ID: string;
  PRINTIFY_URL: string;
  PRINTIFY_API_KEY: string;
  MONGO_URI: string;
  EMAIL_USER: string;
  EMAIL_PASS: string;
}) {
  try {
    console.log("Running updateOrderStatus...");

    // ✅ Use process.env when available, fallback to Firebase Secrets
    const shopId = (secrets) ? secrets.PRINTIFY_STORE_ID : functions.params.defineSecret("PRINTIFY_STORE_ID").value();
    const printifyShopUrl = (secrets) ? secrets.PRINTIFY_URL : functions.params.defineSecret("PRINTIFY_URL").value();
    const apiToken = (secrets) ? secrets.PRINTIFY_API_KEY : functions.params.defineSecret("PRINTIFY_API_KEY").value();
    const uri = (secrets) ? secrets.MONGO_URI : functions.params.defineSecret("MONGO_URI").value();
    const emailUser = (secrets) ? secrets.EMAIL_USER : functions.params.defineSecret("EMAIL_USER").value();
    const emailPass = (secrets) ? secrets.EMAIL_PASS : functions.params.defineSecret("EMAIL_PASS").value();


    // ✅ Fetch orders from Printify
    const ordersUrl = `${printifyShopUrl}/shops/${shopId}/orders.json`;
    const printifyResponse = await fetch(ordersUrl, {
      headers: { "Authorization": `Bearer ${apiToken}` },
    });

    const printifyOrders = await printifyResponse.json() as any;
    const client = await MongoClient.connect(uri);
    const db = client.db("review_my_driving");
    const ordersCollection = db.collection("user_order_history");

    for (let i = 1; i <= printifyOrders.last_page; i++) {
      const pageResponse = await fetch(`${ordersUrl}/?page=${i}`, {
        headers: { "Authorization": `Bearer ${apiToken}` }
      });
      const printifyOrdersPage = await pageResponse.json() as any;

      for (const printifyOrder of printifyOrdersPage.data) {
        const order = await ordersCollection.findOne({ orderID: printifyOrder.id });

        if (order && order['status'] !== printifyOrder.status) {
          await ordersCollection.updateOne(
            { orderID: printifyOrder.id },
            { $set: { status: printifyOrder.status } }
          );

          if (printifyOrder.status === "in-production" && !order['emailOrderCreated']) {
            await sendEmail(emailUser, emailPass, printifyOrder);
            await ordersCollection.updateOne(
              { orderID: printifyOrder.id },
              { $set: { emailOrderCreated: true } }
            );
          }

          if (printifyOrder.status === "fulfilled" && !order['emailOrderShipped']) {
            await sendEmail(emailUser, emailPass, printifyOrder);
            await ordersCollection.updateOne(
              { orderID: printifyOrder.id },
              { $set: { emailOrderShipped: true } }
            );
          }

          if (printifyOrder.status === "canceled" && !order['emailOrderCanceled']) {
            await sendEmail(emailUser, emailPass, printifyOrder);
            await ordersCollection.updateOne(
              { orderID: printifyOrder.id },
              { $set: { emailOrderCanceled: true } }
            );
          }
        }
      }
    }

    await client.close(); // ✅ Close MongoDB connection
  } catch (error: any) {
    console.error("Error processing orders:", error);
  }
}

// ✅ Email Sending Function
async function sendEmail(user: string, pass: string, printifyOrder: any) {
  console.log("Sending email to " + printifyOrder.address_to.email);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: (user) ? user : functions.params.defineSecret("EMAIL_USER").value(),
      pass: (pass) ? pass : functions.params.defineSecret("EMAIL_PASS").value(),
    },
  });

  const mailOptions = {
    from: "review.mydriving1@gmail.com",
    to: printifyOrder.address_to.email,
    subject: `Order Update: ${printifyOrder.id}`,
    text: "Your order status has been updated.",
  };

  return await transporter.sendMail(mailOptions);
}
import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import fetch from "node-fetch";
import { Response } from "express";
import nodemailer from "nodemailer";

// ✅ Load secrets dynamically
export async function updateOrderStatusTask(req?: functions.https.Request, res?: Response) {
  try {
    console.log("Running updateOrderStatus...");

    // ✅ Use process.env when available, fallback to Firebase Secrets
    const shopId = process.env['PRINTIFY_STORE_ID'] || functions.params.defineSecret("PRINTIFY_STORE_ID").value();
    const printifyShopUrl = process.env['PRINTIFY_URL'] || functions.params.defineSecret("PRINTIFY_URL").value();
    const apiToken = process.env['PRINTIFY_API_KEY'] || functions.params.defineSecret("PRINTIFY_API_KEY").value();
    const uri = process.env['MONGO_URI'] || functions.params.defineSecret("MONGO_URI").value();

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
            await sendEmail(printifyOrder);
            await ordersCollection.updateOne(
              { orderID: printifyOrder.id },
              { $set: { emailOrderCreated: true } }
            );
          }

          if (printifyOrder.status === "fulfilled" && !order['emailOrderShipped']) {
            await sendEmail(printifyOrder);
            await ordersCollection.updateOne(
              { orderID: printifyOrder.id },
              { $set: { emailOrderShipped: true } }
            );
          }

          if (printifyOrder.status === "canceled" && !order['emailOrderCanceled']) {
            await sendEmail(printifyOrder);
            await ordersCollection.updateOne(
              { orderID: printifyOrder.id },
              { $set: { emailOrderCanceled: true } }
            );
          }
        }
      }
    }

    await client.close(); // ✅ Close MongoDB connection

    if (res) {
      res.status(200).json({ message: "Orders processed successfully", orders: printifyOrders });
    } else {
      console.log("updateOrderStatus ran via scheduler.");
    }
  } catch (error: any) {
    console.error("Error processing orders:", error);
    if (res) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  }
}

// ✅ Email Sending Function
async function sendEmail(printifyOrder: any) {
  console.log("Sending email to " + printifyOrder.address_to.email);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env['EMAIL_USER'] || functions.params.defineSecret("EMAIL_USER").value(),
      pass: process.env['EMAIL_PASS'] || functions.params.defineSecret("EMAIL_PASS").value(),
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
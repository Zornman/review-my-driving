import * as functions from "firebase-functions/v2";
import {MongoClient} from "mongodb";
import fetch from "node-fetch";
import nodemailer from "nodemailer";
import cors from 'cors';

const corsHandler = cors({ origin: true });

// const statusArray = [
//   "pending",
//   "on-hold",
//   "sending-to-production",
//   "in-production",
//   "canceled",
//   "fulfilled",
//   "partially-fulfilled",
//   "payment-not-received",
//   "had-issues"
// ];

export const updateOrderStatus = functions
.https.onRequest({secrets: ["PRINTIFY_STORE_ID", "PRINTIFY_URL", "PRINTIFY_API_KEY", "MONGO_URI", "EMAIL_USER", "EMAIL_PASS"]}, async (req, res) => {
   corsHandler(req, res, async () => {
      try {
         const shopId = process.env['PRINTIFY_STORE_ID'];
         const printifyShopUrl = process.env['PRINTIFY_URL'];
         const ordersUrl = printifyShopUrl+ "/shops/" + shopId + "/orders.json";
         const apiToken = process.env['PRINTIFY_API_KEY'];
         const uri = process.env['MONGO_URI'] as string;
      
          const printifyResponse = await fetch(ordersUrl, {
            headers: {"Authorization": "Bearer" + apiToken},
          });
          const printifyOrders = await printifyResponse.json() as any;
      
          const client = await MongoClient.connect(uri);
          const db = client.db("review_my_driving");
          const ordersCollection = db.collection("user_order_history");
      
          for (let i = 1; i <= printifyOrders.last_page; i++) {
              const pageResponse = await fetch(ordersUrl + "/?page=" + i, {
                  headers: {"Authorization": "Bearer" + apiToken}
              });
              const printifyOrdersPage = await pageResponse.json() as any;
      
              for (const printifyOrder of printifyOrdersPage.data) {
                  const order = await ordersCollection.findOne({orderID: printifyOrder.id});
      
                  if (order) {
                      if (order['status'] !== printifyOrder.status) {
                          await ordersCollection.updateOne(
                          {orderID: printifyOrder.id},
                          {$set: {status: printifyOrder.status}}
                          );
                      }
      
                      if (printifyOrder.status === "in-production" && !order['emailOrderCreated']) {
                          await sendEmail(printifyOrder);
      
                          await ordersCollection.updateOne(
                          {orderID: printifyOrder.id},
                          {$set: {emailOrderCreated: true}}
                          );
                      }
      
                      if (printifyOrder.status === "fulfilled" && !order['emailOrderShipped']) {
                          await sendEmail(printifyOrder);
      
                          await ordersCollection.updateOne(
                          {orderID: printifyOrder.id},
                          {$set: {emailOrderShipped: true}}
                          );
                      }
      
                      if (printifyOrder.status === "canceled" && !order['emailOrderCanceled']) {
                          await sendEmail(printifyOrder);
      
                          await ordersCollection.updateOne(
                          {orderID: printifyOrder.id},
                          {$set: {emailOrderCanceled: true}}
                          );
                      }
                  }
              }
          }
      
          // Close the MongoDB connection
          await client.close();
      
          res.status(200).json({message: "Orders processed successfully", orders: printifyOrders});
       } catch (error: any) {
          console.error("Error processing orders:", error);
          res.status(500).json({message: "Server Error", error: error.message});
       }
      });
      
      async function sendEmail(printifyOrder: any) {
        console.log("Sending email to " + printifyOrder.address_to.email);
      
        // Set up Nodemailer transporter
        const transporter = nodemailer.createTransport({
          service: "gmail", // Use Gmail or another email service
          auth: {
            user: process.env['EMAIL_USER'], // Your email address
            pass: process.env['EMAIL_PASS'], // Your email password (use an app password for Gmail)
         },
       });
      
        // Email options
        const mailOptions = {
          from: "reviewmy.driving@gmail.com",
          to: "${printifyOrder.address_to.email}",
          subject: getEmailSubject(printifyOrder),
          html: "<html><head><style type=\"text/css\">@import url(\"https://fonts.googleapis.com/css?family=DynaPuff\");body {font-family: \"DynaPuff\", Arial, serif;}</style><style>table {border-collapse: collapse;width: 100%;}td, th {border: 1px solid #dddddd;text-align: left;padding: 8px;}tr:nth-child(even) {background-color: #dddddd;</style></head><body>" + getEmailContents(printifyOrder) + "</body></html>",
       };
      
        // Simulate asynchronous email sending
        return await transporter.sendMail(mailOptions);
      }
      
      function getEmailSubject(order: any): string {
        if (order.status === "in-production") {
          return "Order In Production #${order.id}";
       } else if (order.status === "fulfilled") {
          return "Your Order has Shipped! #${order.id}";
       } else if (order.status === "canceled") {
          return "Order Canceled #${order.id}";
       } else {
          return "Order Status Updated #${order.id}";
       }
      }
      
      function getEmailContents(order: any): string {
        if (order.status === "in-production") {
          let html = "<h1 style=\"text-align: center;\">Review My Driving</h1><h2 style=\"color: #4B0082;\">Your order is being custom crafted!</h2><p><strong>Order Number:  </strong> " + order.id + "</p><p><strong>Order Total:  </strong>" + calculateOrderTotal(order) + "</p>";
          html += "<h3><strong>Order Details:</strong></h3><table><tr><th>Title</th><th>Qty</th><th>Price</th></tr>";
      
          for (const line_item of order.line_items) {
            const md = line_item.metadata;
            html += "<tr><td>" + md.title.split("-")[0] + "</td><td style=\"text-align: center;\">${line_item.quantity}</td><td>" + ((md.price * line_item.quantity) / 100) + "</td></tr>";
         }
      
          html += "</table>";
      
          html += "<hr style=\"border: 1px solid #ccc;\" /><p style=\"font-size: 0.9em; color: #555;\">This email was generated automatically by <a href=\"www.reviewmydriving.co\">reviewmydriving.co</a></p>";
      
          return html;
       } else if (order.status === "fulfilled") {
          return "<h1 style=\"text-align: center;\">Review My Driving</h1><h2 style=\"color: #4B0082;\">Your order has shipped!</h2><p><strong>Order Number:  </strong> ${order.id}</p><p><strong>Date Shipped:  </strong> ${order.fulfilled_at}</p><p><strong>Tracking Info: </strong></p><p>Carrier - ${order.shipments[0].carrier}</p><p>Tracking #<a href=\"${order.shipments[0].url}\">" + order.shipments[0].number + "</a></p><hr style=\"border: 1px solid #ccc;\" /><p style=\"font-size: 0.9em; color: #555;\">This email was generated automatically by <a href=\"www.reviewmydriving.co\">reviewmydriving.co</a></p>";
       } else if (order.status === "canceled") {
          return "<h1 style=\"text-align: center;\">Review My Driving</h1><h2 style=\"color: #4B0082;\">Your order has been canceled.</h2><p><strong>Order Number:  </strong>" + order.id + "</p><p>This order has been canceled. No further action is required on your end.</p><hr style=\"border: 1px solid #ccc;\" /><p style=\"font-size: 0.9em; color: #555;\">This email was generated automatically by <a href=\"www.reviewmydriving.co\">reviewmydriving.co</a></p>";
       } else {
          return "<h1 style=\"text-align: center;\">Review My Driving</h1><h2 style=\"color: #4B0082;\">Order Update Email</h2><p><strong>Order Number:  </strong>" + order.id + "</p><p>This order has been updated. No further action is required on your end.</p><hr style=\"border: 1px solid #ccc;\" /><p style=\"font-size: 0.9em; color: #555;\">This email was generated automatically by <a href=\"www.reviewmydriving.co\">reviewmydriving.co</a></p>";
       }
      }
      
      function calculateOrderTotal(order: any): number {
        let orderTotal = 0;
      
        for (const line_item of order.line_items) {
          const price = line_item.metadata.price;
          const line_total = price * line_item.quantity;
          orderTotal += line_total;
       }
      
        return (orderTotal / 100);
      }
   });
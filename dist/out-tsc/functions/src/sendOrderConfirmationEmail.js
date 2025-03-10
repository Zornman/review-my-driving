import * as functions from "firebase-functions/v2";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";
import fetch from "node-fetch";
import cors from 'cors';
const corsHandler = cors({ origin: true });
export const sendOrderConfirmationEmail = functions
    .https.onRequest({ secrets: ["PRINTIFY_STORE_ID", "PRINTIFY_URL", "PRINTIFY_API_KEY", "MONGO_URI"] }, async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "POST") {
            try {
                const shop_id = process.env['PRINTIFY_STORE_ID'];
                const PRINTIFY_SHOP_URL = process.env['PRINTIFY_URL'];
                const order_url = PRINTIFY_SHOP_URL + "/shops/" + shop_id + "/orders/";
                const api_token = process.env['PRINTIFY_API_KEY'];
                const uri = process.env['MONGO_URI'];
                // Parse the form data from the request body
                const data = req.body;
                const printifyResponse = await fetch(order_url + data.orderID + ".json", {
                    headers: { "Authorization": `Bearer ${api_token}` }
                });
                const printifyOrder = await printifyResponse.json();
                const client = await MongoClient.connect(uri);
                const db = client.db("review_my_driving");
                const ordersCollection = db.collection("user_order_history");
                const order = await ordersCollection.findOne({ orderID: printifyOrder.id });
                if (!order)
                    return;
                if (order['emailOrderConfirm']) {
                    res.status(200).json({ message: "Email already sent for this order" });
                    return;
                }
                // Set up Nodemailer transporter
                const transporter = nodemailer.createTransport({
                    service: "gmail", // Use Gmail or another email service
                    auth: {
                        user: process.env['EMAIL_USER'], // Your email address
                        pass: process.env['EMAIL_PASS'], // Your email password (use an app password for Gmail)
                    },
                });
                const mailOptions = {
                    from: "reviewmy.driving@gmail.com",
                    to: printifyOrder.address_to.email,
                    subject: "Order Confirmation #" + data.orderID,
                    html: `<html><head><style type="text/css">@import url("https://fonts.googleapis.com/css?family=DynaPuff");body {
                      font-family: "DynaPuff", Arial, serif;
                  }
                  </style>
                  <style>
                      table {
                      border-collapse: collapse;
                      width: 100%;
                      }
  
                      td, th {
                      border: 1px solid #dddddd;
                      text-align: left;
                      padding: 8px;
                      }
  
                      tr:nth-child(even) {
                      background-color: #dddddd;
                      }
                  </style>
              </head>
              <body>
                  ${getEmailContents(printifyOrder)}
              </body>
          </html>
          `,
                };
                await transporter.sendMail(mailOptions);
                res.status(200).json({ message: "Email sent successfully!" });
            }
            catch (error) {
                console.error("Error sending email:", error);
                res.status(500).json({ message: "Error sending email", error: error.message });
            }
        }
        else {
            res.status(405).json({ message: "Method not allowed" });
        }
    });
    function getEmailContents(order) {
        let html = `
      <h1 style="text-align: center;">Review My Driving</h1>
      <h2 style="color: #4B0082;">Your order has been confirmed!</h2>
      <p><strong>Order Number:  </strong> ${order.id}</p>
      <p><strong>Order Total:  </strong> $${calculateOrderTotal(order)}</p>
    `;
        html += `
      <h3><strong>Order Details:</strong></h3>
      <table>
          <tr>
              <th>Title</th>
              <th>Qty</th>
              <th>Price</th>
          </tr>
    `;
        for (const line_item of order.line_items) {
            const md = line_item.metadata;
            html += `
          <tr>
              <td>${md.title.split("-")[0]}</td>
              <td style="text-align: center;">${line_item.quantity}</td>
              <td>$${((md.price * line_item.quantity) / 100)}</td>
          </tr>
      `;
        }
        html += `</table>`;
        html += `
      <hr style="border: 1px solid #ccc;" />
      <p style="font-size: 0.9em; color: #555;">This email was generated automatically by <a href="www.reviewmydriving.co">reviewmydriving.co</a></p>
    `;
        return html;
    }
    function calculateOrderTotal(order) {
        let orderTotal = 0;
        for (const line_item of order.line_items) {
            const price = line_item.metadata.price;
            const line_total = price * line_item.quantity;
            orderTotal += line_total;
        }
        return (orderTotal / 100);
    }
});

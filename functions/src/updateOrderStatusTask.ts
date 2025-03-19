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

async function sendEmail(emailUser: string, emailPass: string, printifyOrder: any) {
  console.log("Sending email to " + printifyOrder.address_to.email);

  // Set up Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "gmail", // Use Gmail or another email service
    auth: {
      user: emailUser, // Your email address
      pass: emailPass, // Your email password (use an app password for Gmail)
    },
  });

  // Email options
  const mailOptions = {
    from: "review.mydriving1@gmail.com",
    to: printifyOrder.address_to.email,
    subject: getEmailSubject(printifyOrder),
    html: "<html><head><style type=\"text/css\">@import url(\"https://fonts.googleapis.com/css?family=DynaPuff\");body {font-family: \"DynaPuff\", Arial, serif;}</style><style>table {border-collapse: collapse;width: 100%;}td, th {border: 1px solid #dddddd;text-align: left;padding: 8px;}tr:nth-child(even) {background-color: #dddddd;</style></head><body>" + getEmailContents(printifyOrder) + "</body></html>",
  };

  // Simulate asynchronous email sending
  return await transporter.sendMail(mailOptions);
}
      
function getEmailSubject(order: any): string {
  if (order.status === "in-production") {
    return "Order In Production #" + order.id;
  } else if (order.status === "fulfilled") {
    return "Your Order has Shipped! #" + order.id;
  } else if (order.status === "canceled") {
    return "Order Canceled #" + order.id;
  } else {
    return "Order Status Updated #" + order.id;
  }
}
      
function getEmailContents(order: any): string {
  if (order.status === "in-production") {
    let html = "<h1 style=\"text-align: center;\">Review My Driving</h1><h2 style=\"color: #4B0082;\">Your order is being custom crafted!</h2><p><strong>Order Number:  </strong> " + order.id + "</p><p><strong>Order Total:  </strong>" + calculateOrderTotal(order) + "</p>";
    html += "<h3><strong>Order Details:</strong></h3><table><tr><th>Title</th><th>Qty</th><th>Price</th></tr>";

    for (const line_item of order.line_items) {
      const md = line_item.metadata;
      html += "<tr><td>" + md.title.split("-")[0] + "</td><td style=\"text-align: center;\">" + line_item.quantity + "</td><td>" + ((md.price * line_item.quantity) / 100) + "</td></tr>";
    }

    html += "</table>";

    html += "<hr style=\"border: 1px solid #ccc;\" /><p style=\"font-size: 0.9em; color: #555;\">This email was generated automatically by <a href=\"www.reviewmydriving.co\">reviewmydriving.co</a></p>";

    return html;
  } else if (order.status === "fulfilled") {
    return "<h1 style=\"text-align: center;\">Review My Driving</h1><h2 style=\"color: #4B0082;\">Your order has shipped!</h2><p><strong>Order Number:  </strong> " + order.id + "</p><p><strong>Date Shipped:  </strong>" + order.fulfilled_at + "</p><p><strong>Tracking Info: </strong></p><p>Carrier - " + order.shipments[0].carrier+ "</p><p>Tracking #<a href=\"" + order.shipments[0].url + "\">" + order.shipments[0].number + "</a></p><hr style=\"border: 1px solid #ccc;\" /><p style=\"font-size: 0.9em; color: #555;\">This email was generated automatically by <a href=\"www.reviewmydriving.co\">reviewmydriving.co</a></p>";
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
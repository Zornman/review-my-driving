const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');

const shop_id = process.env.PRINTIFY_STORE_ID;
const PRINTIFY_SHOP_URL = process.env.PRINTIFY_URL;
const order_url = `${PRINTIFY_SHOP_URL}/shops/${shop_id}/orders/`;
const api_token = process.env.PRINTIFY_API_KEY;

const uri = process.env.MONGO_URI;

exports.handler = async (event) => {
  if (event.httpMethod === 'POST') {
    try {
        // Parse the form data from the request body
        const data = JSON.parse(event.body);

        const printifyResponse = await fetch(order_url + data.orderID + '.json', {
            headers: { 'Authorization': `Bearer ${api_token}` }
        });
        const printifyOrder = await printifyResponse.json();

        const client = await MongoClient.connect(uri);
        const db = client.db('review_my_driving');
        const ordersCollection = db.collection('user_order_history');

        const order = await ordersCollection.findOne({ orderID: printifyOrder.id });

        if (order.emailOrderConfirm) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Email already sent for this order' }),
            };
        }

        // Set up Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Use Gmail or another email service
            auth: {
            user: process.env.EMAIL_USER, // Your email address
            pass: process.env.EMAIL_PASS, // Your email password (use an app password for Gmail)
            },
        });

        const mailOptions = {
            from: `reviewmy.driving@gmail.com`,
            to: `${printifyOrder.address_to.email}`,
            subject: `Order Confirmation #${data.orderID}`,
            html: `
            <html>
                <head>
                    <style type="text/css">
                    @import url('https://fonts.googleapis.com/css?family=DynaPuff');
                    body {
                        font-family: 'DynaPuff', Arial, serif;
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

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Email sent successfully!' }),
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error sending email', error: error.message }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ message: 'Method not allowed' }),
  };
};

function getEmailContents(order) {
    let html = `
        <h1 style="text-align: center;">Review My Driving</h1>
        <h2 style="color: #4B0082;">Your order has been confirmed!</h2>
        <p><strong>Order Number:  </strong> ${ order.id }</p>
        <p><strong>Order Total:  </strong> $${ calculateOrderTotal(order) }</p>
    `;

    html = html + `
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
        html = html + `
            <tr>
                <td>${md.title.split('-')[0]}</td>
                <td style="text-align: center;">${line_item.quantity}</td>
                <td>$${((md.price * line_item.quantity) / 100)}</td>
            </tr>
        `;
    }

    html = html + `</table>`;

    html = html + `
        <hr style="border: 1px solid #ccc;" />
        <p style="font-size: 0.9em; color: #555;">This email was generated automatically by <a href="www.reviewmydriving.co">reviewmydriving.co</a></p>
    `;

    return html;
}

function calculateOrderTotal(order) {
    let orderTotal = 0;

    for (const line_item of order.line_items) {
        const price = line_item.metadata.price;
        let line_total = price * line_item.quantity;
        orderTotal += line_total;
    }

    return (orderTotal / 100);
}
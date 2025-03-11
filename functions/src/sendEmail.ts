import * as functions from 'firebase-functions/v2';
import nodemailer from 'nodemailer';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const sendEmail = functions
.https.onRequest({ secrets: ['EMAIL_USER', 'EMAIL_PASS'] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === 'POST') {
      try {
        // Parse the form data from the request body
        const data = JSON.parse(req.body);
  
        // Set up Nodemailer transporter
        const transporter = nodemailer.createTransport({
          service: 'gmail', // Use Gmail or another email service
          auth: {
            user: process.env['EMAIL_USER'], // Your email address
            pass: process.env['EMAIL_PASS'], // Your email password (use an app password for Gmail)
          },
        });
  
        const emailTo = data.emailTo ?? 'zornman45@gmail.com';
  
        // Email options
        const mailOptionsUser = {
          from: 'donotreply@reviewmydriving.co', // Sender email address 
          to: `${emailTo}`, // Replace with your own email address
          subject: "New Submission from " + data.firstName + " " + data.lastName,
          html: "<h2 style=\"color: #4B0082;\">New Submission Alert</h2><p><strong>Submitter:</strong>" + data.firstName + " " + data.lastName + "</p><p><strong>Reason for Contacting:</strong> " + data.reasonForContacting + "</p><p><strong>Description:</strong></p><p>" + data.description + "</p><hr style=\"border: 1px solid #ccc;\" /><p style=\"font-size: 0.9em; color: #555;\">This email was generated automatically by <a href=\"www.reviewmydriving.co\">reviewmydriving.co</a> upon form submission.</p>",
        };
  
        // Email options for additional recipient (e.g., Admin)
        const mailOptionsAdmin = {
          from: 'donotreply@reviewmydriving.co',
          to: "zornman45+review+my+driving@gmail.com", // Replace with the second email you want to receive a copy
          subject: "ADMIN EMAIL: New Submission from " + data.firstName + " " + data.lastName,
          html: "<h2 style=\"color: #4B0082;\">New Submission Alert</h2><p><strong>Submitter:</strong>" + data.firstName + " " + data.lastName + "</p><p><strong>Reason for Contacting:</strong> " + data.reasonForContacting + "</p><p><strong>Description:</strong></p><p>" + data.description + "</p><hr style=\"border: 1px solid #ccc;\" /><p style=\"font-size: 0.9em; color: #555;\">This email was generated automatically by <a href=\"www.reviewmydriving.co\">reviewmydriving.co</a> upon form submission.</p>",
        };
  
        // Send both emails concurrently
        await Promise.all([
          transporter.sendMail(mailOptionsUser),
          transporter.sendMail(mailOptionsAdmin),
        ]);
  
        res.status(200).json({ message: 'Email sent successfully!' });
      } catch (error: any) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error sending email', error: error.message });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  });
});

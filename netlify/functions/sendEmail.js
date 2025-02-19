const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  if (event.httpMethod === 'POST') {
    try {
      // Parse the form data from the request body
      const data = JSON.parse(event.body);

      // Set up Nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail', // Use Gmail or another email service
        auth: {
          user: process.env.EMAIL_USER, // Your email address
          pass: process.env.EMAIL_PASS, // Your email password (use an app password for Gmail)
        },
      });

      // Email options
      const mailOptionsUser = {
        from: 'donotreply@reviewmydriving.co', // Sender email address 
        to: `${data.emailTo}`, // Replace with your own email address
        subject: `New Submission from ${data.firstName} ${data.lastName}`,
        html: `
            <h2 style="color: #0077cc;">New Submission Alert</h2>
            <p><strong>Submitter:</strong> ${data.firstName} ${data.lastName}</p>
            <p><strong>Reason for Contacting:</strong> ${data.reasonForContacting}</p>
            <p><strong>Description:</strong></p>
            <p>${data.description}</p>
            <hr style="border: 1px solid #ccc;" />
            <p style="font-size: 0.9em; color: #555;">This email was generated automatically by <a href="www.reviewmydriving.co">reviewmydriving.co</a> upon form submission.</p>
        `,
      };

      // Email options for additional recipient (e.g., Admin)
      const mailOptionsAdmin = {
        from: 'donotreply@reviewmydriving.co',
        to: "zornman45+review+my+driving@gmail.com", // Replace with the second email you want to receive a copy
        subject: `Copy: New Submission from ${data.firstName} ${data.lastName}`,
        html: `
          <h2 style="color: #0077cc;">New Submission Alert (Admin Copy)</h2>
          <p><strong>Submitter:</strong> ${data.firstName} ${data.lastName}</p>
          <p><strong>Reason for Contacting:</strong> ${data.reasonForContacting}</p>
          <p><strong>Description:</strong></p>
          <p>${data.description}</p>
          <hr style="border: 1px solid #ccc;" />
          <p style="font-size: 0.9em; color: #555;">This is an admin copy of the user submission.</p>
        `,
      };

       // Send both emails concurrently
       await Promise.all([
        transporter.sendMail(mailOptionsUser),
        transporter.sendMail(mailOptionsAdmin),
      ]);

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

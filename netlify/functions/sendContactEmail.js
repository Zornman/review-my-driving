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

      const emailTo = 'zornman45@gmail.com';

      // Email options
      const mailOptions = {
        from: `${data.email}`, // Sender email address 
        to: `${emailTo}`, // Replace with your own email address
        subject: `New Contact Form submission from ${data.firstName} ${data.lastName}`,
        html: `
            <h2 style="color: #4B0082;">New Contact Form submission</h2>
            <p><strong>Submitter:</strong> ${data.firstName} ${data.lastName}</p>
            <p><strong>E-mail:</strong> ${data.email}</p>
            <p><strong>Reason for Contacting:</strong> ${data.reasonForContacting}</p>
            <p><strong>Description:</strong></p>
            <p>${data.description}</p>
            <hr style="border: 1px solid #ccc;" />
            <p style="font-size: 0.9em; color: #555;">This email was generated automatically by <a href="www.reviewmydriving.co">reviewmydriving.co</a> upon form submission.</p>
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

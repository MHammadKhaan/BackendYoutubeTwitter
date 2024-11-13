import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Send Email Function
const sendEmail = async (options) => {
  // Adjust the template path to point to the root directory
  const templatePath = path.resolve("emailTemplate.html"); // Resolves to the root directory
  let emailHtml = fs.readFileSync(templatePath, "utf8"); // Read file synchronously

  // Replace the placeholder {{name}} with the actual name or dynamic data
  emailHtml = emailHtml
    .replace("{{name}}", options.fullName)
    .replace("{{verificationUrl}}", options.verificationUrl);

  // Create a nodemailer transporter instance
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    secure:false,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  // The email content
  const mail = {
    from: "mhamadpst6@gmail.com", // Sender's email
    to: options.email, // Receiver's email
    subject: options.subject, // Email subject
    html: emailHtml, // HTML content (from the template)
  };

  try {
    // Send the email using the transporter
    await transporter.sendMail(mail);
    console.log("Email sent successfully!");
  } catch (error) {
    // Log error if sending email fails
    console.error("Error sending email: ", error);
  }
};

// Example usage
export { sendEmail };

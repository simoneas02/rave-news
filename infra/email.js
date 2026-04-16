import { ServiceError } from "errors/serviceError";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production" ? true : false,
});
async function send(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ServiceError({
      message: "It was not possible to send the email at this time.",
      action:
        "Please try again later or contact support if the problem persists.",
      cause: error,
      context: mailOptions,
    });
  }
}

const email = {
  send,
};

export default email;

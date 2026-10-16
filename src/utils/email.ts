// To connect to smtp and to send otp to emails

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpEmail = async (
  to: string,
  code: string,
  subject: string,
) => {
  await transporter.sendMail(
    {
      from: process.env.MAIL_FROM,
      to,
      subject,
      text: `Your code is ${code}. It expires in 5 minutes.`,
      html: `<p>Your code is <b style="font-size:20px">${code}</b></p><p>It expires in 5 minutes.</p>`,
    },
    (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log("Message sent: %s", info.messageId);
    },
  );
};

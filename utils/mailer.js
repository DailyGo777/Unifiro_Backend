import nodemailer from "nodemailer";

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendOtpEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"Unifiro" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Your Unifiro Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Verify Your Email</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br />
        <p>– Team Unifiro</p>
      </div>
    `,
  });
};

export const sendForgotPasswordLink = async (link, toEmail) => {
  await transporter.sendMail({
    from: `"Unifiro" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your Unifiro password",
    html: `
      <div style="font-family: Arial, sans-serif">
        <h2>Password Reset</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${link}"
           style="display:inline-block;padding:10px 16px;
           background:#16a34a;color:#fff;border-radius:6px;
           text-decoration:none;">
          Reset Password
        </a>
        <p>This link expires in 15 minutes.</p>
        <br/>
        <p>– Team Unifiro</p>
      </div>
    `,
  });
};


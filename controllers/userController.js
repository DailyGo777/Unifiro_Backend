import bcrypt from "bcryptjs";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import { generateResetToken } from "../utils/token.js";
import crypto from "crypto";
import {
  generateOTP,
  sendOtpEmail,
  sendForgotPasswordLink,
} from "../utils/mailer.js";

export const userSignup = async (req, res) => {
  try {
    const { fullName, email, mobile, password, terms } = req.body;

    if (!fullName || !email || !mobile || !password || !terms) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR mobile = ?",
      [email, mobile]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const otp = generateOTP();

    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const passwordHash = await bcrypt.hash(password, 10);
    const hashedOTP = await bcrypt.hash(otp, 10);

    await pool.query(
      `INSERT INTO users 
       (full_name, email, mobile, password_hash, is_accepted, email_otp, otp_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fullName, email, mobile, passwordHash, terms, hashedOTP, otpExpiresAt]
    );

    sendOtpEmail(email, otp).catch(console.error);

    res.status(201).json({
      message: "Account created. Please verify your email.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { identifier, password, rememberMe } = req.body;

    const [rows] = await pool.query(
      `SELECT * FROM users WHERE email = ? OR mobile = ? LIMIT 1`,
      [identifier, identifier]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.is_verified) {
      return res.status(400).json({ message: "User is not verified" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: rememberMe ? "30d" : "1d",
    });

    res.cookie("unifiro_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.full_name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const userLogout = (req, res) => {
  res.clearCookie("unifiro_token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [
    email,
  ]);

  if (!users.length) {
    return res.json({ message: "If account exists, reset link sent" });
  }

  const { rawToken, hashedToken } = generateResetToken();

  await pool.query(
    `UPDATE users 
     SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
     WHERE email = ?`,
    [hashedToken, email]
  );

  const resetLink = `http://localhost:3000/reset-password?token=${rawToken}`;

  sendForgotPasswordLink(resetLink, email);

  res.json({ message: "Password reset link sent" });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const [users] = await pool.query(
    `SELECT id FROM users 
     WHERE reset_token = ? AND reset_token_expiry > NOW()`,
    [hashedToken]
  );

  if (!users.length) {
    return res.status(400).json({ message: "Token expired or invalid" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `UPDATE users 
     SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL
     WHERE id = ?`,
    [passwordHash, users[0].id]
  );

  res.json({ message: "Password updated successfully" });
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const [users] = await pool.query(
      `SELECT id, email_otp, otp_expires_at, is_verified 
       FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    if (user.is_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (!user.email_otp || !user.otp_expires_at) {
      return res.status(400).json({ message: "OTP not generated" });
    }

    if (new Date(user.otp_expires_at) < new Date()) {
      return res.status(410).json({ message: "OTP expired" });
    }

    const isValidOtp = await bcrypt.compare(otp.toString(), user.email_otp);

    if (!isValidOtp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    await pool.query(
      `UPDATE users 
       SET is_verified = true,
           email_otp = NULL,
           otp_expires_at = NULL
       WHERE id = ?`,
      [user.id]
    );

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const [users] = await pool.query(
      `SELECT id, is_verified FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    if (user.is_email_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET email_otp = ?, otp_expires_at = ?
       WHERE id = ?`,
      [hashedOTP, otpExpiresAt, user.id]
    );

    sendOtpEmail(email, otp).catch(console.error);

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

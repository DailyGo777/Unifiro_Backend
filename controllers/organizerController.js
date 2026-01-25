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

export const organizerSignup = async (req, res) => {
  try {
    const {
      organizerName,
      organizerType,
      email,
      mobile,
      password,
      about,
      location,
      idProof,
      bankAccount,
      ifsc,
    } = req.body;

    if (
      !organizerName ||
      !organizerType ||
      !email ||
      !mobile ||
      !password ||
      !about ||
      !location ||
      !idProof ||
      !bankAccount ||
      !ifsc
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existing] = await pool.query(
      "SELECT id FROM organizers WHERE email = ? OR mobile = ?",
      [email, mobile],
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Organizer already exists" });
    }

    const otp = generateOTP();

    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedOTP = await bcrypt.hash(otp, 10);

    const query = `
      INSERT INTO organizers 
      (organizer_name, organizer_type, email, mobile, password,
       about, location, id_proof, bank_account, ifsc, email_otp, otp_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [
      organizerName,
      organizerType,
      email,
      mobile,
      hashedPassword,
      about,
      location,
      idProof,
      bankAccount,
      ifsc,
      hashedOTP,
      otpExpiresAt,
    ]);

    sendOtpEmail(email, otp).catch(console.error);

    res.status(201).json({ message: "Organizer registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const organizerLogin = async (req, res) => {
  try {
    const { identifier, password, rememberMe } = req.body;

    const [rows] = await pool.query(
      `SELECT * FROM organizers WHERE email = ? OR mobile = ? LIMIT 1`,
      [identifier, identifier],
    );

    if (!rows.length) {
      console.log("Mobile is wrong");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const organizer = rows[0];
    const isMatch = await bcrypt.compare(password, organizer.password);

    if (!isMatch) {
      console.log("Password is wrong");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!organizer.is_email_verified) {
      return res.status(400).json({ message: "organizer is not verified" });
    }

    const token = jwt.sign({ id: organizer.id }, process.env.JWT_SECRET, {
      expiresIn: rememberMe ? "30d" : "1d",
    });

    res.cookie("organizer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      organizer: {
        id: organizer.id,
        name: organizer.full_name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const organizerLogout = (req, res) => {
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

  const [organizers] = await pool.query(
    "SELECT id FROM organizers WHERE email = ?",
    [email],
  );

  if (!organizers.length) {
    return res.json({ message: "If account exists, reset link sent" });
  }

  const { rawToken, hashedToken } = generateResetToken();

  await pool.query(
    `UPDATE organizers 
     SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
     WHERE email = ?`,
    [hashedToken, email],
  );

  const resetLink = `http://localhost:3000/reset-password?token=${rawToken}&type=organiser`;

  sendForgotPasswordLink(resetLink, email);

  res.json({ message: "Password reset link sent" });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const [organizers] = await pool.query(
    `SELECT id FROM organizers 
     WHERE reset_token = ? AND reset_token_expiry > NOW()`,
    [hashedToken],
  );

  if (!organizers.length) {
    return res.status(400).json({ message: "Token expired or invalid" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `UPDATE organizers 
     SET password = ?, reset_token = NULL, reset_token_expiry = NULL
     WHERE id = ?`,
    [passwordHash, organizers[0].id],
  );

  res.json({ message: "Password updated successfully" });
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const [organizers] = await pool.query(
      `SELECT id, email_otp, otp_expires_at, is_email_verified 
       FROM organizers WHERE email = ?`,
      [email],
    );

    if (organizers.length === 0) {
      return res.status(404).json({ message: "organizer not found" });
    }

    const organizer = organizers[0];

    if (organizer.is_email_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (!organizer.email_otp || !organizer.otp_expires_at) {
      return res.status(400).json({ message: "OTP not generated" });
    }

    if (new Date(organizer.otp_expires_at) < new Date()) {
      return res.status(410).json({ message: "OTP expired" });
    }

    const isValidOtp = await bcrypt.compare(
      otp.toString(),
      organizer.email_otp,
    );

    if (!isValidOtp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    await pool.query(
      `UPDATE organizers 
       SET is_email_verified = true,
           email_otp = NULL,
           otp_expires_at = NULL
       WHERE id = ?`,
      [organizer.id],
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

    const [organizers] = await pool.query(
      `SELECT id, is_email_verified FROM organizers WHERE email = ?`,
      [email],
    );

    if (organizers.length === 0) {
      return res.status(404).json({ message: "organizer not found" });
    }

    const organizer = organizers[0];

    if (organizer.is_email_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `UPDATE organizers
       SET email_otp = ?, otp_expires_at = ?
       WHERE id = ?`,
      [hashedOTP, otpExpiresAt, organizer.id],
    );

    sendOtpEmail(email, otp).catch(console.error);

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

import bcrypt from "bcryptjs";
import pool from "../db.js";

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO organizers 
      (organizer_name, organizer_type, email, mobile, password,
       about, location, id_proof, bank_account, ifsc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    ]);

    res.status(201).json({ message: "Organizer registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

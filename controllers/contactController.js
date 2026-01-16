import pool from '../db.js'

export const contactControl = async (req, res) => {
    const { name, email, subject, message } = req.body;
    try {
         if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

        const [existing] = await pool.query('SELECT id FROM contact WHERE email = ?', [email]);

        if(existing.length > 0){
           return res.status(409).json({message: "Email already exist"})
        }

        const query = 'INSERT INTO contact (name, email, subject, message) VALUES (?, ?, ?, ?)'

        await pool.query(query, [name, email, subject, message])

        return res.status(201).json({message: "Contact saved successfully"})
    } catch (error) {
        return res.status(500).json({message: "Internal Server Occured"})
    }
}
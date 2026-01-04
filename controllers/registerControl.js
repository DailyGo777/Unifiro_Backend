import pool from "../db.js";

export const register = async(req, res) => {
    try {
    const { fullName, mobileNumber, subject, message } = req.body;
    const query = `INSERT INTO registrations (full_name,  mobile_number, subject, message) VALUES (?, ?, ?, ?)`;
    
    await pool.execute(query, [fullName, mobileNumber, subject, message]);
    res.status(201).json({ message: 'Registration successful!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const emergeRegistration = async (req, res) => {
  try {
    const data = req.body;
    const file = req.file;

    // Validate file exists
    if (!file) {
      return res.status(400).json({
        error: 'Pitch deck file is required'
      });
    }

    const query = `
      INSERT INTO startup_applications (
        full_name_founder,
        gender,
        age,
        startup_name,
        location,
        mobile,
        email,
        education,
        stage,
        sector,
        description,
        challenge,
        problem,
        target_market,
        uvp,
        has_team,
        team_details,
        has_revenue,
        mrr,
        has_ip,
        is_raising,
        raise_amount,
        previous_funding,
        long_term_vision,
        pitch_deck_filename,
        pitch_deck_data,
        pitch_deck_size,
        pitch_deck_mime_type,
        confirm_accurate,
        confirm_disqualification,
        confirm_contact
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.fullNameFounder,
      data.gender,
      data.age,
      data.startupName,
      data.location,
      data.mobile,
      data.email,
      data.education,
      data.stage,
      data.sector,
      data.description,
      data.challenge,
      data.problem,
      data.targetMarket,
      data.uvp,
      data.hasTeam,
      data.hasTeam === 'Yes' ? data.teamDetails : null,
      data.hasRevenue,
      data.hasRevenue === 'Yes' ? data.mrr : null,
      data.hasIP,
      data.isRaising,
      data.isRaising === 'Yes' ? data.raiseAmount : null,
      data.previousFunding,
      data.longTermVision,
      file.originalname,          // filename
      file.buffer,                 // binary data (BLOB)
      file.size,                   // file size in bytes
      file.mimetype,               // mime type
      data.confirmAccurate === 'true' || data.confirmAccurate === true ? 1 : 0,
      data.confirmDisqualification === 'true' || data.confirmDisqualification === true ? 1 : 0,
      data.confirmContact === 'true' || data.confirmContact === true ? 1 : 0
    ];

    await pool.execute(query, values);

    res.status(201).json({
      message: 'Startup application submitted successfully!'
    });

  } catch (error) {
    console.error('Error in emergeRegistration:', error);
    res.status(500).json({
      error: 'Database insertion failed',
      details: error.message
    });
  }
};

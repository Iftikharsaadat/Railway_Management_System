const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// POST /api/auth/register
const register = async (req, res) => {
  const { nid, name, password ,phone,role} = req.body;
  const userRole = role || 'passenger';

  if (!nid || !name || !password || !phone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if NID already exists
    const existing = await pool.query(
      "SELECT * FROM account WHERE nid = $1",
      [nid]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "NID already registered" });
    }
    //check if phone already exists
    const existingPhone = await pool.query(
      "SELECT * FROM account WHERE phone = $1",
      [phone]
    );
    if (existingPhone.rows.length > 0) {
      return res.status(400).json({ error: "Phone number already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new account
    const result = await pool.query(
      "INSERT INTO account (nid, name, password, phone ,role) VALUES ($1, $2, $3, $4, $5) RETURNING account_id, nid, name,phone",
      [nid, name, hashedPassword, phone, userRole]
    );

    res.status(201).json({
      message: "Registration successful",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: "Phone number and password are required" });
  }

  try {
    // Find account by phone number
    const result = await pool.query(
      "SELECT * FROM account WHERE phone = $1",
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid phone number or password" });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid phone number or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { account_id: user.account_id, phone: user.phone , role: user.role},
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        account_id: user.account_id,
        nid: user.nid,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login };
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// POST /api/auth/register
const register = async (req, res) => {
  const { nid, name, password } = req.body;

  if (!nid || !name || !password) {
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new account
    const result = await pool.query(
      "INSERT INTO account (nid, name, password) VALUES ($1, $2, $3) RETURNING account_id, nid, name",
      [nid, name, hashedPassword]
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
  const { nid, password } = req.body;

  if (!nid || !password) {
    return res.status(400).json({ error: "NID and password are required" });
  }

  try {
    // Find account by NID
    const result = await pool.query(
      "SELECT * FROM account WHERE nid = $1",
      [nid]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid NID or password" });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid NID or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { account_id: user.account_id, nid: user.nid },
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
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login };
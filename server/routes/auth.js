const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { get, run } = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username e password obbligatori" });
    }

    const user = await get("SELECT * FROM utenti WHERE username = ?", [username]);
    if (!user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, ruolo: user.ruolo },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: { id: user.id, username: user.username, ruolo: user.ruolo }
    });
  } catch (error) {
    return res.status(500).json({ message: "Errore login", error: error.message });
  }
});

router.post("/operatori", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username e password obbligatori" });
    }

    const exists = await get("SELECT id FROM utenti WHERE username = ?", [username]);
    if (exists) {
      return res.status(409).json({ message: "Username gia in uso" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await run(
      "INSERT INTO utenti (username, password_hash, ruolo) VALUES (?, ?, 'operatore')",
      [username, hash]
    );

    return res.status(201).json({ id: result.lastID, username, ruolo: "operatore" });
  } catch (error) {
    return res.status(500).json({ message: "Errore creazione operatore", error: error.message });
  }
});

module.exports = router;

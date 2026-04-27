const express = require("express");
const bcrypt = require("bcryptjs");
const { all, get, run } = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const rows = await all(
      "SELECT id, nome, cognome, username, ruolo, created_at FROM utenti WHERE ruolo = 'operatore' ORDER BY id DESC"
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Errore lettura operatori", error: error.message });
  }
});

router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { nome, cognome, username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username e password obbligatori" });
    }

    const exists = await get("SELECT id FROM utenti WHERE username = ?", [username]);
    if (exists) {
      return res.status(409).json({ message: "Username gia in uso" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await run(
      "INSERT INTO utenti (nome, cognome, username, password_hash, ruolo) VALUES (?, ?, ?, ?, 'operatore')",
      [nome || null, cognome || null, username, hash]
    );

    return res.status(201).json({ id: result.lastID, nome, cognome, username, ruolo: "operatore" });
  } catch (error) {
    return res.status(500).json({ message: "Errore creazione operatore", error: error.message });
  }
});

router.put("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { nome, cognome, username, password } = req.body;
    const existing = await get("SELECT * FROM utenti WHERE id = ? AND ruolo = 'operatore'", [req.params.id]);
    if (!existing) return res.status(404).json({ message: "Operatore non trovato" });

    const nextUsername = username || existing.username;
    const nextNome = nome || existing.nome;
    const nextCognome = cognome || existing.cognome;

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await run(
        "UPDATE utenti SET nome = ?, cognome = ?, username = ?, password_hash = ? WHERE id = ?",
        [nextNome, nextCognome, nextUsername, hash, req.params.id]
      );
    } else {
      await run(
        "UPDATE utenti SET nome = ?, cognome = ?, username = ? WHERE id = ?",
        [nextNome, nextCognome, nextUsername, req.params.id]
      );
    }

    const updated = await get(
      "SELECT id, nome, cognome, username, ruolo, created_at FROM utenti WHERE id = ?",
      [req.params.id]
    );
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Errore aggiornamento operatore", error: error.message });
  }
});

router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    await run("UPDATE clienti SET operatore_id = NULL WHERE operatore_id = ?", [req.params.id]);
    await run("DELETE FROM utenti WHERE id = ? AND ruolo = 'operatore'", [req.params.id]);
    return res.json({ message: "Operatore eliminato" });
  } catch (error) {
    return res.status(500).json({ message: "Errore eliminazione operatore", error: error.message });
  }
});

module.exports = router;

const express = require("express");
const { all, get, run } = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  try {
    const rows = await all(
      `SELECT c.*
       FROM clienti c
       ORDER BY c.id DESC`
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Errore lettura clienti", error: error.message });
  }
});

router.get("/:id", authRequired, async (req, res) => {
  try {
    const cliente = await get("SELECT * FROM clienti WHERE id = ?", [req.params.id]);
    if (!cliente) return res.status(404).json({ message: "Cliente non trovato" });

    return res.json(cliente);
  } catch (error) {
    return res.status(500).json({ message: "Errore dettaglio cliente", error: error.message });
  }
});

router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { nome, telefono, indirizzo, note } = req.body;
    if (!nome) return res.status(400).json({ message: "Nome obbligatorio" });

    const result = await run(
      "INSERT INTO clienti (nome, telefono, indirizzo, note) VALUES (?, ?, ?, ?)",
      [nome, telefono || null, indirizzo || null, note || null]
    );

    const created = await get("SELECT * FROM clienti WHERE id = ?", [result.lastID]);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Errore creazione cliente", error: error.message });
  }
});

router.put("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { nome, telefono, indirizzo, note } = req.body;
    await run(
      `UPDATE clienti
       SET nome = ?, telefono = ?, indirizzo = ?, note = ?
       WHERE id = ?`,
      [nome, telefono || null, indirizzo || null, note || null, req.params.id]
    );

    const updated = await get("SELECT * FROM clienti WHERE id = ?", [req.params.id]);
    if (!updated) return res.status(404).json({ message: "Cliente non trovato" });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Errore aggiornamento cliente", error: error.message });
  }
});

router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    await run("DELETE FROM clienti WHERE id = ?", [req.params.id]);
    return res.json({ message: "Cliente eliminato" });
  } catch (error) {
    return res.status(500).json({ message: "Errore eliminazione cliente", error: error.message });
  }
});

module.exports = router;

const express = require("express");
const { all, get, run } = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET - Lista tutti i tipi di intervento (accessibile a tutti gli autenticati)
router.get("/", authRequired, async (req, res) => {
  try {
    const rows = await all("SELECT * FROM tipi_intervento ORDER BY nome ASC");
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Errore lettura tipi intervento", error: error.message });
  }
});

// POST - Crea nuovo tipo intervento (solo admin)
router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ message: "Nome obbligatorio" });
    }

    const existing = await get("SELECT id FROM tipi_intervento WHERE LOWER(nome) = LOWER(?)", [nome.trim()]);
    if (existing) {
      return res.status(409).json({ message: "Tipo di intervento già esistente" });
    }

    const result = await run("INSERT INTO tipi_intervento (nome) VALUES (?)", [nome.trim()]);
    const created = await get("SELECT * FROM tipi_intervento WHERE id = ?", [result.lastID]);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Errore creazione tipo intervento", error: error.message });
  }
});

// DELETE - Elimina tipo intervento (solo admin)
router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const existing = await get("SELECT id FROM tipi_intervento WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Tipo intervento non trovato" });
    }

    await run("DELETE FROM tipi_intervento WHERE id = ?", [req.params.id]);
    return res.json({ message: "Tipo intervento eliminato" });
  } catch (error) {
    return res.status(500).json({ message: "Errore eliminazione tipo intervento", error: error.message });
  }
});

module.exports = router;

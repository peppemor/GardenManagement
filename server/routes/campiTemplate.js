const express = require("express");
const { all, get, run } = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();
const ALLOWED_TYPES = new Set(["text", "textarea", "number", "date"]);

router.get("/", authRequired, async (_req, res) => {
  try {
    const rows = await all(
      "SELECT id, nome, tipo, attivo, obbligatorio, is_default, created_at FROM campi_template ORDER BY is_default DESC, id ASC"
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Errore lettura campi template", error: error.message });
  }
});

router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const nome = (req.body?.nome || "").trim();
    const tipo = (req.body?.tipo || "text").trim();
    const attivo = req.body?.attivo ? 1 : 0;
    const obbligatorio = attivo === 1 && req.body?.obbligatorio ? 1 : 0;

    if (!nome) return res.status(400).json({ message: "Nome campo obbligatorio" });
    if (!ALLOWED_TYPES.has(tipo)) return res.status(400).json({ message: "Tipo campo non valido" });

    const existing = await get("SELECT id FROM campi_template WHERE LOWER(nome) = LOWER(?)", [nome]);
    if (existing) {
      return res.status(409).json({ message: "Campo già esistente" });
    }

    const result = await run(
      "INSERT INTO campi_template (nome, tipo, attivo, obbligatorio, is_default) VALUES (?, ?, ?, ?, 0)",
      [nome, tipo, attivo, obbligatorio]
    );

    const created = await get("SELECT id, nome, tipo, attivo, obbligatorio, is_default, created_at FROM campi_template WHERE id = ?", [result.lastID]);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Errore creazione campo template", error: error.message });
  }
});

router.patch("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const item = await get("SELECT * FROM campi_template WHERE id = ?", [req.params.id]);
    if (!item) return res.status(404).json({ message: "Campo non trovato" });

    if (item.is_default === 1 && req.body?.attivo === 0) {
      return res.status(400).json({ message: "I campi base non possono essere disattivati" });
    }

    const attivo = req.body?.attivo === undefined ? item.attivo : (req.body?.attivo ? 1 : 0);
    let obbligatorio = req.body?.obbligatorio === undefined ? item.obbligatorio : (req.body?.obbligatorio ? 1 : 0);

    // A field cannot be required if it is not included in template.
    if (attivo === 0) {
      obbligatorio = 0;
    }
    await run("UPDATE campi_template SET attivo = ?, obbligatorio = ? WHERE id = ?", [attivo, obbligatorio, req.params.id]);

    const updated = await get("SELECT id, nome, tipo, attivo, obbligatorio, is_default, created_at FROM campi_template WHERE id = ?", [req.params.id]);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Errore aggiornamento campo template", error: error.message });
  }
});

router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const item = await get("SELECT id, is_default FROM campi_template WHERE id = ?", [req.params.id]);
    if (!item) return res.status(404).json({ message: "Campo non trovato" });
    if (item.is_default === 1) return res.status(400).json({ message: "I campi base non possono essere eliminati" });

    await run("DELETE FROM campi_template WHERE id = ?", [req.params.id]);
    return res.json({ message: "Campo eliminato" });
  } catch (error) {
    return res.status(500).json({ message: "Errore eliminazione campo template", error: error.message });
  }
});

module.exports = router;

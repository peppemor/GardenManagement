const express = require("express");
const { all, get, run } = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    return options.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof options === "string") {
    const split = options.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
    if (split.length > 0) return split;
    return options.trim() ? [options.trim()] : [];
  }

  return [];
}

function normalizeCampiSchema(campiSchema) {
  if (!Array.isArray(campiSchema)) return [];

  return campiSchema.map((field) => {
    const type = field?.type || "text";
    return {
      id: field?.id || Date.now(),
      label: field?.label || "Nuovo campo",
      type,
      required: Boolean(field?.required),
      options: type === "select" ? normalizeOptions(field?.options) : []
    };
  });
}

router.get("/", authRequired, async (req, res) => {
  try {
    const rows = await all("SELECT * FROM template ORDER BY id DESC");
    // Parse campi_schema se è una stringa JSON
    const parsed = rows.map(t => ({
      ...t,
      campi_schema: normalizeCampiSchema(
        typeof t.campi_schema === "string" ? JSON.parse(t.campi_schema || "[]") : t.campi_schema
      )
    }));
    return res.json(parsed);
  } catch (error) {
    return res.status(500).json({ message: "Errore lettura template", error: error.message });
  }
});

router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { titolo, contenuto, campi_schema } = req.body;
    if (!titolo) {
      return res.status(400).json({ message: "Titolo obbligatorio" });
    }

    const normalizedCampiSchema = normalizeCampiSchema(campi_schema);
    const schema = JSON.stringify(normalizedCampiSchema);
    
    const result = await run(
      "INSERT INTO template (titolo, contenuto, campi_schema) VALUES (?, ?, ?)",
      [titolo, contenuto || '', schema]
    );

    const created = await get("SELECT * FROM template WHERE id = ?", [result.lastID]);
    return res.status(201).json({
      ...created,
      campi_schema: normalizeCampiSchema(JSON.parse(created.campi_schema || "[]"))
    });
  } catch (error) {
    return res.status(500).json({ message: "Errore creazione template", error: error.message });
  }
});

router.put("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { titolo, contenuto, campi_schema } = req.body;
    const normalizedCampiSchema = normalizeCampiSchema(campi_schema);
    const schema = JSON.stringify(normalizedCampiSchema);
    
    await run(
      "UPDATE template SET titolo = ?, contenuto = ?, campi_schema = ? WHERE id = ?",
      [titolo, contenuto || '', schema, req.params.id]
    );

    const updated = await get("SELECT * FROM template WHERE id = ?", [req.params.id]);
    if (!updated) return res.status(404).json({ message: "Template non trovato" });

    return res.json({
      ...updated,
      campi_schema: normalizeCampiSchema(JSON.parse(updated.campi_schema || "[]"))
    });
  } catch (error) {
    return res.status(500).json({ message: "Errore aggiornamento template", error: error.message });
  }
});

router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    await run("DELETE FROM template WHERE id = ?", [req.params.id]);
    return res.json({ message: "Template eliminato" });
  } catch (error) {
    return res.status(500).json({ message: "Errore eliminazione template", error: error.message });
  }
});

module.exports = router;

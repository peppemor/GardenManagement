const express = require("express");
const { all, get, run } = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

// ============================================
// GET - Lista rapporti con filtri
// ============================================
router.get("/", authRequired, async (req, res) => {
  try {
    const { status, cliente } = req.query;
    let query = `
      SELECT r.*, c.nome AS cliente_nome, u.username AS operatore_username, 
             u.nome AS operatore_nome, u.cognome AS operatore_cognome,
             t.titolo AS template_titolo
      FROM rapporti r
      JOIN clienti c ON c.id = r.cliente_id
      JOIN utenti u ON u.id = r.operatore_id
      LEFT JOIN template t ON t.id = r.template_id
      WHERE 1=1
    `;
    const params = [];

    // Regola visibilità operatori:
    // - bozze visibili solo all'operatore che le ha create
    // - rifiutati visibili solo all'operatore che li ha creati
    // - altri rapporti non in bozza visibili a tutti gli operatori
    if (req.user.ruolo === "operatore") {
      if (status === "rifiutato") {
        query += ` AND r.operatore_id = ?`;
        params.push(req.user.id);
      } else {
        query += ` AND (r.status != 'bozza' OR r.operatore_id = ?)`;
        params.push(req.user.id);
      }
    }

    // Filtra per status se fornito
    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    // Filtra per cliente se fornito
    if (cliente) {
      query += ` AND r.cliente_id = ?`;
      params.push(cliente);
    }

    query += ` ORDER BY r.created_at DESC`;

    const rows = await all(query, params);
    
    // Parse dati_compilati
    const parsed = rows.map(r => ({
      ...r,
      dati_compilati: typeof r.dati_compilati === 'string' ? JSON.parse(r.dati_compilati || '{}') : r.dati_compilati
    }));

    return res.json(parsed);
  } catch (error) {
    return res.status(500).json({ message: "Errore lettura rapporti", error: error.message });
  }
});

// ============================================
// POST - Crea nuovo rapporto in bozza
// ============================================
router.post("/", authRequired, async (req, res) => {
  try {
    const { cliente_id, template_id, dati_compilati } = req.body;

    if (!cliente_id) {
      return res.status(400).json({ message: "cliente_id obbligatorio" });
    }

    // Verifica che il cliente esista
    const cliente = await get("SELECT * FROM clienti WHERE id = ?", [cliente_id]);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente non trovato" });
    }

    const compilati = typeof dati_compilati === 'string' ? dati_compilati : JSON.stringify(dati_compilati || {});

    const result = await run(
      `INSERT INTO rapporti (cliente_id, operatore_id, template_id, status, dati_compilati, created_at, updated_at)
       VALUES (?, ?, ?, 'bozza', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [cliente_id, req.user.id, template_id || null, compilati]
    );

    const created = await get("SELECT * FROM rapporti WHERE id = ?", [result.lastID]);
    return res.status(201).json({
      ...created,
      dati_compilati: JSON.parse(created.dati_compilati || '{}')
    });
  } catch (error) {
    return res.status(500).json({ message: "Errore creazione rapporto", error: error.message });
  }
});

// ============================================
// ROTTE SPECIFICHE - Devono stare PRIMA delle rotte generiche
// ============================================

// PATCH - Operatore sottomette rapporto per approvazione
router.patch("/:id/sottometti", authRequired, async (req, res) => {
  try {
    const rapporto = await get("SELECT * FROM rapporti WHERE id = ?", [req.params.id]);

    if (!rapporto) {
      return res.status(404).json({ message: "Rapporto non trovato" });
    }

    if (rapporto.operatore_id !== req.user.id && req.user.ruolo !== "admin") {
      return res.status(403).json({ message: "Non hai permessi" });
    }

    if (rapporto.status !== "bozza") {
      return res.status(400).json({ message: "Solo le bozze possono essere sottomesse" });
    }

    await run(
      "UPDATE rapporti SET status = 'in_attesa', motivo_rifiuto = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [req.params.id]
    );

    // Notifica a tutti gli admin per nuovo rapporto in attesa
    const admins = await all("SELECT id FROM utenti WHERE ruolo = 'admin'");
    for (const admin of admins) {
      await run(
        "INSERT INTO notifiche (utente_id, tipo, rapporto_id) VALUES (?, 'in_attesa', ?)",
        [admin.id, Number(req.params.id)]
      );
    }

    const updated = await get("SELECT * FROM rapporti WHERE id = ?", [req.params.id]);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Errore sottomissione rapporto", error: error.message });
  }
});

// PATCH - Admin approva rapporto
router.patch("/:id/approva", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const rapporto = await get("SELECT * FROM rapporti WHERE id = ?", [req.params.id]);

    if (!rapporto) {
      return res.status(404).json({ message: "Rapporto non trovato" });
    }

    if (rapporto.status !== "in_attesa") {
      return res.status(400).json({ message: "Solo rapporti in attesa possono essere approvati" });
    }

    await run(
      "UPDATE rapporti SET status = 'approvato', motivo_rifiuto = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [req.params.id]
    );

    // Notifica all'operatore
    await run(
      "INSERT INTO notifiche (utente_id, tipo, rapporto_id) VALUES (?, 'approvato', ?)",
      [rapporto.operatore_id, rapporto.id]
    );

    const updated = await get("SELECT * FROM rapporti WHERE id = ?", [req.params.id]);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Errore approvazione rapporto", error: error.message });
  }
});

// PATCH - Admin rifiuta rapporto
router.patch("/:id/rifiuta", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const commento = typeof req.body?.commento === "string" ? req.body.commento.trim() : "";
    const rapporto = await get("SELECT * FROM rapporti WHERE id = ?", [req.params.id]);

    if (!rapporto) {
      return res.status(404).json({ message: "Rapporto non trovato" });
    }

    if (rapporto.status !== "in_attesa") {
      return res.status(400).json({ message: "Solo rapporti in attesa possono essere rifiutati" });
    }

    await run(
      "UPDATE rapporti SET status = 'rifiutato', motivo_rifiuto = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [commento || null, req.params.id]
    );

    // Notifica all'operatore
    await run(
      "INSERT INTO notifiche (utente_id, tipo, rapporto_id) VALUES (?, 'rifiutato', ?)",
      [rapporto.operatore_id, rapporto.id]
    );

    const updated = await get("SELECT * FROM rapporti WHERE id = ?", [req.params.id]);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Errore rifiuto rapporto", error: error.message });
  }
});

// DELETE - Elimina rapporto (solo bozze)
router.delete("/:id", authRequired, async (req, res) => {
  try {
    const rapporto = await get("SELECT * FROM rapporti WHERE id = ?", [req.params.id]);

    if (!rapporto) {
      return res.status(404).json({ message: "Rapporto non trovato" });
    }

    if (rapporto.operatore_id !== req.user.id && req.user.ruolo !== "admin") {
      return res.status(403).json({ message: "Non hai permessi" });
    }

    if (rapporto.status !== "bozza") {
      return res.status(400).json({ message: "Solo le bozze possono essere eliminate" });
    }

    await run("DELETE FROM rapporti WHERE id = ?", [req.params.id]);
    return res.json({ message: "Rapporto eliminato" });
  } catch (error) {
    return res.status(500).json({ message: "Errore eliminazione rapporto", error: error.message });
  }
});

// ============================================
// ROTTE GENERICHE - Devono stare DOPO le rotte specifiche
// ============================================

// PATCH - Aggiorna bozza rapporto
router.patch("/:id", authRequired, async (req, res) => {
  try {
    const { dati_compilati, template_id } = req.body;
    const rapporto = await get("SELECT * FROM rapporti WHERE id = ?", [req.params.id]);

    if (!rapporto) {
      return res.status(404).json({ message: "Rapporto non trovato" });
    }

    // Solo l'operatore che ha creato il rapporto o un admin può modificarlo (se è bozza)
    if (req.user.ruolo === "operatore" && rapporto.operatore_id !== req.user.id) {
      return res.status(403).json({ message: "Non hai permessi per modificare questo rapporto" });
    }

    if (rapporto.status !== "bozza") {
      return res.status(400).json({ message: "Solo i rapporti in bozza possono essere modificati" });
    }

    const compilati = typeof dati_compilati === 'string' ? dati_compilati : JSON.stringify(dati_compilati || {});

    await run(
      "UPDATE rapporti SET dati_compilati = ?, template_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [compilati, template_id || rapporto.template_id, req.params.id]
    );

    const updated = await get("SELECT * FROM rapporti WHERE id = ?", [req.params.id]);
    return res.json({
      ...updated,
      dati_compilati: JSON.parse(updated.dati_compilati || '{}')
    });
  } catch (error) {
    return res.status(500).json({ message: "Errore aggiornamento rapporto", error: error.message });
  }
});

// GET - Rapporto singolo (DEVE stare ULTIMO)
router.get("/:id", authRequired, async (req, res) => {
  try {
    const rapporto = await get(`
      SELECT r.*, c.nome AS cliente_nome, u.username AS operatore_username, 
             u.nome AS operatore_nome, u.cognome AS operatore_cognome,
             t.titolo AS template_titolo
      FROM rapporti r
      JOIN clienti c ON c.id = r.cliente_id
      JOIN utenti u ON u.id = r.operatore_id
      LEFT JOIN template t ON t.id = r.template_id
      WHERE r.id = ?
    `, [req.params.id]);

    if (!rapporto) {
      return res.status(404).json({ message: "Rapporto non trovato" });
    }

    // Regola visibilità operatori:
    // - bozze visibili solo all'operatore che le ha create
    // - rapporti non in bozza visibili a tutti gli operatori
    if (req.user.ruolo === "operatore") {
      if (rapporto.status === "bozza" && rapporto.operatore_id !== req.user.id) {
        return res.status(403).json({ message: "Non hai permessi per visualizzare questo rapporto" });
      }
    }

    return res.json({
      ...rapporto,
      dati_compilati: typeof rapporto.dati_compilati === 'string' ? JSON.parse(rapporto.dati_compilati || '{}') : rapporto.dati_compilati
    });
  } catch (error) {
    return res.status(500).json({ message: "Errore lettura rapporto", error: error.message });
  }
});

module.exports = router;

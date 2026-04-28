const express = require("express");
const { all, get, run } = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

// GET /api/notifiche/count
// Numero notifiche non lette per utente autenticato
router.get("/count", authRequired, async (req, res) => {
  try {
    const row = await get(
      "SELECT COUNT(*) as count FROM notifiche WHERE utente_id = ? AND letto = 0",
      [req.user.id]
    );
    return res.json({ count: row.count });
  } catch (err) {
    return res.status(500).json({ message: "Errore", error: err.message });
  }
});

// GET /api/notifiche/mie
// Restituisce notifiche dell'utente autenticato (default: solo non lette)
router.get("/mie", authRequired, async (req, res) => {
  try {
    const includeRead = String(req.query.includeRead || "0") === "1";
    const rows = await (includeRead
      ? getNotificationsForUser(req.user.id)
      : getUnreadNotificationsForUser(req.user.id));

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Errore", error: err.message });
  }
});

// PATCH /api/notifiche/leggi-tutte
// Segna tutte le notifiche dell'utente come lette
router.patch("/leggi-tutte", authRequired, async (req, res) => {
  try {
    await run(
      "UPDATE notifiche SET letto = 1 WHERE utente_id = ?",
      [req.user.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Errore", error: err.message });
  }
});

async function getUnreadNotificationsForUser(userId) {
  return getNotificationsQuery(userId, false);
}

async function getNotificationsForUser(userId) {
  return getNotificationsQuery(userId, true);
}

async function getNotificationsQuery(userId, includeRead) {
  const whereRead = includeRead ? "" : " AND n.letto = 0";
  return all(
    `SELECT n.id, n.tipo, n.rapporto_id, n.letto, n.created_at
     FROM notifiche n
     WHERE n.utente_id = ?${whereRead}
     ORDER BY n.created_at DESC`,
    [userId]
  );
}

module.exports = router;

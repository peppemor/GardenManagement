const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const dbPath = path.join(__dirname, "vivaio.db");
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await get("SELECT id FROM utenti WHERE username = ?", [username]);
  if (!existing) {
    const hash = await bcrypt.hash(password, 10);
    await run(
      "INSERT INTO utenti (username, password_hash, ruolo) VALUES (?, ?, 'admin')",
      [username, hash]
    );
    console.log("Admin di default creato:", username);
  }
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS utenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      cognome TEXT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      ruolo TEXT NOT NULL CHECK(ruolo IN ('admin', 'operatore')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: aggiungi colonne nome e cognome se non esistono
  try {
    await get("PRAGMA table_info(utenti)");
    const columns = await all("PRAGMA table_info(utenti)");
    const hasNome = columns.some(col => col.name === 'nome');
    const hasCognome = columns.some(col => col.name === 'cognome');
    
    if (!hasNome) {
      await run("ALTER TABLE utenti ADD COLUMN nome TEXT");
      console.log("Colonna 'nome' aggiunta a utenti");
    }
    if (!hasCognome) {
      await run("ALTER TABLE utenti ADD COLUMN cognome TEXT");
      console.log("Colonna 'cognome' aggiunta a utenti");
    }
  } catch (err) {
    console.error("Errore durante la migrazione:", err.message);
  }

  await run(`
    CREATE TABLE IF NOT EXISTS clienti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefono TEXT,
      indirizzo TEXT,
      note TEXT,
      operatore_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (operatore_id) REFERENCES utenti(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS template (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titolo TEXT NOT NULL,
      contenuto TEXT NOT NULL,
      campi_schema TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: aggiungi colonna campi_schema se non esiste
  try {
    const templateCols = await all("PRAGMA table_info(template)");
    const hasSchema = templateCols.some(col => col.name === 'campi_schema');
    if (!hasSchema) {
      await run("ALTER TABLE template ADD COLUMN campi_schema TEXT DEFAULT '[]'");
      console.log("Colonna 'campi_schema' aggiunta a template");
    }
  } catch (err) {
    console.error("Errore migrazione template:", err.message);
  }

  await run(`
    CREATE TABLE IF NOT EXISTS rapporti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      operatore_id INTEGER NOT NULL,
      template_id INTEGER,
      status TEXT NOT NULL DEFAULT 'bozza' CHECK(status IN ('bozza', 'in_attesa', 'approvato', 'rifiutato')),
      dati_compilati TEXT DEFAULT '{}',
      data_intervento TEXT,
      descrizione TEXT,
      foto_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clienti(id),
      FOREIGN KEY (operatore_id) REFERENCES utenti(id),
      FOREIGN KEY (template_id) REFERENCES template(id)
    )
  `);

  // Migration: aggiungi colonne status e dati_compilati se non esistono
  try {
    const rapportiCols = await all("PRAGMA table_info(rapporti)");
    const hasStatus = rapportiCols.some(col => col.name === 'status');
    const hasComporati = rapportiCols.some(col => col.name === 'dati_compilati');
    const hasUpdatedAt = rapportiCols.some(col => col.name === 'updated_at');
    
    if (!hasStatus) {
      await run("ALTER TABLE rapporti ADD COLUMN status TEXT NOT NULL DEFAULT 'bozza'");
      console.log("Colonna 'status' aggiunta a rapporti");
    }
    if (!hasComporati) {
      await run("ALTER TABLE rapporti ADD COLUMN dati_compilati TEXT DEFAULT '{}'");
      console.log("Colonna 'dati_compilati' aggiunta a rapporti");
    }
    if (!hasUpdatedAt) {
      await run("ALTER TABLE rapporti ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP");
      console.log("Colonna 'updated_at' aggiunta a rapporti");
    }
  } catch (err) {
    console.error("Errore migrazione rapporti:", err.message);
  }

  await run(`
    CREATE TABLE IF NOT EXISTS tipi_intervento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS tipi_manutenzione (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS campi_template (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      tipo TEXT NOT NULL CHECK(tipo IN ('text', 'textarea', 'number', 'date')),
      attivo INTEGER NOT NULL DEFAULT 1 CHECK(attivo IN (0, 1)),
      is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0, 1)),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inserisci valori di default per tipi_manutenzione se la tabella è vuota
  const countManutenzione = await get("SELECT COUNT(*) as n FROM tipi_manutenzione");
  if (countManutenzione.n === 0) {
    await run("INSERT INTO tipi_manutenzione (nome) VALUES ('Ordinaria')");
    await run("INSERT INTO tipi_manutenzione (nome) VALUES ('Straordinaria')");
    console.log("Valori di default per tipi_manutenzione inseriti");
  }

  // Campi base obbligatori del template rapporto
  const defaultCampi = [
    { nome: "Materiale Utilizzato", tipo: "textarea" },
    { nome: "Numero Secchi di Immondizia", tipo: "number" },
    { nome: "Eventuali Problemi agli attrezzi", tipo: "textarea" }
  ];

  for (const campo of defaultCampi) {
    const existing = await get("SELECT id FROM campi_template WHERE LOWER(nome) = LOWER(?)", [campo.nome]);
    if (!existing) {
      await run(
        "INSERT INTO campi_template (nome, tipo, attivo, is_default) VALUES (?, ?, 1, 1)",
        [campo.nome, campo.tipo]
      );
    }
  }

  await ensureDefaultAdmin();
}

module.exports = {
  db,
  run,
  get,
  all,
  initDb
};

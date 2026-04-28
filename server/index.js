const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");

const authRoutes = require("./routes/auth");
const clientiRoutes = require("./routes/clienti");
const rapportiRoutes = require("./routes/rapporti");
const templateRoutes = require("./routes/template");
const operatoriRoutes = require("./routes/operatori");
const tipiInterventoRoutes = require("./routes/tipiIntervento");
const tipiManutenzioneRoutes = require("./routes/tipiManutenzione");
const campiTemplateRoutes = require("./routes/campiTemplate");
const notificheRoutes = require("./routes/notifiche");

const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET non configurato. Crea server/.env partendo da server/.env.example");
}

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "vivaio-server" });
});

app.use("/api/auth", authRoutes);
app.use("/api/clienti", clientiRoutes);
app.use("/api/rapporti", rapportiRoutes);
app.use("/api/template", templateRoutes);
app.use("/api/operatori", operatoriRoutes);
app.use("/api/tipi-intervento", tipiInterventoRoutes);
app.use("/api/tipi-manutenzione", tipiManutenzioneRoutes);
app.use("/api/campi-template", campiTemplateRoutes);
app.use("/api/notifiche", notificheRoutes);

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server avviato su http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Errore inizializzazione DB:", err);
    process.exit(1);
  });

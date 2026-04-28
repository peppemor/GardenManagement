import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getAuth } from "../../components/api";
import { RapportoCard, Button } from "../../components/UI";
import { broadcastNotificheChanged } from "../../hooks/useNotifiche";

const TABS = [
  { key: "tutti", label: "Tutti" },
  { key: "in_attesa", label: "In attesa" },
  { key: "approvato", label: "Approvati" },
  { key: "rifiutato", label: "Rifiutati" },
];

export default function IMieiRapporti() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [rapporti, setRapporti] = useState([]);
  const [novitaRapportoIds, setNovitaRapportoIds] = useState([]);
  const [tab, setTab] = useState("tutti");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([
      apiFetch("/rapporti?status=in_attesa"),
      apiFetch("/rapporti?status=approvato"),
      apiFetch("/rapporti?status=rifiutato"),
      apiFetch("/notifiche/mie").catch(() => [])
    ])
      .then(([attesa, approvati, rifiutati, notifiche]) => {
        const operatoreId = auth?.user?.id;
        const tutti = [...attesa, ...approvati, ...rifiutati].filter(
          (r) => r.operatore_id === operatoreId
        );
        tutti.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        setRapporti(tutti);

        const ids = (notifiche || [])
          .map((n) => n.rapporto_id)
          .filter((id) => Number.isInteger(id));
        setNovitaRapportoIds(ids);

        // Dopo aver identificato le novita per la vista corrente, segna le notifiche come lette.
        apiFetch("/notifiche/leggi-tutte", { method: "PATCH" })
          .then(() => broadcastNotificheChanged())
          .catch(() => {});
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [auth?.user?.id]);

  const visibili = tab === "tutti" ? rapporti : rapporti.filter((r) => r.status === tab);
  const todayLabel = new Date().toLocaleDateString("it-IT");
  const novita = visibili.filter((r) => r.status === "in_attesa" || novitaRapportoIds.includes(r.id));
  const storico = visibili.filter((r) => r.status !== "in_attesa" && !novitaRapportoIds.includes(r.id));
  const countByStatus = (status) => rapporti.filter((r) => r.status === status).length;

  return (
    <section>
      <h2>I miei rapporti</h2>
      <p className="info" style={{ marginBottom: "16px" }}>
        Qui trovi tutti i tuoi rapporti inviati: in attesa di approvazione, approvati e rifiutati.
      </p>

      {error && <p className="error">{error}</p>}

      <div className="richieste-toolbar">
        <div className="richieste-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`richieste-tab${tab === t.key ? " active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key !== "tutti" && countByStatus(t.key) > 0 && (
                <span className="tab-count">{countByStatus(t.key)}</span>
              )}
              {t.key === "tutti" && rapporti.length > 0 && (
                <span className="tab-count">{rapporti.length}</span>
              )}
            </button>
          ))}
        </div>
        <Button variant="primary" type="button" onClick={() => navigate("/operatore/nuovo-rapporto")}>
          + Nuovo Rapporto
        </Button>
      </div>

      {loading ? (
        <p style={{ color: "#666", marginTop: "16px" }}>Caricamento...</p>
      ) : visibili.length === 0 ? (
        <p style={{ color: "#666" }}>Nessun rapporto trovato.</p>
      ) : (
        <div className="richieste-sections">
          {novita.length > 0 && (
            <section className="richieste-section">
              <h3 className="richieste-section-title">Novita</h3>
              <div className="clients-grid">
                {novita.map((r) => (
                  <RapportoCard
                    key={`novita-${r.id}`}
                    rapporto={r}
                    isExpanded={expandedId === r.id}
                    onToggleExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    onVisualizza={() => navigate(`/operatore/rapporti/${r.id}`)}
                    showClienteNome={true}
                    layout="card"
                  />
                ))}
              </div>
            </section>
          )}

          {storico.length > 0 && (
            <section className="richieste-section">
              <h3 className="richieste-section-title">Storico Giornaliero ({todayLabel})</h3>
              <div className="clients-grid">
                {storico.map((r) => (
                  <RapportoCard
                    key={`storico-${r.id}`}
                    rapporto={r}
                    isExpanded={expandedId === r.id}
                    onToggleExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    onVisualizza={() => navigate(`/operatore/rapporti/${r.id}`)}
                    showClienteNome={true}
                    layout="card"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}

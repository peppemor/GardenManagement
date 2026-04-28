import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getAuth } from "../../components/api";
import { Card, ListItem, StatusPill, Button } from "../../components/UI";

export default function Rifiutati() {
  const navigate = useNavigate();
  const [rapporti, setRapporti] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch("/rapporti?status=rifiutato")
      .then((data) => {
        const operatoreId = getAuth()?.user?.id;
        setRapporti(data.filter((r) => r.operatore_id === operatoreId));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="cliente-dettaglio-shell">
      <h2>Rapporti Rifiutati</h2>
      <p className="info" style={{ marginBottom: "16px" }}>
        Qui trovi tutti i rapporti che l'amministratore ha rifiutato.
      </p>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p style={{ color: "#666" }}>Caricamento...</p>
      ) : rapporti.length === 0 ? (
        <Card>
          <p style={{ margin: 0, color: "#666" }}>Nessun rapporto rifiutato.</p>
        </Card>
      ) : (
        <Card>
          <h3 style={{ marginTop: 0 }}>Rifiutati ({rapporti.length})</h3>
          <div className="rapporti-list">
            {rapporti.map((r) => (
              <ListItem
                key={r.id}
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              >
                <div className="rapporto-item-header">
                  <div>
                    <p style={{ margin: "0 0 4px 0", fontWeight: 500 }}>
                      {r.template_titolo || "Rapporto"}
                    </p>
                    <small style={{ color: "#666" }}>
                      Cliente: {r.cliente_nome} • {new Date(r.created_at).toLocaleDateString("it-IT")}
                    </small>
                  </div>
                  <StatusPill status={r.status} />
                  <span style={{ fontSize: "18px", color: "#666" }}>
                    {expandedId === r.id ? "▼" : "▶"}
                  </span>
                </div>

                {expandedId === r.id && (
                  <div
                    style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e0e0e0" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Object.keys(r.dati_compilati || {}).length === 0 ? (
                      <p style={{ fontSize: "12px", color: "#666" }}>Nessun dato disponibile</p>
                    ) : (
                      <div style={{ fontSize: "13px" }}>
                        {Object.entries(r.dati_compilati || {}).map(([key, value]) => (
                          <p key={key} style={{ marginBottom: "6px" }}>
                            <strong>{key}:</strong> {String(value)}
                          </p>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: "12px" }}>
                      <Button
                        variant="secondary"
                        style={{ width: "100%" }}
                        onClick={() => navigate(`/operatore/rapporti/${r.id}`)}
                      >
                        👁️ Visualizza Completo
                      </Button>
                    </div>
                  </div>
                )}
              </ListItem>
            ))}
          </div>
        </Card>
      )}
    </section>
  );
}

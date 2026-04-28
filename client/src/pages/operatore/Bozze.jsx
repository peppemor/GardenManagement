import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../components/api";
import { Card, ListItem, StatusPill, Button, Modal } from "../../components/UI";

export default function Bozze() {
  const [rapporti, setRapporti] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  async function loadBozze() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/rapporti?status=bozza");
      setRapporti(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBozze();
  }, []);

  async function deleteBozza(id) {
    setError("");
    try {
      await apiFetch(`/rapporti/${id}`, { method: "DELETE" });
      setRapporti((prev) => prev.filter((r) => r.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="cliente-dettaglio-shell">
      <h2>Bozze Rapporti</h2>
      <p className="info" style={{ marginBottom: "16px" }}>
        Qui trovi tutti i rapporti salvati in bozza dal tuo account.
      </p>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p style={{ color: "#666" }}>Caricamento bozze...</p>
      ) : rapporti.length === 0 ? (
        <Card>
          <p style={{ margin: 0, color: "#666" }}>Nessuna bozza disponibile.</p>
          <div style={{ marginTop: "12px" }}>
            <Link to="/operatore" className="action-link">Vai ai Clienti</Link>
          </div>
        </Card>
      ) : (
        <Card>
          <h3 style={{ marginTop: 0 }}>Bozze ({rapporti.length})</h3>
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
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e0e0e0" }}>
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

                    <div className="inline-actions" style={{ marginTop: "10px" }} onClick={(e) => e.stopPropagation()}>
                      <Link to={`/operatore/bozze/${r.id}/modifica`} className="secondary-button" style={{ textAlign: "center", textDecoration: "none" }}>
                        Apri / Modifica
                      </Link>
                      <Button
                        variant="danger"
                        type="button"
                        onClick={() =>
                          setModal({
                            title: "Conferma Eliminazione",
                            message: "Eliminare questa bozza?",
                            actions: [
                              { label: "Annulla", variant: "secondary", onClick: () => setModal(null) },
                              {
                                label: "Elimina",
                                variant: "danger",
                                onClick: async () => {
                                  setModal(null);
                                  await deleteBozza(r.id);
                                }
                              }
                            ]
                          })
                        }
                      >
                        Elimina
                      </Button>
                    </div>
                  </div>
                )}
              </ListItem>
            ))}
          </div>
        </Card>
      )}

      <Modal
        isOpen={Boolean(modal)}
        title={modal?.title}
        message={modal?.message}
        actions={modal?.actions}
        onClose={() => setModal(null)}
      />
    </section>
  );
}
import { useEffect, useState } from "react";
import { apiFetch } from "../../components/api";

export default function Rapporti() {
  const [rows, setRows] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("in_attesa");
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiFetch("/rapporti");
      setRows(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter(r => {
    if (selectedStatus === "in_attesa") return r.status === "in_attesa";
    if (selectedStatus === "approvato") return r.status === "approvato";
    return true;
  });

  async function approva(id) {
    try {
      await apiFetch(`/rapporti/${id}/approva`, { method: "PATCH" });
      await load();
    } catch (err) {
      alert("Errore: " + err.message);
    }
  }

  async function rifiuta(id) {
    if (!confirm("Rifiutare questo rapporto? Tornerà a bozza.")) return;
    try {
      await apiFetch(`/rapporti/${id}/rifiuta`, { method: "PATCH" });
      await load();
    } catch (err) {
      alert("Errore: " + err.message);
    }
  }

  const inAttesa = rows.filter(r => r.status === "in_attesa");
  const approvati = rows.filter(r => r.status === "approvato");

  return (
    <section>
      <h2>Rapporti</h2>

      {error && <p className="error">{error}</p>}

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          className={selectedStatus === "in_attesa" ? "active-btn" : "secondary-button"}
          onClick={() => setSelectedStatus("in_attesa")}
        >
          In Attesa ({inAttesa.length})
        </button>
        <button
          className={selectedStatus === "approvato" ? "active-btn" : "secondary-button"}
          onClick={() => setSelectedStatus("approvato")}
        >
          Approvati ({approvati.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "#666" }}>Nessun rapporto in questa categoria</p>
      ) : (
        <div className="clients-grid">
          {filtered.map((r) => (
            <article className="card client-card" key={r.id}>
              <div className="card-header">
                <h3>{r.cliente_nome}</h3>
                <button
                  className="menu-button"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  {expandedId === r.id ? "▼" : "▶"}
                </button>
              </div>

              <p className="info">
                <strong>Operatore:</strong> {r.operatore_nome} {r.operatore_cognome}
              </p>
              <p className="info">
                <strong>Template:</strong> {r.template_titolo || "N/A"}
              </p>
              <p className="info">
                <strong>Data:</strong> {r.created_at ? new Date(r.created_at).toLocaleDateString("it-IT") : "-"}
              </p>
              <p className="info">
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: r.status === "in_attesa" ? "#fff3cd" : "#d4edda",
                    color: r.status === "in_attesa" ? "#856404" : "#155724"
                  }}
                >
                  {r.status === "in_attesa" ? "In Attesa" : "Approvato"}
                </span>
              </p>

              {expandedId === r.id && (
                <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #ddd" }}>
                  <h4>Dati Compilati</h4>
                  {Object.keys(r.dati_compilati || {}).length === 0 ? (
                    <p style={{ color: "#666", fontSize: "12px" }}>Nessun dato compilato</p>
                  ) : (
                    <div style={{ fontSize: "12px" }}>
                      {Object.entries(r.dati_compilati || {}).map(([key, value]) => (
                        <p key={key} style={{ marginBottom: "8px" }}>
                          <strong>{key}:</strong> {String(value)}
                        </p>
                      ))}
                    </div>
                  )}

                  {r.status === "in_attesa" && (
                    <div className="inline-actions" style={{ marginTop: "15px" }}>
                      <button
                        onClick={() => approva(r.id)}
                        style={{ backgroundColor: "#28a745", color: "white", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer" }}
                      >
                        Approva
                      </button>
                      <button
                        onClick={() => rifiuta(r.id)}
                        style={{ backgroundColor: "#dc3545", color: "white", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer" }}
                      >
                        Rifiuta
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../../components/api";

export default function ClienteDettaglio() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [rapporti, setRapporti] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    apiFetch(`/clienti/${id}`).then(setCliente).catch(() => {});
    apiFetch(`/rapporti?cliente=${id}`).then((data) => {
      const visibili = data.filter((r) => r.status === "approvato" || r.status === "in_attesa");
      setRapporti(visibili);
    }).catch(() => {});
  }, [id]);

  if (!cliente) return <p>Caricamento...</p>;

  return (
    <section className="cliente-dettaglio-shell">
      <article className="card cliente-info-card">
        <h2>{cliente.nome}</h2>
        <p className="info">Telefono: {cliente.telefono || "-"}</p>
        <p className="info">Indirizzo: {cliente.indirizzo || "-"}</p>
        {cliente.note && <p className="info">Note: {cliente.note}</p>}
      </article>

      <div className="cliente-dettaglio-actions">
        <Link to={`/operatore/clienti/${id}/nuovo-rapporto`} className="secondary-button" style={{ marginTop: "15px" }}>
          + Nuovo Rapporto
        </Link>
      </div>

      <article className="card" style={{ marginTop: "20px" }}>
        <h3>Rapporti Cliente</h3>
        <p className="info" style={{ marginTop: "4px" }}>
          Mostrati: approvati e in attesa di approvazione.
        </p>
        
        {rapporti.length === 0 ? (
          <p style={{ color: "#666" }}>Nessun rapporto approvato o in attesa per questo cliente</p>
        ) : (
          <div className="rapporti-list">
            {rapporti.map((r) => (
              <div
                key={r.id}
                className="rapporto-item"
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              >
                <div className="rapporto-item-header">
                  <div>
                    <p style={{ margin: "0 0 4px 0", fontWeight: "500" }}>
                      {r.template_titolo || "Rapporto"}
                    </p>
                    <small style={{ color: "#666" }}>
                      Operatore: {r.operatore_nome} {r.operatore_cognome} • {new Date(r.created_at).toLocaleDateString("it-IT")}
                    </small>
                  </div>
                  <span className={`status-pill ${r.status === "approvato" ? "approved" : "pending"}`}>
                    {r.status === "approvato" ? "Approvato" : "In attesa"}
                  </span>
                  <span style={{ fontSize: "18px", color: "#666" }}>
                    {expandedId === r.id ? "▼" : "▶"}
                  </span>
                </div>

                {expandedId === r.id && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e0e0e0" }}>
                    <h4 style={{ marginBottom: "8px" }}>Dati Intervento</h4>
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
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

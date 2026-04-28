import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import Card from "./Card";

function renderFieldPreviewByType(type) {
  if (type === "textarea") {
    return <textarea className="template-input template-textarea" disabled />;
  }

  if (type === "number") {
    return <input className="template-input" type="number" disabled placeholder="0" />;
  }

  if (type === "date") {
    return <input className="template-input" type="date" disabled />;
  }

  return <input className="template-input" type="text" disabled placeholder="Valore" />;
}

export default function TemplatePreviewCard({ refreshToken = 0 }) {
  const [campiAggiuntivi, setCampiAggiuntivi] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/campi-template")
      .then((data) => {
        const attivi = data.filter((item) => item.is_default !== 1 && item.attivo === 1);
        setCampiAggiuntivi(attivi);
      })
      .catch((err) => setError(err.message));
  }, [refreshToken]);

  return (
    <Card>
      <div className="card-header" style={{ marginBottom: "12px" }}>
        <h3 style={{ margin: 0 }}>Scheda Rapporto</h3>
        <span className="template-badge" style={{ background: "#e6f4ea", color: "#194d33", borderColor: "#b7d9c1" }}>
          Attivo
        </span>
      </div>

      {error && <p className="error" style={{ marginTop: 0 }}>{error}</p>}

      <div className="template-preview" style={{ marginTop: 0 }}>
        <div className="template-form-preview">
          <div className="template-field-preview" style={{ borderColor: "#b7d9c1", background: "#f0faf3" }}>
            <div className="template-field-label-row">
              <label>Cliente</label>
              <span className="template-required" style={{ background: "#e6f4ea", color: "#194d33", borderColor: "#b7d9c1" }}>
                Obbligatorio
              </span>
            </div>
            <select className="template-input" disabled>
              <option>-- da anagrafica clienti --</option>
            </select>
          </div>

          <div className="template-field-preview" style={{ borderColor: "#b7d9c1", background: "#f0faf3" }}>
            <div className="template-field-label-row">
              <label>Data e Orario Intervento</label>
              <span className="template-required" style={{ background: "#e6f4ea", color: "#194d33", borderColor: "#b7d9c1" }}>
                Obbligatorio
              </span>
            </div>
            <div className="template-date-time-preview-row">
              <div>
                <label className="template-sub-label">Data</label>
                <input className="template-input" type="date" disabled />
              </div>
              <div>
                <label className="template-sub-label">Inizio</label>
                <input className="template-input" type="time" disabled />
              </div>
              <div>
                <label className="template-sub-label">Fine</label>
                <input className="template-input" type="time" disabled />
              </div>
            </div>
          </div>

          <div className="template-field-preview" style={{ borderColor: "#b7d9c1", background: "#f0faf3" }}>
            <div className="template-field-label-row">
              <label>Tipo di Manutenzione</label>
              <span className="template-required" style={{ background: "#e6f4ea", color: "#194d33", borderColor: "#b7d9c1" }}>
                Obbligatorio
              </span>
            </div>
            <select className="template-input" disabled>
              <option>-- da lista impostazioni --</option>
            </select>
          </div>

          <div className="template-field-preview" style={{ borderColor: "#b7d9c1", background: "#f0faf3" }}>
            <div className="template-field-label-row">
              <label>Tipo di Intervento</label>
              <span className="template-required" style={{ background: "#e6f4ea", color: "#194d33", borderColor: "#b7d9c1" }}>
                Obbligatorio
              </span>
            </div>
            <select className="template-input" disabled>
              <option>-- da lista impostazioni --</option>
            </select>
          </div>

          <div className="template-field-preview">
            <div className="template-field-label-row">
              <label>Descrizione tipo di intervento</label>
            </div>
            <textarea className="template-input template-textarea" disabled placeholder="Descrizione sintetica intervento" />
          </div>

          <div className="template-field-preview">
            <div className="template-field-label-row">
              <label>Materiale Utilizzato</label>
            </div>
            <textarea className="template-input template-textarea" disabled placeholder="Materiali usati" />
          </div>

          <div className="template-field-preview">
            <div className="template-field-label-row">
              <label>Eventuali Problemi agli attrezzi</label>
            </div>
            <textarea className="template-input template-textarea" disabled placeholder="Segnala eventuali problemi" />
          </div>

          <div className="template-field-preview">
            <div className="template-field-label-row">
              <label>Note</label>
            </div>
            <textarea className="template-input template-textarea" disabled placeholder="Annotazioni" />
          </div>

          {campiAggiuntivi.map((campo) => (
            <div key={campo.id} className="template-field-preview">
              <div className="template-field-label-row">
                <label>{campo.nome}</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {campo.obbligatorio ? (
                    <span className="template-required" style={{ background: "#fde8e8", color: "#7a0000", borderColor: "#f5b7b7" }}>
                      Obbligatorio
                    </span>
                  ) : null}
                  <span className="template-badge">Aggiunto da Impostazioni</span>
                </div>
              </div>
              {renderFieldPreviewByType(campo.tipo)}
            </div>
          ))}

          <div className="template-two-col-row">
            <div className="template-field-preview">
              <div className="template-field-label-row">
                <label>Numero Secchi di Immondizia</label>
              </div>
              <input className="template-input" type="number" disabled placeholder="0" />
            </div>

            <div className="template-field-preview">
              <div className="template-field-label-row">
                <label>Data Prossimo Intervento</label>
              </div>
              <input className="template-input" type="date" disabled />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
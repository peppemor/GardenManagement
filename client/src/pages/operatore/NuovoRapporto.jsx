import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../components/api";

const TEMPLATE_BASE_TITOLO = "Template Base";

export default function NuovoRapporto() {
  const { id, bozzaId } = useParams();
  const navigate = useNavigate();
  const isEditBozza = Boolean(bozzaId);

  const [cliente, setCliente] = useState(null);
  const [clienteId, setClienteId] = useState(id ? Number(id) : null);
  const [tipiIntervento, setTipiIntervento] = useState([]);
  const [tipiManutenzione, setTipiManutenzione] = useState([]);
  const [campiExtra, setCampiExtra] = useState([]);
  const [datiCompilati, setDatiCompilati] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch("/clienti"),
      apiFetch("/tipi-intervento"),
      apiFetch("/tipi-manutenzione"),
      apiFetch("/campi-template"),
      isEditBozza ? apiFetch("/rapporti?status=bozza") : Promise.resolve(null)
    ])
      .then(([clienti, tipiInt, tipiMan, campiCfg, bozze]) => {
        setTipiIntervento(tipiInt.map((t) => t.nome));
        setTipiManutenzione(tipiMan.map((t) => t.nome));
        setCampiExtra(campiCfg.filter((item) => item.is_default !== 1 && item.attivo === 1));

        let targetClienteId = id ? Number(id) : null;

        if (isEditBozza) {
          const bozza = (bozze || []).find((r) => r.id === Number(bozzaId));
          if (!bozza) throw new Error("Bozza non trovata");
          targetClienteId = bozza.cliente_id;
          setDatiCompilati(bozza.dati_compilati || {});
        }

        const trovato = clienti.find((c) => c.id === targetClienteId);
        if (!trovato) throw new Error("Cliente non trovato");
        setCliente(trovato);
        setClienteId(targetClienteId);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, bozzaId, isEditBozza]);

  function updateField(fieldName, value) {
    setDatiCompilati((prev) => ({ ...prev, [fieldName]: value }));
  }

  async function save(sottometti = false) {
    setSaving(true);
    setError("");

    try {
      if (isEditBozza) {
        await apiFetch(`/rapporti/${bozzaId}`, {
          method: "PATCH",
          body: JSON.stringify({ dati_compilati: datiCompilati })
        });

        if (sottometti) {
          await apiFetch(`/rapporti/${bozzaId}/sottometti`, { method: "PATCH" });
          alert("Rapporto sottomesso all'admin per approvazione!");
          navigate(`/operatore/clienti/${clienteId}`);
        } else {
          alert("Bozza aggiornata!");
          navigate("/operatore/bozze");
        }
      } else {
        const payload = {
          cliente_id: clienteId,
          dati_compilati: datiCompilati
        };

        const result = await apiFetch("/rapporti", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        if (sottometti) {
          await apiFetch(`/rapporti/${result.id}/sottometti`, { method: "PATCH" });
          alert("Rapporto sottomesso all'admin per approvazione!");
          navigate(`/operatore/clienti/${clienteId}`);
        } else {
          alert("Rapporto salvato in bozza!");
          navigate("/operatore/bozze");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" };

  function renderExtraField(campo) {
    const value = datiCompilati[campo.nome] || "";

    if (campo.tipo === "textarea") {
      return (
        <textarea
          rows="3"
          value={value}
          onChange={(e) => updateField(campo.nome, e.target.value)}
          style={inputStyle}
        />
      );
    }

    return (
      <input
        type={campo.tipo || "text"}
        value={value}
        onChange={(e) => updateField(campo.nome, e.target.value)}
        style={inputStyle}
      />
    );
  }

  const fieldRow = (label, required, children, className = "") => (
    <div key={label} className={`report-field-block ${className}`.trim()}>
      <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>
        {label}
        {required && <span style={{ color: "red" }}> *</span>}
      </label>
      {children}
    </div>
  );

  if (loading) {
    return (
      <section>
        <h2>Nuovo Rapporto</h2>
        <p style={{ color: "#666" }}>Caricamento template base...</p>
      </section>
    );
  }

  if (!cliente) {
    return (
      <section>
        <h2>Nuovo Rapporto</h2>
        <p className="error">{error || "Cliente non trovato"}</p>
      </section>
    );
  }

  return (
    <section className="report-form-shell">
      <h2>{isEditBozza ? "Modifica Bozza Rapporto" : "Nuovo Rapporto"}</h2>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        <strong>Cliente:</strong> {cliente.nome}
      </p>

      <form className="card form-grid report-form-card" onSubmit={(e) => e.preventDefault()}>
        <h3>{isEditBozza ? "Continua modifica bozza" : `Compila Modulo: ${TEMPLATE_BASE_TITOLO}`}</h3>

        <div className="report-fields-grid">
          <div className="report-field-block field-span-2">
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
              Data e Orario Intervento <span style={{ color: "red" }}> *</span>
            </label>
            <div className="report-date-time-row">
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#4b6659" }}>Data</label>
                <input
                  type="date"
                  value={datiCompilati["Data di Intervento"] || ""}
                  onChange={(e) => updateField("Data di Intervento", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#4b6659" }}>Inizio</label>
                <input
                  type="time"
                  value={datiCompilati["Ora Inizio Intervento"] || ""}
                  onChange={(e) => updateField("Ora Inizio Intervento", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#4b6659" }}>Fine</label>
                <input
                  type="time"
                  value={datiCompilati["Ora Fine Intervento"] || ""}
                  onChange={(e) => updateField("Ora Fine Intervento", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {fieldRow(
            "Tipo di Manutenzione",
            true,
            <select
              value={datiCompilati["Tipo di Manutenzione"] || ""}
              onChange={(e) => updateField("Tipo di Manutenzione", e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">-- Seleziona tipo manutenzione --</option>
              {tipiManutenzione.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {fieldRow(
            "Tipo di Intervento",
            true,
            <select
              value={datiCompilati["Tipo di Intervento"] || ""}
              onChange={(e) => updateField("Tipo di Intervento", e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">-- Seleziona tipo intervento --</option>
              {tipiIntervento.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {fieldRow(
            "Descrizione tipo di intervento",
            false,
            <textarea
              rows="2"
              value={datiCompilati["Descrizione tipo di intervento"] || ""}
              onChange={(e) => updateField("Descrizione tipo di intervento", e.target.value)}
              style={inputStyle}
            />,
            "field-span-2"
          )}

          {fieldRow(
            "Materiale Utilizzato",
            false,
            <textarea
              rows="3"
              value={datiCompilati["Materiale Utilizzato"] || ""}
              onChange={(e) => updateField("Materiale Utilizzato", e.target.value)}
              style={inputStyle}
            />,
            "field-span-2"
          )}

          {fieldRow(
            "Eventuali Problemi agli attrezzi",
            false,
            <textarea
              rows="3"
              value={datiCompilati["Eventuali Problemi agli attrezzi"] || ""}
              onChange={(e) => updateField("Eventuali Problemi agli attrezzi", e.target.value)}
              style={inputStyle}
            />,
            "field-span-2"
          )}

          {fieldRow(
            "Note",
            false,
            <textarea
              rows="3"
              value={datiCompilati["Note"] || ""}
              onChange={(e) => updateField("Note", e.target.value)}
              style={inputStyle}
            />,
            "field-span-2"
          )}

          {campiExtra.length > 0 && (
            <>
              <hr className="field-span-2" style={{ margin: "4px 0", borderColor: "#e0e0e0" }} />
              <p className="field-span-2" style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#555" }}>
                Campi aggiuntivi da impostazioni
              </p>
              {campiExtra.map((campo) => (
                <div key={campo.id} className="report-field-block">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>
                    {campo.nome}
                  </label>
                  {renderExtraField(campo)}
                </div>
              ))}
            </>
          )}

          {fieldRow(
            "Numero Secchi di Immondizia",
            false,
            <input
              type="number"
              min="0"
              value={datiCompilati["Numero Secchi di Immondizia"] || ""}
              onChange={(e) => updateField("Numero Secchi di Immondizia", e.target.value)}
              style={inputStyle}
            />
          )}

          {fieldRow(
            "Data Prossimo Intervento",
            false,
            <input
              type="date"
              value={datiCompilati["Data Prossimo Intervento"] || ""}
              onChange={(e) => updateField("Data Prossimo Intervento", e.target.value)}
              style={inputStyle}
            />
          )}
        </div>

        {error && <p className="error">{error}</p>}

        <div className="inline-actions" style={{ marginTop: "20px" }}>
          <button type="button" onClick={() => save(false)} className="secondary-button" disabled={saving}>
            {saving ? "Salvataggio..." : "Salva in Bozza"}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            style={{ backgroundColor: "#28a745", color: "white", border: "none" }}
          >
            {saving ? "Invio..." : "Sottometti per Approvazione"}
          </button>
          <button type="button" onClick={() => navigate(isEditBozza ? "/operatore/bozze" : `/operatore/clienti/${clienteId}`)} className="secondary-button">
            Indietro
          </button>
        </div>
      </form>
    </section>
  );
}

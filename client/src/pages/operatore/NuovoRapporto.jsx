import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../components/api";
import { Button, Modal } from "../../components/UI";

export default function NuovoRapporto() {
  const { id, bozzaId } = useParams();
  const navigate = useNavigate();
  const isEditBozza = Boolean(bozzaId);
  const clienteEditabile = !id && !isEditBozza;

  const [clienti, setClienti] = useState([]);
  const [clienteId, setClienteId] = useState(id ? Number(id) : null);
  const [tipiIntervento, setTipiIntervento] = useState([]);
  const [tipiManutenzione, setTipiManutenzione] = useState([]);
  const [campiExtra, setCampiExtra] = useState([]);
  const [datiCompilati, setDatiCompilati] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canLeave, setCanLeave] = useState(false);
  const [modal, setModal] = useState(null);

  const campiObbligatori = [
    "Cliente",
    "Data di Intervento",
    "Ora Inizio Intervento",
    "Ora Fine Intervento",
    "Tipo di Manutenzione",
    "Tipo di Intervento"
  ];

  const campiExtraObbligatori = campiExtra
    .filter((campo) => campo.obbligatorio === 1 || campo.obbligatorio === true)
    .map((campo) => campo.nome);
  function isRequiredFieldValid(campo) {
    const value = String(datiCompilati[campo] || "").trim();
    if (!value) return false;

    if (campo === "Data di Intervento") {
      if (value.toLowerCase() === "dd/mm/yyyy" || value === "__/__/____") return false;
      return /^\d{4}-\d{2}-\d{2}$/.test(value);
    }

    return true;
  }

  const canSottometti = [...campiObbligatori, ...campiExtraObbligatori].every((campo) => isRequiredFieldValid(campo));

  useEffect(() => {
    if (canLeave) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    // Keep one history step to prevent accidental browser back while editing.
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setError("Usa il tasto Indietro della pagina per uscire senza perdere le modifiche.");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [canLeave]);

  function navigateUnlocked(path) {
    setCanLeave(true);
    navigate(path);
  }

  function showSuccessAndNavigate(message, path) {
    setModal({
      title: "Operazione Completata",
      message,
      onClose: () => {
        setModal(null);
        navigateUnlocked(path);
      }
    });
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch("/clienti"),
      apiFetch("/tipi-intervento"),
      apiFetch("/tipi-manutenzione"),
      apiFetch("/campi-template"),
      isEditBozza ? apiFetch("/rapporti?status=bozza") : Promise.resolve(null)
    ])
      .then(([clientiData, tipiInt, tipiMan, campiCfg, bozze]) => {
        setClienti(clientiData);
        setTipiIntervento(tipiInt.map((t) => t.nome));
        setTipiManutenzione(tipiMan.map((t) => t.nome));
        setCampiExtra(campiCfg.filter((item) => item.is_default !== 1 && item.attivo === 1));

        let targetClienteId = id ? Number(id) : null;
        let initialDatiCompilati = {};

        if (isEditBozza) {
          const bozza = (bozze || []).find((r) => r.id === Number(bozzaId));
          if (!bozza) throw new Error("Bozza non trovata");
          targetClienteId = bozza.cliente_id;
          initialDatiCompilati = bozza.dati_compilati || {};
        }

        if (targetClienteId) {
          const trovato = clientiData.find((c) => c.id === targetClienteId);
          if (!trovato) throw new Error("Cliente non trovato");

          setClienteId(targetClienteId);
          setDatiCompilati({
            ...initialDatiCompilati,
            Cliente: initialDatiCompilati.Cliente || trovato.nome
          });
        } else {
          // Da "I miei rapporti": nessun cliente pre-selezionato, mostra placeholder.
          setClienteId(null);
          setDatiCompilati({
            ...initialDatiCompilati,
            Cliente: initialDatiCompilati.Cliente || ""
          });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, bozzaId, isEditBozza]);

  function updateField(fieldName, value) {
    setDatiCompilati((prev) => ({ ...prev, [fieldName]: value }));
  }

  async function save(sottometti = false) {
    if (!clienteId) {
      setError("Seleziona un cliente prima di salvare il rapporto.");
      return;
    }

    if (sottometti && !canSottometti) {
      setError("Compila tutti i campi obbligatori prima di sottomettere il rapporto.");
      return;
    }

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
          showSuccessAndNavigate(
            "Rapporto sottomesso all'admin per approvazione!",
            id ? `/operatore/clienti/${clienteId}` : "/operatore/richieste"
          );
        } else {
          showSuccessAndNavigate("Bozza aggiornata!", "/operatore/bozze");
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
          showSuccessAndNavigate(
            "Rapporto sottomesso all'admin per approvazione!",
            id ? `/operatore/clienti/${clienteId}` : "/operatore/richieste"
          );
        } else {
          showSuccessAndNavigate("Rapporto salvato in bozza!", "/operatore/bozze");
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
    const isCampoObbligatorio = campo.obbligatorio === 1 || campo.obbligatorio === true;

    if (campo.tipo === "textarea") {
      return (
        <textarea
          rows="3"
          value={value}
          onChange={(e) => updateField(campo.nome, e.target.value)}
          required={isCampoObbligatorio}
          style={inputStyle}
        />
      );
    }

    return (
      <input
        type={campo.tipo || "text"}
        value={value}
        onChange={(e) => updateField(campo.nome, e.target.value)}
        required={isCampoObbligatorio}
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
        <p style={{ color: "#666" }}>Caricamento modulo...</p>
      </section>
    );
  }

  const clienteSelezionato = clienti.find((c) => c.id === Number(clienteId));
  const exitPath = isEditBozza
    ? "/operatore/bozze"
    : id
      ? `/operatore/clienti/${clienteId}`
      : "/operatore/richieste";

  if (!clienteSelezionato && !clienteEditabile) {
    return (
      <section>
        <h2>Nuovo Rapporto</h2>
        <p className="error">{error || "Nessun cliente disponibile"}</p>
      </section>
    );
  }

  return (
    <section className="report-form-shell">
      <h2>{isEditBozza ? "Modifica Bozza Rapporto" : "Nuovo Rapporto"}</h2>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        <strong>Cliente:</strong> {clienteSelezionato ? clienteSelezionato.nome : "Seleziona dal menu"}
      </p>

      <form className="card form-grid report-form-card" onSubmit={(e) => e.preventDefault()}>
        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
          <button
            type="button"
            aria-label="Chiudi form"
            title="Chiudi"
            onClick={() => navigateUnlocked(exitPath)}
            style={{
              border: "none",
              background: "transparent",
              color: "#b00020",
              cursor: "pointer",
              fontSize: "20px",
              lineHeight: 1,
              fontWeight: 700,
              padding: "0 4px",
              marginLeft: "auto",
              width: "auto",
              flexShrink: 0
            }}
          >
            X
          </button>
        </div>

        <div className="report-fields-grid">
          {fieldRow(
            "Cliente",
            true,
            <select
              value={clienteId || ""}
              onChange={(e) => {
                const nextId = Number(e.target.value);
                const nextCliente = clienti.find((c) => c.id === nextId);
                setClienteId(nextId);
                updateField("Cliente", nextCliente ? nextCliente.nome : "");
              }}
              required
              disabled={!clienteEditabile}
              style={inputStyle}
            >
              <option value="">-- Seleziona cliente --</option>
              {clienti.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>,
            "field-span-2"
          )}

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
                <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#4b6659" }}>
                  Inizio <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="time"
                  value={datiCompilati["Ora Inizio Intervento"] || ""}
                  onChange={(e) => updateField("Ora Inizio Intervento", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#4b6659" }}>
                  Fine <span style={{ color: "red" }}>*</span>
                </label>
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
                    {(campo.obbligatorio === 1 || campo.obbligatorio === true) && <span style={{ color: "red" }}> *</span>}
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
          <Button variant="secondary" type="button" onClick={() => save(false)} disabled={saving}>
            {saving ? "Salvataggio..." : "Salva in Bozza"}
          </Button>
          <Button variant="primary" type="button" onClick={() => save(true)} disabled={saving || !canSottometti}>
            {saving ? "Invio..." : "Sottometti per Approvazione"}
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigateUnlocked(exitPath)}
          >
            Indietro
          </Button>
        </div>
      </form>

      <Modal
        isOpen={Boolean(modal)}
        title={modal?.title}
        message={modal?.message}
        onClose={modal?.onClose || (() => setModal(null))}
      />
    </section>
  );
}

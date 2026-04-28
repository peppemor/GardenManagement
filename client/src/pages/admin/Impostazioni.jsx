import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../components/api";
import { Card, Button, Modal, TemplatePreviewCard } from "../../components/UI";

function ListaTipologie({
  title,
  description,
  endpoint,
  placeholder
}) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const [modal, setModal] = useState(null);

  async function load() {
    try {
      const data = await apiFetch(endpoint);
      setItems(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [endpoint]);

  async function add(e) {
    e.preventDefault();
    setError("");
    const nome = inputRef.current?.value?.trim() || "";
    if (!nome) return;

    setLoading(true);
    try {
      await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ nome })
      });
      inputRef.current.value = "";
      inputRef.current.focus();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    setError("");
    try {
      await apiFetch(`${endpoint}/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Card style={{ width: "100%" }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p className="info" style={{ marginBottom: "14px" }}>{description}</p>

      <form onSubmit={add} style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
        <input
          ref={inputRef}
          placeholder={placeholder}
          disabled={loading}
          style={{ flex: 1, padding: "10px", border: "1px solid #cfe5d5", borderRadius: "8px" }}
        />
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? "..." : "Aggiungi"}
        </Button>
      </form>

      {error && <p className="error">{error}</p>}

      {items.length === 0 ? (
        <p style={{ color: "#666", margin: 0 }}>Nessun valore configurato.</p>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                border: "1px solid #d8e8dd",
                borderRadius: "8px",
                background: "#f6fbf8"
              }}
            >
              <span style={{ fontWeight: 500, color: "#173426" }}>{item.nome}</span>
              <Button
                variant="secondary"
                type="button"
                onClick={() =>
                  setModal({
                    title: "Conferma Eliminazione",
                    message: `Eliminare "${item.nome}"? Verrà rimosso dalla lista globale.`,
                    actions: [
                      { label: "Annulla", variant: "secondary", onClick: () => setModal(null) },
                      {
                        label: "Elimina",
                        variant: "danger",
                        onClick: async () => {
                          setModal(null);
                          await remove(item.id);
                        }
                      }
                    ]
                  })
                }
              >
                Elimina
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(modal)}
        title={modal?.title}
        message={modal?.message}
        actions={modal?.actions}
        onClose={() => setModal(null)}
      />
    </Card>
  );
}

function CampiTemplateConfigurator({ onTemplateChange = () => {} }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newTipo, setNewTipo] = useState("text");
  const [newAttivo, setNewAttivo] = useState(false);
  const [newObbligatorio, setNewObbligatorio] = useState(false);
  const [modal, setModal] = useState(null);

  async function load() {
    try {
      const data = await apiFetch("/campi-template");
      setItems(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addField(e) {
    e.preventDefault();
    setError("");
    if (!newNome.trim()) return;

    setLoading(true);
    try {
      await apiFetch("/campi-template", {
        method: "POST",
        body: JSON.stringify({
          nome: newNome.trim(),
          tipo: newTipo,
          attivo: newAttivo,
          obbligatorio: newObbligatorio
        })
      });
      setNewNome("");
      setNewTipo("text");
      setNewAttivo(false);
      setNewObbligatorio(false);
      await load();
      onTemplateChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleInclude(item) {
    setError("");
    try {
      const nextAttivo = item.attivo ? 0 : 1;
      await apiFetch(`/campi-template/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          attivo: nextAttivo,
          obbligatorio: nextAttivo ? item.obbligatorio : 0
        })
      });
      await load();
      onTemplateChange();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleObbligatorio(item) {
    setError("");
    try {
      const nextObbligatorio = item.obbligatorio ? 0 : 1;
      await apiFetch(`/campi-template/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          attivo: nextObbligatorio ? 1 : item.attivo,
          obbligatorio: nextObbligatorio
        })
      });
      await load();
      onTemplateChange();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeField(item) {
    setError("");
    try {
      await apiFetch(`/campi-template/${item.id}`, { method: "DELETE" });
      await load();
      onTemplateChange();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Card style={{ width: "100%" }}>
      <h3 style={{ marginTop: 0 }}>Campi Template</h3>
      <p className="info" style={{ marginBottom: "14px" }}>
        I campi base sono sempre inclusi. Puoi aggiungere campi possibili e scegliere con la checkbox se includerli nel template.
      </p>

      <form onSubmit={addField} style={{ display: "grid", gridTemplateColumns: "1fr 170px auto", gap: "10px", marginBottom: "18px" }}>
        <input
          value={newNome}
          onChange={(e) => setNewNome(e.target.value)}
          placeholder="Nome campo (es. Ore impiegate)"
          disabled={loading}
        />
        <select value={newTipo} onChange={(e) => setNewTipo(e.target.value)} disabled={loading}>
          <option value="text">Testo</option>
          <option value="textarea">Area testo</option>
          <option value="number">Numero</option>
          <option value="date">Data</option>
        </select>
        <Button variant="primary" type="submit" disabled={loading}>{loading ? "..." : "Aggiungi"}</Button>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#173426", gridColumn: "1 / -1" }}>
          <input
            type="checkbox"
            checked={newAttivo}
            onChange={(e) => {
              const checked = e.target.checked;
              setNewAttivo(checked);
              if (!checked) setNewObbligatorio(false);
            }}
            disabled={loading}
          />
          Includi nel template
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#173426", gridColumn: "1 / -1" }}>
          <input
            type="checkbox"
            checked={newObbligatorio}
            onChange={(e) => setNewObbligatorio(e.target.checked)}
            disabled={loading || !newAttivo}
          />
          Campo obbligatorio
        </label>
      </form>

      {error && <p className="error">{error}</p>}

      <div style={{ display: "grid", gap: "8px" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto auto",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              border: "1px solid #d8e8dd",
              borderRadius: "8px",
              background: item.is_default ? "#eef8f0" : "#f6fbf8"
            }}
          >
            <div>
              <strong style={{ color: "#173426" }}>{item.nome}</strong>
              <span style={{ marginLeft: "8px", fontSize: "12px", color: "#4b6659" }}>
                ({item.tipo}){item.is_default ? " · base" : ""}
              </span>
              {item.obbligatorio ? (
                <span style={{ marginLeft: "8px", fontSize: "12px", color: "#7a0000", fontWeight: 600 }}>
                  * obbligatorio
                </span>
              ) : null}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              <input
                type="checkbox"
                checked={Boolean(item.attivo)}
                onChange={() => toggleInclude(item)}
                disabled={item.is_default === 1}
              />
              Includi
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              <input
                type="checkbox"
                checked={Boolean(item.obbligatorio)}
                onChange={() => toggleObbligatorio(item)}
                disabled={item.is_default === 1}
              />
              Obbligatorio
            </label>

            {item.is_default ? (
              <span style={{ fontSize: "12px", color: "#4b6659" }}>Bloccato</span>
            ) : (
              <Button
                variant="secondary"
                type="button"
                onClick={() =>
                  setModal({
                    title: "Conferma Eliminazione",
                    message: `Eliminare il campo "${item.nome}"?`,
                    actions: [
                      { label: "Annulla", variant: "secondary", onClick: () => setModal(null) },
                      {
                        label: "Elimina",
                        variant: "danger",
                        onClick: async () => {
                          setModal(null);
                          await removeField(item);
                        }
                      }
                    ]
                  })
                }
              >
                Elimina
              </Button>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={Boolean(modal)}
        title={modal?.title}
        message={modal?.message}
        actions={modal?.actions}
        onClose={() => setModal(null)}
      />
    </Card>
  );
}

export default function Impostazioni() {
  const [templateRefreshToken, setTemplateRefreshToken] = useState(0);

  function scrollToCampiTemplate() {
    const element = document.getElementById("campi-template-section");
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="impostazioni-shell">
      <h2>Impostazioni</h2>
      <p className="info" style={{ marginBottom: "16px" }}>
        Gestisci in un unico punto le liste globali usate nei rapporti compilati dagli operatori.
      </p>

      <div className="impostazioni-layout">
        <div className="impostazioni-left-column">
          <Card className="impostazioni-template-tools">
            <div className="impostazioni-template-head">
              <span className="template-badge" style={{ background: "#e6f4ea", color: "#194d33", borderColor: "#b7d9c1" }}>
                Sola anteprima
              </span>
              <p className="info" style={{ margin: 0 }}>
                Template attivo usato dagli operatori.
              </p>
            </div>
            <Button variant="secondary" type="button" onClick={scrollToCampiTemplate}>
              Vai a Campi Template
            </Button>
          </Card>
          <TemplatePreviewCard refreshToken={templateRefreshToken} />
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          <ListaTipologie
            title="Tipologie di Intervento"
            description="Valori disponibili per il campo fisso Tipo di Intervento."
            endpoint="/tipi-intervento"
            placeholder="Nuova tipologia intervento (es. Potatura)"
          />

          <ListaTipologie
            title="Tipologie di Manutenzione"
            description="Valori disponibili per il campo fisso Tipo di Manutenzione."
            endpoint="/tipi-manutenzione"
            placeholder="Nuova tipologia manutenzione (es. Ordinaria)"
          />

          <div id="campi-template-section">
            <CampiTemplateConfigurator onTemplateChange={() => setTemplateRefreshToken((prev) => prev + 1)} />
          </div>
        </div>
      </div>
    </section>
  );
}
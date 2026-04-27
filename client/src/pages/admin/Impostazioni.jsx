import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../components/api";

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

  async function remove(id, nome) {
    if (!confirm(`Eliminare "${nome}"? Verrà rimosso dalla lista globale.`)) return;
    setError("");
    try {
      await apiFetch(`${endpoint}/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card" style={{ maxWidth: "680px" }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p className="info" style={{ marginBottom: "14px" }}>{description}</p>

      <form onSubmit={add} style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
        <input
          ref={inputRef}
          placeholder={placeholder}
          disabled={loading}
          style={{ flex: 1, padding: "10px", border: "1px solid #cfe5d5", borderRadius: "8px" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "..." : "Aggiungi"}
        </button>
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
              <button
                type="button"
                className="secondary-button"
                onClick={() => remove(item.id, item.nome)}
              >
                Elimina
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CampiTemplateConfigurator() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newTipo, setNewTipo] = useState("text");

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
        body: JSON.stringify({ nome: newNome.trim(), tipo: newTipo })
      });
      setNewNome("");
      setNewTipo("text");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleInclude(item) {
    setError("");
    try {
      await apiFetch(`/campi-template/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ attivo: item.attivo ? 0 : 1 })
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeField(item) {
    if (!confirm(`Eliminare il campo "${item.nome}"?`)) return;
    setError("");
    try {
      await apiFetch(`/campi-template/${item.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card" style={{ maxWidth: "680px" }}>
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
        <button type="submit" disabled={loading}>{loading ? "..." : "Aggiungi"}</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div style={{ display: "grid", gap: "8px" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
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

            {item.is_default ? (
              <span style={{ fontSize: "12px", color: "#4b6659" }}>Bloccato</span>
            ) : (
              <button type="button" className="secondary-button" onClick={() => removeField(item)}>
                Elimina
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Impostazioni() {
  return (
    <section>
      <h2>Impostazioni</h2>
      <p className="info" style={{ marginBottom: "16px" }}>
        Gestisci in un unico punto le liste globali usate nei rapporti compilati dagli operatori.
      </p>

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

        <CampiTemplateConfigurator />
      </div>
    </section>
  );
}
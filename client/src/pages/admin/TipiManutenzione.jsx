import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../components/api";

export default function TipiManutenzione() {
  const [tipi, setTipi] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  async function load() {
    try {
      const data = await apiFetch("/tipi-manutenzione");
      setTipi(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    setError("");
    const nome = inputRef.current.value.trim();
    if (!nome) return;

    setLoading(true);
    try {
      await apiFetch("/tipi-manutenzione", {
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
      await apiFetch(`/tipi-manutenzione/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>Tipi di Manutenzione</h2>
      <p className="info" style={{ marginBottom: "20px" }}>
        Gestisci qui la lista globale dei tipi di manutenzione. Ogni rapporto include
        obbligatoriamente il campo <strong>"Tipo di Manutenzione"</strong> con questi valori.
      </p>

      <div className="card" style={{ maxWidth: "560px" }}>
        <form onSubmit={add} style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <input
            ref={inputRef}
            placeholder="Nuovo tipo di manutenzione (es. Straordinaria urgente)"
            style={{ flex: 1, padding: "10px", border: "1px solid #cfe5d5", borderRadius: "8px" }}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#194d33",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            {loading ? "…" : "Aggiungi"}
          </button>
        </form>

        {error && <p className="error" style={{ marginBottom: "12px" }}>{error}</p>}

        {tipi.length === 0 ? (
          <p style={{ color: "#666" }}>
            Nessun tipo di manutenzione configurato. Aggiungine uno sopra.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {tipi.map((tipo) => (
              <div
                key={tipo.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  border: "1px solid #d8e8dd",
                  borderRadius: "8px",
                  background: "#f6fbf8"
                }}
              >
                <span style={{ fontWeight: 500, color: "#173426" }}>{tipo.nome}</span>
                <button
                  onClick={() => remove(tipo.id, tipo.nome)}
                  style={{
                    background: "none",
                    border: "1px solid #e0b0b0",
                    color: "#a92f2f",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  Elimina
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
